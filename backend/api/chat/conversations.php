<?php
/**
 * Conversations API Endpoint
 * GET /api/chat/conversations - Get all user conversations
 * POST /api/chat/conversations - Create new conversation
 * DELETE /api/chat/conversations/:id - Delete conversation
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/Conversation.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Response.php';

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$conversationModel = new Conversation();

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all conversations for user
        $conversations = $conversationModel->getUserConversations($userId);
        Response::success($conversations);
        break;

    case 'POST':
        // Create new conversation
        $input = json_decode(file_get_contents('php://input'), true);
        $title = $input['title'] ?? 'Nouvelle conversation';

        $conversation = $conversationModel->create($userId, $title);
        Response::success($conversation, 'Conversation créée', 201);
        break;

    case 'DELETE':
        // Delete conversation
        // Get ID from query string
        $id = $_GET['id'] ?? null;

        if (!$id) {
            Response::error('ID de conversation requis');
        }

        $success = $conversationModel->delete($id, $userId);

        if ($success) {
            Response::success(null, 'Conversation supprimée');
        } else {
            Response::notFound('Conversation non trouvée');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}
?>