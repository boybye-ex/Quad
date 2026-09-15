-- Quad Step 1: Seed Data
-- South African universities, private colleges, and admin user

-- =============================================================================
-- SOUTH AFRICAN PUBLIC UNIVERSITIES (26)
-- =============================================================================

INSERT INTO campuses (name, short_name, city, province, kind, allowed_email_domains) VALUES

-- Western Cape (4)
('University of Cape Town', 'UCT', 'Cape Town', 'Western Cape', 'public_university', 
  ARRAY['myuct.ac.za', 'uct.ac.za']),

('Stellenbosch University', 'SU', 'Stellenbosch', 'Western Cape', 'public_university', 
  ARRAY['sun.ac.za']),

('University of the Western Cape', 'UWC', 'Bellville', 'Western Cape', 'public_university', 
  ARRAY['uwc.ac.za', 'myuwc.ac.za']),

('Cape Peninsula University of Technology', 'CPUT', 'Cape Town', 'Western Cape', 'public_university', 
  ARRAY['cput.ac.za']),

-- Gauteng (6)
('University of the Witwatersrand', 'Wits', 'Johannesburg', 'Gauteng', 'public_university', 
  ARRAY['students.wits.ac.za', 'wits.ac.za']),

('University of Johannesburg', 'UJ', 'Johannesburg', 'Gauteng', 'public_university', 
  ARRAY['student.uj.ac.za', 'uj.ac.za']),

('University of Pretoria', 'UP', 'Pretoria', 'Gauteng', 'public_university', 
  ARRAY['tuks.co.za', 'up.ac.za']),

('Tshwane University of Technology', 'TUT', 'Pretoria', 'Gauteng', 'public_university', 
  ARRAY['tut4life.ac.za', 'tut.ac.za']),

('University of South Africa', 'UNISA', 'Pretoria', 'Gauteng', 'public_university', 
  ARRAY['mylife.unisa.ac.za']),

('Sefako Makgatho Health Sciences University', 'SMU', 'Ga-Rankuwa', 'Gauteng', 'public_university', 
  ARRAY['smu.ac.za']),

-- KwaZulu-Natal (4)
('University of KwaZulu-Natal', 'UKZN', 'Durban', 'KwaZulu-Natal', 'public_university', 
  ARRAY['stu.ukzn.ac.za', 'ukzn.ac.za']),

('Durban University of Technology', 'DUT', 'Durban', 'KwaZulu-Natal', 'public_university', 
  ARRAY['dut4life.ac.za']),

('University of Zululand', 'UniZulu', 'KwaDlangezwa', 'KwaZulu-Natal', 'public_university', 
  ARRAY['unizulu.ac.za']),

('Mangosuthu University of Technology', 'MUT', 'Umlazi', 'KwaZulu-Natal', 'public_university', 
  ARRAY['mut.ac.za']),

-- Eastern Cape (4)
('Nelson Mandela University', 'NMU', 'Gqeberha', 'Eastern Cape', 'public_university', 
  ARRAY['mandela.ac.za']),

('Walter Sisulu University', 'WSU', 'Mthatha', 'Eastern Cape', 'public_university', 
  ARRAY['wsu.ac.za']),

('Rhodes University', 'RU', 'Makhanda', 'Eastern Cape', 'public_university', 
  ARRAY['campus.ru.ac.za', 'ru.ac.za']),

('University of Fort Hare', 'UFH', 'Alice', 'Eastern Cape', 'public_university', 
  ARRAY['ufh.ac.za']),

-- Free State (2)
('University of the Free State', 'UFS', 'Bloemfontein', 'Free State', 'public_university', 
  ARRAY['ufs4life.ac.za', 'ufs.ac.za']),

('Central University of Technology', 'CUT', 'Bloemfontein', 'Free State', 'public_university', 
  ARRAY['cut.ac.za']),

-- Limpopo (2)
('University of Limpopo', 'UL', 'Polokwane', 'Limpopo', 'public_university', 
  ARRAY['ul.ac.za']),

('University of Venda', 'Univen', 'Thohoyandou', 'Limpopo', 'public_university', 
  ARRAY['univen.ac.za']),

-- North West (1)
('North-West University', 'NWU', 'Potchefstroom', 'North West', 'public_university', 
  ARRAY['student.nwu.ac.za', 'nwu.ac.za']),

-- Northern Cape (1)
('Sol Plaatje University', 'SPU', 'Kimberley', 'Northern Cape', 'public_university', 
  ARRAY['spu.ac.za']),

-- Mpumalanga (1)
('University of Mpumalanga', 'UMP', 'Mbombela', 'Mpumalanga', 'public_university', 
  ARRAY['ump.ac.za']),

-- Gauteng (additional - VUT)
('Vaal University of Technology', 'VUT', 'Vanderbijlpark', 'Gauteng', 'public_university', 
  ARRAY['vut.ac.za']);

-- =============================================================================
-- SOUTH AFRICAN PRIVATE COLLEGES (10)
-- =============================================================================

INSERT INTO campuses (name, short_name, city, province, kind, allowed_email_domains) VALUES

('IIE MSA', 'MSA', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['iiemsa.co.za', 'msa.ac.za']),

('IIE Varsity College', 'Varsity College', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['varsitycollege.co.za']),

('IIE Rosebank College', 'Rosebank College', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['rosebankcollege.co.za']),

('IIE Vega School', 'Vega', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['vegaschool.com']),

('Eduvos', 'Eduvos', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['eduvos.com']),

('AFDA', 'AFDA', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['afda.co.za']),

('STADIO', 'STADIO', 'Bellville', 'Western Cape', 'private_college', 
  ARRAY['stadio.ac.za']),

('MANCOSA', 'MANCOSA', 'Durban', 'KwaZulu-Natal', 'private_college', 
  ARRAY['mancosa.co.za']),

('Boston City Campus', 'Boston', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['boston.co.za']),

('Boston Media House', 'BMH', 'Johannesburg', 'Gauteng', 'private_college', 
  ARRAY['myboston.co.za', 'bostonmediahouse.ac.za']);


-- =============================================================================
-- ADMIN USER
-- Note: This creates a profile entry for the admin. In production, you need to:
-- 1. Create the auth.users entry first via Supabase Auth
-- 2. Or use the Supabase dashboard to create the admin user
-- 
-- For local development/testing with email: admin@quad.local
-- The actual auth.users entry is created when the admin signs up.
-- This is documented for manual setup.
-- =============================================================================

-- We cannot insert directly into auth.users from seed (it's a protected schema).
-- Instead, document that the admin should be created via:
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- 2. Email: admin@quad.local (or your admin email)
-- 3. The trigger will create profile with role='student' by default
-- 4. Then manually update the profile role to 'admin'

-- For testing, here's the SQL to run AFTER creating the admin user in auth:
-- UPDATE profiles SET role = 'admin', campus_id = NULL WHERE email = 'admin@quad.local';

COMMENT ON TABLE campuses IS '
Quad Campus Directory - South African Universities and Colleges

Total: 36 institutions
- 26 Public Universities (all provinces)
- 10 Private Colleges (major institutions)
- TVET colleges NOT included in v1 (inconsistent email domains)

Verification Rule:
Students must register with an email whose domain matches their selected campus.
Gmail, Yahoo, Hotmail, and personal domains are rejected.
Admin accounts are not bound to campus domains.
Alumni domains (e.g. alumni.uct.ac.za) are NOT allowed in v1.

Future additions:
- TVET colleges (50+) when email domains are standardized
- Campus SSO integration
- Student number verification APIs
';
