<?php
/**
 * Verify Token API Endpoint
 * POST /api/auth/verify
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Verify JWT token
$payload = JWT::verifyRequest();

if (!$payload) {
    Response::unauthorized('Token invalide ou expiré');
}

// Get user data
$userModel = new User();
$user = $userModel->findById($payload['user_id']);

if (!$user) {
    Response::unauthorized('Utilisateur non trouvé');
}

// Return user data
Response::success([
    'user' => $userModel->sanitize($user)
], 'Token valide');
?>