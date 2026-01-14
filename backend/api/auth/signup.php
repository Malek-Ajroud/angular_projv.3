<?php
/**
 * PURPOSE: Registers new users and hashes passwords.
 * CONTENT: Endpoint to create a new user account in the database.
 */
/**
 * Signup API Endpoint
 * POST /api/auth/signup
 */

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../utils/JWT.php';
require_once __DIR__ . '/../../utils/Response.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$errors = [];

if (empty($input['name'])) {
    $errors['name'] = 'Le nom est requis';
}

if (empty($input['email'])) {
    $errors['email'] = 'L\'email est requis';
} elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Email invalide';
}

if (empty($input['password'])) {
    $errors['password'] = 'Le mot de passe est requis';
} elseif (strlen($input['password']) < 6) {
    $errors['password'] = 'Le mot de passe doit contenir au moins 6 caractères';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Create user
$userModel = new User();
$user = $userModel->create(
    $input['name'],
    $input['email'],
    $input['password']
);

if (!$user) {
    Response::error('Cet email est déjà utilisé', 409);
}

// Generate JWT token
$token = JWT::encode([
    'user_id' => $user['id'],
    'email' => $user['email']
]);

// Return success response
Response::success([
    'token' => $token,
    'user' => $userModel->sanitize($user)
], 'Compte créé avec succès', 201);
?>