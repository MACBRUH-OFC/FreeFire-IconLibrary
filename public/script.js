// Configuration
const API_BASE_URL = '/api';
const ITEMS_PER_PAGE = 50;

// Global State
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

// DOM Elements
const elements = {
    itemGrid: document.getElementById('itemGrid'),
    gridContainer: document.getElementById('gridContainer'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    searchInput: document.getElementById('searchInput'),
    totalItems: document.getElementById('totalItems'),
    filteredItems: document.getElementById('filteredItems'),
    currentPage: document.getElementById('currentPage'),
    pageNumber: document.getElementById('pageNumber'),
    totalPages: document.getElementById('totalPages'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    mainHeader: document.getElementById('mainHeader'),
    loadingScreen: document.getElementById('loadingScreen'),
    loadingPercent: document.getElementById('loadingPercent'),
    statusText: document.getElementById('statusText'),
    stage1: document.getElementById('stage1'),
    stage2: document.getElementById('stage2'),
    stage3: document.getElementById('stage3'),
    appContainer: document.getElementById('appContainer'),
    pageTransition: document.getElementById('pageTransition'),
    popupBg: document.getElementById("popupBg"),
    popupID: document.getElementById("popupID"),
    popupType: document.getElementById("popupType"),
    popupName: document.getElementById("popupName"),
    popupIconID: document.getElementById("popupIconID"),
    popupDesc: document.getElementById("popupDesc"),
    popupRarity: document.getElementById("popupRarity"),
    popupCategory: document.getElementById("popupCategory"),
    popupImageBg: document.getElementById("popupImageBg"),
    popupImageContent: document.getElementById("popupImageContent"),
    dataUpdateNote: document.getElementById("dataUpdateNote"),
    closePopupBtn: document.getElementById("closePopupBtn")
};

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
    simulateLoadingProgress();
    fetchData();
    setupEventListeners();
    initializeCustomSelects();
    setupScrollBehavior();
}

// Simulate loading progress for better UX
function simulateLoadingProgress() {
    let progress = 0;
    loadingInterval = setInterval(() => {
        progress += Math.random() * 8;
        if (progress >= 90) {
            progress = 90;
            clearInterval(loadingInterval);
        }
        
        updateProgress(progress);
        
        if (progress % 15 < 2) {
            updateStatus();
        }
    }, 200);
}

function updateProgress(progress) {
    elements.loadingPercent.textContent = `${Math.round(progress)}%`;
    
    if (progress >= 30 && !elements.stage1.classList.contains('active')) {
        elements.stage1.classList.add('active');
        elements.stage1.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
    if (progress >= 60 && !elements.stage2.classList.contains('active')) {
        elements.stage2.classList.add('active');
        elements.stage2.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
    if (progress >= 90 && !elements.stage3.classList.contains('active')) {
        elements.stage3.classList.add('active');
        elements.stage3.querySelector('.stage-node').style.animation = 'stageActivate 0.5s ease';
    }
}

function updateStatus() {
    statusIndex = (statusIndex + 1) % statusMessages.length;
    elements.statusText.textContent = statusMessages[statusIndex];
}

// Enhanced loading screen transition
function hideLoadingScreen() {
    elements.loadingPercent.textContent = '100%';
    elements.statusText.textContent = "Library Ready";
    elements.stage1.classList.add('active');
    elements.stage2.classList.add('active');
    elements.stage3.classList.add('active');
    
    elements.loadingScreen.classList.add('complete');
    
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        elements.loadingScreen.style.visibility = 'hidden';
        
        setTimeout(() => {
            elements.appContainer.classList.add('loaded');
        }, 300);
    }, 800);
}

// Enhanced page transition function
function transitionToPage(pageFunction) {
    elements.gridContainer.classList.add('fade-out');
    elements.pageTransition.classList.add('active');
    
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        pageFunction();
        
        setTimeout(() => {
            elements.pageTransition.classList.remove('active');
            elements.gridContainer.classList.remove('fade-out');
        }, 200);
    }, 300);
}

// Set up scroll behavior for header
function setupScrollBehavior() {
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            elements.mainHeader.classList.add('hidden');
        } else {
            elements.mainHeader.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
}

// Initialize custom dropdowns
function initializeCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(select => {
        const selected = select.querySelector('.select-selected');
        const items = select.querySelector('.select-items');
        
        selected.addEventListener('click', function(e) {
            e.stopPropagation();
            
            document.querySelectorAll('.custom-select').forEach(otherSelect => {
                if (otherSelect !== select) {
                    otherSelect.querySelector('.select-selected').classList.remove('select-arrow-active');
                    otherSelect.querySelector('.select-items').classList.remove('active');
                }
            });
            
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

// Fetch data from API
async function fetchData() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/items`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !Array.isArray(data.items)) {
            throw new Error('Invalid data format received');
        }
        
        allItems = data.items;
        filteredItems = [...allItems];
        updateStats();
        applyFilters();
        hideLoadingScreen();
    } catch (err) {
        console.error('Error fetching data:', err);
        hideLoadingScreen();
        showError('Failed to load items', 'Please check your internet connection and try again.', true);
    } finally {
        hideLoading();
    }
}

// ERROR HANDLING FUNCTION
function showError(title, message, showRetry = false) {
    elements.itemGrid.innerHTML = `
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
    elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
    
    elements.popupBg.addEventListener('click', function(e) {
        if (e.target === elements.popupBg) {
            closePopup();
        }
    });
    
    elements.closePopupBtn.addEventListener('click', closePopup);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowRight' && currentPage < totalPages) enhancedNextPage();
        if (e.key === 'ArrowLeft' && currentPage > 1) enhancedPrevPage();
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
async function applyFilters() {
    const searchQuery = elements.searchInput.value.toLowerCase();
    
    try {
        showLoading();
        
        const params = new URLSearchParams({
            search: searchQuery,
            rarity: currentRarityFilter,
            type: currentTypeFilter,
            collection: currentCollectionFilter,
            sort: currentSort,
            page: currentPage,
            per_page: ITEMS_PER_PAGE
        });
        
        const response = await fetch(`${API_BASE_URL}/items/filter?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            filteredItems = data.items;
            updateStats();
            loadPage(currentPage);
        } else {
            throw new Error('Failed to filter items');
        }
    } catch (err) {
        console.error('Error applying filters:', err);
        showError('Filter Error', 'Failed to apply filters. Please try again.');
    } finally {
        hideLoading();
    }
}

// Load items for the current page
function loadPage(page) {
    elements.itemGrid.innerHTML = '';
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = page * ITEMS_PER_PAGE;
    const itemsToShow = filteredItems.slice(start, end);

    if (itemsToShow.length === 0) {
        elements.itemGrid.innerHTML = `
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
    const div = document.createElement('div');
    div.className = `item rarity-${item.rare}`;
    
    let displayType = item.type;
    if (item.type === 'COLLECTION' && item.collection_type && item.collection_type !== 'NONE') {
        displayType = item.collection_type;
    }
    
    const primaryURL = `https://ff-iconlibrary.vercel.app/api/img?type=id&value=${item.id}`;
    const secondaryURL = `https://ff-iconlibrary.vercel.app/api/img?type=icon&value=${item.icon}`;
    
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
    elements.itemGrid.appendChild(div);
    
    preloadImage(primaryURL);
}

// Fixed image error handler
function handleImageError(imgElement, fallbackUrl) {
    if (imgElement.dataset.fallbackTried === 'true') {
        imgElement.style.display = 'none';
        const fallbackDiv = imgElement.nextElementSibling;
        if (fallbackDiv && fallbackDiv.classList.contains('image-not-available')) {
            fallbackDiv.style.display = 'flex';
        }
        return;
    }
    
    imgElement.dataset.fallbackTried = 'true';
    imgElement.src = fallbackUrl;
    
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
    totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    elements.pageNumber.textContent = currentPage;
    elements.totalPages.textContent = totalPages;
    
    elements.prevBtn.disabled = currentPage === 1;
    elements.nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Update current page display in stats
function updateCurrentPageDisplay() {
    elements.currentPage.textContent = currentPage;
}

// Navigation functions
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadPage(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadPage(currentPage);
    }
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
    elements.totalItems.textContent = allItems.length.toLocaleString();
    elements.filteredItems.textContent = filteredItems.length.toLocaleString();
    updateCurrentPageDisplay();
}

// Show/hide loading indicator
function showLoading() {
    elements.loadingIndicator.style.display = 'flex';
    elements.itemGrid.innerHTML = '';
}

function hideLoading() {
    elements.loadingIndicator.style.display = 'none';
}

// Popup functions
function openPopup(item) {
    elements.popupBg.style.display = "flex";
    document.body.style.overflow = "hidden";

    const primaryURL = `https://ff-iconlibrary.vercel.app/api/img?type=id&value=${item.id}`;
    const secondaryURL = `https://ff-iconlibrary.vercel.app/api/img?type=icon&value=${item.icon}`;

    elements.popupImageContent.innerHTML = `
        <img src="${primaryURL}" 
             onerror="handlePopupImageError(this, '${secondaryURL}')"
             style="max-width: 100%; max-height: 100%; object-fit: contain;">
    `;

    elements.popupID.textContent = item.id || 'N/A';
    elements.popupType.textContent = item.type || 'Unknown';
    elements.popupName.textContent = item.name_text || 'Unnamed Item';
    elements.popupIconID.textContent = item.icon || 'N/A';
    
    const hasValidIcon = item.icon && item.icon !== 'N/A' && item.icon !== '';
    const hasAnyTextData = (item.name_text && item.name_text !== 'Unnamed Item') || 
                         (item.description_text && item.description_text !== 'No description available.');
    
    if (hasValidIcon && !hasAnyTextData) {
        elements.popupDesc.textContent = "Item ID: " + (item.id || 'N/A');
        elements.dataUpdateNote.style.display = 'block';
    } else {
        elements.popupDesc.textContent = item.description_text || "No description available.";
        elements.dataUpdateNote.style.display = 'none';
    }
    
    elements.popupRarity.textContent = item.rare || 'Unknown';
    
    let category = item.type;
    if (item.type === 'COLLECTION' && item.collection_type && item.collection_type !== 'NONE') {
        category = item.collection_type;
    }
    elements.popupCategory.textContent = category || 'General';

    const rarity = item.rare || 'Blue';
    elements.popupImageBg.style.backgroundImage = `url(https://raw.githubusercontent.com/MACBRUH-OFC/FreeFire-Resources/refs/heads/main/Others/Prize-${rarity.replace('_Plus', 'Plus')}.png)`;
}

// Fixed popup image error handler
function handlePopupImageError(imgElement, fallbackUrl) {
    if (imgElement.dataset.fallbackTried === 'true') {
        imgElement.style.display = 'none';
        elements.popupImageContent.innerHTML = '<div class="image-not-available"><i class="fas fa-image"></i><span>IMG<br>Not Available</span></div>';
        return;
    }
    
    imgElement.dataset.fallbackTried = 'true';
    imgElement.src = fallbackUrl;
}

function closePopup() {
    elements.popupBg.style.display = "none";
    document.body.style.overflow = "auto";
    elements.dataUpdateNote.style.display = 'none';
}

// Event listeners for pagination buttons
elements.prevBtn.addEventListener('click', enhancedPrevPage);
elements.nextBtn.addEventListener('click', enhancedNextPage);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
