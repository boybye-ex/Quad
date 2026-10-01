-- ============================================================================
-- MIGRATION: Email Allowlist for Invite-Only Access
-- ============================================================================
-- This migration creates an email allowlist system for private/invite-only
-- deployment of Quad. Only emails in the allowlist can sign up or sign in.
--
-- Features:
-- - allowed_emails table with email (unique, lowercase), note, created_at
-- - RLS enabled, readable only by admins via service role
-- - Trigger on auth.users insert to enforce allowlist
-- - Settings flag to enable/disable invite-only mode
-- - Seeds existing auth.users + specified test emails
-- ============================================================================

-- ============================================================================
-- 1. SETTINGS TABLE (for feature flags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on settings (admins only via service role)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only service role can access settings
CREATE POLICY "Service role can manage settings"
  ON app_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert the invite-only setting (enabled by default)
INSERT INTO app_settings (key, value, description)
VALUES (
  'invite_only_enabled',
  'true',
  'When true, only emails in allowed_emails can sign up or sign in. Set to false to disable the gate.'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. ALLOWED EMAILS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);

-- Enable RLS
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (admins access via Edge Functions or direct DB)
CREATE POLICY "Service role can manage allowed_emails"
  ON allowed_emails
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view allowed emails via their role
CREATE POLICY "Admins can view allowed_emails"
  ON allowed_emails
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. FUNCTION TO CHECK IF EMAIL IS ALLOWED
-- ============================================================================

CREATE OR REPLACE FUNCTION is_email_allowed(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_only BOOLEAN;
  email_exists BOOLEAN;
BEGIN
  -- Check if invite-only mode is enabled
  SELECT value::BOOLEAN INTO invite_only
  FROM app_settings
  WHERE key = 'invite_only_enabled';
  
  -- If invite-only is disabled, all emails are allowed
  IF NOT COALESCE(invite_only, false) THEN
    RETURN true;
  END IF;
  
  -- Check if email is in the allowlist (case-insensitive)
  SELECT EXISTS (
    SELECT 1 FROM allowed_emails
    WHERE LOWER(email) = LOWER(check_email)
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;

-- ============================================================================
-- 4. TRIGGER TO ENFORCE ALLOWLIST ON AUTH.USERS INSERT
-- ============================================================================
-- Note: This requires Supabase to allow triggers on auth schema.
-- If this doesn't work, enforcement happens at profile creation.

-- First, create the trigger function
CREATE OR REPLACE FUNCTION enforce_email_allowlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the email is allowed
  IF NOT is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Quad is invite-only right now. Contact the team to request access.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Try to create trigger on auth.users (may fail if auth schema triggers not allowed)
DO $$
BEGIN
  -- Drop trigger if exists (for idempotency)
  DROP TRIGGER IF EXISTS check_email_allowlist ON auth.users;
  
  -- Create trigger
  CREATE TRIGGER check_email_allowlist
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION enforce_email_allowlist();
    
  RAISE NOTICE 'Successfully created auth.users trigger for email allowlist';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not create auth.users trigger (insufficient privileges). Enforcement will happen at profile creation.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create auth.users trigger: %. Enforcement will happen at profile creation.', SQLERRM;
END;
$$;

-- ============================================================================
-- 5. BACKUP: TRIGGER ON PROFILES TABLE
-- ============================================================================
-- In case auth.users trigger doesn't work, enforce at profile creation

CREATE OR REPLACE FUNCTION enforce_email_allowlist_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the email is allowed
  IF NOT is_email_allowed(NEW.email) THEN
    -- Delete the auth.user if we can (cleanup)
    -- This might fail but we try anyway
    BEGIN
      DELETE FROM auth.users WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors, the profile insert will still fail
      NULL;
    END;
    
    RAISE EXCEPTION 'Quad is invite-only right now. Contact the team to request access.'
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles
DROP TRIGGER IF EXISTS check_email_allowlist_on_profile ON profiles;
CREATE TRIGGER check_email_allowlist_on_profile
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_email_allowlist_on_profile();

-- ============================================================================
-- 6. ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to add an email to the allowlist
CREATE OR REPLACE FUNCTION admin_add_allowed_email(
  p_email TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
  caller_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can add allowed emails';
  END IF;
  
  -- Insert the email (lowercase)
  INSERT INTO allowed_emails (email, note, created_by)
  VALUES (LOWER(TRIM(p_email)), p_note, auth.uid())
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to remove an email from the allowlist
CREATE OR REPLACE FUNCTION admin_remove_allowed_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
  deleted_count INT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can remove allowed emails';
  END IF;
  
  -- Delete the email
  DELETE FROM allowed_emails
  WHERE LOWER(email) = LOWER(TRIM(p_email));
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- Function to list all allowed emails (admin only)
CREATE OR REPLACE FUNCTION admin_list_allowed_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can list allowed emails';
  END IF;
  
  RETURN QUERY
  SELECT ae.id, ae.email, ae.note, ae.created_at
  FROM allowed_emails ae
  ORDER BY ae.created_at DESC;
END;
$$;

-- Function to toggle invite-only mode (admin only)
CREATE OR REPLACE FUNCTION admin_set_invite_only(p_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change invite-only setting';
  END IF;
  
  -- Update the setting
  UPDATE app_settings
  SET value = p_enabled::TEXT, updated_at = NOW()
  WHERE key = 'invite_only_enabled';
  
  RETURN p_enabled;
END;
$$;

-- ============================================================================
-- 7. SEED ALLOWED EMAILS
-- ============================================================================
-- Add all existing auth.users emails to the allowlist so no one is locked out

INSERT INTO allowed_emails (email, note)
SELECT LOWER(email), 'Auto-added: existing user at migration time'
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Add the specified test emails
INSERT INTO allowed_emails (email, note)
VALUES 
  ('student.test@myboston.co.za', 'Test account for development'),
  ('lebohangntamane03@gmail.com', 'Specified in migration requirements')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 8. GRANT EXECUTE PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call admin functions (they check role internally)
GRANT EXECUTE ON FUNCTION admin_add_allowed_email(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_remove_allowed_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_allowed_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_invite_only(BOOLEAN) TO authenticated;

-- ============================================================================
-- USAGE NOTES:
-- ============================================================================
-- 
-- To add an email (as admin via SQL):
--   SELECT admin_add_allowed_email('newemail@example.com', 'Optional note');
--   
-- Or directly:
--   INSERT INTO allowed_emails (email, note) VALUES ('newemail@example.com', 'Note');
--
-- To remove an email:
--   SELECT admin_remove_allowed_email('email@example.com');
--
-- To disable invite-only mode (allow anyone to sign up):
--   SELECT admin_set_invite_only(false);
--   
-- Or directly:
--   UPDATE app_settings SET value = 'false' WHERE key = 'invite_only_enabled';
--
-- To re-enable invite-only mode:
--   SELECT admin_set_invite_only(true);
-- ============================================================================
