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
-- SOUTH AFRICAN PUBLIC TVET COLLEGES (50)
-- Technical and Vocational Education and Training colleges
-- Note: TVET email domains are less standardized than universities.
-- Domains listed are based on official college websites and confirmed student 
-- email patterns where available. Some colleges may use personal emails or
-- Coltech portals rather than institutional email accounts.
-- =============================================================================

INSERT INTO campuses (name, short_name, city, province, kind, allowed_email_domains) VALUES

-- Gauteng (8 TVETs)
('Central Johannesburg TVET College', 'CJC', 'Johannesburg', 'Gauteng', 'tvet', 
  ARRAY['cjc.edu.za']),

('Ekurhuleni East TVET College', 'EEC', 'Springs', 'Gauteng', 'tvet', 
  ARRAY['eec.edu.za']),

('Ekurhuleni West TVET College', 'EWC', 'Germiston', 'Gauteng', 'tvet', 
  ARRAY['ewc.edu.za']),

('Sedibeng TVET College', 'Sedibeng', 'Vereeniging', 'Gauteng', 'tvet', 
  ARRAY['sedcol.co.za']),

('South West Gauteng TVET College', 'SWGC', 'Soweto', 'Gauteng', 'tvet', 
  ARRAY['swgc.co.za']),

('Tshwane North TVET College', 'TNC', 'Pretoria', 'Gauteng', 'tvet', 
  ARRAY['tnc.edu.za']),

('Tshwane South TVET College', 'TSC', 'Centurion', 'Gauteng', 'tvet', 
  ARRAY['tsc.edu.za']),

('Western TVET College', 'Westcol', 'Randfontein', 'Gauteng', 'tvet', 
  ARRAY['westcol.co.za']),

-- Western Cape (6 TVETs)
('Boland TVET College', 'Boland', 'Stellenbosch', 'Western Cape', 'tvet', 
  ARRAY['bolandcollege.com']),

('College of Cape Town TVET', 'CCT', 'Cape Town', 'Western Cape', 'tvet', 
  ARRAY['cct.edu.za']),

('False Bay TVET College', 'False Bay', 'Muizenberg', 'Western Cape', 'tvet', 
  ARRAY['falsebaycollege.co.za', 'fbstudent.org.za']),

('Northlink TVET College', 'Northlink', 'Bellville', 'Western Cape', 'tvet', 
  ARRAY['northlink.co.za']),

('South Cape TVET College', 'South Cape', 'George', 'Western Cape', 'tvet', 
  ARRAY['sccollege.co.za']),

('West Coast TVET College', 'West Coast', 'Malmesbury', 'Western Cape', 'tvet', 
  ARRAY['westcoastcollege.co.za']),

-- KwaZulu-Natal (9 TVETs)
('Coastal TVET College', 'Coastal KZN', 'Durban', 'KwaZulu-Natal', 'tvet', 
  ARRAY['coastalkzn.co.za']),

('Elangeni TVET College', 'Elangeni', 'Pinetown', 'KwaZulu-Natal', 'tvet', 
  ARRAY['elangeni.edu.za']),

('Esayidi TVET College', 'Esayidi', 'Port Shepstone', 'KwaZulu-Natal', 'tvet', 
  ARRAY['esayidifet.co.za']),

('Majuba TVET College', 'Majuba', 'Newcastle', 'KwaZulu-Natal', 'tvet', 
  ARRAY['majuba.edu.za']),

('Mnambithi TVET College', 'Mnambithi', 'Ladysmith', 'KwaZulu-Natal', 'tvet', 
  ARRAY['mnambithicollege.co.za']),

('Mthashana TVET College', 'Mthashana', 'Vryheid', 'KwaZulu-Natal', 'tvet', 
  ARRAY['mthashanacollege.co.za']),

('Thekwini TVET College', 'Thekwini', 'Durban', 'KwaZulu-Natal', 'tvet', 
  ARRAY['thekwini.edu.za']),

('Umfolozi TVET College', 'Umfolozi', 'Richards Bay', 'KwaZulu-Natal', 'tvet', 
  ARRAY['umfolozicollege.co.za']),

('Umgungundlovu TVET College', 'Umgungundlovu', 'Pietermaritzburg', 'KwaZulu-Natal', 'tvet', 
  ARRAY['ufetc.edu.za']),

-- Eastern Cape (8 TVETs)
('Buffalo City TVET College', 'Buffalo City', 'East London', 'Eastern Cape', 'tvet', 
  ARRAY['bccollege.co.za']),

('Eastcape Midlands TVET College', 'Eastcape Midlands', 'Uitenhage', 'Eastern Cape', 'tvet', 
  ARRAY['emcol.co.za']),

('Ikhala TVET College', 'Ikhala', 'Queenstown', 'Eastern Cape', 'tvet', 
  ARRAY['ikhala.edu.za']),

('Ingwe TVET College', 'Ingwe', 'Mount Frere', 'Eastern Cape', 'tvet', 
  ARRAY['ingwecollege.edu.za']),

('King Hintsa TVET College', 'King Hintsa', 'Butterworth', 'Eastern Cape', 'tvet', 
  ARRAY['kinghintsacollege.edu.za']),

('King Sabata Dalindyebo TVET College', 'KSD', 'Mthatha', 'Eastern Cape', 'tvet', 
  ARRAY['ksdcollege.edu.za']),

('Lovedale TVET College', 'Lovedale', 'King Williams Town', 'Eastern Cape', 'tvet', 
  ARRAY['lovedalecollege.co.za']),

('Port Elizabeth TVET College', 'PE TVET', 'Gqeberha', 'Eastern Cape', 'tvet', 
  ARRAY['pecollege.edu.za', 'pecs.edu.za']),

-- Limpopo (7 TVETs)
('Capricorn TVET College', 'Capricorn', 'Polokwane', 'Limpopo', 'tvet', 
  ARRAY['capricorncollege.edu.za']),

('Lephalale TVET College', 'Lephalale', 'Lephalale', 'Limpopo', 'tvet', 
  ARRAY['leptvetcol.edu.za']),

('Letaba TVET College', 'Letaba', 'Tzaneen', 'Limpopo', 'tvet', 
  ARRAY['letabafet.co.za']),

('Mopani South East TVET College', 'Mopani SE', 'Phalaborwa', 'Limpopo', 'tvet', 
  ARRAY['mopanicollege.edu.za']),

('Sekhukhune TVET College', 'Sekhukhune', 'Groblersdal', 'Limpopo', 'tvet', 
  ARRAY['sekhukhunetvet.edu.za']),

('Vhembe TVET College', 'Vhembe', 'Sibasa', 'Limpopo', 'tvet', 
  ARRAY['vhembecollege.edu.za']),

('Waterberg TVET College', 'Waterberg', 'Mokopane', 'Limpopo', 'tvet', 
  ARRAY['waterbergcollege.co.za']),

-- Free State (4 TVETs)
('Flavius Mareka TVET College', 'Flavius Mareka', 'Sasolburg', 'Free State', 'tvet', 
  ARRAY['flaviusmareka.net']),

('Goldfields TVET College', 'Goldfields', 'Welkom', 'Free State', 'tvet', 
  ARRAY['goldfieldstvet.edu.za']),

('Maluti TVET College', 'Maluti', 'Phuthaditjhaba', 'Free State', 'tvet', 
  ARRAY['malutitvet.co.za']),

('Motheo TVET College', 'Motheo', 'Bloemfontein', 'Free State', 'tvet', 
  ARRAY['motheotvet.co.za']),

-- Mpumalanga (3 TVETs)
('Ehlanzeni TVET College', 'Ehlanzeni', 'Mbombela', 'Mpumalanga', 'tvet', 
  ARRAY['ehlanzenicollege.co.za']),

('Gert Sibande TVET College', 'Gert Sibande', 'Standerton', 'Mpumalanga', 'tvet', 
  ARRAY['gscollege.edu.za']),

('Nkangala TVET College', 'Nkangala', 'eMalahleni', 'Mpumalanga', 'tvet', 
  ARRAY['nkangalafet.edu.za']),

-- North West (3 TVETs)
('Orbit TVET College', 'Orbit', 'Rustenburg', 'North West', 'tvet', 
  ARRAY['orbitcollege.co.za']),

('Taletso TVET College', 'Taletso', 'Mahikeng', 'North West', 'tvet', 
  ARRAY['taletsofetcollege.co.za']),

('Vuselela TVET College', 'Vuselela', 'Klerksdorp', 'North West', 'tvet', 
  ARRAY['vuselelacollege.co.za']),

-- Northern Cape (2 TVETs)
('Northern Cape Rural TVET College', 'NC Rural', 'Upington', 'Northern Cape', 'tvet', 
  ARRAY['ncrfet.edu.za']),

('Northern Cape Urban TVET College', 'NC Urban', 'Kimberley', 'Northern Cape', 'tvet', 
  ARRAY['ncutvet.edu.za']);

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

Total: 86 institutions
- 26 Public Universities (all provinces)
- 10 Private Colleges (major institutions including Boston Media House)
- 50 Public TVET Colleges (all provinces)

TVET Email Domain Notes:
TVET college email domains are less standardized than universities. The domains
listed are based on official college websites and confirmed student email patterns.
Some colleges may use personal emails or Coltech portals for student management.
Domains were researched from DHET registers and college websites (2026).

Verification Rule:
Students must register with an email whose domain matches their selected campus.
Gmail, Yahoo, Hotmail, and personal domains are rejected.
Admin accounts are not bound to campus domains.
Alumni domains (e.g. alumni.uct.ac.za) are NOT allowed in v1.

Future additions:
- Campus SSO integration
- Student number verification APIs
';
