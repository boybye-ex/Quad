-- Quad Step 4: Seed Demo Reports
-- Run this AFTER you have at least 2 users and some listings
-- Replace the UUIDs below with actual user/listing IDs from your database

-- INSTRUCTIONS:
-- 1. First, query your users to get their IDs:
--    SELECT id, email, name FROM profiles LIMIT 10;
--
-- 2. Query your listings to get their IDs:
--    SELECT id, title, seller_id FROM listings LIMIT 10;
--
-- 3. Replace the placeholder UUIDs below with real IDs from your database
--
-- Example reports (replace UUIDs before running):

-- Report 1: Spam listing report
-- INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',  -- Replace with a real user ID
--   'listing',
--   '00000000-0000-0000-0000-000000000002',  -- Replace with a real listing ID
--   'spam',
--   'This listing appears multiple times with slightly different titles.'
-- );

-- Report 2: Scam listing report
-- INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',  -- Replace with a real user ID
--   'listing',
--   '00000000-0000-0000-0000-000000000003',  -- Replace with a real listing ID
--   'scam',
--   'Seller asked me to pay outside the platform and then ghosted me.'
-- );

-- Report 3: Inappropriate content report
-- INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',  -- Replace with a real user ID
--   'listing',
--   '00000000-0000-0000-0000-000000000004',  -- Replace with a real listing ID
--   'inappropriate',
--   'The listing images contain inappropriate content.'
-- );

-- Report 4: Report a user
-- INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',  -- Replace with a real user ID (reporter)
--   'user',
--   '00000000-0000-0000-0000-000000000005',  -- Replace with a real user ID (target)
--   'harassment',
--   'This user has been sending threatening messages.'
-- );

-- =============================================================================
-- AUTOMATED SEED (only works if you have existing users and listings)
-- =============================================================================

-- This will create reports if you have at least 2 users and 3 listings
DO $$
DECLARE
  v_reporter_id UUID;
  v_listing_1 UUID;
  v_listing_2 UUID;
  v_listing_3 UUID;
  v_target_user UUID;
BEGIN
  -- Get a reporter (first non-admin user)
  SELECT id INTO v_reporter_id 
  FROM profiles 
  WHERE role != 'admin' 
  ORDER BY created_at 
  LIMIT 1;
  
  -- Get another user to report
  SELECT id INTO v_target_user 
  FROM profiles 
  WHERE role != 'admin' AND id != v_reporter_id 
  ORDER BY created_at 
  LIMIT 1;
  
  -- Get some listings to report
  SELECT id INTO v_listing_1 
  FROM listings 
  WHERE status = 'active' 
  ORDER BY created_at 
  LIMIT 1;
  
  SELECT id INTO v_listing_2 
  FROM listings 
  WHERE status = 'active' AND id != v_listing_1 
  ORDER BY created_at 
  LIMIT 1;
  
  SELECT id INTO v_listing_3 
  FROM listings 
  WHERE status = 'active' AND id != v_listing_1 AND id != v_listing_2 
  ORDER BY created_at 
  LIMIT 1;
  
  -- Only proceed if we have the required data
  IF v_reporter_id IS NOT NULL AND v_listing_1 IS NOT NULL THEN
    -- Report 1: Spam
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (
      v_reporter_id,
      'listing',
      v_listing_1,
      'spam',
      'This listing appears to be spam. Saw similar posts from different accounts.'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created spam report for listing %', v_listing_1;
  END IF;
  
  IF v_reporter_id IS NOT NULL AND v_listing_2 IS NOT NULL THEN
    -- Report 2: Scam
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (
      v_reporter_id,
      'listing',
      v_listing_2,
      'scam',
      'Price seems too good to be true. Seller asked for upfront payment via EFT before meeting.'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created scam report for listing %', v_listing_2;
  END IF;
  
  IF v_reporter_id IS NOT NULL AND v_listing_3 IS NOT NULL THEN
    -- Report 3: Fake listing
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (
      v_reporter_id,
      'listing',
      v_listing_3,
      'fake_listing',
      'The images appear to be stock photos, not actual product photos.'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created fake listing report for listing %', v_listing_3;
  END IF;
  
  IF v_reporter_id IS NOT NULL AND v_target_user IS NOT NULL THEN
    -- Report 4: User harassment
    INSERT INTO reports (reporter_id, target_type, target_id, reason, description)
    VALUES (
      v_reporter_id,
      'user',
      v_target_user,
      'harassment',
      'This user keeps messaging me even after I said I am not interested.'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created harassment report for user %', v_target_user;
  END IF;
  
  IF v_reporter_id IS NULL THEN
    RAISE NOTICE 'No non-admin users found. Create some test users first.';
  END IF;
  
  IF v_listing_1 IS NULL THEN
    RAISE NOTICE 'No active listings found. Create some listings first.';
  END IF;
END $$;

-- Check what reports were created
SELECT 
  r.id,
  r.target_type,
  r.reason,
  r.status,
  reporter.name as reporter_name,
  CASE 
    WHEN r.target_type = 'listing' THEN (SELECT title FROM listings WHERE id = r.target_id)
    WHEN r.target_type = 'user' THEN (SELECT name FROM profiles WHERE id = r.target_id)
    ELSE 'Unknown'
  END as target_name
FROM reports r
JOIN profiles reporter ON r.reporter_id = reporter.id
ORDER BY r.created_at DESC;
