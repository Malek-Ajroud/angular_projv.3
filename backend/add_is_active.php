<?php
require_once __DIR__ . '/config/database.php';

try {
    $pdo = getDBConnection();
    echo "Connected to database.\n";

    // Add is_active column to users table
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_active'");
    if ($stmt->fetch()) {
        echo "Column 'is_active' already exists in users table.\n";
    } else {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1");
        echo "Added 'is_active' column to users table.\n";
    }

    echo "Migration completed successfully.\n";

} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>