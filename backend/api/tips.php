<?php
/**
 * Tips API Endpoint
 */

// Prevent PHP from outputting errors as HTML/Text
error_reporting(0);
ini_set('display_errors', 0);

// Clear any previous output (whitespace, notices)
if (ob_get_length())
    ob_clean();
ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../models/Tip.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

// Set header correctly
header('Content-Type: application/json');

$tipModel = new Tip();

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all tips - public access
        $category = $_GET['category'] ?? null;

        if ($category && $category !== 'all') {
            $tips = $tipModel->getByCategory($category);
        } else {
            $tips = $tipModel->getAll();
        }

        Response::success($tips);
        break;

    case 'POST':
        // Create new tip - admin only
        $payload = JWT::verifyRequest();
        if (!$payload || $payload['role'] !== 'admin') {
            Response::unauthorized('Admin access required');
        }

        $input = json_decode(file_get_contents('php://input'), true);

        // Validate input
        if (empty($input['category']) || empty($input['title']) || empty($input['description'])) {
            Response::error('Données manquantes (category, title, description requis)');
        }

        $tip = $tipModel->create(
            $input['category'],
            $input['title'],
            $input['description'],
            $input['icon'] ?? '💡',
            $input['color'] ?? 'gradient-default'
        );

        Response::success($tip, 'Astuce ajoutée', 201);
        break;

    case 'PUT':
        // Update tip - admin only
        $payload = JWT::verifyRequest();
        if (!$payload || $payload['role'] !== 'admin') {
            Response::unauthorized('Admin access required');
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID requis');
        }

        $input = json_decode(file_get_contents('php://input'), true);

        // Validate input
        if (empty($input['category']) || empty($input['title']) || empty($input['description'])) {
            Response::error('Données manquantes (category, title, description requis)');
        }

        $tip = $tipModel->update(
            $id,
            $input['category'],
            $input['title'],
            $input['description'],
            $input['icon'] ?? '💡',
            $input['color'] ?? 'gradient-default'
        );

        if ($tip) {
            Response::success($tip, 'Astuce modifiée');
        } else {
            Response::notFound('Astuce non trouvée');
        }
        break;

    case 'DELETE':
        // Delete tip - admin only
        $payload = JWT::verifyRequest();
        if (!$payload || $payload['role'] !== 'admin') {
            Response::unauthorized('Admin access required');
        }

        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID requis');
        }

        $success = $tipModel->delete($id);

        if ($success) {
            Response::success(null, 'Astuce supprimée');
        } else {
            Response::notFound('Astuce non trouvée');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}