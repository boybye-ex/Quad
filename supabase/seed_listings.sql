-- Quad Step 2: Demo Listings Seed Data
-- Realistic SA campus listings for UCT, Wits, Stellenbosch, UJ, UNISA

-- Note: This seed requires:
-- 1. The campuses from seed.sql to exist
-- 2. At least one verified user profile to exist (run after creating test users)
-- 
-- For testing, first create a test user via the app or Supabase dashboard,
-- then run this seed replacing the seller_id with the actual user's UUID.

-- =============================================================================
-- DEMO LISTINGS
-- Uses placeholder seller_id - replace with actual user IDs after creating test users
-- =============================================================================

-- First, let's create a demo seller profile if one doesn't exist
-- This is a workaround for seeding - in production, users create their own profiles
DO $$
DECLARE
  v_uct_id UUID;
  v_wits_id UUID;
  v_su_id UUID;
  v_uj_id UUID;
  v_unisa_id UUID;
  v_demo_seller_id UUID;
  v_textbooks_id UUID;
  v_housing_id UUID;
  v_tutoring_id UUID;
  v_rides_id UUID;
  v_electronics_id UUID;
  v_furniture_id UUID;
BEGIN
  -- Get campus IDs
  SELECT id INTO v_uct_id FROM campuses WHERE short_name = 'UCT';
  SELECT id INTO v_wits_id FROM campuses WHERE short_name = 'Wits';
  SELECT id INTO v_su_id FROM campuses WHERE short_name = 'SU';
  SELECT id INTO v_uj_id FROM campuses WHERE short_name = 'UJ';
  SELECT id INTO v_unisa_id FROM campuses WHERE short_name = 'UNISA';
  
  -- Get category IDs
  SELECT id INTO v_textbooks_id FROM categories WHERE slug = 'textbooks';
  SELECT id INTO v_housing_id FROM categories WHERE slug = 'housing';
  SELECT id INTO v_tutoring_id FROM categories WHERE slug = 'tutoring';
  SELECT id INTO v_rides_id FROM categories WHERE slug = 'rides';
  SELECT id INTO v_electronics_id FROM categories WHERE slug = 'electronics';
  SELECT id INTO v_furniture_id FROM categories WHERE slug = 'furniture';
  
  -- Check if we have a demo seller, if not, we'll need to skip
  -- In production, you'd create test users first
  SELECT id INTO v_demo_seller_id FROM profiles WHERE is_verified = true LIMIT 1;
  
  IF v_demo_seller_id IS NULL THEN
    RAISE NOTICE 'No verified profiles found. Please create a test user first, then run this seed.';
    RETURN;
  END IF;
  
  -- UCT Listings
  INSERT INTO listings (title, description, price, original_price, price_type, category_id, images, seller_id, campus_id, condition, tags, status)
  VALUES
    ('Calculus: Early Transcendentals 8th Ed', 
     'Stewart''s Calculus textbook in good condition. Some highlighting but all pages intact. Perfect for MAM1000W.', 
     350, 850, 'fixed', v_textbooks_id, 
     ARRAY['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'],
     v_demo_seller_id, v_uct_id, 'good', ARRAY['MAM1000W', 'Mathematics'], 'active'),
     
    ('Sunny Rondebosch Studio - Summer Sublet',
     'Fully furnished studio 10 min walk to upper campus. Fiber WiFi, secure parking, mountain views. Available Dec-Feb.',
     7500, NULL, 'monthly', v_housing_id,
     ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
     v_demo_seller_id, v_uct_id, NULL, ARRAY['Rondebosch', 'Summer', 'Furnished'], 'active'),
     
    ('Python Programming Tutor - CS Honours Student',
     'Offering tutoring for CSC1015F/1016S and CSC2001F. R250/hour. Can meet at library or online via Zoom.',
     250, NULL, 'hourly', v_tutoring_id,
     ARRAY['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'],
     v_demo_seller_id, v_uct_id, NULL, ARRAY['Python', 'CSC1015F', 'Computer Science'], 'active');
  
  -- Wits Listings  
  INSERT INTO listings (title, description, price, original_price, price_type, category_id, images, seller_id, campus_id, condition, tags, status)
  VALUES
    ('MacBook Air M2 2023 - Perfect Condition',
     '8GB RAM, 256GB SSD. Still under AppleCare+ until 2025. Includes original charger and box. Selling because upgraded to Pro.',
     18500, 22999, 'fixed', v_electronics_id,
     ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
     v_demo_seller_id, v_wits_id, 'like-new', ARRAY['Apple', 'Laptop', 'M2'], 'active'),
     
    ('Ride to OR Tambo - Friday 4PM',
     'Driving to OR Tambo International this Friday. Have 3 seats available. R150 per person, will help with luggage. Meet at Matrix.',
     150, NULL, 'fixed', v_rides_id,
     ARRAY['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'],
     v_demo_seller_id, v_wits_id, NULL, ARRAY['Airport', 'OR Tambo', 'Friday'], 'active'),
     
    ('Law of Contract Textbook + Study Guide',
     'Christie''s Law of Contract 8th edition plus the Juta study guide. Both in excellent condition. Essential for LLB.',
     600, 1200, 'fixed', v_textbooks_id,
     ARRAY['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400'],
     v_demo_seller_id, v_wits_id, 'like-new', ARRAY['Law', 'LLB', 'Contract'], 'active');
  
  -- Stellenbosch Listings
  INSERT INTO listings (title, description, price, original_price, price_type, category_id, images, seller_id, campus_id, condition, tags, status)
  VALUES
    ('IKEA MALM Desk + MARKUS Chair',
     'White MALM desk (140x65cm) and black MARKUS office chair. Both in great condition. Selling together due to move.',
     2500, 4500, 'fixed', v_furniture_id,
     ARRAY['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'],
     v_demo_seller_id, v_su_id, 'good', ARRAY['IKEA', 'Desk', 'Chair'], 'active'),
     
    ('Afrikaans en Nederlands Tutoring',
     'Moedertaalspreker bied tutoring vir Afrikaans 178/278 en Nederlands. R200/uur. Kan by biblioteek ontmoet.',
     200, NULL, 'hourly', v_tutoring_id,
     ARRAY['https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400'],
     v_demo_seller_id, v_su_id, NULL, ARRAY['Afrikaans', 'Nederlands', 'Taal'], 'active'),
     
    ('Single Room in Student House - Stellenbosch Central',
     'Room available in 4-bedroom student house. Walking distance to campus. R4500 p/m incl. WiFi. Available from Feb.',
     4500, NULL, 'monthly', v_housing_id,
     ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'],
     v_demo_seller_id, v_su_id, NULL, ARRAY['Stellenbosch', 'Room', 'Student House'], 'active');
  
  -- UJ Listings
  INSERT INTO listings (title, description, price, original_price, price_type, category_id, images, seller_id, campus_id, condition, tags, status)
  VALUES
    ('Accounting IFRS Textbook Bundle',
     'Includes Accounting: An Introduction 14th Ed + GAAP Handbook 2024. Perfect for ACC1A/ACC1B. Some notes in margins.',
     800, 1800, 'fixed', v_textbooks_id,
     ARRAY['https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400'],
     v_demo_seller_id, v_uj_id, 'good', ARRAY['Accounting', 'IFRS', 'ACC1A'], 'active'),
     
    ('Samsung Galaxy Tab S8 + S Pen',
     'Great for note-taking and studying. 128GB WiFi model. Includes original S Pen and book cover. Minor scratches on back.',
     8500, 13999, 'fixed', v_electronics_id,
     ARRAY['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
     v_demo_seller_id, v_uj_id, 'good', ARRAY['Samsung', 'Tablet', 'S Pen'], 'active'),
     
    ('Ride to Pretoria - Daily Carpool',
     'Looking for carpool partners for daily commute APK to Pretoria East. Leaving 6:30 AM, returning 5 PM. R1500/month.',
     1500, NULL, 'monthly', v_rides_id,
     ARRAY['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'],
     v_demo_seller_id, v_uj_id, NULL, ARRAY['Carpool', 'Pretoria', 'Daily'], 'active');
  
  -- UNISA Listings (distance learning focused)
  INSERT INTO listings (title, description, price, original_price, price_type, category_id, images, seller_id, campus_id, condition, tags, status)
  VALUES
    ('Complete Psychology 101 Study Pack',
     'PYC1501 prescribed textbook + tutorial letters + past papers (2020-2023). Everything you need to pass!',
     450, 900, 'fixed', v_textbooks_id,
     ARRAY['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400'],
     v_demo_seller_id, v_unisa_id, 'good', ARRAY['PYC1501', 'Psychology', 'Study Pack'], 'active'),
     
    ('Online Statistics Tutoring - Honours Student',
     'Offering online tutoring for STA1501/STA1503. Zoom sessions with screen sharing. Past papers and exam tips included.',
     300, NULL, 'hourly', v_tutoring_id,
     ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'],
     v_demo_seller_id, v_unisa_id, NULL, ARRAY['Statistics', 'STA1501', 'Online'], 'active'),
     
    ('Ergonomic Home Office Setup',
     'Flexispot standing desk (120x60cm) + Herman Miller Aeron chair (size B). Both in excellent condition. Perfect for studying at home.',
     12000, 25000, 'fixed', v_furniture_id,
     ARRAY['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400'],
     v_demo_seller_id, v_unisa_id, 'like-new', ARRAY['Standing Desk', 'Ergonomic', 'Home Office'], 'active');

  RAISE NOTICE 'Demo listings seeded successfully!';
END $$;
