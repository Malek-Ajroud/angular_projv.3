-- ============================================
-- Database Schema for Angular Chat Application
-- Database Name: bdStage
-- ============================================

-- Create database (if not already created in phpMyAdmin)
-- CREATE DATABASE IF NOT EXISTS bdStage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE bdStage;

-- ============================================
-- Table: users
-- Stores user account information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: tips
-- Stores parentings tips and tricks
-- ============================================
CREATE TABLE IF NOT EXISTS tips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'lightbulb',
    color VARCHAR(50) DEFAULT 'gradient-default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: admin_logs
-- Stores administrative actions
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Default Admin User
-- Email: admin@gmail.com
-- Password: admin123
-- ============================================
-- INSERT INTO users (name, email, password_hash, role) 
-- VALUES ('Administrator', 'admin@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
-- ON DUPLICATE KEY UPDATE role='admin';

-- ============================================
-- Table: chat_conversations
-- Stores chat conversation metadata
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Nouvelle conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: chat_messages
-- Stores individual chat messages
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'ai', 'system') NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: children
-- Stores child profiles for users
-- ============================================
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    school_year VARCHAR(100) NULL,
    school_name VARCHAR(255) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert a test user (password is 'password123' hashed with bcrypt)
-- You can use this for initial testing
-- INSERT INTO users (name, email, password_hash) VALUES 
-- ('Test User', 'test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables were created successfully
-- SHOW TABLES;

-- Check table structures
-- DESCRIBE users;
-- DESCRIBE chat_conversations;
-- DESCRIBE chat_messages;

-- Check for any existing data
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as conversation_count FROM chat_conversations;
-- SELECT COUNT(*) as message_count FROM chat_messages;
