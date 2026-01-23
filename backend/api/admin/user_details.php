<?php
/**
 * User Details API
 * GET /api/admin/user_details.php?id=X
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

$userId = $_GET['id'] ?? null;
if (!$userId) {
    Response::error('ID utilisateur requis');
}

try {
    $userModel = new User();
    $childModel = new Child();
    $conversationModel = new Conversation();

    $user = $userModel->findById($userId);
    if (!$user) {
        Response::notFound('Utilisateur non trouvé');
    }

    $children = $childModel->getUserChildren($userId);
    $conversations = $conversationModel->getUserConversations($userId);

    Response::success([
        'user' => $userModel->sanitize($user),
        'children' => $children,
        'stats' => [
            'children_count' => count($children),
            'conversation_count' => count($conversations)
        ]
    ]);

} catch (Exception $e) {
    Response::error($e->getMessage());
}
?>