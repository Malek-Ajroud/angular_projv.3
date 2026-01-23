<?php
<<<<<<< HEAD
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
                u.created_at,
                COUNT(DISTINCT c.id) as children_count,
                COUNT(DISTINCT cc.id) as conversations_count
            FROM users u
            LEFT JOIN children c ON u.id = c.user_id
            LEFT JOIN chat_conversations cc ON u.id = cc.user_id
            WHERE u.id != :id
            GROUP BY u.id, u.name, u.email, u.role, u.created_at
            ORDER BY u.created_at DESC
        ");
        $stmt->execute(['id' => $payload['user_id']]);
        $users = $stmt->fetchAll();

        Response::success($users);
    } catch (PDOException $e) {
        Response::error('Erreur lors de la récupération : ' . $e->getMessage(), 500);
    }
}

// If not GET or DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('Method not allowed', 405);
}
=======
/**
 * Admin: User Management API
 * GET /api/admin/users.php - List all users
 * DELETE /api/admin/users.php?id=X - Delete user
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Response.php';

// Verify Admin Token
$payload = JWT::verifyRequest();
if (!$payload || ($payload['role'] ?? 'user') !== 'admin') {
    Response::error('Accès refusé. Privilèges administrateur requis.', 403);
}

$db = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("SELECT id, name, email, role, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    Response::success($users);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id)
        Response::error('ID requis');

    // Prevent deleting self
    if ($id == $payload['user_id']) {
        Response::error('Vous ne pouvez pas supprimer votre propre compte.');
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
    if ($stmt->execute(['id' => $id])) {
        // Log action
        $log = $db->prepare("INSERT INTO admin_logs (admin_id, action, details, ip_address) VALUES (?, ?, ?, ?)");
        $log->execute([$payload['user_id'], 'DELETE_USER', "Deleted user ID: $id", $_SERVER['REMOTE_ADDR']]);

        Response::success(null, 'Utilisateur supprimé');
    } else {
        Response::error('Erreur lors de la suppression');
    }
}
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
?>