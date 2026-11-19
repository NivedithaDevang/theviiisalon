CREATE DATABASE IF NOT EXISTS theviiisalon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE theviiisalon;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  sub_category VARCHAR(120) NULL,
  service_name VARCHAR(180) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 45,
  image_url VARCHAR(500),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id),
  INDEX idx_services_active (is_active, category_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  whatsapp_number VARCHAR(20),
  email VARCHAR(190),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(32) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  service_id INT NULL,
  service_name_snapshot VARCHAR(500) NOT NULL,
  price_snapshot DECIMAL(10,2) NOT NULL,
  duration_snapshot SMALLINT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('PENDING','CONFIRMED','COMPLETED','CANCELLED','REJECTED') NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  INDEX idx_booking_slot_check (appointment_date, appointment_time, status),
  INDEX idx_booking_status_date (status, appointment_date)
);

CREATE TABLE IF NOT EXISTS business_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT,
  channel ENUM('WHATSAPP','EMAIL') NOT NULL,
  recipient VARCHAR(190) NOT NULL,
  event_name VARCHAR(80) NOT NULL,
  status ENUM('PENDING','SENT','FAILED') NOT NULL,
  provider_message_id VARCHAR(190),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS salon_gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  description VARCHAR(255),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status ENUM('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
  internal_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_status (status, created_at)
);

CREATE TABLE IF NOT EXISTS appointment_rules (
  id INT PRIMARY KEY DEFAULT 1,
  opening_time TIME NOT NULL DEFAULT '11:00:00',
  closing_time TIME NOT NULL DEFAULT '20:30:00',
  slot_interval_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  buffer_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  closed_days VARCHAR(50) NOT NULL DEFAULT '[]',
  cancellation_policy TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO service_categories (id, name) VALUES
  (1, 'Hair'),
  (2, 'Skin & Beauty'),
  (3, 'Women''s Grooming'),
  (4, 'Men''s Grooming'),
  (5, 'Nails');

INSERT IGNORE INTO services (id, category_id, sub_category, service_name, price, duration_minutes, is_featured) VALUES
  -- 1. HAIR — Haircuts & Styling
  (101, 1, 'Haircuts & Styling', 'Women''s Haircut', 800.00, 45, TRUE),
  (102, 1, 'Haircuts & Styling', 'Men''s Haircut', 400.00, 30, TRUE),
  (103, 1, 'Haircuts & Styling', 'Hair Trimming', 350.00, 25, FALSE),
  (104, 1, 'Haircuts & Styling', 'Bangs / Fringe Cut', 300.00, 20, FALSE),
  (105, 1, 'Haircuts & Styling', 'Hair Wash', 300.00, 20, FALSE),
  (106, 1, 'Haircuts & Styling', 'Blow Dry', 500.00, 30, FALSE),
  (107, 1, 'Haircuts & Styling', 'Hair Styling', 900.00, 45, FALSE),
  (108, 1, 'Haircuts & Styling', 'Curls & Straightening', 1000.00, 45, FALSE),

  -- 1. HAIR — Hair Treatments
  (109, 1, 'Hair Treatments', 'Hair Spa', 1200.00, 60, TRUE),
  (110, 1, 'Hair Treatments', 'Deep Conditioning', 900.00, 45, FALSE),
  (111, 1, 'Hair Treatments', 'Scalp Treatments', 1400.00, 60, FALSE),
  (112, 1, 'Hair Treatments', 'Anti-Dandruff Treatment', 1300.00, 60, FALSE),
  (113, 1, 'Hair Treatments', 'Hair Repair Treatments', 1600.00, 60, FALSE),

  -- 1. HAIR — Hair Colour
  (114, 1, 'Hair Colour', 'Global Hair Colour', 2800.00, 90, TRUE),
  (115, 1, 'Hair Colour', 'Root Touch-Up', 1200.00, 45, FALSE),
  (116, 1, 'Hair Colour', 'Ammonia-Free Hair Colour', 3200.00, 90, FALSE),
  (117, 1, 'Hair Colour', 'Highlights & Lowlights', 3500.00, 120, TRUE),
  (118, 1, 'Hair Colour', 'Balayage', 4500.00, 150, TRUE),
  (119, 1, 'Hair Colour', 'Ombre', 4200.00, 150, FALSE),
  (120, 1, 'Hair Colour', 'Fashion / Creative Colours', 4000.00, 120, FALSE),
  (121, 1, 'Hair Colour', 'Men''s Hair Colour', 1000.00, 45, FALSE),
  (122, 1, 'Hair Colour', 'Beard Colour', 450.00, 30, FALSE),

  -- 1. HAIR — Hair Smoothening & Texture Treatments
  (123, 1, 'Hair Smoothening & Texture Treatments', 'Keratin Treatment', 3800.00, 150, TRUE),
  (124, 1, 'Hair Smoothening & Texture Treatments', 'Hair Smoothening', 3500.00, 150, FALSE),
  (125, 1, 'Hair Smoothening & Texture Treatments', 'Hair Rebonding', 3600.00, 150, FALSE),
  (126, 1, 'Hair Smoothening & Texture Treatments', 'Permanent Hair Straightening', 4000.00, 180, FALSE),
  (127, 1, 'Hair Smoothening & Texture Treatments', 'Hair Botox', 4200.00, 120, TRUE),

  -- 2. SKIN & BEAUTY — Facials
  (201, 2, 'Facials', 'Basic Facial', 1000.00, 45, FALSE),
  (202, 2, 'Facials', 'Fruit Facial', 1200.00, 45, FALSE),
  (203, 2, 'Facials', 'Gold Facial', 1800.00, 60, TRUE),
  (204, 2, 'Facials', 'Diamond Facial', 2200.00, 60, TRUE),
  (205, 2, 'Facials', 'Hydrating Facial', 1600.00, 60, FALSE),
  (206, 2, 'Facials', 'Brightening Facial', 1700.00, 60, FALSE),
  (207, 2, 'Facials', 'Anti-Ageing Facial', 2400.00, 60, FALSE),
  (208, 2, 'Facials', 'De-Tan Facial', 1500.00, 50, FALSE),
  (209, 2, 'Facials', 'Sensitive Skin Facial', 1600.00, 50, FALSE),

  -- 2. SKIN & BEAUTY — Skin Treatments
  (210, 2, 'Skin Treatments', 'Face Cleanup', 700.00, 35, FALSE),
  (211, 2, 'Skin Treatments', 'De-Tan Treatment', 800.00, 35, FALSE),
  (212, 2, 'Skin Treatments', 'Face Bleach', 500.00, 30, FALSE),
  (213, 2, 'Skin Treatments', 'Face Polishing', 1200.00, 45, FALSE),

  -- 2. SKIN & BEAUTY — Threading
  (214, 2, 'Threading', 'Eyebrow Threading', 60.00, 15, FALSE),
  (215, 2, 'Threading', 'Upper Lip', 40.00, 10, FALSE),
  (216, 2, 'Threading', 'Forehead', 50.00, 10, FALSE),
  (217, 2, 'Threading', 'Chin', 50.00, 10, FALSE),
  (218, 2, 'Threading', 'Full Face Threading', 250.00, 25, FALSE),

  -- 2. SKIN & BEAUTY — Waxing
  (219, 2, 'Waxing', 'Full Arms', 500.00, 30, FALSE),
  (220, 2, 'Waxing', 'Half Arms', 300.00, 20, FALSE),
  (221, 2, 'Waxing', 'Full Legs', 700.00, 40, FALSE),
  (222, 2, 'Waxing', 'Half Legs', 400.00, 25, FALSE),
  (223, 2, 'Waxing', 'Underarms', 150.00, 15, FALSE),

  -- 3. WOMEN'S GROOMING
  (301, 3, 'Women''s Grooming', 'Haircuts & Trimming', 750.00, 45, FALSE),
  (302, 3, 'Women''s Grooming', 'Hair Wash & Blow Dry', 650.00, 40, FALSE),
  (303, 3, 'Women''s Grooming', 'Hair Styling', 950.00, 45, FALSE),
  (304, 3, 'Women''s Grooming', 'Party Hairstyles', 1400.00, 60, TRUE),
  (305, 3, 'Women''s Grooming', 'Eyebrow & Facial Threading', 250.00, 25, FALSE),
  (306, 3, 'Women''s Grooming', 'Waxing', 800.00, 45, FALSE),
  (307, 3, 'Women''s Grooming', 'Bleach & De-Tan', 900.00, 40, FALSE),
  (308, 3, 'Women''s Grooming', 'Manicure', 600.00, 40, FALSE),
  (309, 3, 'Women''s Grooming', 'Pedicure', 750.00, 45, FALSE),
  (310, 3, 'Women''s Grooming', 'Nail Care', 500.00, 30, FALSE),

  -- 4. MEN'S GROOMING
  (401, 4, 'Men''s Grooming', 'Haircut', 400.00, 30, TRUE),
  (402, 4, 'Men''s Grooming', 'Beard Trim & Styling', 250.00, 20, TRUE),
  (403, 4, 'Men''s Grooming', 'Beard Colour', 450.00, 30, FALSE),
  (404, 4, 'Men''s Grooming', 'Hair Wash & Styling', 350.00, 25, FALSE),
  (405, 4, 'Men''s Grooming', 'Hair Spa', 1000.00, 45, FALSE),
  (406, 4, 'Men''s Grooming', 'Head Massage', 450.00, 30, FALSE),
  (407, 4, 'Men''s Grooming', 'Face Cleanup', 700.00, 35, FALSE),
  (408, 4, 'Men''s Grooming', 'Men''s Facial', 1200.00, 50, FALSE),

  -- 5. NAILS — Nail Extensions
  (501, 5, 'Nail Extensions', 'Acrylic Nail Extensions', 2200.00, 90, TRUE),
  (502, 5, 'Nail Extensions', 'Gel Nail Extensions', 2500.00, 90, TRUE),
  (503, 5, 'Nail Extensions', 'Polygel Extensions', 2600.00, 90, FALSE),
  (504, 5, 'Nail Extensions', 'Nail Refills', 1200.00, 60, FALSE),
  (505, 5, 'Nail Extensions', 'Nail Extension Removal', 600.00, 30, FALSE),

  -- 5. NAILS — Nail Art & Design
  (506, 5, 'Nail Art & Design', 'Basic Nail Art', 500.00, 30, FALSE),
  (507, 5, 'Nail Art & Design', 'French Nail Art', 700.00, 35, FALSE),
  (508, 5, 'Nail Art & Design', 'Chrome Nails', 900.00, 40, FALSE),
  (509, 5, 'Nail Art & Design', 'Ombre Nails', 950.00, 45, FALSE),
  (510, 5, 'Nail Art & Design', 'Glitter Nails', 800.00, 35, FALSE),
  (511, 5, 'Nail Art & Design', '3D Nail Art', 1200.00, 50, FALSE),
  (512, 5, 'Nail Art & Design', 'Custom Nail Designs', 1500.00, 60, FALSE),

  -- 5. NAILS — Nail Care
  (513, 5, 'Nail Care', 'Regular Nail Polish', 250.00, 20, FALSE),
  (514, 5, 'Nail Care', 'Gel Polish', 800.00, 40, TRUE),
  (515, 5, 'Nail Care', 'Gel Polish Removal', 350.00, 20, FALSE),
  (516, 5, 'Nail Care', 'Manicure', 600.00, 40, FALSE),
  (517, 5, 'Nail Care', 'Pedicure', 750.00, 45, FALSE),
  (518, 5, 'Nail Care', 'Nail Shaping', 200.00, 15, FALSE),
  (519, 5, 'Nail Care', 'Cuticle Care', 300.00, 20, FALSE),
  (520, 5, 'Nail Care', 'Nail Repair', 350.00, 20, FALSE),
  (521, 5, 'Nail Care', 'Nail Strengthening', 500.00, 30, FALSE);

INSERT IGNORE INTO appointment_rules (id, opening_time, closing_time, slot_interval_minutes, buffer_minutes)
VALUES (1, '11:00:00', '20:30:00', 30, 15);