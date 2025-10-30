// Configuration and sensitive data
const CONFIG = {
    API_ENDPOINTS: {
        DATA_SOURCE: '/api/get-data.php',
        IMAGE_BY_ID: 'https://ff-iconlibrary.vercel.app/api/img?type=id&value=',
        IMAGE_BY_ICON: 'https://ff-iconlibrary.vercel.app/api/img?type=icon&value='
    },
    ASSETS: {
        LOGO: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/main/Others/MacbruhLogo.png',
        RARITY_BACKGROUNDS: {
            Blue: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Blue.png',
            Green: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Green.png',
            Orange: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Orange.png',
            Orange_Plus: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-OrangePlus.png',
            Purple: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Purple.png',
            Purple_Plus: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-PurplePlus.png',
            Red: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-Red.png',
            White: 'https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-White.png'
        }
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
    // Set up assets
    setupAssets();
    
    // Show loading screen with progress animation
    simulateLoadingProgress();
    
    // Start loading data in background
    fetchData();
    setupEventListeners();
    initializeCustomSelects();
    setupScrollBehavior();
}

// Set up dynamic assets
function setupAssets() {
    document.getElementById('loadingLogo').src = CONFIG.ASSETS.LOGO;
    document.getElementById('headerLogo').src = CONFIG.ASSETS.LOGO;
    
    // Set up rarity background images
    Object.keys(CONFIG.ASSETS.RARITY_BACKGROUNDS).forEach(rarity => {
        const elements = document.querySelectorAll(`.rarity-${rarity} .item-background`);
        elements.forEach(el => {
            el.style.backgroundImage = `url('${CONFIG.ASSETS.RARITY_BACKGROUNDS[rarity]}')`;
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

// Enhanced page transition function
function transitionToPage(pageFunction) {
    const gridContainer = document.getElementById('gridContainer');
    const pageTransition = document.getElementById('pageTransition');
    
    // Add fade-out effect to grid
    gridContainer.classList.add('fade-out');
    
    // Show page transition overlay
    pageTransition.classList.add('active');
    
    setTimeout(() => {
        // Scroll instantly to top
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        // Execute the page function (nextPage or prevPage)
        pageFunction();
        
        // Hide transition and show content
        setTimeout(() => {
            pageTransition.classList.remove('active');
            gridContainer.classList.remove('fade-out');
        }, 200);
    }, 300);
}

// Set up scroll behavior for header
function setupScrollBehavior() {
    const mainHeader = document.getElementById('mainHeader');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            mainHeader.classList.add('hidden');
        } else {
            mainHeader.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
}

// Fetch data from API via PHP backend
function fetchData() {
    fetch(CONFIG.API_ENDPOINTS.DATA_SOURCE)
    .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format received');
        }
        allItems = data;
        filteredItems = [...allItems];
        updateStats();
        applyFilters();
        hideLoadingScreen(); // Hide loading screen when data is ready
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        hideLoadingScreen();
        showError('Failed to load items', 'Please check your internet connection and try again.', true);
    });
}

// ERROR HANDLING FUNCTION
function showError(title, message, showRetry = false) {
    const itemGrid = document.getElementById('itemGrid');
    itemGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            ${showRetry ? '<button class="retry-btn" onclick="fetchData()"><i class="fas fa-redo"></i> Try Again</button>' : ''}
        </div>
    `;
}

// Apply filters and sorting
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.toLowerCase();

    filteredItems = allItems.filter(item => {
        const matchesSearch = 
            (item.name_text && item.name_text.toLowerCase().includes(searchQuery)) ||
            (item.icon && item.icon.toLowerCase().includes(searchQuery)) ||
            (item.id && item.id.toString().includes(searchQuery));
        
        const matchesRarity = currentRarityFilter === 'all' || item.rare === currentRarityFilter;
        const matchesType = currentTypeFilter === 'all' || item.type === currentTypeFilter;
        
        let matchesCollectionType = true;
        if (currentCollectionFilter !== 'all') {
            if (item.type === 'COLLECTION') {
                matchesCollectionType = item.collection_type === currentCollectionFilter;
            } else {
                matchesCollectionType = false;
            }
        }
        
        return matchesSearch && matchesRarity && matchesType && matchesCollectionType;
    });

    // Sort items
    if (currentSort === 'name') {
        filteredItems.sort((a, b) => (a.name_text || '').localeCompare(b.name_text || ''));
    } else if (currentSort === 'id') {
        filteredItems.sort((a, b) => (a.id || 0) - (b.id || 0));
    } else if (currentSort === 'rarity') {
        const rarityOrder = { 
            'Orange_Plus': 1, 
            'Orange': 2, 
            'Purple_Plus': 3, 
            'Purple': 4, 
            'Red': 5, 
            'Blue': 6, 
            'Green': 7, 
            'White': 8 
        };
        filteredItems.sort((a, b) => {
            const aRarity = rarityOrder[a.rare] || 9;
            const bRarity = rarityOrder[b.rare] || 9;
            return aRarity - bRarity;
        });
    }

    currentPage = 1;
    updateStats();
    loadPage(currentPage);
}

// Load items for the current page
function loadPage(page) {
    const itemGrid = document.getElementById('itemGrid');
    itemGrid.innerHTML = '';
    const start = (page - 1) * CONFIG.APP.ITEMS_PER_PAGE;
    const end = page * CONFIG.APP.ITEMS_PER_PAGE;
    const itemsToShow = filteredItems.slice(start, end);

    if (itemsToShow.length === 0) {
        itemGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        updatePagination();
        updateCurrentPageDisplay();
        return;
    }

    itemsToShow.forEach(item => {
        createItemElement(item);
    });

    updatePagination();
    updateCurrentPageDisplay();
}

// Create item element with better image handling
function createItemElement(item) {
    const itemGrid = document.getElementById('itemGrid');
    const div = document.createElement('div');
    div.className = `item rarity-${item.rare}`;
    
    let displayType = item.type;
    if (item.type === 'COLLECTION' && item.collection_type && item.collection_type !== 'NONE') {
        displayType = item.collection_type;
    }
    
    const primaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_BY_ID}${item.id}`;
    const secondaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_BY_ICON}${item.icon}`;
    
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

// Fixed image error handler
function handleImageError(imgElement, fallbackUrl) {
    // If already tried fallback, show not available
    if (imgElement.dataset.fallbackTried === 'true') {
        imgElement.style.display = 'none';
        const fallbackDiv = imgElement.nextElementSibling;
        if (fallbackDiv && fallbackDiv.classList.contains('image-not-available')) {
            fallbackDiv.style.display = 'flex';
        }
        return;
    }
    
    // Mark as tried and attempt fallback
    imgElement.dataset.fallbackTried = 'true';
    imgElement.src = fallbackUrl;
    
    // Preload fallback image
    preloadImage(fallbackUrl);
}

// Preload images for faster loading
function preloadImage(url) {
    if (imageCache.has(url)) return;
    
    const img = new Image();
    img.src = url;
    imageCache.set(url, img);
}

// Update pagination controls
function updatePagination() {
    const pageNumberEl = document.getElementById('pageNumber');
    const totalPagesEl = document.getElementById('totalPages');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    totalPages = Math.ceil(filteredItems.length / CONFIG.APP.ITEMS_PER_PAGE);
    pageNumberEl.textContent = currentPage;
    totalPagesEl.textContent = totalPages;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Update current page display in stats
function updateCurrentPageDisplay() {
    const currentPageEl = document.getElementById('currentPage');
    currentPageEl.textContent = currentPage;
}

// Enhanced navigation with transitions
function enhancedNextPage() {
    if (currentPage < totalPages) {
        transitionToPage(() => {
            currentPage++;
            loadPage(currentPage);
        });
    }
}

function enhancedPrevPage() {
    if (currentPage > 1) {
        transitionToPage(() => {
            currentPage--;
            loadPage(currentPage);
        });
    }
}

// Update statistics
function updateStats() {
    const totalItemsEl = document.getElementById('totalItems');
    const filteredItemsEl = document.getElementById('filteredItems');
    
    totalItemsEl.textContent = allItems.length.toLocaleString();
    filteredItemsEl.textContent = filteredItems.length.toLocaleString();
    updateCurrentPageDisplay();
}

// Popup functions
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

    const primaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_BY_ID}${item.id}`;
    const secondaryURL = `${CONFIG.API_ENDPOINTS.IMAGE_BY_ICON}${item.icon}`;

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

    const rarity = item.rare || 'Blue';
    popupImageBg.style.backgroundImage = `url(${CONFIG.ASSETS.RARITY_BACKGROUNDS[rarity] || CONFIG.ASSETS.RARITY_BACKGROUNDS.Blue})`;
}

// Fixed popup image error handler
function handlePopupImageError(imgElement, fallbackUrl) {
    const popupImageContent = document.getElementById("popupImageContent");
    
    // If already tried fallback, show not available
    if (imgElement.dataset.fallbackTried === 'true') {
        imgElement.style.display = 'none';
        popupImageContent.innerHTML = '<div class="image-not-available"><i class="fas fa-image"></i><span>IMG<br>Not Available</span></div>';
        return;
    }
    
    // Mark as tried and attempt fallback
    imgElement.dataset.fallbackTried = 'true';
    imgElement.src = fallbackUrl;
}

function closePopup() {
    const popupBg = document.getElementById("popupBg");
    const dataUpdateNote = document.getElementById("dataUpdateNote");
    
    popupBg.style.display = "none";
    document.body.style.overflow = "auto";
    dataUpdateNote.style.display = 'none';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
