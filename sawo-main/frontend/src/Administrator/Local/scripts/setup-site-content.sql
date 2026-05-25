-- ============================================================
-- SAWO: Site Content CMS — Supabase Setup
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS site_content (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  page        TEXT        NOT NULL,          -- e.g. 'home', 'about', 'contact'
  section     TEXT        NOT NULL,          -- e.g. 'hero', 'section1', 'section5'
  data        JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- full section content as JSON
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT,                          -- username who last saved

  UNIQUE (page, section)
);

-- Index for fast lookups by page
CREATE INDEX IF NOT EXISTS site_content_page_idx ON site_content(page);

-- 2. Seed: Home page — Hero section
INSERT INTO site_content (page, section, data) VALUES
('home', 'hero', '{
  "image_640":  null,
  "image_1024": null,
  "image_1920": null,
  "alt_text": "SAWO sauna heaters - Experience wellness and rejuvenation",
  "typewriter_sentences": [
    "a rejuvenating escape",
    "wellness with ancient tradition",
    "an authentic Finnish sauna"
  ],
  "button_text": "VIEW CATALOGUE",
  "button_url":  "https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf"
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- 3. Seed: Home page — Section 1 (category carousel)
INSERT INTO site_content (page, section, data) VALUES
('home', 'section1', '{
  "heading": "Dive into our Sauna World",
  "items": [
    { "title": "SAUNA HEATERS",    "caption": "Rejuvenate in the warmth of a traditional Finnish sauna with SAWO'\''s premium heaters.",                                    "image_url": null, "alt": "Finnish sauna heater collection by SAWO for efficient sauna heating" },
    { "title": "STEAM GENERATORS", "caption": "Relieve your stress and tension with healing steam powered by SAWO generators.",                                               "image_url": null, "alt": "SAWO steam generator for modern sauna and spa steam rooms" },
    { "title": "SAUNA ROOMS",      "caption": "Relax, detox, and rejuvenate in a SAWO-designed sauna room with therapeutic heat.",                                           "image_url": null, "alt": "Standard Finnish sauna room by SAWO with natural wood design" },
    { "title": "INFRARED SAUNA",   "caption": "Experience deep relaxation with advanced infrared sauna technology.",                                                          "image_url": null, "alt": "Infrared sauna with cedar wood interior by SAWO" },
    { "title": "SAUNA ACCESSORIES","caption": "Enhance your sauna with thoughtfully designed SAWO accessories.",                                                              "image_url": null, "alt": "SAWO sauna accessories collection including buckets, ladles, and thermometers" },
    { "title": "SAUNA CONTROLS",   "caption": "Precise temperature and time control for total comfort.",                                                                      "image_url": null, "alt": "SAWO sauna control system for ultimate comfort" }
  ]
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- 4. Seed: Home page — Section 2 (heaters carousel)
INSERT INTO site_content (page, section, data) VALUES
('home', 'section2', '{
  "heading": "SAUNA HEATERS",
  "items": [
    { "title": "TOWER",        "caption": "Height and energy efficiency in a sleek, elegant design. Consistent warmth delivered from the lowest to the highest parts of the sauna for optimal relaxation and wellness.",                                                                                                           "image_url": null, "alt": "SAWO Tower Sauna Heater Series with elegant vertical design" },
    { "title": "WALL-MOUNTED", "caption": "Space-saving and energy-efficient wall-mounted sauna heaters that generate steady, powerful heat. Sleek, modern design and superior comfort for the ultimate sauna experience.",                                                                                                  "image_url": null, "alt": "SAWO Wall-Mounted Sauna Heater Series for compact sauna rooms" },
    { "title": "FLOOR",        "caption": "Premium, highly powerful standalone heaters that provide the unbeatable combination of energy efficiency and elegant design. Ideal for commercial use.",                                                                                                                            "image_url": null, "alt": "SAWO Floor-Mounted Sauna Heater Series for commercial saunas" },
    { "title": "COMBI",        "caption": "Versatility in one modern, energy-efficient unit. Steam and heat combined for customizable comfort, wellness, and relaxation.",                                                                                                                                                    "image_url": null, "alt": "SAWO Combi Sauna Heater Series with steam and heat combination" },
    { "title": "STONE",        "caption": "The perfect heater for every type of sauna: stainless steel durability, superior Finnish soapstone heat conduction, and sleek aesthetics. Modern, energy-efficient, highly comfortable saunas designed for relaxation and wellness.",                                            "image_url": null, "alt": "SAWO Stone Sauna Heater Series with stainless steel and soapstone" },
    { "title": "DRAGONFIRE",   "caption": "A blend of artistic flair and cutting-edge technology designed by industrial and interior designer Stefan Lindfors. Heaters that deliver powerful, consistent heat with stylish elegance.",                                                                                        "image_url": null, "alt": "SAWO Dragonfire Sauna Heater Series with artistic design by Stefan Lindfors" }
  ]
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- 5. Seed: Home page — Section 3 (Steam / Sauna Rooms / Infrared / Control grid)
INSERT INTO site_content (page, section, data) VALUES
('home', 'section3', '{
  "steam_heading": "STEAM",
  "steam_items": [
    { "title": "Steam Generators", "caption": "The luxury of tailored steam from advanced steam generators for a spa-like experience. Customized settings and overall exceptional performance.", "image_url": null },
    { "title": "Steam Controls",   "caption": "Precision, effortlessness, and personalization: Precise steam settings, effortless operation, and a personalized sauna experience from our Saunova and Innova control series.", "image_url": null },
    { "title": "Steam Accessories","caption": "Premium accessories designed to enhance functionality and maximize comfort. Consistently extraordinary wellness and relaxation experience.", "image_url": null }
  ],
  "sauna_rooms_heading": "SAUNA ROOMS",
  "sauna_rooms_items": [
    { "title": "Standard Sauna",  "caption": "Timeless design and high-quality materials. Classic indoor sauna experience for any home or wellness space.", "image_url": null },
    { "title": "Glass Front Sauna","caption": "Modern design featuring clear tempered glass panels for an unobstructed view outside. Pure serenity and relaxation.", "image_url": null },
    { "title": "Outdoor Sauna",   "caption": "Engineered to withstand severe weather. Top-coated walls and durable asphalt-shingle roof for maximum protection from the sun and rain.", "image_url": null },
    { "title": "Infrared Sauna",  "caption": "Expertly crafted in cedar, aspen, and spruce. Gentle infrared warmth for soothing, therapeutic comfort.", "image_url": null }
  ],
  "infrared_heading": "INFRARED",
  "infrared_items": [
    { "title": "Infrared Rooms",   "image_url": null },
    { "title": "Infrared Panels",  "image_url": null },
    { "title": "Infrared Controls","image_url": null }
  ],
  "sauna_control_heading": "SAUNA CONTROL",
  "sauna_control_items": [
    { "title": "Saunova Series",       "image_url": null },
    { "title": "Innova Series",        "image_url": null },
    { "title": "Control Accessories",  "image_url": null }
  ]
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- 6. Seed: Home page — Section 4 (accessories carousel)
INSERT INTO site_content (page, section, data) VALUES
('home', 'section4', '{
  "heading": "SAUNA ACCESSORIES",
  "items": [
    { "title": "PAILS and LADLES",                  "image_url": null, "alt": "Sauna pails and ladles" },
    { "title": "THERMOMETERS and COMBINED METERS",   "image_url": null, "alt": "Sauna thermometers and combined meters" },
    { "title": "CLOCKS and SANDTIMERS",              "image_url": null, "alt": "Sauna clocks and sand timers" },
    { "title": "SAUNA LIGHTS and COVERS",            "image_url": null, "alt": "Sauna light covers" },
    { "title": "HEADRESTS and BACKRESTS",            "image_url": null, "alt": "Sauna headrests and backrests" },
    { "title": "DOORS and HANDLES",                  "image_url": null, "alt": "Sauna doors and handles" },
    { "title": "BENCHES and FLOOR TILES",            "image_url": null, "alt": "Sauna benches and floor tiles" },
    { "title": "KIVISTONE",                          "image_url": null, "alt": "Kivistone sauna stones" },
    { "title": "VENTILATION and ADD-ONS",            "image_url": null, "alt": "Sauna ventilation and add-ons" }
  ]
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- 7. Seed: Home page — Section 5 (customized solutions)
INSERT INTO site_content (page, section, data) VALUES
('home', 'section5', '{
  "heading":     "Customized Solutions",
  "subtitle":    "Let'\''s bring your sauna vision to life.",
  "body1":       "We craft sauna solutions tailored to your style and space. Whether for home or business, we'\''ve got you covered from design to installation to technical support.",
  "body2":       "Call us or send us a message.",
  "button_text": "INQUIRE TODAY",
  "image_left":  null,
  "image_right": null
}'::jsonb)
ON CONFLICT (page, section) DO NOTHING;

-- ============================================================
-- ROLLBACK (run if you want to completely remove this feature)
-- ============================================================
-- DROP TABLE IF EXISTS site_content;
-- DROP INDEX IF EXISTS site_content_page_idx;
