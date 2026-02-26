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
    console.log('Initializing Free Fire Item Library...');
    
    // Show loading screen with progress animation
    simulateLoadingProgress();
    
    // Start loading data in background
    fetchData();
    setupEventListeners();
    initializeCustomSelects();
    setupScrollBehavior();
}

// Call this function after data loads to setup rarity backgrounds
function setupRarityBackgrounds() {
    const rarities = ['Blue', 'Green', 'Orange', 'Orange_Plus', 'Purple', 'Purple_Plus', 'Red', 'White'];
    rarities.forEach(rarity => {
        const elements = document.querySelectorAll(`.rarity-${rarity} .item-background`);
        elements.forEach(el => {
            // Use protected endpoint for rarity backgrounds
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

// Enhanced fetchData with better error handling
function fetchData() {
    console.log('Starting data fetch from:', CONFIG.API_ENDPOINTS.DATA_SOURCE);
    
    fetch(CONFIG.API_ENDPOINTS.DATA_SOURCE)
    .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`);
        }
        return res.json();
    })
    .then(response => {
        console.log('API Response:', response);
        
        if (response.status === 'error') {
            throw new Error(response.error);
        }
        
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid data format received - expected array');
        }
        
        console.log(`Successfully loaded ${response.data.length} items`);
        
        allItems = response.data;
        filteredItems = [...allItems];
        updateStats();
        
        // SETUP RARITY BACKGROUNDS AFTER DATA LOADS
        setTimeout(() => {
            setupRarityBackgrounds();
        }, 100);
        
        applyFilters();
        hideLoadingScreen();
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        hideLoadingScreen();
        showError('Failed to load items', err.message, true);
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

// Set up event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const popupBg = document.getElementById('popupBg');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    popupBg.addEventListener('click', function(e) {
        if (e.target === popupBg) {
            closePopup();
        }
    });
    
    closePopupBtn.addEventListener('click', closePopup);
    
    prevBtn.addEventListener('click', enhancedPrevPage);
    nextBtn.addEventListener('click', enhancedNextPage);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowRight' && currentPage < totalPages) enhancedNextPage();
        if (e.key === 'ArrowLeft' && currentPage > 1) enhancedPrevPage();
    });
}

// Initialize custom dropdowns
function initializeCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(select => {
        const selected = select.querySelector('.select-selected');
        const items = select.querySelector('.select-items');
        
        selected.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close all other selects
            document.querySelectorAll('.custom-select').forEach(otherSelect => {
                if (otherSelect !== select) {
                    otherSelect.querySelector('.select-selected').classList.remove('select-arrow-active');
                    otherSelect.querySelector('.select-items').classList.remove('active');
                }
            });
            
            // Toggle current select
            this.classList.toggle('select-arrow-active');
            items.classList.toggle('active');
        });
        
        items.querySelectorAll('div').forEach(option => {
            option.addEventListener('click', function() {
                const select = this.closest('.custom-select');
                const selected = select.querySelector('.select-selected');
                selected.textContent = this.textContent;
                selected.classList.remove('select-arrow-active');
                items.classList.remove('active');
                
                if (select.id === 'raritySelect') {
                    currentRarityFilter = this.textContent === 'All Rarities' ? 'all' : 
                        this.textContent === 'Orange Plus' ? 'Orange_Plus' :
                        this.textContent === 'Purple Plus' ? 'Purple_Plus' : this.textContent;
                    applyFilters();
                } else if (select.id === 'typeSelect') {
                    currentTypeFilter = this.textContent === 'All Types' ? 'all' : this.textContent;
                    applyFilters();
                } else if (select.id === 'collectionTypeSelect') {
                    currentCollectionFilter = this.textContent === 'All Collections' ? 'all' : this.textContent;
                    applyFilters();
                } else if (select.id === 'sortSelect') {
                    currentSort = this.textContent.toLowerCase();
                    applyFilters();
                }
            });
        });
    });
    
    // Close all selects when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            closeAllSelects();
        }
    });
}

function closeAllSelects() {
    document.querySelectorAll('.select-selected').forEach(selected => {
        selected.classList.remove('select-arrow-active');
    });
    document.querySelectorAll('.select-items').forEach(items => {
        items.classList.remove('active');
    });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

    // SETUP RARITY BACKGROUNDS FOR NEWLY CREATED ITEMS
    setTimeout(() => {
        setupRarityBackgrounds();
    }, 50);

    updatePagination();
    updateCurrentPageDisplay();
}

// Create item element with protected image endpoints
function createItemElement(item) {
    const itemGrid = document.getElementById('itemGrid');
    const div = document.createElement('div');
    
    // FIX: Only add rarity class if item has valid rarity, otherwise use default styling
    const validRarities = ['Blue', 'Green', 'Orange', 'Orange_Plus', 'Purple', 'Purple_Plus', 'Red', 'White'];
    const hasValidRarity = item.rare && validRarities.includes(item.rare);
    const rarityClass = hasValidRarity ? `rarity-${item.rare}` : 'rarity-none';
    div.className = `item ${rarityClass}`;
    
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
        
        // Execute the page function
        pageFunction();
        
        // Hide transition and show content
        setTimeout(() => {
            pageTransition.classList.remove('active');
            gridContainer.classList.remove('fade-out');
        }, 200);
    }, 300);
}

// Update statistics
function updateStats() {
    const totalItemsEl = document.getElementById('totalItems');
    const filteredItemsEl = document.getElementById('filteredItems');
    
    totalItemsEl.textContent = allItems.length.toLocaleString();
    filteredItemsEl.textContent = filteredItems.length.toLocaleString();
    updateCurrentPageDisplay();
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
    
    // Only set rarity background if item has valid rarity
    const validRarities = ['Blue', 'Green', 'Orange', 'Orange_Plus', 'Purple', 'Purple_Plus', 'Red', 'White'];
    const hasValidRarity = item.rare && validRarities.includes(item.rare);
    const rarityBgURL = hasValidRarity ? `${CONFIG.API_ENDPOINTS.IMAGE_PROXY}?type=rarity&value=${item.rare}` : '';

    // Clear previous content
    popupImageContent.innerHTML = `
        <img src="${primaryURL}" 
             onerror="handlePopupImageError(this, '${secondaryURL}')">
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

    // Use protected endpoint for rarity background only if valid rarity
    if (hasValidRarity) {
        popupImageBg.style.backgroundImage = `url(${rarityBgURL})`;
    } else {
        popupImageBg.style.backgroundImage = 'none';
        popupImageBg.style.backgroundColor = 'var(--surface-light)';
    }
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
