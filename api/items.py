from flask import Flask, jsonify, request
import requests
import json
from flask_cors import CORS
import os

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
    global item_cache
    
    try:
        print("Fetching item data from GitHub...")
        response = requests.get(ITEM_DATA_URL, timeout=30)
        response.raise_for_status()
        item_data = response.json()
        
        if not isinstance(item_data, list):
            print("Invalid data format: expected list")
            return None
            
        print(f"Successfully fetched {len(item_data)} items")
        item_cache = item_data
        return item_cache
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching item data: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

@app.route('/')
def home():
    return jsonify({
        "message": "Free Fire Item Library API",
        "status": "active",
        "endpoints": {
            "/api/items": "Get all items",
            "/api/items/filter": "Filter items with query parameters",
            "/api/items/<item_id>": "Get specific item by ID"
        }
    })

@app.route('/api/items', methods=['GET'])
def get_all_items():
    """Get all Free Fire items"""
    try:
        print("API: Fetching all items")
        items = fetch_item_data()
        
        if items is None:
            return jsonify({
                "success": False,
                "error": "Failed to fetch item data from source"
            }), 500
        
        return jsonify({
            "success": True,
            "count": len(items),
            "items": items[:100]  # Limit for testing
        })
        
    except Exception as e:
        print(f"Error in get_all_items: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/items/filter', methods=['GET'])
def filter_items():
    """Filter items with various parameters"""
    try:
        print("API: Filtering items")
        items = fetch_item_data()
        
        if items is None:
            return jsonify({
                "success": False,
                "error": "Failed to fetch item data"
            }), 500
        
        # Get query parameters with defaults
        search = request.args.get('search', '').lower()
        rarity = request.args.get('rarity', 'all')
        item_type = request.args.get('type', 'all')
        collection_type = request.args.get('collection', 'all')
        sort_by = request.args.get('sort', 'id')
        
        # Pagination with error handling
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
        except ValueError:
            page = 1
            per_page = 50
        
        # Filter items
        filtered_items = []
        for item in items:
            # Ensure item is a dictionary
            if not isinstance(item, dict):
                continue
                
            # Search filter
            matches_search = True
            if search:
                item_name = item.get('name_text', '') or ''
                item_icon = item.get('icon', '') or ''
                item_id = str(item.get('id', '')) or ''
                
                matches_search = (
                    search in item_name.lower() or
                    search in item_icon.lower() or
                    search in item_id
                )
            
            # Rarity filter
            matches_rarity = True
            if rarity != 'all':
                item_rarity = item.get('rare', '')
                if rarity == 'Orange_Plus':
                    matches_rarity = item_rarity == 'Orange_Plus'
                elif rarity == 'Purple_Plus':
                    matches_rarity = item_rarity == 'Purple_Plus'
                else:
                    matches_rarity = item_rarity == rarity
            
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
            filtered_items.sort(key=lambda x: rarity_order.get(x.get('rare', ''), 9))
        else:  # id sort (default)
            filtered_items.sort(key=lambda x: int(x.get('id', 0)))
        
        # Pagination with bounds checking
        total_items = len(filtered_items)
        total_pages = max(1, (total_items + per_page - 1) // per_page)
        page = max(1, min(page, total_pages))
        
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
        
    except Exception as e:
        print(f"Error in filter_items: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/items/<item_id>', methods=['GET'])
def get_item_by_id(item_id):
    """Get specific item by ID"""
    try:
        items = fetch_item_data()
        if items is None:
            return jsonify({
                "success": False,
                "error": "Failed to fetch item data"
            }), 500
        
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
            
    except Exception as e:
        print(f"Error in get_item_by_id: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    })

# Vercel serverless function handler
def handler(request, context=None):
    """Vercel serverless function handler"""
    try:
        from flask import Request, Response
        import json as json_module
        
        # Convert Vercel request to Flask request
        flask_request = Request(request)
        
        # Call the Flask app
        with app.request_context(flask_request.environ):
            try:
                response = app.full_dispatch_request()
            except Exception as e:
                response = app.handle_exception(e)
        
        # Convert Flask response to Vercel response
        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.get_data(as_text=True)
        }
        
    except Exception as e:
        print(f"Handler error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json_module.dumps({
                "success": False,
                "error": "Internal server error in handler"
            })
        }

if __name__ == '__main__':
    app.run(debug=True)
