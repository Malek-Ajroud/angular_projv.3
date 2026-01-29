<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

$payload = JWT::verifyRequest();
if (!$payload || ($payload['role'] ?? 'user') !== 'admin') {
    Response::error('Accès refusé', 403);
}

$conn = getDBConnection();

// Handle DELETE
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::error('ID requis', 400);
    }

    // Prevent deleting self
    if ($id == $payload['user_id']) {
        Response::error('Impossible de se supprimer soi-même', 400);
    }

    try {
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute(['id' => $id]);
        Response::success([], 'Utilisateur supprimé');
    } catch (PDOException $e) {
        Response::error('Erreur lors de la suppression : ' . $e->getMessage(), 500);
    }
}

// Handle GET (List)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get users with child and conversation counts
        $stmt = $conn->prepare("
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.is_active,
                u.created_at,
                COUNT(DISTINCT c.id) as children_count,
                COUNT(DISTINCT cc.id) as conversations_count
            FROM users u
            LEFT JOIN children c ON u.id = c.user_id
            LEFT JOIN chat_conversations cc ON u.id = cc.user_id
            WHERE u.id != :id
            GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at
            ORDER BY u.created_at DESC
        ");
        $stmt->execute(['id' => $payload['user_id']]);
        $users = $stmt->fetchAll();

        Response::success($users);
    } catch (PDOException $e) {
        Response::error('Erreur lors de la récupération : ' . $e->getMessage(), 500);
    }
}

// Handle POST (Add User)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name']) || empty($input['email']) || empty($input['password'])) {
        Response::error('Nom, email et mot de passe requis', 400);
    }

    try {
        $password_hash = password_hash($input['password'], PASSWORD_BCRYPT);
        $stmt = $conn->prepare("
            INSERT INTO users (name, email, password_hash, role, phone) 
            VALUES (:name, :email, :password_hash, :role, :phone)
        ");
        $stmt->execute([
            'name' => $input['name'],
            'email' => $input['email'],
            'password_hash' => $password_hash,
            'role' => $input['role'] ?? 'user',
            'phone' => $input['phone'] ?? null
        ]);
        Response::success([], 'Utilisateur ajouté');
    } catch (PDOException $e) {
        Response::error('Erreur lors de l\'ajout : ' . $e->getMessage(), 500);
    }
}

// Handle PATCH (Toggle Status)
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id']) || !isset($input['is_active'])) {
        Response::error('ID et statut requis', 400);
    }

    try {
        $stmt = $conn->prepare("UPDATE users SET is_active = :is_active WHERE id = :id");
        $stmt->execute([
            'is_active' => $input['is_active'] ? 1 : 0,
            'id' => $input['id']
        ]);
        Response::success([], 'Statut mis à jour');
    } catch (PDOException $e) {
        Response::error('Erreur lors de la mise à jour : ' . $e->getMessage(), 500);
    }
}

// If not GET, POST, DELETE or PATCH
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST', 'DELETE', 'PATCH'])) {
    Response::error('Method not allowed', 405);
}
?>