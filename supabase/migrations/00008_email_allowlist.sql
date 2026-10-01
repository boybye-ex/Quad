-- ============================================================================
-- MIGRATION: Email Allowlist for Invite-Only Access (reviewed/hardened)
-- ============================================================================
-- Only emails in public.allowed_emails can SIGN UP (new auth.users rows) while
-- app_settings.invite_only_enabled = 'true'. Existing users are seeded so no
-- one is locked out. Sign-in of existing accounts is not affected.
--
-- Hardening vs. first draft:
--  * every SECURITY DEFINER function has SET search_path = '' and fully
--    qualified names (the auth.users trigger runs as supabase_auth_admin whose
--    search_path does not include public -> unqualified names would break ALL
--    sign-ups)
--  * admin_* functions: NULL role (anon / no profile) no longer bypasses the
--    admin check; EXECUTE revoked from PUBLIC/anon
--  * is_email_allowed not callable by anon/authenticated (no email enumeration)
--  * tolerant boolean parsing of the flag (bad value can't break sign-ups)
--  * emails normalised to lower(trim()) on insert/update
--  * created_by FK uses ON DELETE SET NULL (doesn't block deleting users)
--  * profiles backup trigger no longer tries to DELETE FROM auth.users
-- ============================================================================

-- 1. SETTINGS TABLE ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: only service_role (bypasses RLS) and
-- SECURITY DEFINER functions can read/write settings.
DROP POLICY IF EXISTS "Service role can manage settings" ON public.app_settings;

INSERT INTO public.app_settings (key, value, description)
VALUES (
  'invite_only_enabled',
  'true',
  'When true, only emails in allowed_emails can sign up. Set to false to disable the gate.'
)
ON CONFLICT (key) DO NOTHING;

-- 2. ALLOWED EMAILS TABLE ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage allowed_emails" ON public.allowed_emails;
DROP POLICY IF EXISTS "Admins can view allowed_emails" ON public.allowed_emails;
CREATE POLICY "Admins can view allowed_emails"
  ON public.allowed_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );

-- Normalise emails (lower + trim) however they are inserted
CREATE OR REPLACE FUNCTION public.normalize_allowed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_allowed_email ON public.allowed_emails;
CREATE TRIGGER normalize_allowed_email
  BEFORE INSERT OR UPDATE OF email ON public.allowed_emails
  FOR EACH ROW EXECUTE FUNCTION public.normalize_allowed_email();

-- 3. CHECK FUNCTION ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_email_allowed(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_flag TEXT;
BEGIN
  SELECT LOWER(TRIM(s.value)) INTO v_flag
  FROM public.app_settings s
  WHERE s.key = 'invite_only_enabled';

  -- Gate is on only when the flag is explicitly truthy
  IF v_flag IS NULL OR v_flag NOT IN ('true', 't', '1', 'on', 'yes') THEN
    RETURN TRUE;
  END IF;

  IF check_email IS NULL OR TRIM(check_email) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.allowed_emails ae
    WHERE ae.email = LOWER(TRIM(check_email))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_email_allowed(TEXT) FROM PUBLIC, anon, authenticated;

-- 4. ENFORCE ON auth.users INSERT -------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_email_allowlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Quad is invite-only right now. Contact the team to request access.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_email_allowlist() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS check_email_allowlist ON auth.users;
  CREATE TRIGGER check_email_allowlist
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_email_allowlist();
  RAISE NOTICE 'Created auth.users trigger for email allowlist';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not create auth.users trigger: %. Enforcement falls back to profile creation.', SQLERRM;
END;
$$;

-- 5. BACKUP: ENFORCE ON profiles INSERT -------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_email_allowlist_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_email_allowed(NEW.email) THEN
    -- Raising aborts the whole sign-up transaction (incl. the auth.users row)
    RAISE EXCEPTION 'Quad is invite-only right now. Contact the team to request access.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_email_allowlist_on_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_email_allowlist_on_profile ON public.profiles;
CREATE TRIGGER check_email_allowlist_on_profile
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_email_allowlist_on_profile();

-- 6. ADMIN HELPERS -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_add_allowed_email(
  p_email TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can add allowed emails';
  END IF;

  INSERT INTO public.allowed_emails (email, note, created_by)
  VALUES (LOWER(TRIM(p_email)), p_note, auth.uid())
  ON CONFLICT (email) DO UPDATE SET note = COALESCE(EXCLUDED.note, public.allowed_emails.note)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_allowed_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INT;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can remove allowed emails';
  END IF;

  DELETE FROM public.allowed_emails
  WHERE email = LOWER(TRIM(p_email));

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_allowed_emails()
RETURNS TABLE (id UUID, email TEXT, note TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can list allowed emails';
  END IF;

  RETURN QUERY
  SELECT ae.id, ae.email, ae.note, ae.created_at
  FROM public.allowed_emails ae
  ORDER BY ae.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_invite_only(p_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can change invite-only setting';
  END IF;

  UPDATE public.app_settings
  SET value = CASE WHEN p_enabled THEN 'true' ELSE 'false' END, updated_at = NOW()
  WHERE key = 'invite_only_enabled';

  RETURN p_enabled;
END;
$$;

-- 7. SEED --------------------------------------------------------------------
INSERT INTO public.allowed_emails (email, note)
SELECT DISTINCT LOWER(TRIM(u.email)), 'Auto-added: existing user at migration time'
FROM auth.users u
WHERE u.email IS NOT NULL AND TRIM(u.email) <> ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.allowed_emails (email, note)
VALUES
  ('student.test@myboston.co.za', 'Test account for development'),
  ('lebohangntamane03@gmail.com', 'Owner / admin')
ON CONFLICT (email) DO NOTHING;

-- 8. GRANTS ------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_allowed_email(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_remove_allowed_email(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_allowed_emails() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_invite_only(BOOLEAN) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_allowed_email(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_allowed_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_allowed_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_invite_only(BOOLEAN) TO authenticated;

-- USAGE (SQL editor, as owner):
--   INSERT INTO public.allowed_emails (email, note) VALUES ('new@example.com', 'note');
--   DELETE FROM public.allowed_emails WHERE email = 'old@example.com';
--   UPDATE public.app_settings SET value = 'false' WHERE key = 'invite_only_enabled';
-- From the app as an admin: rpc('admin_add_allowed_email', ...), etc.
