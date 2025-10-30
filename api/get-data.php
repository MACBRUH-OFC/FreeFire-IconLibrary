<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration for sensitive data and API endpoints
$CONFIG = [
    'DATA_SOURCE' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/data/itemData.json',
    'CACHE_TIME' => 3600, // 1 hour cache
    'CACHE_FILE' => __DIR__ . '/data_cache.json'
];

function fetchDataWithCache() {
    global $CONFIG;
    
    // Check if cache exists and is still valid
    if (file_exists($CONFIG['CACHE_FILE']) && 
        (time() - filemtime($CONFIG['CACHE_FILE'])) < $CONFIG['CACHE_TIME']) {
        
        $cachedData = file_get_contents($CONFIG['CACHE_FILE']);
        $data = json_decode($cachedData, true);
        
        if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
            return $data;
        }
    }
    
    // Fetch fresh data from GitHub
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'User-Agent: FreeFire-Item-Library/1.0',
            'timeout' => 30
        ]
    ]);
    
    $response = file_get_contents($CONFIG['DATA_SOURCE'], false, $context);
    
    if ($response === FALSE) {
        // If fetch fails and cache exists, use cache even if expired
        if (file_exists($CONFIG['CACHE_FILE'])) {
            $cachedData = file_get_contents($CONFIG['CACHE_FILE']);
            $data = json_decode($cachedData, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                return $data;
            }
        }
        throw new Exception('Failed to fetch data from source');
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        throw new Exception('Invalid data format received');
    }
    
    // Cache the data
    file_put_contents($CONFIG['CACHE_FILE'], json_encode($data));
    
    return $data;
}

try {
    $data = fetchDataWithCache();
    
    // Add timestamp for cache validation
    $response = [
        'data' => $data,
        'timestamp' => time(),
        'count' => count($data),
        'status' => 'success'
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'timestamp' => time(),
        'status' => 'error'
    ]);
}
?>
