export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET');

  // HIDDEN IMAGE CONFIGURATION
  const CONFIG = {
    IMAGE_BASE_ID: 'https://ff-iconlibrary.vercel.app/api/img?type=id&value=',
    IMAGE_BASE_ICON: 'https://ff-iconlibrary.vercel.app/api/img?type=icon&value=',
    RARITY_BACKGROUNDS: {
      'Blue': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Blue.png',
      'Green': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Green.png',
      'Orange': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Orange.png',
      'Orange_Plus': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-OrangePlus.png',
      'Purple': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Purple.png',
      'Purple_Plus': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-PurplePlus.png',
      'Red': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Red.png',
      'White': 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-White.png'
    }
  };

  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const type = searchParams.get('type') || '';
  const value = searchParams.get('value') || '';

  if (!type || !value) {
    return response.status(400).json({ error: 'Missing type or value parameter' });
  }

  try {
    let imageUrl;

    // Route to appropriate image URL based on type
    if (type === 'item') {
      imageUrl = `${CONFIG.IMAGE_BASE_ID}${encodeURIComponent(value)}`;
    } else if (type === 'icon') {
      imageUrl = `${CONFIG.IMAGE_BASE_ICON}${encodeURIComponent(value)}`;
    } else if (type === 'rarity') {
      imageUrl = CONFIG.RARITY_BACKGROUNDS[value] || CONFIG.RARITY_BACKGROUNDS['Blue'];
    } else {
      return response.status(400).json({ error: 'Invalid type parameter' });
    }

    // Redirect to the actual image (hides the real URL from client)
    response.redirect(302, imageUrl);

  } catch (error) {
    console.error('Error in get-image:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
