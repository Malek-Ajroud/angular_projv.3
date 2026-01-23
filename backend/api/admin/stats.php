<?php
<<<<<<< HEAD
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

// ⚠️ UTILISER LA BONNE CLASSE
$payload = JWT::verifyRequest();

// Vérification admin
if (!$payload || ($payload['role'] ?? 'user') !== 'admin') {
    Response::error('Accès refusé', 403);
}

try {
    $conn = getDBConnection();

    // On ne compte que les utilisateurs (pas les admins) pour la cohérence
    $usersCount = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role != 'admin'")->fetchColumn();

    // On ne compte que les données des utilisateurs gérés
    $childrenCount = (int) $conn->query("
        SELECT COUNT(*) FROM children 
        WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')
    ")->fetchColumn();

    $convosCount = (int) $conn->query("
        SELECT COUNT(*) FROM chat_conversations 
        WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')
    ")->fetchColumn();

    Response::success([
        'users' => $usersCount,
        'children' => $childrenCount,
        'conversations' => $convosCount
    ]);

} catch (Exception $e) {
    Response::error('Erreur serveur : ' . $e->getMessage(), 500);
}
=======
/**
 * Admin Stats API
 * GET /api/admin/stats.php
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Child.php';
require_once __DIR__ . '/../../models/Conversation.php';

// Verify admin authentication
$payload = JWT::verifyRequest();
if (!$payload || $payload['role'] !== 'admin') {
    Response::unauthorized('Accès réservé aux administrateurs');
}

try {
    $db = getDBConnection();

    // Total Users
    $totalUsers = (int) $db->query("SELECT COUNT(*) FROM users")->fetchColumn();

    // Total Children
    $childModel = new Child();
    $totalChildren = $childModel->getTotalCount();

    // Total Conversations
    $conversationModel = new Conversation();
    $totalConversations = $conversationModel->getTotalCount();

    Response::success([
        'users' => $totalUsers,
        'children' => $totalChildren,
        'conversations' => $totalConversations
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage());
}
?>
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
