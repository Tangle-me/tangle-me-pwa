-- ================================================================
-- Tangle-me: Schema Changelog
-- Track all database changes here. Run each block once in order.
-- ================================================================

-- ----------------------------------------------------------------
-- 2026-03-29: Rate Limits table (Phase 2 - Security)
-- Tracks auth attempts per IP for brute-force protection
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip         VARCHAR(45) NOT NULL,           -- IPv4 or IPv6
    action     VARCHAR(50) NOT NULL,           -- e.g., 'login', 'register', 'reset', 'verify'
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rate_ip_action (ip, action, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 2026-03-29: API Request Log table (Phase 3 - Backend)
-- Audit trail for all API requests
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_log (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip            VARCHAR(45) NOT NULL,
    endpoint      VARCHAR(100) NOT NULL,
    user_id       INT UNSIGNED NULL,
    username      VARCHAR(100) NULL,
    action        VARCHAR(100) DEFAULT '',
    response_code SMALLINT DEFAULT 200,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_created (created_at),
    INDEX idx_log_user (user_id),
    INDEX idx_log_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- 2026-03-29: Spatial index for GPS search (Phase 4 - Database)
-- Run AFTER adding a POINT column to the ads table:
--   ALTER TABLE ads ADD COLUMN location POINT NULL AFTER longitude;
--   UPDATE ads SET location = ST_PointFromText(CONCAT('POINT(', longitude, ' ', latitude, ')')) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
--   ALTER TABLE ads MODIFY location POINT NOT NULL SRID 0;
--   CREATE SPATIAL INDEX idx_ads_location ON ads(location);
-- ----------------------------------------------------------------
-- (Instructions above — run manually after verifying column names)
