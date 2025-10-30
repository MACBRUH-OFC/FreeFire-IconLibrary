<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// HIDDEN IMAGE CONFIGURATION
$CONFIG = [
    'IMAGE_BASE_ID' => 'https://ff-iconlibrary.vercel.app/api/img?type=id&value=',
    'IMAGE_BASE_ICON' => 'https://ff-iconlibrary.vercel.app/api/img?type=icon&value=',
    'RARITY_BACKGROUNDS' => [
        'Blue' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Blue.png',
        'Green' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Green.png',
        'Orange' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Orange.png',
        'Orange_Plus' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-OrangePlus.png',
        'Purple' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Purple.png',
        'Purple_Plus' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-PurplePlus.png',
        'Red' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Red.png',
        'White' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-White.png'
    ]
];

$type = $_GET['type'] ?? '';
$value = $_GET['value'] ?? '';

if (empty($type) || empty($value)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing type or value parameter']);
    exit;
}

// Route to appropriate image URL based on type
if ($type === 'item') {
    $imageUrl = $CONFIG['IMAGE_BASE_ID'] . urlencode($value);
} elseif ($type === 'icon') {
    $imageUrl = $CONFIG['IMAGE_BASE_ICON'] . urlencode($value);
} elseif ($type === 'rarity') {
    $imageUrl = $CONFIG['RARITY_BACKGROUNDS'][$value] ?? $CONFIG['RARITY_BACKGROUNDS']['Blue'];
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type parameter']);
    exit;
}

// Redirect to the actual image (hides the real URL from client)
header('Location: ' . $imageUrl, true, 302);
exit;
?>
