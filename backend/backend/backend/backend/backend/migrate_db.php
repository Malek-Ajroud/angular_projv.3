<?php
require_once __DIR__ . '/config/database.php';

try {
    $pdo = getDBConnection();
    echo "Connected to database.\n";

    // 1. Update users table
    try {
        // Check if column exists first to avoid exception if we want to be cleaner, 
        // but try-catch is standard for "ADD COLUMN" which might fail if exists.
        // However, standard PDO might throw exception.
        $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'");
        if ($stmt->fetch()) {
            echo "Column 'role' already exists in users table.\n";
        } else {
            $pdo->exec("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
            echo "Added 'role' column to users table.\n";
        }
    } catch (PDOException $e) {
        echo "Error updating users table: " . $e->getMessage() . "\n";
    }

    // 2. Create children table
    // Note: gender enum 'boy'/'girl' vs 'garçon'/'fille'? 
    // User requested "garçon/fille" in description "gender (garçon/fille)"
    // But usually DB enums are english. Let's stick to English 'boy','girl' for enum keys, or match user request exactly?
    // User said: "gender (garçon/fille)". I will use English keys 'boy', 'girl' for the DB enum to be safe standard practice, 
    // unless the code expects French. I'll use 'boy','girl' as interpreted, or maybe 'male','female'? 
    // Let's use 'boy', 'girl' as it matches "gender (garçon/fille)" logic usually mapping 1:1.
    // Actually, to be safe with "garçon" having special char, I'll use 'boy','girl'. 
    $sqlChildren = "CREATE TABLE IF NOT EXISTS children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) DEFAULT NULL,
        birth_date DATE NOT NULL,
        gender ENUM('boy', 'girl', 'other') NOT NULL,
        school_year VARCHAR(100) DEFAULT NULL,
        school_name VARCHAR(255) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlChildren);
    echo "Table 'children' ensured.\n";

    // 3. chat_conversations
    $sqlConvo = "CREATE TABLE IF NOT EXISTS chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) DEFAULT 'Nouvelle conversation',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlConvo);
    echo "Table 'chat_conversations' ensured.\n";

    // 4. chat_messages
    $sqlMsg = "CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        role ENUM('user', 'ai', 'system') NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlMsg);
    echo "Table 'chat_messages' ensured.\n";

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    // If table users doesn't exist, we might be in trouble. 
    // But we assume it exists from previous context.
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>