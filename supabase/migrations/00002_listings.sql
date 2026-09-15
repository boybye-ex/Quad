-- Quad Step 2: Real Listings
-- Full listings implementation with categories, favourites, and storage

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'grid-outline',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories(display_order);

COMMENT ON TABLE categories IS 'Listing categories: textbooks, housing, tutoring, rides, shifts, electronics, furniture';

-- Seed categories
INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('Textbooks', 'textbooks', 'book-outline', 1),
  ('Housing', 'housing', 'home-outline', 2),
  ('Tutoring', 'tutoring', 'school-outline', 3),
  ('Rides', 'rides', 'car-outline', 4),
  ('Shifts', 'shifts', 'briefcase-outline', 5),
  ('Electronics', 'electronics', 'laptop-outline', 6),
  ('Furniture', 'furniture', 'bed-outline', 7);

-- =============================================================================
-- DROP STUB LISTINGS TABLE AND CREATE REAL ONE
-- =============================================================================
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS listings;

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10, 2),
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'monthly', 'free')),
  category_id UUID NOT NULL REFERENCES categories(id),
  images TEXT[] NOT NULL DEFAULT '{}',
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id),
  condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_campus ON listings(campus_id);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);

COMMENT ON TABLE listings IS 'Campus noticeboard listings with full details';
COMMENT ON COLUMN listings.images IS 'Array of storage paths or URLs for listing images';
COMMENT ON COLUMN listings.status IS 'active = visible, hidden = seller-hidden, deleted = soft-deleted';

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_updated
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_listing_timestamp();

-- =============================================================================
-- FAVOURITES TABLE
-- =============================================================================
CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favourites_user ON favourites(user_id);
CREATE INDEX idx_favourites_listing ON favourites(listing_id);

COMMENT ON TABLE favourites IS 'User favourite listings';

-- =============================================================================
-- RECREATE STUB TABLES FOR FK PLANNING (messages, reports)
-- =============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'STUB for Step 3 - FK planning only. Full schema in later step.';

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'STUB for Step 4 - FK planning only. Full schema in later step.';

-- =============================================================================
-- ROW LEVEL SECURITY FOR LISTINGS
-- =============================================================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- CATEGORIES: Anyone authenticated can read
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- LISTINGS: Anyone authenticated can read active listings
CREATE POLICY "Anyone can read active listings"
  ON listings FOR SELECT
  TO authenticated
  USING (status = 'active');

-- LISTINGS: Sellers can read their own listings (any status)
CREATE POLICY "Sellers can read own listings"
  ON listings FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- LISTINGS: Admins can read all listings
CREATE POLICY "Admins can read all listings"
  ON listings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- LISTINGS: Signed-in verified users can insert
CREATE POLICY "Verified users can insert listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_verified = true AND is_suspended = false
    )
  );

-- LISTINGS: Sellers can update their own listings
CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- LISTINGS: Admins can update any listing
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

-- LISTINGS: Sellers can delete (soft-delete) their own listings
CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid());

-- LISTINGS: Admins can delete any listing
CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FAVOURITES: Users can read their own favourites
CREATE POLICY "Users can read own favourites"
  ON favourites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- FAVOURITES: Users can insert their own favourites
CREATE POLICY "Users can insert own favourites"
  ON favourites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- FAVOURITES: Users can delete their own favourites
CREATE POLICY "Users can delete own favourites"
  ON favourites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

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
-- STORAGE BUCKET: listing-images
-- Note: Run this in Supabase SQL Editor or via supabase CLI
-- Storage policies must be created through the dashboard or storage API
-- =============================================================================

-- Create the storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listing-images bucket
-- Public read access
CREATE POLICY "Public read access for listing images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own images
CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get listing with all related data
CREATE OR REPLACE FUNCTION get_listing_with_details(p_listing_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL,
  original_price DECIMAL,
  price_type TEXT,
  images TEXT[],
  condition TEXT,
  tags TEXT[],
  status TEXT,
  view_count INT,
  created_at TIMESTAMPTZ,
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_icon TEXT,
  seller_id UUID,
  seller_name TEXT,
  seller_avatar TEXT,
  seller_role TEXT,
  seller_verified BOOLEAN,
  campus_id UUID,
  campus_name TEXT,
  campus_short_name TEXT
) AS $$
BEGIN
  -- Increment view count
  UPDATE listings SET view_count = view_count + 1 WHERE listings.id = p_listing_id;
  
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.price,
    l.original_price,
    l.price_type,
    l.images,
    l.condition,
    l.tags,
    l.status,
    l.view_count,
    l.created_at,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    c.icon AS category_icon,
    p.id AS seller_id,
    p.name AS seller_name,
    p.avatar_url AS seller_avatar,
    p.role AS seller_role,
    p.is_verified AS seller_verified,
    ca.id AS campus_id,
    ca.name AS campus_name,
    ca.short_name AS campus_short_name
  FROM listings l
  JOIN categories c ON l.category_id = c.id
  JOIN profiles p ON l.seller_id = p.id
  JOIN campuses ca ON l.campus_id = ca.id
  WHERE l.id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has favourited a listing
CREATE OR REPLACE FUNCTION is_favourited(p_listing_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM favourites 
    WHERE listing_id = p_listing_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
