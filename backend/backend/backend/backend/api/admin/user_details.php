<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

$payload = JWT::verifyRequest();
if (!$payload || ($payload['role'] ?? 'user') !== 'admin') {
    Response::error('Accès refusé', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$userId = $_GET['id'] ?? null;
if (!$userId) {
    Response::error('ID requis', 400);
}

try {
    $conn = getDBConnection();

    // Get User Profile
    $stmtUser = $conn->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = :id");
    $stmtUser->execute(['id' => $userId]);
    $user = $stmtUser->fetch();

    if (!$user) {
        Response::error('Utilisateur non trouvé', 404);
    }

    // Get Children
    $stmtChildren = $conn->prepare("SELECT * FROM children WHERE user_id = :id");
    $stmtChildren->execute(['id' => $userId]);
    $children = $stmtChildren->fetchAll();

    // Get Chat Stats (Volume of chat)
    // Count total messages by this user (either sent by them or in their conversations)
    // Actually, simpler: Count conversations owned by user
    $stmtConvos = $conn->prepare("SELECT COUNT(*) as count FROM chat_conversations WHERE user_id = :id");
    $stmtConvos->execute(['id' => $userId]);
    $convoCount = $stmtConvos->fetch()['count'];

    // Count messages sent by user
    // Join not strictly needed if we assume user_id owns convo, but messages have sender 'user' or 'bot'.
    // We want messages sent BY user.
    // Need to join conversations to ensure it's their conversation? Or just any message from 'user' in their convos?
    // Messages table has conversation_id. Conversations table has user_id.
    $stmtMessages = $conn->prepare("
        SELECT COUNT(*) as count 
        FROM chat_messages m
        JOIN chat_conversations c ON m.conversation_id = c.id
        WHERE c.user_id = :id AND m.sender = 'user'
    ");
    $stmtMessages->execute(['id' => $userId]);
    $msgCount = $stmtMessages->fetch()['count'];

    Response::success([
        'profile' => $user,
        'children' => $children,
        'stats' => [
            'conversations_count' => $convoCount,
            'messages_sent_count' => $msgCount
        ]
    ]);

} catch (PDOException $e) {
    Response::error('Erreur serveur : ' . $e->getMessage(), 500);
}
?>