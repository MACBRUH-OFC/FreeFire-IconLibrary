export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // HIDDEN CONFIGURATION - Users can't see these URLs
  const CONFIG = {
    DATA_SOURCE: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/data/itemData.json',
    CACHE_TIME: 1800 * 1000, // 30 minutes in milliseconds
  };

  try {
    // Fetch data from GitHub
    const fetchResponse = await fetch(CONFIG.DATA_SOURCE, {
      headers: {
        'User-Agent': 'FreeFire-Item-Library/1.0'
      },
      timeout: 30000
    });

    if (!fetchResponse.ok) {
      throw new Error(`Source returned HTTP ${fetchResponse.status}`);
    }

    const data = await fetchResponse.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received');
    }

    // Return successful response
    return response.status(200).json({
      data: data,
      timestamp: Date.now(),
      count: data.length,
      status: 'success'
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    
    return response.status(500).json({
      error: error.message,
      timestamp: Date.now(),
      status: 'error'
    });
  }
}
