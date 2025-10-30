// UI Event Handlers and DOM Manipulation

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

// Show/hide loading indicator
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const itemGrid = document.getElementById('itemGrid');
    
    loadingIndicator.style.display = 'flex';
    itemGrid.innerHTML = '';
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'none';
}
