<?php
// download.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$fileId = $_GET['fileId'] ?? null;

if (!$fileId) {
    http_response_code(400);
    exit('Missing fileId');
}

/**
 * TOKEN TECHNIQUE EDUCAnet
 * (celui que l'app mobile utilise)
 */
$token = 'EDUCANET_TECH_TOKEN';

// URL Educanet réelle de téléchargement
// Note: The user specified /api/direct/HwFile/ which maps to the external PDF path
$url = "https://mon-compte.rafi9ni.pro/api/direct/HwFile/" . $fileId;

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false, // IMPORTANT
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token"
    ],
    // Disable SSL verification for simplicity in dev/debug if needed, 
    // but ideally we should keep it. User didn't specify, but often needed in local envs interacting with external https.
    // Keeping default for now.
]);

$data = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(404);
    exit('File not accessible (HTTP ' . $httpCode . ')');
}

// Headers navigateur
header('Content-Type: ' . ($contentType ?: 'application/pdf'));
header('Content-Disposition: inline; filename="' . basename($fileId) . '"');
echo $data;
