<?php
<<<<<<< HEAD
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../models/Child.php';
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Response.php';

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized(JWT::$lastError);
}

$userId = $payload['user_id'];
$childModel = new ChildModel();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $child = $childModel->findById($id, $userId);
                if ($child) {
                    Response::success($child);
                } else {
                    Response::notFound('Enfant non trouvé');
                }
            } else {
                $children = $childModel->getAllByUserId($userId);
                Response::success($children);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['first_name']) || empty($input['birth_date']) || empty($input['gender'])) {
                Response::error('Données incomplètes');
            }

            $id = $input['id'] ?? null;
            if ($id) {
                // Update
                $child = $childModel->update($id, $userId, $input);
                Response::success($child, 'Enfant mis à jour');
            } else {
                // Create
                $child = $childModel->create($userId, $input);
                Response::success($child, 'Enfant ajouté', 201);
            }
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                Response::error('ID requis');
            }
            $success = $childModel->delete($id, $userId);
            if ($success) {
                Response::success(null, 'Enfant supprimé');
            } else {
                Response::error('Erreur lors de la suppression');
            }
            break;

        default:
            Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Erreur serveur : ' . $e->getMessage(), 500);
}
=======
/**
 * Children API Endpoint
 */

// Prevent PHP from outputting errors as HTML/Text
error_reporting(0);
ini_set('display_errors', 0);

// Clear any previous output (whitespace, notices)
if (ob_get_length())
    ob_clean();
ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../models/Child.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

// Set header correctly
header('Content-Type: application/json');

// Verify authentication
$payload = JWT::verifyRequest();
if (!$payload) {
    Response::unauthorized();
}

$userId = $payload['user_id'];
$childModel = new Child();

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $children = $childModel->getUserChildren($userId);
        Response::success($children);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            Response::error('Requête JSON invalide');
        }

        // Validate required input
        if (empty($input['firstName']) || empty($input['birthDate']) || empty($input['gender'])) {
            Response::error('Données manquantes (firstName, birthDate, gender requis)');
        }

        try {
            $child = $childModel->create(
                $userId,
                $input['firstName'],
                $input['birthDate'],
                $input['gender'],
                $input['lastName'] ?? null,
                $input['schoolYear'] ?? null,
                $input['schoolName'] ?? null,
                $input['address'] ?? null
            );

            Response::success($child, 'Enfant ajouté', 201);
        } catch (Exception $e) {
            Response::error('Erreur base de données: ' . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            Response::error('ID requis');
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            Response::error('Requête JSON invalide');
        }

        // Validate required input
        if (empty($input['firstName']) || empty($input['birthDate']) || empty($input['gender'])) {
            Response::error('Données manquantes (firstName, birthDate, gender requis)');
        }

        try {
            $success = $childModel->update(
                $id,
                $userId,
                $input['firstName'],
                $input['birthDate'],
                $input['gender'],
                $input['lastName'] ?? null,
                $input['schoolYear'] ?? null,
                $input['schoolName'] ?? null,
                $input['address'] ?? null
            );

            if ($success) {
                $updatedChild = $childModel->findById($id);
                Response::success($updatedChild, 'Enfant mis à jour');
            } else {
                Response::error('Erreur lors de la mise à jour (peut-être que l\'enfant n\'existe pas ou ne vous appartient pas)');
            }
        } catch (Exception $e) {
            Response::error('Erreur base de données: ' . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id)
            Response::error('ID requis');

        $success = $childModel->delete($id, $userId);
        if ($success) {
            Response::success(null, 'Enfant supprimé');
        } else {
            Response::notFound('Enfant non trouvé');
        }
        break;

    default:
        Response::error('Method not allowed', 405);
}
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
