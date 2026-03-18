-- =============================================================
-- EVENT MANAGEMENT DATABASE SETUP
-- Covers Spring auth/events/orders, ASP.NET reporting, and Node sync tables.
-- =============================================================

CREATE DATABASE IF NOT EXISTS event_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE event_management;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  role ENUM('ADMIN', 'ORGANIZER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role_active (role, is_active)
);

CREATE TABLE IF NOT EXISTS venues (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  price_per_hour DECIMAL(12, 2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_venues_active (active),
  INDEX idx_venues_name (name)
);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(140) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  venue_id BIGINT NOT NULL,
  organizer_id BIGINT NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  capacity INT NOT NULL,
  seats_booked INT NOT NULL DEFAULT 0,
  price DECIMAL(12, 2) NOT NULL,
  status ENUM('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(id),
  CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES users(id),
  INDEX idx_events_status_start (status, start_at),
  INDEX idx_events_category (category),
  INDEX idx_events_organizer_title (organizer_id, title)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  ticket_code VARCHAR(40) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_event FOREIGN KEY (event_id) REFERENCES events(id),
  INDEX idx_orders_user_created (user_id, created_at),
  INDEX idx_orders_event_status (event_id, status),
  INDEX idx_orders_ticket_code (ticket_code)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NULL,
  recipient VARCHAR(255) NULL,
  type VARCHAR(50) NULL,
  channel VARCHAR(50) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SENT',
  message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_created (created_at),
  INDEX idx_notifications_status (status),
  INDEX idx_notifications_recipient (recipient)
);

CREATE TABLE IF NOT EXISTS budgets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  planned_amount DECIMAL(18, 2) NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_budgets_event FOREIGN KEY (event_id) REFERENCES events(id),
  INDEX idx_budgets_event (event_id),
  INDEX idx_budgets_created (created_at)
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_event FOREIGN KEY (event_id) REFERENCES events(id),
  INDEX idx_expenses_event (event_id),
  INDEX idx_expenses_category (category),
  INDEX idx_expenses_created (created_at)
);

INSERT INTO venues (name, address, capacity, price_per_hour, active)
SELECT 'Innovation Hall', 'City Center Campus', 220, 2200.00, 1
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Innovation Hall');

INSERT INTO venues (name, address, capacity, price_per_hour, active)
SELECT 'Studio Commons', 'Design District', 140, 1600.00, 1
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Studio Commons');

INSERT INTO venues (name, address, capacity, price_per_hour, active)
SELECT 'Main Auditorium', 'Riverside Block', 420, 3500.00, 1
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Main Auditorium');

-- Seed reporting rows only after matching events exist.
INSERT INTO notifications (event_id, recipient, type, channel, status, message)
SELECT e.id, 'customer@eventnest.io', 'ORDER', 'email', 'SENT', 'Demo order confirmation'
FROM events e
WHERE e.title = 'Campus Coding Night'
  AND NOT EXISTS (
    SELECT 1
    FROM notifications n
    WHERE n.recipient = 'customer@eventnest.io'
      AND n.type = 'ORDER'
  );

INSERT INTO budgets (event_id, planned_amount, note)
SELECT e.id, 25000.00, 'Initial production and venue allocation'
FROM events e
WHERE e.title = 'Campus Coding Night'
  AND NOT EXISTS (
    SELECT 1
    FROM budgets b
    WHERE b.event_id = e.id
  );

INSERT INTO expenses (event_id, category, amount, note)
SELECT e.id, 'Venue', 12500.00, 'Deposit and operations'
FROM events e
WHERE e.title = 'Campus Coding Night'
  AND NOT EXISTS (
    SELECT 1
    FROM expenses ex
    WHERE ex.event_id = e.id
      AND ex.category = 'Venue'
  );

-- Useful report sanity queries.
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_events FROM events;
SELECT COUNT(*) AS total_orders FROM orders;
SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status <> 'CANCELLED';
SELECT COALESCE(SUM(amount), 0) AS total_expense FROM expenses;