-- ============================================================================
-- MIGRATION: Harden Roles and Revoke Anon Access
-- ============================================================================
-- Security hardening:
--  1. Fix handle_new_user to ignore role from sign-up metadata (always 'student')
--  2. Revoke EXECUTE from anon/PUBLIC on privileged admin functions
--  3. Add SET search_path = '' to touched functions
--
-- IMPORTANT: Do NOT apply to live until reviewed. The coordinator will apply.
-- ============================================================================

-- ============================================================================
-- 1. FIX handle_new_user: Ignore role from metadata
-- ============================================================================
-- The original function trusted raw_user_meta_data->>'role', allowing any
-- allowlisted user to sign up as admin. This version always uses 'student'.
-- Admins are set only by SQL or by an existing admin via admin functions.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name TEXT;
  v_campus_id UUID;
  v_role TEXT;
BEGIN
  -- Extract metadata from auth signup
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  v_campus_id := (NEW.raw_user_meta_data->>'campus_id')::UUID;
  
  -- SECURITY: Always use 'student' for new sign-ups, regardless of metadata.
  -- Admins can only be created via SQL or by an existing admin.
  v_role := 'student';
  
  -- For students, validate email domain against campus
  IF v_campus_id IS NOT NULL THEN
    IF NOT public.validate_email_domain(NEW.email, v_campus_id) THEN
      RAISE EXCEPTION 'Email domain not allowed for selected campus';
    END IF;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, name, email, campus_id, role, is_verified)
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    v_campus_id,
    v_role,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. REVOKE ANON ACCESS FROM ADMIN FUNCTIONS (00004_admin_reports.sql)
-- ============================================================================
-- These functions check for admin role internally, but anon shouldn't be able
-- to call them at all. Only authenticated users should attempt these calls.

REVOKE ALL ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

REVOKE ALL ON FUNCTION public.admin_verify_user(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(UUID, BOOLEAN) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_suspend_user(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_suspend_user(UUID, BOOLEAN) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_update_listing_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_listing_status(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_resolve_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(UUID, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_get_users(INT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_users(INT, INT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_get_listings(INT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_listings(INT, INT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_get_reports(INT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_reports(INT, INT, TEXT) TO authenticated;

-- create_report is for authenticated users (not admin-only), keep it callable
REVOKE ALL ON FUNCTION public.create_report(TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_report(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 3. REVOKE ANON ACCESS FROM PRIVILEGED FUNCTIONS (00001_initial_schema.sql)
-- ============================================================================
-- These are helper functions that should only be callable by authenticated users
-- or internally by triggers.

-- validate_email_domain is used by handle_new_user trigger and client validation
-- Keep it callable by authenticated (for client-side checks) but not anon
REVOKE ALL ON FUNCTION public.validate_email_domain(TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_email_domain(TEXT, UUID) TO authenticated;

-- get_campus_for_email is a helper that could leak info about which domains map to which campus
-- It's used client-side for email validation, so keep for authenticated
REVOKE ALL ON FUNCTION public.get_campus_for_email(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_campus_for_email(TEXT) TO authenticated;

-- ============================================================================
-- 4. ADD search_path TO OTHER SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- Update functions from earlier migrations to use SET search_path = ''

CREATE OR REPLACE FUNCTION public.validate_email_domain(
  p_email TEXT,
  p_campus_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_domain TEXT;
  v_allowed_domains TEXT[];
BEGIN
  -- Admin accounts don't need campus domain validation
  IF p_campus_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Extract domain from email (everything after @)
  v_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  -- Reject common personal email domains
  IF v_domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'mail.com', 'protonmail.com', 'aol.com') THEN
    RETURN FALSE;
  END IF;
  
  -- Get allowed domains for the campus
  SELECT allowed_email_domains INTO v_allowed_domains
  FROM public.campuses
  WHERE id = p_campus_id;
  
  IF v_allowed_domains IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email domain is in allowed list
  RETURN v_domain = ANY(v_allowed_domains);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- When email is confirmed, set is_verified = true
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET is_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Prevent changing email or campus_id to bypass domain validation
  IF OLD.email != NEW.email THEN
    RAISE EXCEPTION 'Email cannot be changed directly';
  END IF;
  
  IF OLD.campus_id IS DISTINCT FROM NEW.campus_id THEN
    -- Only admin can change campus
    IF OLD.role != 'admin' THEN
      RAISE EXCEPTION 'Campus cannot be changed';
    END IF;
  END IF;
  
  -- Only admin can change roles
  IF OLD.role != NEW.role THEN
    -- Check if current user is admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  
  -- Only admin can change suspension status
  IF OLD.is_suspended != NEW.is_suspended THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can suspend users';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_campus_for_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_domain TEXT;
  v_campus_id UUID;
BEGIN
  v_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  SELECT id INTO v_campus_id
  FROM public.campuses
  WHERE v_domain = ANY(allowed_email_domains)
  LIMIT 1;
  
  RETURN v_campus_id;
END;
$$;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Functions that remain callable by anon (needed for sign-up flow):
--   - None. All privileged functions now require authenticated role.
--
-- The sign-up flow works because:
--   - Supabase's signUp() creates the auth.users row as service_role
--   - The handle_new_user trigger runs as SECURITY DEFINER (postgres owner)
--   - RLS policies for campuses allow SELECT to authenticated users
--   - The client loads campuses after authentication
--
-- To make an existing user an admin:
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
