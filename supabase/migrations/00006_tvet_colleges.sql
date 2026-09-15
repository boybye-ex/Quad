-- Quad: Add South African Public TVET Colleges
-- Migration for production deployment
-- 
-- This migration adds all 50 public TVET (Technical and Vocational Education
-- and Training) colleges in South Africa to the campuses table.
--
-- TVET email domains are based on:
-- - Official DHET (Department of Higher Education and Training) register
-- - College official websites
-- - Confirmed student email patterns where available
--
-- Note: TVET email domains are less standardized than universities.
-- Some colleges may use personal emails or Coltech portals rather than
-- institutional email accounts. Domains listed are best-effort based on
-- official sources.
--
-- Run this migration AFTER the initial schema (00001_initial_schema.sql)
-- and seed.sql have been applied.

-- =============================================================================
-- SOUTH AFRICAN PUBLIC TVET COLLEGES (50)
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
  ARRAY['ncutvet.edu.za'])

ON CONFLICT DO NOTHING;

-- Update table comment
COMMENT ON TABLE campuses IS '
Quad Campus Directory - South African Universities and Colleges

Total: 85 institutions
- 26 Public Universities (all provinces)
- 9 Private Colleges (major institutions)
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
