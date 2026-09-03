-- ============================================================================
-- KalaSearch — MySQL/MariaDB schema (cPanel / phpMyAdmin import target)
-- Engine: InnoDB · Charset: utf8mb4 (full Persian/emoji support)
--
-- Import via cPanel → phpMyAdmin → your database → Import → database/schema.sql
-- Or on a VPS:  mysql -u USER -p DB_NAME < database/schema.sql
--
-- The real production database name/user/password are configured in the PHP
-- config file (php-api/config.example.php → ../kalasearch-config.php), NEVER
-- in the frontend or in this file.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------------
-- Orders — immutable customer + snapshot data, one row per order
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number      VARCHAR(32)     NOT NULL,
  customer_name     VARCHAR(200)    NOT NULL,
  phone             VARCHAR(20)     NOT NULL,               -- normalized: +9891xxxxxxxx
  email             VARCHAR(254)    NULL,
  province          VARCHAR(120)    NOT NULL,
  city              VARCHAR(120)    NOT NULL,
  address           VARCHAR(600)    NOT NULL,
  postal_code       VARCHAR(10)     NULL,
  notes             VARCHAR(2000)   NULL,
  status            VARCHAR(32)     NOT NULL DEFAULT 'registered',
  payment_status    VARCHAR(32)     NOT NULL DEFAULT 'unpaid',
  total             DECIMAL(14,2)   NOT NULL DEFAULT 0,     -- server-computed, toman
  status_updated_at DATETIME        NULL,                   -- UTC
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP, -- UTC
  document_filename VARCHAR(64)     NULL,                   -- KS-<date>-<hex>.pdf
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_phone (phone),
  KEY idx_orders_status (status),
  KEY idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Order items — immutable product snapshot taken at checkout time
-- (product may later be removed/renamed in the CSV catalog; orders keep it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     BIGINT UNSIGNED NOT NULL,
  position     INT             NOT NULL DEFAULT 0,
  product_id   VARCHAR(200)    NOT NULL DEFAULT '',
  product_code VARCHAR(200)    NOT NULL DEFAULT '',
  sku          VARCHAR(200)    NOT NULL DEFAULT '',
  name         VARCHAR(200)    NOT NULL,
  model        VARCHAR(200)    NOT NULL DEFAULT '',
  variation    VARCHAR(120)    NOT NULL DEFAULT '',
  color        VARCHAR(120)    NOT NULL DEFAULT '',
  quantity     INT             NOT NULL,
  unit_price   DECIMAL(14,2)   NOT NULL,                    -- snapshot price, toman
  image        VARCHAR(2048)   NOT NULL DEFAULT '',         -- snapshot image URL
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Admin sessions — secure random tokens (SHA-256/HMAC hash stored, never raw)
-- Logout sets revoked_at; expired sessions are ignored by the verifier.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_sessions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token_hash  CHAR(64)        NOT NULL,                     -- sha256(token + session secret)
  username    VARCHAR(100)    NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP, -- UTC
  expires_at  DATETIME        NOT NULL,                     -- UTC, login + 7 days
  revoked_at  DATETIME        NULL,                         -- UTC, set on logout
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_sessions_token_hash (token_hash),
  KEY idx_admin_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;