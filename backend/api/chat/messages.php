<?php
/**
 * PURPOSE: Logic for fetching and saving family events.
 * CONTENT: API endpoints for managing the shared family calendar.
 */
/**
 * Messages API Endpoint
 * GET /api/chat/messages?conversation_id=X - Get messages for conversation
 * POST /api/chat/messages - Save new message
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/Message.php';
require_once __DIR__ . '/../../models/Conversation.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Response.php';

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$messageModel = new Message();
$conversationModel = new Conversation();

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get messages for conversation
        $conversationId = $_GET['conversation_id'] ?? null;

        if (!$conversationId) {
            Response::error('ID de conversation requis');
        }

        // Verify conversation belongs to user
        $conversation = $conversationModel->findById($conversationId);
        if (!$conversation || $conversation['user_id'] != $userId) {
            Response::unauthorized('Accès non autorisé à cette conversation');
        }

        $messages = $messageModel->getConversationMessages($conversationId);
        Response::success($messages);
        break;

    case 'POST':
        // Save new message
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate input
        if (empty($input['conversation_id']) || empty($input['role']) || empty($input['content'])) {
            Response::error('Données manquantes');
        }

        // Verify conversation belongs to user
        $conversation = $conversationModel->findById($input['conversation_id']);
        if (!$conversation || $conversation['user_id'] != $userId) {
            Response::unauthorized('Accès non autorisé à cette conversation');
        }

        // Create message
        $message = $messageModel->create(
            $input['conversation_id'],
            $input['role'],
            $input['content']
        );

        // Update conversation timestamp
        $conversationModel->touch($input['conversation_id']);

        Response::success($message, 'Message enregistré', 201);
        break;

    default:
        Response::error('Method not allowed', 405);
}
?>