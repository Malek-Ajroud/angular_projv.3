<?php
/**
 * Child Model
 * Handles database operations for children
 */

require_once __DIR__ . '/../config/database.php';

<<<<<<< HEAD
class ChildModel
=======
class Child
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
{
    private $db;

    public function __construct()
    {
        $this->db = getDBConnection();
    }

<<<<<<< HEAD
    public function getAllByUserId($userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE user_id = :user_id ORDER BY first_name ASC");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function findById($id, $userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $userId]);
        return $stmt->fetch();
    }

    public function create($userId, $data)
=======
    /**
     * Get all children for a specific user
     */
    public function getUserChildren($userId)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE user_id = :user_id ORDER BY first_name ASC");
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get total count of children
     */
    public function getTotalCount()
    {
        return (int) $this->db->query("SELECT COUNT(*) FROM children")->fetchColumn();
    }

    /**
     * Create a new child
     */
    public function create($userId, $firstName, $birthDate, $gender, $lastName = null, $schoolYear = null, $schoolName = null, $address = null)
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
    {
        $stmt = $this->db->prepare("
            INSERT INTO children (user_id, first_name, last_name, birth_date, gender, school_year, school_name, address) 
            VALUES (:user_id, :first_name, :last_name, :birth_date, :gender, :school_year, :school_name, :address)
        ");

        $stmt->execute([
            'user_id' => $userId,
<<<<<<< HEAD
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'birth_date' => $data['birth_date'],
            'gender' => $data['gender'],
            'school_year' => $data['school_year'] ?? null,
            'school_name' => $data['school_name'] ?? null,
            'address' => $data['address'] ?? null
        ]);

        return $this->findById($this->db->lastInsertId(), $userId);
    }

    public function update($id, $userId, $data)
=======
            'first_name' => $firstName,
            'last_name' => $lastName,
            'birth_date' => $birthDate,
            'gender' => $gender,
            'school_year' => $schoolYear,
            'school_name' => $schoolName,
            'address' => $address
        ]);

        return $this->findById($this->db->lastInsertId());
    }

    /**
     * Find child by ID
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM children WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Update an existing child
     */
    public function update($id, $userId, $firstName, $birthDate, $gender, $lastName = null, $schoolYear = null, $schoolName = null, $address = null)
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
    {
        $stmt = $this->db->prepare("
            UPDATE children 
            SET first_name = :first_name, 
                last_name = :last_name, 
                birth_date = :birth_date, 
                gender = :gender, 
                school_year = :school_year, 
                school_name = :school_name, 
                address = :address
            WHERE id = :id AND user_id = :user_id
        ");

<<<<<<< HEAD
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'birth_date' => $data['birth_date'],
            'gender' => $data['gender'],
            'school_year' => $data['school_year'] ?? null,
            'school_name' => $data['school_name'] ?? null,
            'address' => $data['address'] ?? null
        ]);

        return $this->findById($id, $userId);
    }

=======
        return $stmt->execute([
            'id' => $id,
            'user_id' => $userId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'birth_date' => $birthDate,
            'gender' => $gender,
            'school_year' => $schoolYear,
            'school_name' => $schoolName,
            'address' => $address
        ]);
    }

    /**
     * Delete a child
     */
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
    public function delete($id, $userId)
    {
        $stmt = $this->db->prepare("DELETE FROM children WHERE id = :id AND user_id = :user_id");
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
