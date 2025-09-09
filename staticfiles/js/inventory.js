/*
 * INVENTORY PAGE - JavaScript Functionality
 * 
 * This file handles all interactive functionality for the inventory page including:
 * - Search and filtering
 * - Data export and printing
 * - Land management actions
 * - Modal interactions
 * - Responsive behavior
 */

// Global variables
let currentLandId = null;
let filteredData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeInventoryPage();
    setupEventListeners();
    setupSearchFilters();
});

// Initialize the inventory page
function initializeInventoryPage() {
    console.log('Initializing inventory page...');
    
    // Get all table rows for filtering
    const tableRows = document.querySelectorAll('#inventoryTable tbody tr');
    filteredData = Array.from(tableRows).filter(row => !row.classList.contains('empty-row'));
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    console.log(`Loaded ${filteredData.length} inventory lands`);
}

// Setup event listeners
function setupEventListeners() {
    // Search input listeners
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleSearch, 300));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + F for search focus
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('landIdSearch').focus();
        }
        
        // Ctrl + R for refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
        
        // Ctrl + P for print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            printData();
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', debounce(handleResize, 250));
}

// Setup search filters
function setupSearchFilters() {
    const searchInputs = {
        landId: document.getElementById('landIdSearch'),
        holder: document.getElementById('holderSearch'),
        village: document.getElementById('villageSearch'),
        sataPrakar: document.getElementById('sataPrakarSearch')
    };
    
    // Clear search functionality
    Object.values(searchInputs).forEach(input => {
        if (input) {
            // Add clear button functionality
            input.addEventListener('input', function() {
                if (this.value.length > 0) {
                    this.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%23666\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z\'/%3E%3Cpath d=\'M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z\'/%3E%3C/svg%3E")';
                    this.style.backgroundRepeat = 'no-repeat';
                    this.style.backgroundPosition = 'right 12px center';
                    this.style.paddingRight = '40px';
                } else {
                    this.style.backgroundImage = '';
                    this.style.paddingRight = '';
                }
            });
        }
    });
}

// Handle search functionality
function handleSearch() {
    const searchTerms = {
        landId: document.getElementById('landIdSearch').value.toLowerCase(),
        holder: document.getElementById('holderSearch').value.toLowerCase(),
        village: document.getElementById('villageSearch').value.toLowerCase(),
        sataPrakar: document.getElementById('sataPrakarSearch').value.toLowerCase()
    };
    
    const tableRows = document.querySelectorAll('#inventoryTable tbody tr');
    let visibleCount = 0;
    
    tableRows.forEach(row => {
        if (row.classList.contains('empty-row')) return;
        
        const landId = row.querySelector('.land-id')?.textContent.toLowerCase() || '';
        const holder = row.querySelector('.property-holder')?.textContent.toLowerCase() || '';
        const village = row.querySelector('.village-info')?.textContent.toLowerCase() || '';
        const sataPrakar = row.querySelector('.sata-prakar-badge')?.textContent.toLowerCase() || '';
        
        const matches = (
            landId.includes(searchTerms.landId) &&
            holder.includes(searchTerms.holder) &&
            village.includes(searchTerms.village) &&
            sataPrakar.includes(searchTerms.sataPrakar)
        );
        
        if (matches) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update results count
    updateResultsCount(visibleCount);
}

// Update results count
function updateResultsCount(count) {
    let countElement = document.getElementById('resultsCount');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.id = 'resultsCount';
        countElement.className = 'results-count';
        document.querySelector('.search-section').appendChild(countElement);
    }
    
    const totalRows = document.querySelectorAll('#inventoryTable tbody tr:not(.empty-row)').length;
    countElement.innerHTML = `Showing ${count} of ${totalRows} lands`;
}

// Refresh data
function refreshData() {
    console.log('Refreshing inventory data...');
    showLoadingOverlay();
    
    // Simulate API call delay
    setTimeout(() => {
        location.reload();
    }, 500);
}

// Export data
function exportData() {
    console.log('Exporting inventory data...');
    
    const table = document.getElementById('inventoryTable');
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.empty-row)'));
    
    if (rows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Land ID,Property Holder,Village,Taluka,District,Total Area,Sata Prakar,Status\n';
    
    rows.forEach(row => {
        const landId = row.querySelector('.land-id')?.textContent || '';
        const holder = row.querySelector('.property-holder')?.textContent || '';
        const village = row.querySelector('.village-info')?.textContent || '';
        const locationDetails = row.querySelector('.location-details')?.textContent || '';
        const totalArea = row.querySelector('.area-item.total .area-value')?.textContent || '';
        const sataPrakar = row.querySelector('.sata-prakar-badge')?.textContent || '';
        const status = 'In Inventory';
        
        csvContent += `"${landId}","${holder}","${village}","${locationDetails}","${totalArea}","${sataPrakar}","${status}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_lands_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported successfully!', 'success');
}

// Print data
function printData() {
    console.log('Printing inventory data...');
    
    // Create print-friendly version
    const printWindow = window.open('', '_blank');
    const table = document.getElementById('inventoryTable');
    const tableClone = table.cloneNode(true);
    
    // Remove action buttons from print version
    const actionColumns = tableClone.querySelectorAll('td:last-child');
    actionColumns.forEach(cell => {
        cell.innerHTML = '';
    });
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Land Inventory Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .land-id { font-weight: bold; color: #007bff; }
                    .property-holder { font-weight: bold; }
                    .sata-prakar-badge { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
                    .inventory-status { background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>Land Inventory Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                ${tableClone.outerHTML}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// View land details
function viewLandDetails(landId) {
    console.log('Viewing land details for ID:', landId);
    currentLandId = landId;
    
    // Show loading state
    showLoadingOverlay();
    
    // Fetch land details from backend
    fetch(`/land/${landId}/details/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingOverlay();
        
        if (data.success) {
            const land = data.land;
            
            // Create comprehensive land details content
            const landDetailsContent = `
                <div class="land-details-content">
                    <!-- Header Section -->
                    <div class="land-header mb-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 class="mb-1">${land.name}</h4>
                                <span class="badge ${getStatusBadgeClass(land.status_value)}">${land.status}</span>
                            </div>
                            <div class="text-end">
                                <h5 class="text-primary mb-0">Land ID: ${land.id}</h5>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Left Column -->
                        <div class="col-md-6">
                            <!-- Location Details -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-geo-alt me-2 text-primary"></i>Location Details
                                </h6>
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Full Address:</span>
                                        <span class="detail-value">${land.full_location}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">State:</span>
                                        <span class="detail-value">${land.state}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">District:</span>
                                        <span class="detail-value">${land.district}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Taluka:</span>
                                        <span class="detail-value">${land.taluka}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Village:</span>
                                        <span class="detail-value">${land.village}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Identification Numbers -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-hash me-2 text-info"></i>Identification Numbers
                                </h6>
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Old SR No:</span>
                                        <span class="detail-value">${land.old_sr_no}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">New SR No:</span>
                                        <span class="detail-value">${land.new_sr_no}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Area Information -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-rulers me-2 text-success"></i>Area Information
                                </h6>
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Sata Prakar:</span>
                                        <span class="detail-value">${land.sata_prakar}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Built Up Area:</span>
                                        <span class="detail-value">${land.built_up_area} ${land.area_unit}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Unutilized Area:</span>
                                        <span class="detail-value">${land.unutilized_area} ${land.area_unit}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Area:</span>
                                        <span class="detail-value fw-bold text-primary">${land.total_area} ${land.area_unit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Column -->
                        <div class="col-md-6">
                            <!-- Important Dates -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-calendar me-2 text-warning"></i>Important Dates
                                </h6>
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Past Date:</span>
                                        <span class="detail-value">${land.past_date}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Soda Tarikh:</span>
                                        <span class="detail-value">${land.soda_tarikh}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Banakhat Tarikh:</span>
                                        <span class="detail-value">${land.banakhat_tarikh}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Dastavej Tarikh:</span>
                                        <span class="detail-value">${land.dastavej_tarikh}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Additional Information -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-person-badge me-2 text-secondary"></i>Additional Information
                                </h6>
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Broker Name:</span>
                                        <span class="detail-value">${land.broker_name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Location:</span>
                                        <span class="detail-value">${land.location}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Remark:</span>
                                        <span class="detail-value">${land.remark}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Total Value:</span>
                                        <span class="detail-value fw-bold text-success">${land.total_value} ${land.area_unit}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Selected Tasks -->
                            <div class="detail-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-list-task me-2 text-danger"></i>Selected Tasks (${land.tasks_count})
                                </h6>
                                <div class="detail-content">
                                    ${land.selected_tasks.length > 0 ? 
                                        land.selected_tasks.map(task => `
                                            <span class="badge bg-light text-dark me-2 mb-2">${task}</span>
                                        `).join('') : 
                                        '<span class="text-muted">No tasks assigned</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('landDetailsContent').innerHTML = landDetailsContent;
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('landDetailsModal'));
            modal.show();
        } else {
            showNotification(data.message || 'Failed to load land details', 'error');
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error fetching land details:', error);
        showNotification('Error loading land details', 'error');
    });
}

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'bg-success';
        case 'inventory': return 'bg-info';
        case 'sold': return 'bg-warning';
        case 'archived': return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}



// Show sell land modal
async function showSellLandModal(landId) {
    console.log('Showing sell land modal for land:', landId);
    currentLandId = landId;
    
    try {
        // Show loading state
        showLoadingOverlay();
        
        // First check if there's an existing sale for this land
        const saleResponse = await fetch(`/land/${landId}/installments/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
        });
        
        // Check if sale response is ok
        if (!saleResponse.ok) {
            throw new Error(`HTTP error! status: ${saleResponse.status}`);
        }
        
        // Check if sale response is JSON
        const saleContentType = saleResponse.headers.get('content-type');
        if (!saleContentType || !saleContentType.includes('application/json')) {
            const saleText = await saleResponse.text();
            console.error('Non-JSON sale response received:', saleText.substring(0, 200));
            throw new Error('Server returned non-JSON response for sale data');
        }
        
        const saleData = await saleResponse.json();
        
        // Fetch land details
        const landResponse = await fetch(`/land/${landId}/details/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
        });
        
        // Check if response is ok
        if (!landResponse.ok) {
            throw new Error(`HTTP error! status: ${landResponse.status}`);
        }
        
        // Check if response is JSON
        const contentType = landResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await landResponse.text();
            console.error('Non-JSON response received:', text.substring(0, 200));
            throw new Error('Server returned non-JSON response');
        }
        
        const landData = await landResponse.json();
        
        if (!landData.success) {
            throw new Error(landData.message || 'Failed to load land details');
        }
        
        // Fetch clients data
        const clientsResponse = await fetch('/api/clients/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
        });
        
        const clientsData = await clientsResponse.json();
        
        hideLoadingOverlay();
        
        // Check if there's an existing sale
        if (saleData.success && saleData.has_sale) {
            // Show existing sale in read-only mode
            populateSellLandFormWithExistingSale(landData.land, clientsData.clients, window.marketingEmployees, saleData.sale, saleData.installments);
        } else {
            // Show new sale form
            populateSellLandForm(landData.land, clientsData.clients, window.marketingEmployees);
        }
        
        // Initialize installments for new sales
        if (!saleData.has_sale) {
            initializeInstallments();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('sellLandModal'));
        modal.show();
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Error loading sell land data:', error);
        showNotification('Failed to load land details. Please try again.', 'error');
    }
}

// Populate sell land form with data
function populateSellLandForm(land, clients, employees) {
    // Set land ID
    document.getElementById('sellLandId').value = land.id;
    
    // Populate land details
    document.getElementById('sellLandIdDisplay').textContent = land.id;
    document.getElementById('sellLandName').textContent = land.name;
    document.getElementById('sellLandLocation').textContent = land.full_location;
    document.getElementById('sellLandArea').textContent = `${land.total_area} m²`;
    document.getElementById('sellLandSataPrakar').textContent = land.sata_prakar;
    document.getElementById('sellLandBroker').textContent = land.broker_name || 'Not specified';
    
    // Populate clients dropdown
    const clientSelect = document.getElementById('sellClient');
    clientSelect.innerHTML = '<option value="">Choose a client...</option>';
    
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.client_name} (${client.get_client_type_display})`;
            clientSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No clients available';
        option.disabled = true;
        clientSelect.appendChild(option);
    }
    
    // Populate marketing employees dropdown
    const employeeSelect = document.getElementById('sellMarketingEmployee');
    employeeSelect.innerHTML = '<option value="">Choose marketing employee...</option>';
    
    if (employees && employees.length > 0) {
        // employees is already filtered to marketing employees from template
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.full_name || employee.username;
            employeeSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No marketing employees available';
        option.disabled = true;
        employeeSelect.appendChild(option);
    }
    
    // Set default sale date to today
    document.getElementById('sellDate').value = new Date().toISOString().split('T')[0];
    
    // Reset form fields
    document.getElementById('sellNotes').value = '';
}

// Populate sell land form with existing sale data (read-only mode)
function populateSellLandFormWithExistingSale(land, clients, employees, sale, installments) {
    // Set land ID
    document.getElementById('sellLandId').value = land.id;
    
    // Populate land details
    document.getElementById('sellLandIdDisplay').textContent = land.id;
    document.getElementById('sellLandName').textContent = land.name;
    document.getElementById('sellLandLocation').textContent = land.full_location;
    document.getElementById('sellLandArea').textContent = `${land.total_area} m²`;
    document.getElementById('sellLandSataPrakar').textContent = land.sata_prakar;
    document.getElementById('sellLandBroker').textContent = land.broker_name || 'Not specified';
    
    // Populate clients dropdown
    const clientSelect = document.getElementById('sellClient');
    clientSelect.innerHTML = '<option value="">Choose a client...</option>';
    
    if (clients && clients.length > 0) {
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.client_name} (${client.get_client_type_display})`;
            if (sale.client_name && client.client_name === sale.client_name) {
                option.selected = true;
            }
            clientSelect.appendChild(option);
        });
    }
    
    // Populate marketing employees dropdown
    const employeeSelect = document.getElementById('sellMarketingEmployee');
    employeeSelect.innerHTML = '<option value="">Choose marketing employee...</option>';
    
    if (employees && employees.length > 0) {
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.full_name || employee.username;
            if (sale.marketing_employee_name && employee.full_name === sale.marketing_employee_name) {
                option.selected = true;
            }
            employeeSelect.appendChild(option);
        });
    }
    
    // Set sale date
    document.getElementById('sellDate').value = sale.sale_date;
    
    // Set notes
    document.getElementById('sellNotes').value = sale.notes || '';
    
    // Set form to read-only mode
    setSellFormReadOnly(true);
    
    // Display installments in read-only mode
    displayExistingInstallments(installments || []);
    
    // Update modal title and buttons
    updateSellModalForExistingSale(sale);
}

// Set sell form to read-only or editable mode
function setSellFormReadOnly(isReadOnly) {
    const formElements = [
        'sellClient',
        'sellMarketingEmployee', 
        'sellDate',
        'sellNotes'
    ];
    
    formElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = isReadOnly;
            if (isReadOnly) {
                // Keep form-control styling but add read-only appearance
                element.classList.add('form-control-readonly');
                element.classList.remove('form-control-plaintext');
                // Ensure proper classes are maintained
                if (element.tagName === 'SELECT') {
                    element.classList.add('form-select');
                } else {
                    element.classList.add('form-control');
                }
            } else {
                element.classList.remove('form-control-readonly', 'form-control-plaintext');
                if (element.tagName === 'SELECT') {
                    element.classList.add('form-select');
                } else {
                    element.classList.add('form-control');
                }
            }
        }
    });
    
    // Disable + buttons
    const addButtons = document.querySelectorAll('#addClientBtn, #addEmployeeBtn, #addInstallmentBtn');
    addButtons.forEach(btn => {
        btn.disabled = isReadOnly;
        btn.style.display = isReadOnly ? 'none' : 'inline-block';
    });
}

// Update modal for existing sale
function updateSellModalForExistingSale(sale) {
    // Update modal title
    const modalTitle = document.querySelector('#sellLandModal .modal-title');
    modalTitle.innerHTML = `
        <i class="bi bi-house me-2"></i>Land Sale Details
        <span class="badge bg-success ms-2">${sale.status.toUpperCase()}</span>
    `;
    
    // Update modal footer buttons
    const modalFooter = document.querySelector('#sellLandModal .modal-footer');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-warning" onclick="enableSellFormEdit()">
            <i class="bi bi-pencil me-2"></i>Edit Sale
        </button>
    `;
}

// Enable edit mode for existing sale
function enableSellFormEdit() {
    // Set form to editable mode
    setSellFormReadOnly(false);
    
    // Convert read-only installments to editable
    convertInstallmentsToEditable();
    
    // Update modal title
    const modalTitle = document.querySelector('#sellLandModal .modal-title');
    modalTitle.innerHTML = `
        <i class="bi bi-pencil me-2"></i>Edit Land Sale
    `;
    
    // Update modal footer buttons
    const modalFooter = document.querySelector('#sellLandModal .modal-footer');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-success" onclick="updateExistingSale()">
            <i class="bi bi-check-circle me-2"></i>Update Sale
        </button>
    `;
}

// Update existing sale
function updateExistingSale() {
    const form = document.getElementById('sellLandForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const clientId = formData.get('client_id');
    const marketingEmployeeId = formData.get('marketing_employee_id');
    const saleDate = formData.get('sale_date');
    
    if (!clientId) {
        showNotification('Please select a client', 'error');
        return;
    }
    
    if (!marketingEmployeeId) {
        showNotification('Please select a marketing employee', 'error');
        return;
    }
    
    if (!saleDate) {
        showNotification('Please select a sale date', 'error');
        return;
    }
    
    // Confirm the update
    if (confirm('Are you sure you want to update this land sale?')) {
        showLoadingOverlay();
        
        // Get installment data
        const installments = getInstallmentData();
        const totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
        
        // Validate installments if any exist
        if (installments.length > 0 && totalPercentage !== 100) {
            showNotification('Total installment percentage must be exactly 100%', 'error');
            return;
        }
        
        // Prepare update data
        const updateData = {
            land_id: currentLandId,
            client_id: clientId,
            marketing_employee_id: marketingEmployeeId,
            sale_date: saleDate,
            notes: formData.get('notes') || '',
            installments: installments,
            total_percentage: totalPercentage
        };
        
        console.log('Updating land sale with data:', updateData);
        
        // Make API call to update sale
        fetch('/update-land-sale/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            hideLoadingOverlay();
            
            if (data.success) {
                showNotification(data.message, 'success');
                
                // Close modal
                const sellModal = bootstrap.Modal.getInstance(document.getElementById('sellLandModal'));
                sellModal.hide();
                
                // Refresh page to update inventory
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Failed to update land sale', 'error');
            }
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Network or parsing error:', error);
            showNotification('Error updating land sale. Please try again.', 'error');
        });
    }
}

// Process sell land form
function processSellLand() {
    const form = document.getElementById('sellLandForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const clientId = formData.get('client_id');
    const marketingEmployeeId = formData.get('marketing_employee_id');
    const saleDate = formData.get('sale_date');
    
    if (!clientId) {
        showNotification('Please select a client', 'error');
        return;
    }
    
    if (!marketingEmployeeId) {
        showNotification('Please select a marketing employee', 'error');
        return;
    }
    
    if (!saleDate) {
        showNotification('Please select a sale date', 'error');
        return;
    }
    
    // Confirm the sale
    if (confirm('Are you sure you want to sell this land?')) {
        showLoadingOverlay();
        
            // Get installment data
    const installments = getInstallmentData();
    const totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
    
    // Validate installments if any exist
    if (installments.length > 0 && totalPercentage !== 100) {
        showNotification('Total installment percentage must be exactly 100%', 'error');
        return;
    }
    
    // Prepare sale data
    const saleData = {
        land_id: currentLandId,
        client_id: clientId,
        marketing_employee_id: marketingEmployeeId,
        sale_date: saleDate,
        notes: formData.get('notes') || '',
        installments: installments,
        total_percentage: totalPercentage
    };
        
        console.log('Processing land sale with data:', saleData);
        
        // Make API call to backend
        fetch('/process-land-sale/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            hideLoadingOverlay();
            
            if (data.success) {
                showNotification(data.message, 'success');
                
                // Close sell modal
                const sellModal = bootstrap.Modal.getInstance(document.getElementById('sellLandModal'));
                sellModal.hide();
                
                // Refresh page to update inventory
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Failed to process land sale', 'error');
            }
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Network or parsing error:', error);
            showNotification('Error processing land sale. Please try again.', 'error');
        });
    }
}

// Show installments modal (enhanced to use sale data)
function showInstallmentsModal(landId) {
    console.log('Showing installments modal for land:', landId);
    currentLandId = landId;
    
    // Show loading state
    showLoadingOverlay();
    
    // First check if there are existing installments
    fetch(`/land/${landId}/installments/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingOverlay();
        
        if (data.success && data.has_sale) {
            // Show existing installments
            showExistingInstallments(data);
        } else {
            // Show new installment form
            showNewInstallmentForm();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('installmentsModal'));
        modal.show();
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error checking installments:', error);
        // Fallback to new installment form
        showNewInstallmentForm();
        const modal = new bootstrap.Modal(document.getElementById('installmentsModal'));
        modal.show();
    });
}

// Show existing installments with pay buttons
function showExistingInstallments(data) {
    console.log('Showing existing installments:', data);
    
    // Update modal title - remove buyer name to avoid "Unknown Buyer"
    const modalTitle = document.getElementById('installmentsModalLabel');
    modalTitle.innerHTML = `<i class="bi bi-cash-coin me-2"></i>Installments`;
    
    // Clear existing content
    const container = document.getElementById('installmentRowsContainer');
    container.innerHTML = '';
    
    // Add simplified sale summary without amount fields
    const saleSummary = document.createElement('div');
    saleSummary.className = 'sale-summary mb-4 p-3 bg-light rounded';
    saleSummary.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="mb-2">Sale Details</h6>
                <p class="mb-1"><strong>Buyer:</strong> ${data.sale.buyer_name}</p>
                <p class="mb-1"><strong>Sale Date:</strong> ${data.sale.sale_date}</p>
            </div>
            <div class="col-md-6">
                <h6 class="mb-2">Payment Status</h6>
                <p class="mb-1"><strong>Paid:</strong> ${data.paid_installments}/${data.total_installments}</p>
                <p class="mb-1"><strong>Pending:</strong> ${data.pending_installments}</p>
                <p class="mb-1"><strong>Status:</strong> ${data.sale.status}</p>
            </div>
        </div>
    `;
    container.appendChild(saleSummary);
    
    // Add installments
    data.installments.forEach(installment => {
        const installmentRow = document.createElement('div');
        installmentRow.className = 'installment-row existing-installment mb-3 p-3 border rounded';
        
        const statusClass = installment.status === 'paid' ? 'success' : 
                           installment.is_overdue ? 'danger' : 'warning';
        const statusText = installment.status === 'paid' ? 'Paid' : 
                          installment.is_overdue ? 'Overdue' : 'Pending';
        
        installmentRow.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-3">
                    <strong>Installment ${installment.installment_number}</strong>
                </div>
                <div class="col-md-2">
                    <span class="badge bg-${statusClass}">${statusText}</span>
                </div>
                <div class="col-md-2">
                    ${installment.percentage}%
                </div>
                <div class="col-md-3">
                    ${installment.due_date}
                </div>
                <div class="col-md-2">
                    ${installment.status === 'paid' ? 
                        `<div class="d-flex flex-column gap-1">
                            <span class="text-success small">Paid on ${installment.paid_date}</span>
                            <button class="btn btn-info btn-sm" onclick="showPaymentDetails(${installment.id})">
                                <i class="bi bi-eye me-1"></i>View
                            </button>
                        </div>` :
                        `<button class="btn btn-success btn-sm" onclick="processPaymentForInstallment(${installment.id})">
                            <i class="bi bi-credit-card me-1"></i>Pay
                        </button>`
                    }
                </div>
            </div>
        `;
        container.appendChild(installmentRow);
    });
    
    // Update footer buttons
    const modalFooter = document.querySelector('#installmentsModal .modal-footer');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" onclick="showNewInstallmentForm()">
            <i class="bi bi-plus-circle me-2"></i>Add New Installment
        </button>
    `;
}

// Show new installment form
function showNewInstallmentForm() {
    console.log('Showing new installment form');
    
    // Update modal title
    const modalTitle = document.getElementById('installmentsModalLabel');
    modalTitle.innerHTML = `<i class="bi bi-cash-coin me-2"></i>Create New Installments`;
    
    // Clear existing content
    const container = document.getElementById('installmentRowsContainer');
    container.innerHTML = '';
    
    // Initialize modal with default rows
    initializeInstallmentsModal();
    
    // Update footer buttons
    const modalFooter = document.querySelector('#installmentsModal .modal-footer');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-success" onclick="processInstallments()">
            <i class="bi bi-check-circle me-2"></i>Process Sale
        </button>
    `;
}

// Global variables for payment modal
let currentInstallmentId = null;
let currentInstallmentAmount = 0;

// Show payment details modal
function showPaymentDetails(installmentId) {
    console.log('Showing payment details for installment:', installmentId);
    
    // Show loading state
    showLoadingOverlay();
    
    // Fetch payment details from backend
    fetch(`/installment/${installmentId}/payment-details/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingOverlay();
        
        if (data.success) {
            displayPaymentDetails(data.payment_details);
        } else {
            showNotification(data.message || 'Failed to fetch payment details', 'error');
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error fetching payment details:', error);
        showNotification('Error fetching payment details. Please try again.', 'error');
    });
}

// Display payment details in modal
function displayPaymentDetails(paymentDetails) {
    console.log('Displaying payment details:', paymentDetails);
    
    // Update modal title
    const modalTitle = document.getElementById('paymentDetailsModalLabel');
    modalTitle.innerHTML = `<i class="bi bi-receipt me-2"></i>Payment Details - Installment ${paymentDetails.installment_number}`;
    
    // Update modal content
    const modalBody = document.getElementById('paymentDetailsModalBody');
    modalBody.innerHTML = `
        <div class="payment-details-container">
            <!-- Payment Summary -->
            <div class="payment-summary mb-4 p-3 bg-light rounded">
                <h6 class="mb-3"><i class="bi bi-info-circle me-2"></i>Payment Summary</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Installment Number:</strong> ${paymentDetails.installment_number}</p>
                        <p><strong>Payment Method:</strong> ${paymentDetails.payment_method}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Received Date:</strong> ${paymentDetails.received_date}</p>
                        <p><strong>Received By:</strong> ${paymentDetails.received_by}</p>
                    </div>
                </div>
            </div>
            
            <!-- Payment Information -->
            <div class="payment-info mb-4 p-3 bg-light rounded">
                <h6 class="mb-3"><i class="bi bi-credit-card me-2"></i>Payment Information</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>RTGS Number:</strong> ${paymentDetails.rtgs_number || 'Not provided'}</p>
                        <p><strong>From Bank:</strong> ${paymentDetails.from_bank || 'Not provided'}</p>
                        <p><strong>UTR Reference:</strong> ${paymentDetails.utr_reference || 'Not provided'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>IFSC Code:</strong> ${paymentDetails.ifsc_code || 'Not provided'}</p>
                        <p><strong>Bank Name:</strong> ${paymentDetails.bank_name || 'Not provided'}</p>
                        <p><strong>Payment Reference:</strong> ${paymentDetails.payment_reference || 'Not provided'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Cheque Photo -->
            ${paymentDetails.cheque_photo ? `
                <div class="cheque-photo mb-4 p-3 bg-light rounded">
                    <h6 class="mb-3"><i class="bi bi-image me-2"></i>Cheque Photo</h6>
                    <div class="text-center">
                        <img src="${paymentDetails.cheque_photo}" 
                             alt="Cheque Photo" 
                             class="img-fluid rounded shadow cheque-image" 
                             style="max-height: 400px; cursor: pointer;"
                             onclick="openImageModal('${paymentDetails.cheque_photo}')"
                             title="Click to view full size">
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="bi bi-zoom-in me-1"></i>Click image to view full size
                            </small>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="cheque-photo mb-4 p-3 bg-light rounded">
                    <h6 class="mb-3"><i class="bi bi-image me-2"></i>Cheque Photo</h6>
                    <div class="text-center text-muted">
                        <i class="bi bi-image" style="font-size: 48px;"></i>
                        <p class="mt-2 mb-0">No cheque photo uploaded</p>
                    </div>
                </div>
            `}
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
    modal.show();
}

// Show payment modal
function showPaymentModal(installmentId, amount) {
    console.log('Showing payment modal for installment:', installmentId, 'Amount:', amount);

    currentInstallmentId = installmentId;
    currentInstallmentAmount = amount;

    // Set default values for new fields
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('rtgsNumber').value = '';
    document.getElementById('fromBank').value = '';
    document.getElementById('utrReference').value = '';
    document.getElementById('ifscCode').value = '';
    document.getElementById('bankName').value = '';
    
    // Clear file input and preview
    document.getElementById('chequePhoto').value = '';
    document.getElementById('chequePhotoPreview').style.display = 'none';

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

// Process payment
function processPayment() {
    // Debug: Check if currentInstallmentId is set
    console.log('Current installment ID:', window.currentInstallmentId);
    console.log('Available window properties:', Object.keys(window).filter(key => key.includes('installment')));
    
    // Try to get installment ID from different possible sources
    let installmentId = window.currentInstallmentId;
    
    if (!installmentId) {
        // Try to get from global variables
        installmentId = window.currentInstallmentId || window.installmentId;
    }
    
    if (!installmentId) {
        showNotification('Installment ID not found. Please close this modal and try clicking the Pay button again.', 'error');
        return;
    }
    
    // Update the global variable
    window.currentInstallmentId = installmentId;
    
    const paymentDate = document.getElementById('paymentDate').value;
    const rtgsNumber = document.getElementById('rtgsNumber').value;
    const fromBank = document.getElementById('fromBank').value;
    const utrReference = document.getElementById('utrReference').value;
    const ifscCode = document.getElementById('ifscCode').value;
    const bankName = document.getElementById('bankName').value;
    const chequePhoto = document.getElementById('chequePhoto').files[0];
    
    // Validate required fields
    if (!paymentDate) {
        showNotification('Please select a payment date', 'error');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('payment_date', paymentDate);
    formData.append('rtgs_number', rtgsNumber);
    formData.append('from_bank', fromBank);
    formData.append('utr_reference', utrReference);
    formData.append('ifsc_code', ifscCode);
    formData.append('bank_name', bankName);
    
    if (chequePhoto) {
        formData.append('cheque_photo', chequePhoto);
    }
    
    if (confirm(`Are you sure you want to process this payment?`)) {
        showLoadingOverlay();
        
        console.log('Processing payment with FormData');
        
        fetch(`/installment/${installmentId}/pay/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }
            
            return response.json();
        })
        .then(data => {
            hideLoadingOverlay();
            console.log('Payment response data:', data);
            
            if (data.success) {
                showNotification(data.message, 'success');
                
                // Close payment modal
                const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                if (paymentModal) {
                paymentModal.hide();
                }
                
                // Check if land status was updated to sold
                if (data.land_status_updated) {
                    // Use helper function to handle auto-reload
                    handleLandStatusChange(true, 'All installments paid! Land status updated to SOLD. Reloading page...');
                } else {
                    // Refresh installments modal if status not updated
                    setTimeout(() => {
                        showInstallmentsModal(currentLandId);
                    }, 1000);
                }
            } else {
                showNotification(data.message || 'Failed to process payment', 'error');
            }
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Error processing payment:', error);
            showNotification('Error processing payment. Please try again.', 'error');
        });
    }
}

// Process installments
function processInstallments() {
    // Validate installments
    const validation = validateInstallments();
    
    if (!validation.isValid) {
        showNotification('Please fix the following errors:\n' + validation.errors.join('\n'), 'error');
        return;
    }
    
    // Check if we have sale data from the sell modal
    if (!window.currentSaleData) {
        showNotification('Sale data not found. Please start the sell process again.', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to process this land sale with installments?')) {
        showLoadingOverlay();
        
        // Get installments data
        const installmentsData = getInstallmentsData();
        
        // Prepare data for backend with sale information
        const saleData = {
            land_id: currentLandId,
            client_id: window.currentSaleData.client_id,
            marketing_employee_id: window.currentSaleData.marketing_employee_id,
            sale_date: window.currentSaleData.sale_date,
            notes: window.currentSaleData.notes,
            installments: installmentsData,
            total_percentage: validation.totalPercentage
        };
        
        console.log('Processing sale with data:', saleData);
        console.log('CSRF Token found:', getCSRFToken() ? 'YES' : 'NO');
        console.log('CSRF Token value:', getCSRFToken());
        
        // Make actual API call to backend
        fetch('/process-land-sale/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            hideLoadingOverlay();
            
            if (data.success) {
                showNotification(data.message, 'success');
                
                // Clear sale data
                window.currentSaleData = null;
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('installmentsModal'));
                modal.hide();
                
                // Reload page to update inventory
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification(data.message || 'Failed to process land sale', 'error');
            }
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Network or parsing error:', error);
            showNotification('Error processing land sale. Please try again.', 'error');
        });
    }
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
function showNotification(message, type = 'info', additionalClass = '') {
    // Create notification element
    const notification = document.createElement('div');
    let className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    if (additionalClass) {
        className += ` ${additionalClass}`;
    }
    notification.className = className;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds (or 7 seconds for reload notifications)
    const removeDelay = additionalClass === 'notification-reload' ? 7000 : 5000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, removeDelay);
}

// Get CSRF token
function getCSRFToken() {
    // Try to get from cookie (same as other working examples)
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    
    if (cookieValue) {
        return cookieValue;
    }
    
    // Fallback to meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute('content');
    }
    
    // Fallback to form input
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// Handle window resize
function handleResize() {
    // Adjust table layout for mobile
    const table = document.getElementById('inventoryTable');
    if (window.innerWidth < 768) {
        table.classList.add('table-responsive');
    } else {
        table.classList.remove('table-responsive');
    }
}

// Debounce function for performance
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

// Utility function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Cheque photo preview functions
function previewChequePhoto(input) {
    const file = input.files[0];
    const preview = document.getElementById('chequePhotoPreview');
    const previewImage = document.getElementById('previewImage');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

function removeChequePhoto() {
    document.getElementById('chequePhoto').value = '';
    document.getElementById('chequePhotoPreview').style.display = 'none';
}

// Open image in full-size modal
function openImageModal(imageSrc) {
    // Create image modal if it doesn't exist
    let imageModal = document.getElementById('imageModal');
    if (!imageModal) {
        imageModal = document.createElement('div');
        imageModal.id = 'imageModal';
        imageModal.className = 'modal fade';
        imageModal.setAttribute('tabindex', '-1');
        imageModal.setAttribute('aria-hidden', 'true');
        imageModal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-image me-2"></i>Cheque Photo
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="fullSizeImage" src="" alt="Cheque Photo" class="img-fluid rounded shadow">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(imageModal);
    }
    
    // Set image source and show modal
    document.getElementById('fullSizeImage').src = imageSrc;
    const modal = new bootstrap.Modal(imageModal);
    modal.show();
}

// Function to handle auto-reload when land status changes
function handleLandStatusChange(landStatusUpdated, message) {
    if (landStatusUpdated) {
        console.log('Land status updated - preparing to reload page...');
        
        // Show notification about status change with special styling
        showNotification(message || 'Land status updated! Reloading page...', 'success', 'notification-reload');
        
        // Reload page after a short delay to let user see the notification
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        return true; // Indicates that page will reload
    }
    return false; // No reload needed
}

// Function to fetch land status directly from database
function fetchLandStatusFromDatabase(landId) {
    console.log(`Fetching land status from database for land ID: ${landId}`);
    
    fetch(`/land/${landId}/status/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Land ${landId} status from database:`, data);
            showNotification(`Land ${data.land_name} status: ${data.status}`, 'info');
        } else {
            console.error('Error fetching land status:', data.message);
            showNotification(data.message || 'Failed to fetch land status', 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching land status:', error);
        showNotification('Error fetching land status. Please try again.', 'error');
    });
}

// Show Land Info Modal
function showLandInfo(landId) {
    console.log('Showing land info for ID:', landId);
    currentLandId = landId;
    
    // Show loading state
    showLoadingOverlay();
    
    // Fetch land details from backend
    fetch(`/land/${landId}/details/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingOverlay();
        
        if (data.success) {
            const land = data.land;
            
            // Create land info content
            const landInfoContent = `
                <div class="land-info-content">
                    <!-- Header Section -->
                    <div class="land-header mb-4">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h4 class="mb-1">${land.name}</h4>
                                <span class="badge ${getStatusBadgeClass(land.status_value)}">${land.status}</span>
                            </div>
                            <div class="text-end">
                                <h5 class="text-primary mb-0">Land ID: ${land.id}</h5>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <!-- Area Details Section -->
                        <div class="col-md-6">
                            <div class="info-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-rulers me-2 text-primary"></i>Area Details
                                </h6>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Built Area</span>
                                        <span class="info-value">${land.built_up_area || '0.00'} m²</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Unutilized Area</span>
                                        <span class="info-value">${land.unutilized_area || '0.00'} m²</span>
                                    </div>
                                    <div class="info-item total">
                                        <span class="info-label">Total Area</span>
                                        <span class="info-value">${land.total_area || '0.00'} m²</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Important Dates Section -->
                        <div class="col-md-6">
                            <div class="info-section mb-4">
                                <h6 class="section-title">
                                    <i class="bi bi-calendar-event me-2 text-success"></i>Important Dates
                                </h6>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Soda Date</span>
                                        <span class="info-value">${formatDate(land.soda_tarikh)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Banakhat Date</span>
                                        <span class="info-value">${formatDate(land.banakhat_tarikh)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Dastaveg Date</span>
                                        <span class="info-value">${formatDate(land.dastavej_tarikh)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Information -->
                    <div class="row">
                        <div class="col-12">
                            <div class="info-section">
                                <h6 class="section-title">
                                    <i class="bi bi-info-circle me-2 text-info"></i>Additional Information
                                </h6>
                                <div class="additional-info">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Location:</strong> ${land.location || 'Not specified'}</p>
                                            <p><strong>Remark:</strong> ${land.remark || 'No remarks'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Broker:</strong> ${land.broker_name || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set modal content and show
            document.getElementById('landInfoContent').innerHTML = landInfoContent;
            const modal = new bootstrap.Modal(document.getElementById('landInfoModal'));
            modal.show();
        } else {
            showErrorMessage('Error loading land information: ' + data.message);
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error loading land information:', error);
        showErrorMessage('Failed to load land information. Please try again.');
    });
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
}

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    const statusClasses = {
        'active': 'bg-primary',
        'inventory': 'bg-success',
        'in_process': 'bg-warning',
        'sold': 'bg-info'
    };
    return statusClasses[status] || 'bg-secondary';
}

// Export functions for global access
// Show add client modal from inventory page
function showAddClientModalFromInventory() {
    // Show the add client modal
    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();
    
    // Store reference to current sell modal for later use
    window.currentSellModal = document.getElementById('sellLandModal');
}

// Refresh client dropdown after adding a new client
async function refreshClientDropdown() {
    try {
        const response = await fetch('/api/clients/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            const clientSelect = document.getElementById('sellClient');
            
            // Clear existing options
            clientSelect.innerHTML = '<option value="">Choose a client...</option>';
            
            if (data.clients && data.clients.length > 0) {
                data.clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.client_name} (${client.get_client_type_display})`;
                    clientSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No clients available';
                option.disabled = true;
                clientSelect.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error refreshing client dropdown:', error);
    }
}

// Show installments management modal
async function showInstallmentsModal(landId) {
    console.log('Opening installments management modal for land:', landId);
    currentLandId = landId;
    
    try {
        // Show loading state
        const modal = new bootstrap.Modal(document.getElementById('manageInstallmentsModal'));
        const contentDiv = document.getElementById('installmentsManagementContent');
        contentDiv.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading installments and payments...</p>
            </div>
        `;
        modal.show();
        
        // Fetch land sale and installments data
        const response = await fetch(`/land/${landId}/installments/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Render installments management content
            renderInstallmentsManagement(data);
        } else {
            contentDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${data.message || 'No installments found for this land.'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading installments:', error);
        document.getElementById('installmentsManagementContent').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i>
                Error loading installments: ${error.message}
            </div>
        `;
    }
}

// Render installments management content
function renderInstallmentsManagement(data) {
    const contentDiv = document.getElementById('installmentsManagementContent');
    
    // Debug: Log the received data
    console.log('Received installments data:', data);
    
    if (!data.has_sale) {
        contentDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                This land has not been sold yet. Please use the "Sell" button to create a sale and installments.
            </div>
        `;
        return;
    }
    
    const sale = data.sale;
    const installments = data.installments || [];
    
    // Debug: Log installments
    console.log('Installments:', installments);
    
    let installmentsHtml = '';
    if (installments.length > 0) {
        installmentsHtml = installments.map(installment => {
            // Debug: Log each installment
            console.log('Processing installment:', installment);
            console.log('Installment ID:', installment.id);
            console.log('Installment status:', installment.status);
            
            // Check if installment is paid
            const isPaid = installment.status === 'paid';
            const rowClass = isPaid ? 'installment-management-row paid-installment' : 'installment-management-row';
            const inputClass = isPaid ? 'form-control paid-input' : 'form-control';
            
            return `
                <div class="${rowClass}">
                    <div class="installment-management-fields">
                        <div class="installment-management-field">
                            <label>PAYMENT METHOD</label>
                            <input type="text" class="${inputClass}" value="${getPaymentMethodDisplay(installment.payment_type)}" readonly>
                        </div>
                        <div class="installment-management-field">
                            <label>%</label>
                            <input type="number" class="${inputClass}" value="${installment.percentage}" readonly>
                        </div>
                        <div class="installment-management-field">
                            <label>DUE DATE</label>
                            <input type="date" class="${inputClass}" value="${installment.due_date}" readonly>
                        </div>
                        <div class="installment-management-field">
                            ${isPaid ? `
                                <div class="paid-status-container">
                                    <span class="paid-status-text">PAID</span>
                                    <button class="btn btn-success btn-sm view-btn" onclick="showPaymentDetails(${installment.id})" title="View Payment Details">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            ` : `
                                <button class="btn btn-warning btn-sm pay-btn" onclick="processPaymentForInstallment(${installment.id})" title="Pay">
                                    <i class="bi bi-credit-card"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        installmentsHtml = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No installments found for this sale.
            </div>
        `;
    }
    
    contentDiv.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-house me-2"></i>
                            Sale Information
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Land:</strong> ${sale.land_name}</p>
                                <p><strong>Buyer:</strong> ${sale.buyer_name}</p>
                                <p><strong>Sale Date:</strong> ${sale.sale_date}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Client:</strong> ${sale.client_name || 'N/A'}</p>
                                <p><strong>Marketing Employee:</strong> ${sale.marketing_employee_name || 'N/A'}</p>
                                <p><strong>Status:</strong> <span class="badge ${getStatusBadgeClass(sale.status)}">${sale.status.toUpperCase()}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="mb-3">
                    <h6 class="mb-0">
                        <i class="bi bi-list-ul me-2"></i>
                        Installments & Payments
                    </h6>
                </div>
                ${installmentsHtml}
            </div>
        </div>
    `;
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'paid': return 'bg-success';
        case 'pending': return 'bg-warning';
        case 'overdue': return 'bg-danger';
        case 'cancelled': return 'bg-secondary';
        case 'active': return 'bg-primary';
        case 'completed': return 'bg-success';
        default: return 'bg-secondary';
    }
}

// Process payment for specific installment
function processPaymentForInstallment(installmentId) {
    // Debug: Log the installment ID
    console.log('Processing payment for installment ID:', installmentId);
    
    // Validate installment ID
    if (!installmentId || installmentId === 'null' || installmentId === 'undefined') {
        showNotification('Invalid installment ID. Please try again.', 'error');
        return;
    }
    
    // Store the installment ID for payment processing
    window.currentInstallmentId = installmentId;
    console.log('Stored currentInstallmentId:', window.currentInstallmentId);
    
    // Clear any existing form data
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('rtgsNumber').value = '';
    document.getElementById('fromBank').value = '';
    document.getElementById('utrReference').value = '';
    document.getElementById('ifscCode').value = '';
    document.getElementById('bankName').value = '';
    document.getElementById('chequePhoto').value = '';
    
    // Open the payment modal with proper z-index handling
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    // Ensure proper z-index stacking
    paymentModal.show();
    
    // Force z-index after modal is shown
    setTimeout(() => {
        const modalElement = document.getElementById('paymentModal');
        if (modalElement) {
            modalElement.style.zIndex = '1060';
        }
        const backdrop = document.querySelector('.modal-backdrop:last-child');
        if (backdrop) {
            backdrop.style.zIndex = '1055';
        }
    }, 100);
}

// Add new installment
function addNewInstallment() {
    // This would open a form to add a new installment
    alert('Add new installment functionality will be implemented here');
}

// Edit installment
function editInstallment(installmentId) {
    // This would open a form to edit the installment
    alert('Edit installment functionality will be implemented here');
}

// ===== INSTALLMENT MANAGEMENT FUNCTIONS =====

// Global variable to track installment rows
let installmentRowCount = 0;

// Add a new installment row
function addInstallmentRow() {
    installmentRowCount++;
    const container = document.getElementById('installmentsContainer');
    
    const rowHtml = `
        <div class="installment-row" id="installmentRow${installmentRowCount}">
            <div class="installment-fields">
                <div class="installment-field">
                    <label>Days</label>
                    <input type="number" class="form-control" id="days${installmentRowCount}" 
                           placeholder="0" min="0" oninput="updateDueDate(${installmentRowCount})">
                </div>
                <div class="installment-field">
                    <label>Cash</label>
                    <select class="form-select" id="paymentMethod${installmentRowCount}">
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="installment-field">
                    <label>%</label>
                    <input type="number" class="form-control" id="percentage${installmentRowCount}" 
                           placeholder="0" min="0" max="100" step="0.01" 
                           oninput="updateTotalPercentage()">
                </div>
                <div class="installment-field">
                    <label>Due Date</label>
                    <input type="date" class="form-control" id="dueDate${installmentRowCount}" 
                           readonly>
                </div>
                <div class="installment-field">
                    <button type="button" class="remove-installment-btn" 
                            onclick="removeInstallmentRow(${installmentRowCount})" 
                            title="Remove Installment">
                        <i class="bi bi-dash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHtml);
    
    // Add animation class
    const newRow = document.getElementById(`installmentRow${installmentRowCount}`);
    newRow.classList.add('adding');
    
    // Remove animation class after animation completes
    setTimeout(() => {
        newRow.classList.remove('adding');
    }, 300);
    
    // Update total percentage
    updateTotalPercentage();
}

// Remove an installment row
function removeInstallmentRow(rowId) {
    const row = document.getElementById(`installmentRow${rowId}`);
    if (row) {
        row.classList.add('removing');
        
        setTimeout(() => {
            row.remove();
            updateTotalPercentage();
        }, 300);
    }
}

// Update due date based on days from today
function updateDueDate(rowId) {
    const daysInput = document.getElementById(`days${rowId}`);
    const dueDateInput = document.getElementById(`dueDate${rowId}`);
    
    if (daysInput && dueDateInput) {
        const days = parseInt(daysInput.value) || 0;
        const today = new Date();
        const dueDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // Format date as YYYY-MM-DD
        const formattedDate = dueDate.toISOString().split('T')[0];
        dueDateInput.value = formattedDate;
    }
}


// Update total percentage and status
function updateTotalPercentage() {
    let totalPercentage = 0;
    const container = document.getElementById('installmentsContainer');
    const rows = container.querySelectorAll('.installment-row');
    
    // Reset all percentage input styles
    rows.forEach(row => {
        const percentageInput = row.querySelector('input[id^="percentage"]');
        if (percentageInput) {
            percentageInput.classList.remove('is-invalid', 'is-valid');
        }
    });
    
    rows.forEach(row => {
        const percentageInput = row.querySelector('input[id^="percentage"]');
        if (percentageInput && percentageInput.value) {
            const percentage = parseFloat(percentageInput.value) || 0;
            totalPercentage += percentage;
            
            // Add validation styling to individual inputs
            if (percentage > 0) {
                percentageInput.classList.add('is-valid');
            }
        }
    });
    
    // Update total display
    const totalElement = document.getElementById('totalPercentage');
    const statusElement = document.getElementById('totalStatus');
    const totalContainer = document.querySelector('.installment-total');
    
    if (totalElement) {
        totalElement.textContent = totalPercentage.toFixed(2);
    }
    
    if (statusElement && totalContainer) {
        if (totalPercentage === 100) {
            statusElement.textContent = 'Complete';
            statusElement.className = 'badge bg-light text-dark status-badge complete';
            totalContainer.className = 'installment-total complete';
            // Remove any validation error messages
            removeValidationMessage();
        } else if (totalPercentage > 100) {
            statusElement.textContent = 'Over Complete';
            statusElement.className = 'badge bg-light text-dark status-badge over-complete';
            totalContainer.className = 'installment-total over-complete';
            showValidationMessage('Total percentage cannot exceed 100%', 'error');
        } else {
            statusElement.textContent = 'Incomplete';
            statusElement.className = 'badge bg-light text-dark status-badge incomplete';
            totalContainer.className = 'installment-total incomplete';
            if (totalPercentage > 0) {
                showValidationMessage(`Total percentage is ${totalPercentage.toFixed(2)}%. Must be exactly 100%`, 'warning');
            }
        }
    }
}

// Clear all installments
function clearAllInstallments() {
    const container = document.getElementById('installmentsContainer');
    container.innerHTML = '';
    installmentRowCount = 0;
    updateTotalPercentage();
}

// Get installment data for form submission
function getInstallmentData() {
    const installments = [];
    const container = document.getElementById('installmentsContainer');
    const rows = container.querySelectorAll('.installment-row');
    
    rows.forEach((row, index) => {
        const daysInput = row.querySelector('input[id^="days"]');
        const paymentMethodSelect = row.querySelector('select[id^="paymentMethod"]');
        const percentageInput = row.querySelector('input[id^="percentage"]');
        const dueDateInput = row.querySelector('input[id^="dueDate"]');
        
        if (daysInput && paymentMethodSelect && percentageInput && dueDateInput) {
            const days = parseInt(daysInput.value) || 0;
            const paymentMethod = paymentMethodSelect.value;
            const percentage = parseFloat(percentageInput.value) || 0;
            const dueDate = dueDateInput.value;
            
            // Only add if percentage is greater than 0
            if (percentage > 0) {
                installments.push({
                    installment_number: index + 1,
                    days: days,
                    payment_method: paymentMethod,
                    percentage: percentage,
                    due_date: dueDate
                });
            }
        }
    });
    
    return installments;
}

// Show validation message
function showValidationMessage(message, type) {
    // Remove existing validation message
    removeValidationMessage();
    
    const container = document.getElementById('installmentsContainer');
    const messageDiv = document.createElement('div');
    messageDiv.id = 'installmentValidationMessage';
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'warning'} alert-dismissible fade show mt-2`;
    messageDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    container.appendChild(messageDiv);
}

// Remove validation message
function removeValidationMessage() {
    const existingMessage = document.getElementById('installmentValidationMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Initialize installments when modal opens
function initializeInstallments() {
    clearAllInstallments();
    // Add one default row
    addInstallmentRow();
}

// Display existing installments in read-only mode
function displayExistingInstallments(installments) {
    const container = document.getElementById('installmentsContainer');
    container.innerHTML = '';
    
    if (!installments || installments.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No installments found for this sale.
            </div>
        `;
        updateTotalPercentage();
        return;
    }
    
    let totalPercentage = 0;
    
    installments.forEach((installment, index) => {
        totalPercentage += installment.percentage;
        
        const rowHtml = `
            <div class="installment-row read-only-installment" id="existingInstallmentRow${installment.id}">
                <div class="installment-fields">
                    <div class="installment-field">
                        <label>Payment Method</label>
                        <input type="text" class="form-control form-control-readonly" value="${getPaymentMethodDisplay(installment.payment_type)}" readonly>
                    </div>
                    <div class="installment-field">
                        <label>%</label>
                        <input type="number" class="form-control form-control-readonly" value="${installment.percentage}" readonly>
                    </div>
                    <div class="installment-field">
                        <label>Due Date</label>
                        <input type="date" class="form-control form-control-readonly" value="${installment.due_date}" readonly>
                    </div>
                    <div class="installment-field">
                        <label>Status</label>
                        <span class="badge ${getStatusBadgeClass(installment.status)}">${getStatusDisplay(installment.status)}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rowHtml);
    });
    
    // Update total percentage display
    const totalElement = document.getElementById('totalPercentage');
    const statusElement = document.getElementById('totalStatus');
    const totalContainer = document.querySelector('.installment-total');
    
    if (totalElement) {
        totalElement.textContent = totalPercentage.toFixed(2);
    }
    
    if (statusElement && totalContainer) {
        statusElement.textContent = 'Complete';
        statusElement.className = 'badge bg-light text-dark status-badge complete';
        totalContainer.className = 'installment-total complete';
    }
}

// Helper function to get payment method display name
function getPaymentMethodDisplay(paymentType) {
    const paymentMethods = {
        'cash': 'Cash',
        'cheque': 'Cheque',
        'bank_transfer': 'Bank Transfer',
        'upi': 'UPI',
        'other': 'Other'
    };
    return paymentMethods[paymentType] || paymentType;
}

// Helper function to get status display name
function getStatusDisplay(status) {
    const statuses = {
        'pending': 'Pending',
        'paid': 'Paid',
        'overdue': 'Overdue',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

// Helper function to get status badge class
function getStatusBadgeClass(status) {
    const statusClasses = {
        'pending': 'bg-warning',
        'paid': 'bg-success',
        'overdue': 'bg-danger',
        'cancelled': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
}

// Convert read-only installments to editable format
function convertInstallmentsToEditable() {
    const container = document.getElementById('installmentsContainer');
    const readOnlyRows = container.querySelectorAll('.read-only-installment');
    
    if (readOnlyRows.length === 0) {
        // If no installments exist, initialize with one default row
        initializeInstallments();
        return;
    }
    
    // Clear the container
    container.innerHTML = '';
    installmentRowCount = 0;
    
    // Convert each read-only installment to editable
    readOnlyRows.forEach((row, index) => {
        installmentRowCount++;
        
        // Extract data from read-only row
        const paymentMethodInput = row.querySelector('input[value*="Cash"], input[value*="Cheque"], input[value*="Bank Transfer"], input[value*="UPI"], input[value*="Other"]');
        const percentageInput = row.querySelector('input[type="number"]');
        const dueDateInput = row.querySelector('input[type="date"]');
        
        const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cash';
        const percentage = percentageInput ? percentageInput.value : '';
        const dueDate = dueDateInput ? dueDateInput.value : '';
        
        // Convert payment method display back to value
        const paymentMethodValue = getPaymentMethodValue(paymentMethod);
        
        // Calculate days from due date (if available)
        let days = '';
        if (dueDate) {
            const today = new Date();
            const dueDateObj = new Date(dueDate);
            const diffTime = dueDateObj - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            days = diffDays > 0 ? diffDays : 0;
        }
        
        const rowHtml = `
            <div class="installment-row" id="installmentRow${installmentRowCount}">
                <div class="installment-fields">
                    <div class="installment-field">
                        <label>Days</label>
                        <input type="number" class="form-control" id="days${installmentRowCount}" 
                               placeholder="0" min="0" value="${days}" oninput="updateDueDate(${installmentRowCount})">
                    </div>
                    <div class="installment-field">
                        <label>Cash</label>
                        <select class="form-select" id="paymentMethod${installmentRowCount}">
                            <option value="cash" ${paymentMethodValue === 'cash' ? 'selected' : ''}>Cash</option>
                            <option value="cheque" ${paymentMethodValue === 'cheque' ? 'selected' : ''}>Cheque</option>
                            <option value="bank_transfer" ${paymentMethodValue === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="upi" ${paymentMethodValue === 'upi' ? 'selected' : ''}>UPI</option>
                            <option value="other" ${paymentMethodValue === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="installment-field">
                        <label>%</label>
                        <input type="number" class="form-control" id="percentage${installmentRowCount}" 
                               placeholder="0" min="0" max="100" step="0.01" value="${percentage}"
                               oninput="updateTotalPercentage()">
                    </div>
                    <div class="installment-field">
                        <label>Due Date</label>
                        <input type="date" class="form-control" id="dueDate${installmentRowCount}" 
                               value="${dueDate}" readonly>
                    </div>
                    <div class="installment-field">
                        <button type="button" class="remove-installment-btn" 
                                onclick="removeInstallmentRow(${installmentRowCount})" 
                                title="Remove Installment">
                            <i class="bi bi-dash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rowHtml);
    });
    
    // Add the + button functionality
    const addButton = document.getElementById('addInstallmentBtn');
    if (addButton) {
        addButton.style.display = 'block';
    }
    
    // Update total percentage
    updateTotalPercentage();
}

// Helper function to convert payment method display back to value
function getPaymentMethodValue(displayName) {
    const paymentMethodMap = {
        'Cash': 'cash',
        'Cheque': 'cheque',
        'Bank Transfer': 'bank_transfer',
        'UPI': 'upi',
        'Other': 'other'
    };
    return paymentMethodMap[displayName] || 'cash';
}
window.refreshData = refreshData;
window.exportData = exportData;
window.printData = printData;
window.fetchLandStatusFromDatabase = fetchLandStatusFromDatabase;
window.viewLandDetails = viewLandDetails;
window.showLandInfo = showLandInfo;
window.editLand = editLand;
window.editLandFromModal = editLandFromModal;
window.restoreFromInventory = restoreFromInventory;
window.markAsSold = markAsSold;
window.showSellLandModal = showSellLandModal;
window.processSellLand = processSellLand;
window.showInstallmentsModal = showInstallmentsModal;
window.showPaymentModal = showPaymentModal;
window.showPaymentDetails = showPaymentDetails;
window.processPayment = processPayment;
window.previewChequePhoto = previewChequePhoto;
window.removeChequePhoto = removeChequePhoto;
window.openImageModal = openImageModal;
window.handleLandStatusChange = handleLandStatusChange;
window.showAddClientModalFromInventory = showAddClientModalFromInventory;
window.refreshClientDropdown = refreshClientDropdown;
window.addInstallmentRow = addInstallmentRow;
window.removeInstallmentRow = removeInstallmentRow;
window.updateDueDate = updateDueDate;
window.updateTotalPercentage = updateTotalPercentage;
window.clearAllInstallments = clearAllInstallments;
window.getInstallmentData = getInstallmentData;
window.initializeInstallments = initializeInstallments;
window.displayExistingInstallments = displayExistingInstallments;
window.convertInstallmentsToEditable = convertInstallmentsToEditable;
window.getPaymentMethodValue = getPaymentMethodValue;
window.getPaymentMethodDisplay = getPaymentMethodDisplay;
window.getStatusDisplay = getStatusDisplay;
window.getStatusBadgeClass = getStatusBadgeClass;
window.showValidationMessage = showValidationMessage;
window.removeValidationMessage = removeValidationMessage;
