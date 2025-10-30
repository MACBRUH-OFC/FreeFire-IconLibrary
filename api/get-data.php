<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// HIDDEN CONFIGURATION - Users can't see these URLs
$CONFIG = [
    'DATA_SOURCE' => 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/data/itemData.json',
    'CACHE_TIME' => 1800, // 30 minutes
    'CACHE_FILE' => '/tmp/ff_data_cache.json'
];

function getRemoteData() {
    global $CONFIG;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $CONFIG['DATA_SOURCE'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'FreeFire-Item-Library/1.0',
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Network error: " . $error);
    }
    
    if ($http_code !== 200) {
        throw new Exception("Source returned HTTP " . $http_code);
    }
    
    return $response;
}

function getCachedData() {
    global $CONFIG;
    
    if (file_exists($CONFIG['CACHE_FILE']) && 
        (time() - filemtime($CONFIG['CACHE_FILE'])) < $CONFIG['CACHE_TIME']) {
        return file_get_contents($CONFIG['CACHE_FILE']);
    }
    return null;
}

function cacheData($data) {
    global $CONFIG;
    file_put_contents($CONFIG['CACHE_FILE'], $data);
}

try {
    // Try to get cached data first
    $cachedData = getCachedData();
    if ($cachedData !== null) {
        $data = json_decode($cachedData, true);
        if (is_array($data)) {
            echo json_encode([
                'data' => $data,
                'timestamp' => time(),
                'count' => count($data),
                'source' => 'cache',
                'status' => 'success'
            ]);
            exit;
        }
    }
    
    // Fetch fresh data
    $response = getRemoteData();
    $data = json_decode($response, true);
    
    if (!is_array($data)) {
        throw new Exception('Invalid data format received');
    }
    
    // Cache the data
    cacheData($response);
    
    echo json_encode([
        'data' => $data,
        'timestamp' => time(),
        'count' => count($data),
        'source' => 'remote',
        'status' => 'success'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'timestamp' => time(),
        'status' => 'error'
    ]);
}
?>
