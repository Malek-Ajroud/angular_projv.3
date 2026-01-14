<?php
/**
 * PURPOSE: Handles user-related database operations.
 * CONTENT: Methods for user registration, login validation, and fetching user profiles.
 */
/**
 * User Model
 * Handles user-related database operations
 */

require_once __DIR__ . '/../config/database.php';

class User
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

    /**
     * Create a new user
     * @param string $name
     * @param string $email
     * @param string $password
     * @return array|false
     */
    public function create($name, $email, $password)
    {
        // Check if email already exists
        if ($this->findByEmail($email)) {
            return false;
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare("
            INSERT INTO users (name, email, password_hash) 
            VALUES (:name, :email, :password_hash)
        ");

        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash
        ]);

        $userId = $this->db->lastInsertId();
        return $this->findById($userId);
    }

    /**
     * Find user by email
     * @param string $email
     * @return array|false
     */
    public function findByEmail($email)
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        return $stmt->fetch();
    }

    /**
     * Find user by ID
     * @param int $id
     * @return array|false
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT id, name, email, created_at FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Verify user password
     * @param string $email
     * @param string $password
     * @return array|false
     */
    public function verify($email, $password)
    {
        $user = $this->findByEmail($email);

        if (!$user) {
            return false;
        }

        if (!password_verify($password, $user['password_hash'])) {
            return false;
        }

        // Return user without password hash
        unset($user['password_hash']);
        return $user;
    }

    /**
     * Get user data without sensitive information
     * @param array $user
     * @return array
     */
    public function sanitize($user)
    {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'created_at' => $user['created_at']
        ];
    }
}
?>