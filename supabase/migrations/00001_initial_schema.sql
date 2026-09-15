-- Quad Step 1: Foundation Schema
-- South African campus noticeboard - Supabase backend

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CAMPUSES TABLE
-- =============================================================================
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('public_university', 'private_college', 'tvet')),
  allowed_email_domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campuses_kind ON campuses(kind);
CREATE INDEX idx_campuses_province ON campuses(province);

COMMENT ON TABLE campuses IS 'South African universities and colleges. Students must use an email from allowed_email_domains.';
COMMENT ON COLUMN campuses.kind IS 'public_university | private_college | tvet (TVET colleges added later)';
COMMENT ON COLUMN campuses.allowed_email_domains IS 'Lowercase email domains without @, e.g. {''myuct.ac.za'', ''uct.ac.za''}';

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  campus_id UUID REFERENCES campuses(id),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'ta', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_campus ON profiles(campus_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

COMMENT ON TABLE profiles IS 'User profiles linked to auth.users. Admin accounts may have NULL campus_id.';
COMMENT ON COLUMN profiles.is_verified IS 'True after email is confirmed (set by trigger on auth.users)';
COMMENT ON COLUMN profiles.role IS 'student | ta | admin';

-- =============================================================================
-- STUB TABLES FOR FK PLANNING (not functional in Step 1)
-- =============================================================================

-- Listings stub
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE listings IS 'STUB for Step 1 - FK planning only. Full schema in later step.';

-- Messages stub
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'STUB for Step 1 - FK planning only. Full schema in later step.';

-- Reports stub
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'STUB for Step 1 - FK planning only. Full schema in later step.';

-- =============================================================================
-- DOMAIN VALIDATION FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_email_domain(
  p_email TEXT,
  p_campus_id UUID
) RETURNS BOOLEAN AS $$
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
  FROM campuses
  WHERE id = p_campus_id;
  
  IF v_allowed_domains IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if email domain is in allowed list
  RETURN v_domain = ANY(v_allowed_domains);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_email_domain IS 'Server-side check: email domain must be in campus allowed_email_domains. Rejects Gmail/Yahoo/Hotmail etc.';

-- =============================================================================
-- PROFILE CREATION TRIGGER (on auth.users insert)
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_campus_id UUID;
  v_role TEXT;
BEGIN
  -- Extract metadata from auth signup
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  v_campus_id := (NEW.raw_user_meta_data->>'campus_id')::UUID;
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Validate role
  IF v_role NOT IN ('student', 'ta', 'admin') THEN
    v_role := 'student';
  END IF;
  
  -- For non-admin users, validate email domain
  IF v_role != 'admin' AND v_campus_id IS NOT NULL THEN
    IF NOT validate_email_domain(NEW.email, v_campus_id) THEN
      RAISE EXCEPTION 'Email domain not allowed for selected campus';
    END IF;
  END IF;
  
  -- Create profile
  INSERT INTO profiles (id, name, email, campus_id, role, is_verified)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- EMAIL CONFIRMATION TRIGGER (updates is_verified)
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- When email is confirmed, set is_verified = true
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles
    SET is_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_email_confirmed();

-- =============================================================================
-- PROFILE UPDATE VALIDATION (prevent bypassing domain rules)
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS TRIGGER AS $$
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
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  
  -- Only admin can change suspension status
  IF OLD.is_suspended != NEW.is_suspended THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can suspend users';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_profile_changes ON profiles;
CREATE TRIGGER validate_profile_changes
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_update();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- CAMPUSES: Anyone authenticated can read
CREATE POLICY "Authenticated users can read campuses"
  ON campuses FOR SELECT
  TO authenticated
  USING (true);

-- CAMPUSES: Only service role can modify (via migrations/admin)
CREATE POLICY "Service role can manage campuses"
  ON campuses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PROFILES: Users can read own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- PROFILES: Users can read other verified profiles (for listings/messages)
CREATE POLICY "Users can read verified profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_verified = true AND is_suspended = false);

-- PROFILES: Users can update own name and avatar
CREATE POLICY "Users can update own profile fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- PROFILES: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PROFILES: Admins can update any profile (for role/suspension changes)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- LISTINGS (stub): Basic policies for future use
CREATE POLICY "Users can read listings"
  ON listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

-- MESSAGES (stub): Basic policies for future use
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- REPORTS (stub): Basic policies for future use
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can read reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- HELPER FUNCTION: Check if email domain matches campus
-- =============================================================================
CREATE OR REPLACE FUNCTION get_campus_for_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_domain TEXT;
  v_campus_id UUID;
BEGIN
  v_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  SELECT id INTO v_campus_id
  FROM campuses
  WHERE v_domain = ANY(allowed_email_domains)
  LIMIT 1;
  
  RETURN v_campus_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_campus_for_email IS 'Returns campus ID if email domain matches any campus, NULL otherwise.';
