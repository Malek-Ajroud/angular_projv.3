<?php
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
?>