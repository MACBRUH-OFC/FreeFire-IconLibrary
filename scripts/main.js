// Configuration - Only public endpoints visible
const CONFIG = {
    API_ENDPOINTS: {
        DATA_SOURCE: '/api/get-data',
        IMAGE_PROXY: '/api/get-image'
    },
    APP: {
        ITEMS_PER_PAGE: 50,
        LOADING_DELAY: 200
    }
};

// Global state
let allItems = [];
let filteredItems = [];
let currentPage = 1;
let totalPages = 1;
let lastScrollTop = 0;

// Filter values
let currentRarityFilter = 'all';
let currentTypeFilter = 'all';
let currentCollectionFilter = 'all';
let currentSort = 'id';

// Image cache for faster loading
const imageCache = new Map();

// Loading simulation
let loadingInterval;
let currentProgress = 0;
let statusIndex = 0;
const statusMessages = [
    "Loading item database",
    "Processing icons library", 
    "Loading item assets",
    "Preparing interface",
    "Finalizing setup",
    "Library ready"
];

// Initialize the app
function initApp() {
    // Set up assets through protected endpoints
    setupAssets();
    
    // Show loading screen with progress animation
    simulateLoadingProgress();
    
    // Start loading data in background
    fetchData();
    setupEventListeners();
    initializeCustomSelects();
    setupScrollBehavior();
}

// Set up dynamic assets through protected endpoints
function setupAssets() {
    // These will be set via CSS through protected endpoints
    setupRarityBackgrounds();
}

function setupRarityBackgrounds() {
    const rarities = ['Blue', 'Green', 'Orange', 'Orange_Plus', 'Purple', 'Purple_Plus', 'Red', 'White'];
    rarities.forEach(rarity => {
        const elements = document.querySelectorAll(`.rarity-${rarity} .item-background`);
        elements.forEach(el => {
            el.style.backgroundImage = `url('${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=rarity&value=${rarity}')`;
        });
    });
}

// Simulate loading progress for better UX
function simulateLoadingProgress() {
    let progress = 0;
    loadingInterval = setInterval(() => {
        progress += Math.random() * 8;
        if (progress >= 90) {
            progress = 90; // Stop at 90% until data loads
            clearInterval(loadingInterval);
        }
        
        updateProgress(progress);
        
        // Update status message every 15% progress
        if (progress % 15 < 2) {
            updateStatus();
        }
    }, CONFIG.APP.LOADING_DELAY);
}

function updateProgress(progress) {
    const loadingPercent = document.getElementById('loadingPercent');
    loadingPercent.textContent = `${Math.round(progress)}%`;
    
    // Update loading stages
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');
    const stage3 = document.getElementById('stage3');
    
    if (progress >= 30 && !stage1.classList.contains('active')) {
        stage1.classList.add('active');
        stage1.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
    if (progress >= 60 && !stage2.classList.contains('active')) {
        stage2.classList.add('active');
        stage2.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
    if (progress >= 90 && !stage3.classList.contains('active')) {
        stage3.classList.add('active');
        stage3.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
}

function updateStatus() {
    const statusText = document.getElementById('statusText');
    statusIndex = (statusIndex + 1) % statusMessages.length;
    statusText.textContent = statusMessages[statusIndex];
}

// Enhanced loading screen transition
function hideLoadingScreen() {
    const loadingPercent = document.getElementById('loadingPercent');
    const statusText = document.getElementById('statusText');
    const loadingScreen = document.getElementById('loadingScreen');
    const stage1 = document.getElementById('stage1');
    const stage2 = document.getElementById('stage2');
    const stage3 = document.getElementById('stage3');
    
    loadingPercent.textContent = '100%';
    statusText.textContent = "Library Ready";
    stage1.classList.add('active');
    stage2.classList.add('active');
    stage3.classList.add('active');
    
    // Add completion class for special animations
    loadingScreen.classList.add('complete');
    
    setTimeout(() => {
        // Smooth fade out with better timing
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // Show app with smooth transition
        setTimeout(() => {
            document.getElementById('appContainer').classList.add('loaded');
        }, 300);
    }, 800);
}

// Fetch data from protected PHP endpoint
function fetchData() {
    fetch(CONFIG.API_ENDPOINTS.DATA_SOURCE)
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(response => {
        // Handle the response format from PHP
        if (response.status === 'error') {
            throw new Error(response.error);
        }
        
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid data format received');
        }
        
        allItems = response.data;
        filteredItems = [...allItems];
        updateStats();
        applyFilters();
        hideLoadingScreen();
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        hideLoadingScreen();
        showError('Failed to load items', err.message, true);
    });
}

// Create item element with protected image endpoints
function createItemElement(item) {
    const itemGrid = document.getElementById('itemGrid');
    const div = document.createElement('div');
    div.className = `item rarity-${item.rare}`;
    
    let displayType = item.type;
    if (item.type === 'COLLECTION' && item.collection_type && item.collection_type !== 'NONE') {
        displayType = item.collection_type;
    }
    
    // Use protected image endpoints - URLs are hidden from users
    const primaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=item&value=${item.id}`;
    const secondaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=icon&value=${item.icon}`;
    
    div.innerHTML = `
        <div class="item-background"></div>
        <div class="item-content">
            <div class="item-image-container">
                <img src="${primaryURL}" alt="${item.name_text}" 
                     onerror="handleImageError(this, '${secondaryURL}')">
                <div class="image-not-available" style="display: none;">
                    <i class="fas fa-image"></i>
                    <span>IMG<br>Not Available</span>
                </div>
            </div>
            <div class="item-info">
                <div class="item-name">${item.name_text || 'Unnamed Item'}</div>
                <div class="item-type">${displayType || 'Unknown'}</div>
            </div>
        </div>
    `;
    div.onclick = () => openPopup(item);
    itemGrid.appendChild(div);
    
    // Preload image for faster display
    preloadImage(primaryURL);
}

// Popup functions using protected endpoints
function openPopup(item) {
    const popupBg = document.getElementById("popupBg");
    const popupID = document.getElementById("popupID");
    const popupType = document.getElementById("popupType");
    const popupName = document.getElementById("popupName");
    const popupIconID = document.getElementById("popupIconID");
    const popupDesc = document.getElementById("popupDesc");
    const popupRarity = document.getElementById("popupRarity");
    const popupCategory = document.getElementById("popupCategory");
    const popupImageBg = document.getElementById("popupImageBg");
    const popupImageContent = document.getElementById("popupImageContent");
    const dataUpdateNote = document.getElementById("dataUpdateNote");

    popupBg.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Use protected image endpoints
    const primaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=item&value=${item.id}`;
    const secondaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=icon&value=${item.icon}`;
    const rarityBgURL = `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=rarity&value=${item.rare || 'Blue'}`;

    // Clear previous content
    popupImageContent.innerHTML = `
        <img src="${primaryURL}" 
             onerror="handlePopupImageError(this, '${secondaryURL}')"
             style="max-width: 100%; max-height: 100%; object-fit: contain;">
    `;

    popupID.textContent = item.id || 'N/A';
    popupType.textContent = item.type || 'Unknown';
    popupName.textContent = item.name_text || 'Unnamed Item';
    popupIconID.textContent = item.icon || 'N/A';
    
    // Data update logic
    const hasValidIcon = item.icon && item.icon !== 'N/A' && item.icon !== '';
    const hasAnyTextData = (item.name_text && item.name_text !== 'Unnamed Item') || 
                         (item.description_text && item.description_text !== 'No description available.');
    
    if (hasValidIcon && !hasAnyTextData) {
        popupDesc.textContent = "Item ID: " + (item.id || 'N/A');
        dataUpdateNote.style.display = 'block';
    } else {
        popupDesc.textContent = item.description_text || "No description available.";
        dataUpdateNote.style.display = 'none';
    }
    
    popupRarity.textContent = item.rare || 'Unknown';
    
    let category = item.type;
    if (item.type === 'COLLECTION' && item.collection_type && item.collection_type !== 'NONE') {
        category = item.collection_type;
    }
    popupCategory.textContent = category || 'General';

    // Use protected endpoint for rarity background
    popupImageBg.style.backgroundImage = `url(${rarityBgURL})`;
}

// ... rest of your existing functions (applyFilters, updateStats, etc.) remain the same
// Make sure to update the image URLs to use the protected endpoints