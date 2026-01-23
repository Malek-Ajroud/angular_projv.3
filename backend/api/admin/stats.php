<?php
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