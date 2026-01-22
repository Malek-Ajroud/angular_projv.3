<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/UserModel.php';
require_once __DIR__ . '/../../utils/JWTHandler.php';
require_once __DIR__ . '/../../utils/Response.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$errors = [];

if (empty($input['email'])) {
    $errors['email'] = 'L\'email est requis';
}

if (empty($input['password'])) {
    $errors['password'] = 'Le mot de passe est requis';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Verify credentials
try {
    // Verify credentials
    $userModel = new User();
    $user = $userModel->verify($input['email'], $input['password']);

    if (!$user) {
        Response::error('Email ou mot de passe incorrect', 401);
    }

    // Generate JWT token
    $token = JWT::encode([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'] ?? 'user'
    ]);

    // Return success response
    $sanitizedUser = $userModel->sanitize($user);

    Response::success([
        'token' => $token,
        'user' => $sanitizedUser
    ], 'Connexion réussie');
} catch (PDOException $e) {
    Response::error('Erreur de base de données : ' . $e->getMessage(), 500);
} catch (Exception $e) {
    Response::error('Une erreur inattendue est survenue : ' . $e->getMessage(), 500);
}
?>