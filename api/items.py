from flask import Flask, jsonify, request
import requests
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Free Fire Data URLs
ITEM_DATA_URL = "https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/data/itemData.json"
IMAGE_BASE_URL = "https://ff-iconlibrary.vercel.app/api/img"

# Cache for item data
item_cache = None
cache_timestamp = None

def fetch_item_data():
    """Fetch item data from GitHub with caching"""
    global item_cache, cache_timestamp
    
    try:
        response = requests.get(ITEM_DATA_URL, timeout=10)
        response.raise_for_status()
        item_cache = response.json()
        return item_cache
    except requests.exceptions.RequestException as e:
        print(f"Error fetching item data: {e}")
        return None

@app.route('/')
def home():
    return jsonify({
        "message": "Free Fire Item Library API",
        "endpoints": {
            "/api/items": "Get all items",
            "/api/items/filter": "Filter items with query parameters",
            "/api/items/<item_id>": "Get specific item by ID"
        }
    })

@app.route('/api/items', methods=['GET'])
def get_all_items():
    """Get all Free Fire items"""
    items = fetch_item_data()
    if items is None:
        return jsonify({"error": "Failed to fetch item data"}), 500
    
    return jsonify({
        "success": True,
        "count": len(items),
        "items": items
    })

@app.route('/api/items/filter', methods=['GET'])
def filter_items():
    """Filter items with various parameters"""
    items = fetch_item_data()
    if items is None:
        return jsonify({"error": "Failed to fetch item data"}), 500
    
    # Get query parameters
    search = request.args.get('search', '').lower()
    rarity = request.args.get('rarity', 'all')
    item_type = request.args.get('type', 'all')
    collection_type = request.args.get('collection', 'all')
    sort_by = request.args.get('sort', 'id')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    # Filter items
    filtered_items = []
    for item in items:
        # Search filter
        matches_search = (
            search in (item.get('name_text') or '').lower() or
            search in (item.get('icon') or '').lower() or
            search in str(item.get('id') or '')
        ) if search else True
        
        # Rarity filter
        matches_rarity = (
            rarity == 'all' or 
            item.get('rare') == rarity or
            (rarity == 'Orange_Plus' and item.get('rare') == 'Orange_Plus') or
            (rarity == 'Purple_Plus' and item.get('rare') == 'Purple_Plus')
        )
        
        # Type filter
        matches_type = (
            item_type == 'all' or 
            item.get('type') == item_type
        )
        
        # Collection type filter
        matches_collection = True
        if collection_type != 'all':
            if item.get('type') == 'COLLECTION':
                matches_collection = item.get('collection_type') == collection_type
            else:
                matches_collection = False
        
        if matches_search and matches_rarity and matches_type and matches_collection:
            filtered_items.append(item)
    
    # Sorting
    if sort_by == 'name':
        filtered_items.sort(key=lambda x: (x.get('name_text') or '').lower())
    elif sort_by == 'rarity':
        rarity_order = {
            'Orange_Plus': 1, 'Orange': 2, 'Purple_Plus': 3, 
            'Purple': 4, 'Red': 5, 'Blue': 6, 'Green': 7, 'White': 8
        }
        filtered_items.sort(key=lambda x: rarity_order.get(x.get('rare'), 9))
    else:  # id sort (default)
        filtered_items.sort(key=lambda x: x.get('id', 0))
    
    # Pagination
    total_items = len(filtered_items)
    total_pages = (total_items + per_page - 1) // per_page
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_items = filtered_items[start_idx:end_idx]
    
    return jsonify({
        "success": True,
        "filters": {
            "search": search,
            "rarity": rarity,
            "type": item_type,
            "collection": collection_type,
            "sort": sort_by
        },
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages
        },
        "items": paginated_items
    })

@app.route('/api/items/<item_id>', methods=['GET'])
def get_item_by_id(item_id):
    """Get specific item by ID"""
    items = fetch_item_data()
    if items is None:
        return jsonify({"error": "Failed to fetch item data"}), 500
    
    item = next((item for item in items if str(item.get('id')) == str(item_id)), None)
    
    if item:
        return jsonify({
            "success": True,
            "item": item
        })
    else:
        return jsonify({
            "success": False,
            "error": "Item not found"
        }), 404

@app.route('/api/image/<image_type>/<value>', methods=['GET'])
def get_image_url(image_type, value):
    """Generate image URL"""
    if image_type == 'id':
        return jsonify({
            "url": f"{IMAGE_BASE_URL}?type=id&value={value}"
        })
    elif image_type == 'icon':
        return jsonify({
            "url": f"{IMAGE_BASE_URL}?type=icon&value={value}"
        })
    else:
        return jsonify({"error": "Invalid image type"}), 400

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)

if __name__ == '__main__':
    app.run(debug=True)
