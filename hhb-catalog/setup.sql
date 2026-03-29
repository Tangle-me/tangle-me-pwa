-- HHB Catalog Orders Table
-- Run this in phpMyAdmin on your u143213086_tangleme database

CREATE TABLE IF NOT EXISTS hhb_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer VARCHAR(255) NOT NULL,
    items TEXT NOT NULL,
    date VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
