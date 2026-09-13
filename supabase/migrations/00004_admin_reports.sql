-- Quad Step 4: Admin + Reports
-- Reports system and admin-only APIs

-- =============================================================================
-- DROP STUB REPORTS TABLE AND CREATE REAL SCHEMA
-- =============================================================================
DROP TABLE IF EXISTS reports;

-- =============================================================================
-- REPORTS TABLE
-- =============================================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'scam',
    'harassment',
    'fake_listing',
    'prohibited_item',
    'other'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

COMMENT ON TABLE reports IS 'User reports for listings, users, or messages';

-- =============================================================================
-- ROW LEVEL SECURITY FOR REPORTS
-- =============================================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (they can report anything)
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
    )
  );

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
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

-- =============================================================================
-- ADMIN-ONLY RLS POLICIES FOR PROFILES
-- =============================================================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admins can update any profile (for verify/suspend)
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

-- =============================================================================
-- ADMIN-ONLY RLS POLICIES FOR LISTINGS
-- =============================================================================

-- Admins can update any listing (for moderation)
CREATE POLICY "Admins can update any listing"
  ON listings FOR UPDATE
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

-- Admins can delete any listing
CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- ADMIN HELPER FUNCTIONS
-- =============================================================================

-- Get dashboard stats for admin
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'verified_users', (SELECT COUNT(*) FROM profiles WHERE is_verified = true),
    'suspended_users', (SELECT COUNT(*) FROM profiles WHERE is_suspended = true),
    'total_listings', (SELECT COUNT(*) FROM listings WHERE status != 'deleted'),
    'active_listings', (SELECT COUNT(*) FROM listings WHERE status = 'active'),
    'hidden_listings', (SELECT COUNT(*) FROM listings WHERE status = 'hidden'),
    'total_reports', (SELECT COUNT(*) FROM reports),
    'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
    'resolved_reports', (SELECT COUNT(*) FROM reports WHERE status = 'resolved'),
    'total_conversations', (SELECT COUNT(*) FROM conversations),
    'total_messages', (SELECT COUNT(*) FROM messages)
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify a user (admin only)
CREATE OR REPLACE FUNCTION admin_verify_user(p_user_id UUID, p_verified BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  UPDATE profiles
  SET is_verified = p_verified
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend/unsuspend a user (admin only)
CREATE OR REPLACE FUNCTION admin_suspend_user(p_user_id UUID, p_suspended BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- Cannot suspend another admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Cannot suspend an admin user';
  END IF;

  UPDATE profiles
  SET is_suspended = p_suspended
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update listing status (admin only)
CREATE OR REPLACE FUNCTION admin_update_listing_status(p_listing_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- Validate status
  IF p_status NOT IN ('active', 'hidden', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status: must be active, hidden, or deleted';
  END IF;

  UPDATE listings
  SET status = p_status
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve a report (admin only)
CREATE OR REPLACE FUNCTION admin_resolve_report(
  p_report_id UUID, 
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- Validate status
  IF p_status NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid status: must be resolved or dismissed';
  END IF;

  UPDATE reports
  SET 
    status = p_status,
    resolved_by = auth.uid(),
    resolved_at = NOW(),
    resolution_notes = p_notes
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all users (admin only, with pagination)
CREATE OR REPLACE FUNCTION admin_get_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  is_verified BOOLEAN,
  is_suspended BOOLEAN,
  campus_id UUID,
  campus_name TEXT,
  created_at TIMESTAMPTZ,
  listing_count BIGINT
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.is_verified,
    p.is_suspended,
    p.campus_id,
    c.name AS campus_name,
    p.created_at,
    (SELECT COUNT(*) FROM listings l WHERE l.seller_id = p.id AND l.status != 'deleted') AS listing_count
  FROM profiles p
  LEFT JOIN campuses c ON p.campus_id = c.id
  WHERE (
    p_status IS NULL OR
    (p_status = 'verified' AND p.is_verified = true) OR
    (p_status = 'unverified' AND p.is_verified = false) OR
    (p_status = 'suspended' AND p.is_suspended = true)
  )
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all listings for moderation (admin only, with pagination)
CREATE OR REPLACE FUNCTION admin_get_listings(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  status TEXT,
  seller_id UUID,
  seller_name TEXT,
  seller_email TEXT,
  campus_name TEXT,
  category_name TEXT,
  created_at TIMESTAMPTZ,
  report_count BIGINT
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.price,
    l.status,
    l.seller_id,
    p.name AS seller_name,
    p.email AS seller_email,
    camp.name AS campus_name,
    cat.name AS category_name,
    l.created_at,
    (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'listing' AND r.target_id = l.id AND r.status = 'pending') AS report_count
  FROM listings l
  JOIN profiles p ON l.seller_id = p.id
  LEFT JOIN campuses camp ON l.campus_id = camp.id
  LEFT JOIN categories cat ON l.category_id = cat.id
  WHERE (p_status IS NULL OR l.status = p_status)
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all reports (admin only, with pagination)
CREATE OR REPLACE FUNCTION admin_get_reports(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  reporter_id UUID,
  reporter_name TEXT,
  reporter_email TEXT,
  target_type TEXT,
  target_id UUID,
  target_title TEXT,
  reason TEXT,
  description TEXT,
  status TEXT,
  resolved_by UUID,
  resolver_name TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.reporter_id,
    reporter.name AS reporter_name,
    reporter.email AS reporter_email,
    r.target_type,
    r.target_id,
    CASE 
      WHEN r.target_type = 'listing' THEN (SELECT title FROM listings WHERE id = r.target_id)
      WHEN r.target_type = 'user' THEN (SELECT name FROM profiles WHERE id = r.target_id)
      WHEN r.target_type = 'message' THEN 'Message'
      ELSE 'Unknown'
    END AS target_title,
    r.reason,
    r.description,
    r.status,
    r.resolved_by,
    resolver.name AS resolver_name,
    r.resolved_at,
    r.resolution_notes,
    r.created_at
  FROM reports r
  JOIN profiles reporter ON r.reporter_id = reporter.id
  LEFT JOIN profiles resolver ON r.resolved_by = resolver.id
  WHERE (p_status IS NULL OR r.status = p_status)
  ORDER BY 
    CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
    r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a report (user function)
CREATE OR REPLACE FUNCTION create_report(
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
BEGIN
  -- Check if user is verified and not suspended
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
  ) THEN
    RAISE EXCEPTION 'Only verified users can submit reports';
  END IF;

  -- Validate target type
  IF p_target_type NOT IN ('listing', 'user', 'message') THEN
    RAISE EXCEPTION 'Invalid target type';
  END IF;

  -- Validate reason
  IF p_reason NOT IN ('spam', 'inappropriate', 'scam', 'harassment', 'fake_listing', 'prohibited_item', 'other') THEN
    RAISE EXCEPTION 'Invalid reason';
  END IF;

  -- Check target exists
  IF p_target_type = 'listing' AND NOT EXISTS (SELECT 1 FROM listings WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF p_target_type = 'user' AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF p_target_type = 'message' AND NOT EXISTS (SELECT 1 FROM messages WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Cannot report yourself
  IF p_target_type = 'user' AND p_target_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot report yourself';
  END IF;

  -- Check for duplicate pending report
  IF EXISTS (
    SELECT 1 FROM reports 
    WHERE reporter_id = auth.uid() 
    AND target_type = p_target_type 
    AND target_id = p_target_id 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'You already have a pending report for this item';
  END IF;

  INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
  VALUES (auth.uid(), p_target_type, p_target_id, p_reason, p_description)
  RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
