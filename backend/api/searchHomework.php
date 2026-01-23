<?php
// api/searchHomework.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// 🔐 TOKEN TECHNIQUE EDUCAnet (le même que pour download.php)
$token = 'EDUCANET_TECH_TOKEN';

// Récupération des paramètres GET
$levelId = isset($_GET['levelId']) ? $_GET['levelId'] : 5; // Fallback 5
$idrole = isset($_GET['idrole']) ? $_GET['idrole'] : 3;
$count = isset($_GET['count']) ? $_GET['count'] : 10;

// URL EDUCAnet (Dynamique)
$url = "https://mon-compte.rafi9ni.pro/api/external/mobile/AI/SearchHomeWork/Rafi9ni/$levelId/$idrole/$count";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false, // 🚫 PAS DE REDIRECT
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token"
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// ❌ Educanet renvoie 302 → on bloque ici
if ($httpCode !== 200) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Unauthorized or redirected',
        'status' => $httpCode
    ]);
    exit;
}

// ✅ OK
echo $response;
