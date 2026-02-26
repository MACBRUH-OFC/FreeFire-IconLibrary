// Normalize item format (supports old + new API structure)
function normalizeItem(item) {
  return {
    ...item,

    name: item.name || item.name_text || "",
    description: item.description || item.description_text || "",

    id: item.id ?? "",
    icon: item.icon ?? "",
    type: item.type ?? "UNKNOWN",
    rare: item.rare ?? "NONE",
    collection_type: item.collection_type ?? "NONE"
  };
}
export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // HIDDEN CONFIGURATION
  const CONFIG = {
    DATA_SOURCE: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/data/itemData.json'
  };

  try {
    console.log('Fetching data from:', CONFIG.DATA_SOURCE);
    
    const fetchResponse = await fetch(CONFIG.DATA_SOURCE, {
      headers: {
        'User-Agent': 'FreeFire-Item-Library/1.0'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }

    const data = await fetchResponse.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: Expected array');
    }

    console.log(`Successfully fetched ${data.length} items`);
    
    response.status(200).json({
      data: data,
      timestamp: Date.now(),
      count: data.length,
      status: 'success'
    });

  } catch (error) {
    console.error('API Error:', error);
    
    response.status(500).json({
      error: error.message,
      timestamp: Date.now(),
      status: 'error'
    });
  }
}