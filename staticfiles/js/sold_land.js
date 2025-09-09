// Sold Land Page JavaScript

// Global variables
let soldLands = [];
let filteredLands = [];
let currentFilters = {
    search: '',
    status: '',
    broker: '',
    location: ''
};

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sold Land page initialized');
    initializePage();
});

// Initialize the page
async function initializePage() {
    try {
        showLoadingOverlay();
        
        // Load sold lands data
        await loadSoldLands();
        
        // Initialize filters
        await initializeFilters();
        
        // Render lands
        renderLands();
        
        // Update stats
        updateStats();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing sold land page:', error);
        showNotification('Error loading sold lands data', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Load sold lands data
async function loadSoldLands() {
    try {
        const response = await fetch('/api/sold-lands/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        soldLands = data.lands || [];
        filteredLands = [...soldLands];
        
        console.log('Loaded sold lands:', soldLands.length);
        
    } catch (error) {
        console.error('Error loading sold lands:', error);
        throw error;
    }
}

// Initialize filters
async function initializeFilters() {
    try {
        // Get unique brokers
        const brokers = [...new Set(soldLands.map(land => land.broker_name).filter(Boolean))];
        const brokerSelect = document.getElementById('brokerFilter');
        brokerSelect.innerHTML = '<option value="">All Brokers</option>';
        brokers.forEach(broker => {
            brokerSelect.innerHTML += `<option value="${broker}">${broker}</option>`;
        });

        // Get unique locations
        const locations = [...new Set(soldLands.map(land => land.location).filter(Boolean))];
        const locationSelect = document.getElementById('locationFilter');
        locationSelect.innerHTML = '<option value="">All Locations</option>';
        locations.forEach(location => {
            locationSelect.innerHTML += `<option value="${location}">${location}</option>`;
        });

    } catch (error) {
        console.error('Error initializing filters:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Filter selects
    const statusFilter = document.getElementById('statusFilter');
    const brokerFilter = document.getElementById('brokerFilter');
    const locationFilter = document.getElementById('locationFilter');

    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }
    if (brokerFilter) {
        brokerFilter.addEventListener('change', handleFilterChange);
    }
    if (locationFilter) {
        locationFilter.addEventListener('change', handleFilterChange);
    }
}

// Handle search input
function handleSearch(event) {
    currentFilters.search = event.target.value.toLowerCase();
    applyFilters();
}

// Handle filter changes
function handleFilterChange(event) {
    const filterType = event.target.id.replace('Filter', '');
    currentFilters[filterType] = event.target.value;
    applyFilters();
}

// Apply filters
function applyFilters() {
    filteredLands = soldLands.filter(land => {
        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchableText = [
                land.property_name,
                land.location,
                land.broker_name,
                land.sata_prakar
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        // Status filter
        if (currentFilters.status && land.status !== currentFilters.status) {
            return false;
        }

        // Broker filter
        if (currentFilters.broker && land.broker_name !== currentFilters.broker) {
            return false;
        }

        // Location filter
        if (currentFilters.location && land.location !== currentFilters.location) {
            return false;
        }

        return true;
    });

    renderLands();
    updateStats();
}

// Clear filters
function clearFilters() {
    currentFilters = {
        search: '',
        status: '',
        broker: '',
        location: ''
    };

    // Reset form inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('brokerFilter').value = '';
    document.getElementById('locationFilter').value = '';

    filteredLands = [...soldLands];
    renderLands();
    updateStats();
}

// Render lands
function renderLands() {
    const landsGrid = document.getElementById('landsGrid');
    const noResultsMessage = document.getElementById('noResultsMessage');

    if (filteredLands.length === 0) {
        landsGrid.innerHTML = '';
        noResultsMessage.style.display = 'block';
        return;
    }

    noResultsMessage.style.display = 'none';
    
    const landsHtml = filteredLands.map(land => createLandCard(land)).join('');
    landsGrid.innerHTML = landsHtml;
}

// Create land card HTML
function createLandCard(land) {
    const statusClass = land.status === 'sold' ? 'sold' : 'in-process';
    const statusText = land.status === 'sold' ? 'SOLD' : 'IN PROCESS';
    const statusIcon = land.status === 'sold' ? 'bi-check-circle' : 'bi-clock';
    
    // Get sale information if available
    const saleInfo = land.sale_info || {};
    const buyerName = saleInfo.buyer_name || 'Not specified';
    const saleDate = saleInfo.sale_date ? new Date(saleInfo.sale_date).toLocaleDateString('en-GB') : 'Not specified';

    return `
        <div class="col-lg-6 col-xl-4">
            <div class="land-card status-${statusClass}">
                <div class="land-card-header">
                    <div class="land-id">#${land.id}</div>
                    <div class="land-status">
                        <i class="bi ${statusIcon}"></i>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <h5 class="land-title">${land.property_name || 'Unnamed Property'}</h5>
                </div>
                
                <div class="land-details">
                    <div class="land-detail-item">
                        <i class="bi bi-person"></i>
                        <strong>Broker:</strong> ${land.broker_name || 'Not specified'}
                    </div>
                    <div class="land-detail-item">
                        <i class="bi bi-geo-alt"></i>
                        <strong>Location:</strong> ${land.location || 'Not specified'}
                    </div>
                    <div class="land-detail-item">
                        <i class="bi bi-rulers"></i>
                        <strong>Area:</strong> ${land.total_area || '0'} sq ft
                    </div>
                    <div class="land-detail-item">
                        <i class="bi bi-tag"></i>
                        <strong>Sata Prakar:</strong> ${land.sata_prakar || 'Not specified'}
                    </div>
                    
                    ${saleInfo.buyer_name ? `
                        <div class="buyer-info">
                            <div class="land-detail-item">
                                <i class="bi bi-person-check"></i>
                                <strong>Buyer:</strong> ${buyerName}
                            </div>
                            <div class="land-detail-item">
                                <i class="bi bi-calendar"></i>
                                <strong>Sale Date:</strong> ${saleDate}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="land-actions">
                    <button class="btn btn-primary" onclick="showLandTasks(${land.id})" title="View Tasks">
                        <i class="bi bi-list-task me-1"></i>Tasks
                    </button>
                    <button class="btn btn-success" onclick="showLandInfoModal(${land.id})" title="View Details">
                        <i class="bi bi-eye me-1"></i>View
                    </button>
                    <button class="btn btn-success" onclick="showSellLandModal(${land.id})" title="Sell Land">
                        <i class="bi bi-bag me-1"></i>Sell
                    </button>
                    <button class="btn btn-warning" onclick="showInstallmentsModal(${land.id})" title="Manage Installments">
                        <i class="bi bi-credit-card me-1"></i>Installments
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Update statistics
function updateStats() {
    const totalLands = filteredLands.length;
    const inProcessCount = filteredLands.filter(land => land.status === 'in_process').length;
    const completedCount = filteredLands.filter(land => land.status === 'sold').length;
    
    // Calculate total value (price field doesn't exist in Land model)
    const totalValue = 0;

    // Update DOM elements
    const totalLandsElement = document.getElementById('totalLandsCount');
    const inProcessElement = document.getElementById('inProcessCount');
    const completedElement = document.getElementById('completedCount');
    const totalValueElement = document.getElementById('totalValue');

    if (totalLandsElement) totalLandsElement.textContent = totalLands;
    if (inProcessElement) inProcessElement.textContent = inProcessCount;
    if (completedElement) completedElement.textContent = completedCount;
    if (totalValueElement) totalValueElement.textContent = `₹${totalValue.toLocaleString()}`;
}

// Refresh sold lands
async function refreshSoldLands() {
    try {
        showLoadingOverlay();
        await loadSoldLands();
        await initializeFilters();
        applyFilters();
        showNotification('Sold lands data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing sold lands:', error);
        showNotification('Error refreshing sold lands data', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// Show land tasks (placeholder function)
function showLandTasks(landId) {
    console.log('Show tasks for land:', landId);
    // This would typically redirect to a tasks page or open a tasks modal
    showNotification('Tasks functionality will be implemented', 'info');
}

// Utility functions
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

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Get CSRF token
function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// Export functions for global access
window.refreshSoldLands = refreshSoldLands;
window.showLandTasks = showLandTasks;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
