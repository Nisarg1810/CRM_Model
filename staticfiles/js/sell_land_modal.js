// Sell Land Modal JavaScript Functions
console.log('Sell Land Modal JS file loaded successfully');

// Immediate test to verify the file is loading
window.testSellLandModalFile = function() {
    console.log('sell_land_modal.js file is loaded and working!');
    return true;
};

// Global variables for sell land modal
let currentLandId = null;
let installmentRowCount = 0;

// Show sell land modal
async function showSellLandModal(landId) {
    console.log('Showing sell land modal for land:', landId);
    currentLandId = landId;
    
    try {
        // Show loading state
        if (typeof showLoadingOverlay === 'function') {
            showLoadingOverlay();
        }
        
        // Fetch land details and check for existing sale
        const [landResponse, saleResponse] = await Promise.all([
            fetch(`/land/${landId}/details/`),
            fetch(`/land/${landId}/installments/`)
        ]);
        
        if (!landResponse.ok) {
            throw new Error(`Failed to load land details: ${landResponse.status}`);
        }
        
        const land = await landResponse.json();
        console.log('Land data:', land);
        
        // Check if sale exists
        let saleData = null;
        if (saleResponse.ok) {
            const contentType = saleResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                saleData = await saleResponse.json();
                console.log('Sale data:', saleData);
            }
        }
        
        // Fetch clients and employees
        const [clientsResponse, employeesResponse] = await Promise.all([
            fetch('/api/clients/'),
            fetch('/api/employees/')
        ]);
        
        if (!clientsResponse.ok || !employeesResponse.ok) {
            throw new Error('Failed to load clients or employees');
        }
        
        const clients = await clientsResponse.json();
        const employees = await employeesResponse.json();
        
        // Filter marketing employees
        const marketingEmployees = employees.filter(emp => emp.employee_type === 'marketing');
        
        // Populate form based on whether sale exists
        if (saleData && saleData.sale) {
            // Existing sale - show in read-only mode
            populateSellLandFormWithExistingSale(land, clients, marketingEmployees, saleData.sale, saleData.installments);
        } else {
            // New sale - show editable form
            populateSellLandForm(land, clients, marketingEmployees);
            initializeInstallments();
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('sellLandModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error loading sell land data:', error);
        if (typeof showNotification === 'function') {
            showNotification('Failed to load land details. Please try again.', 'error');
        } else {
            alert('Failed to load land details. Please try again.');
        }
    } finally {
        if (typeof hideLoadingOverlay === 'function') {
            hideLoadingOverlay();
        }
    }
}

// Populate sell land form with data
function populateSellLandForm(land, clients, employees) {
    // Set land ID
    document.getElementById('sellLandId').value = land.id;
    
    // Populate land details
    document.getElementById('sellLandIdDisplay').textContent = land.id;
    document.getElementById('sellLandName').textContent = land.property_name || 'N/A';
    document.getElementById('sellLandLocation').textContent = land.location || 'N/A';
    document.getElementById('sellLandArea').textContent = land.total_area || 'N/A';
    document.getElementById('sellLandSataPrakar').textContent = land.sata_prakar || 'N/A';
    document.getElementById('sellLandBroker').textContent = land.broker_name || 'N/A';
    
    // Populate client dropdown
    const clientSelect = document.getElementById('sellClient');
    clientSelect.innerHTML = '<option value="">Choose a client...</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.client_name} (${client.mobile_no})`;
        clientSelect.appendChild(option);
    });
    
    // Populate marketing employee dropdown
    const employeeSelect = document.getElementById('sellMarketingEmployee');
    employeeSelect.innerHTML = '<option value="">Choose marketing employee...</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.full_name || employee.username;
        employeeSelect.appendChild(option);
    });
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sellDate').value = today;
    
    // Clear notes
    document.getElementById('sellNotes').value = '';
    
    // Set form to editable mode
    setSellFormReadOnly(false);
    
    // Update modal title and buttons
    const modalTitle = document.querySelector('#sellLandModal .modal-title');
    modalTitle.innerHTML = `<i class="bi bi-cash-coin me-2"></i>Sell Land`;
    
    const modalFooter = document.querySelector('#sellLandModal .modal-footer');
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-success" onclick="processSellLand()">
            <i class="bi bi-cash-coin me-2"></i>Sell Land
        </button>
    `;
}

// Populate sell land form with existing sale data (read-only mode)
function populateSellLandFormWithExistingSale(land, clients, employees, sale, installments) {
    // Set land ID
    document.getElementById('sellLandId').value = land.id;
    
    // Populate land details
    document.getElementById('sellLandIdDisplay').textContent = land.id;
    document.getElementById('sellLandName').textContent = land.property_name || 'N/A';
    document.getElementById('sellLandLocation').textContent = land.location || 'N/A';
    document.getElementById('sellLandArea').textContent = land.total_area || 'N/A';
    document.getElementById('sellLandSataPrakar').textContent = land.sata_prakar || 'N/A';
    document.getElementById('sellLandBroker').textContent = land.broker_name || 'N/A';
    
    // Populate client dropdown
    const clientSelect = document.getElementById('sellClient');
    clientSelect.innerHTML = '<option value="">Choose a client...</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.client_name} (${client.mobile_no})`;
        if (client.id === sale.client_id) {
            option.selected = true;
        }
        clientSelect.appendChild(option);
    });
    
    // Populate marketing employee dropdown
    const employeeSelect = document.getElementById('sellMarketingEmployee');
    employeeSelect.innerHTML = '<option value="">Choose marketing employee...</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.full_name || employee.username;
        if (employee.id === sale.marketing_employee_id) {
            option.selected = true;
        }
        employeeSelect.appendChild(option);
    });
    
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
async function updateExistingSale() {
    const form = document.getElementById('sellLandForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const clientId = formData.get('client_id');
    const marketingEmployeeId = formData.get('marketing_employee_id');
    const saleDate = formData.get('sale_date');
    
    if (!clientId || !marketingEmployeeId || !saleDate) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    // Get installment data
    const installments = getInstallmentData();
    const totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
    
    // Validate installments if any exist
    if (installments.length > 0 && totalPercentage !== 100) {
        showNotification('Total installment percentage must be exactly 100%', 'error');
        return;
    }
    
    const updateData = {
        land_id: currentLandId,
        client_id: clientId,
        marketing_employee_id: marketingEmployeeId,
        sale_date: saleDate,
        notes: formData.get('notes') || '',
        installments: installments,
        total_percentage: totalPercentage
    };
    
    try {
        const response = await fetch('/update-land-sale/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showNotification('Land sale updated successfully!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('sellLandModal'));
            modal.hide();
            window.location.reload();
        } else {
            const errorData = await response.json();
            showNotification(errorData.error || 'Failed to update land sale', 'error');
        }
    } catch (error) {
        console.error('Error updating land sale:', error);
        showNotification('Error updating land sale. Please try again.', 'error');
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
    
    if (!clientId || !marketingEmployeeId || !saleDate) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
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
    
    // Show confirmation dialog
    const confirmMessage = installments.length > 0 
        ? `Are you sure you want to sell this land with ${installments.length} installments?`
        : 'Are you sure you want to sell this land?';
    
    if (confirm(confirmMessage)) {
        processLandSale(saleData);
    }
}

// Process land sale
async function processLandSale(saleData) {
    try {
        showLoadingOverlay();
        
        const response = await fetch('/process-land-sale/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(saleData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(result.message || 'Land sold successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('sellLandModal'));
            modal.hide();
            
            // Refresh page
            window.location.reload();
        } else {
            const errorData = await response.json();
            showNotification(errorData.error || 'Failed to process land sale', 'error');
        }
    } catch (error) {
        console.error('Error processing land sale:', error);
        showNotification('Error processing land sale. Please try again.', 'error');
    } finally {
        hideLoadingOverlay();
    }
}

// ===== INSTALLMENT MANAGEMENT FUNCTIONS =====

// Add a new installment row
function addInstallmentRow() {
    installmentRowCount++;
    const container = document.getElementById('installmentsContainer');
    
    const rowHtml = `
        <div class="installment-row" id="installmentRow${installmentRowCount}">
            <div class="installment-fields">
                <div class="installment-field">
                    <label>Days</label>
                    <input type="number" class="form-control" id="days${installmentRowCount}" placeholder="0" min="0" value="0" oninput="updateDueDate(${installmentRowCount})">
                </div>
                <div class="installment-field">
                    <label>Payment Method</label>
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
                    <input type="number" class="form-control" id="percentage${installmentRowCount}" placeholder="0" min="0" max="100" step="0.01" value="0" oninput="updateTotalPercentage()">
                </div>
                <div class="installment-field">
                    <label>Due Date</label>
                    <input type="date" class="form-control" id="dueDate${installmentRowCount}" readonly>
                </div>
                <div class="installment-field">
                    <button type="button" class="remove-installment-btn" onclick="removeInstallmentRow(${installmentRowCount})" title="Remove Installment">
                        <i class="bi bi-dash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHtml);
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

// Update due date based on days
function updateDueDate(rowId) {
    const daysInput = document.getElementById(`days${rowId}`);
    const dueDateInput = document.getElementById(`dueDate${rowId}`);
    
    if (daysInput && dueDateInput) {
        const days = parseInt(daysInput.value) || 0;
        const today = new Date();
        const dueDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
        
        dueDateInput.value = dueDate.toISOString().split('T')[0];
    }
}

// Update total percentage display
function updateTotalPercentage() {
    const installments = getInstallmentData();
    const totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
    
    const totalElement = document.getElementById('totalPercentage');
    const statusElement = document.getElementById('totalStatus');
    
    if (totalElement) {
        totalElement.textContent = totalPercentage.toFixed(2);
    }
    
    if (statusElement) {
        if (totalPercentage === 100) {
            statusElement.textContent = 'Complete';
            statusElement.className = 'badge bg-success text-white';
        } else if (totalPercentage > 100) {
            statusElement.textContent = 'Over 100%';
            statusElement.className = 'badge bg-danger text-white';
        } else {
            statusElement.textContent = 'Incomplete';
            statusElement.className = 'badge bg-warning text-dark';
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
        const rowId = row.id.replace('installmentRow', '');
        const days = document.getElementById(`days${rowId}`)?.value || 0;
        const paymentMethod = document.getElementById(`paymentMethod${rowId}`)?.value || 'cash';
        const percentage = document.getElementById(`percentage${rowId}`)?.value || 0;
        
        if (percentage > 0) {
            installments.push({
                installment_number: index + 1,
                days: parseInt(days),
                payment_method: paymentMethod,
                percentage: parseFloat(percentage)
            });
        }
    });
    
    return installments;
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
    
    if (totalElement) {
        totalElement.textContent = totalPercentage.toFixed(2);
    }
    
    if (statusElement) {
        statusElement.textContent = 'Complete';
        statusElement.className = 'badge bg-success text-white';
    }
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
    
    // Clear container
    container.innerHTML = '';
    installmentRowCount = 0;
    
    // Convert each read-only row to editable
    readOnlyRows.forEach((row, index) => {
        installmentRowCount++;
        
        // Extract data from read-only row
        const paymentMethodInput = row.querySelector('input[value*="Cash"], input[value*="Cheque"], input[value*="Bank Transfer"], input[value*="UPI"], input[value*="Other"]');
        const percentageInput = row.querySelector('input[type="number"]');
        const dueDateInput = row.querySelector('input[type="date"]');
        
        const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cash';
        const percentage = percentageInput ? percentageInput.value : '';
        const dueDate = dueDateInput ? dueDateInput.value : '';
        
        // Convert display name to value
        const paymentMethodValue = getPaymentMethodValue(paymentMethod);
        
        // Calculate days from due date
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
                        <input type="number" class="form-control" id="days${installmentRowCount}" placeholder="0" min="0" value="${days}" oninput="updateDueDate(${installmentRowCount})">
                    </div>
                    <div class="installment-field">
                        <label>Payment Method</label>
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
                        <input type="number" class="form-control" id="percentage${installmentRowCount}" placeholder="0" min="0" max="100" step="0.01" value="${percentage}" oninput="updateTotalPercentage()">
                    </div>
                    <div class="installment-field">
                        <label>Due Date</label>
                        <input type="date" class="form-control" id="dueDate${installmentRowCount}" value="${dueDate}" readonly>
                    </div>
                    <div class="installment-field">
                        <button type="button" class="remove-installment-btn" onclick="removeInstallmentRow(${installmentRowCount})" title="Remove Installment">
                            <i class="bi bi-dash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', rowHtml);
    });
    
    // Show add button
    const addButton = document.getElementById('addInstallmentBtn');
    if (addButton) {
        addButton.style.display = 'block';
    }
    
    updateTotalPercentage();
}

// Helper functions
function getPaymentMethodValue(displayName) {
    const mapping = {
        'Cash': 'cash',
        'Cheque': 'cheque',
        'Bank Transfer': 'bank_transfer',
        'UPI': 'upi',
        'Other': 'other'
    };
    return mapping[displayName] || 'cash';
}

function getPaymentMethodDisplay(value) {
    const mapping = {
        'cash': 'Cash',
        'cheque': 'Cheque',
        'bank_transfer': 'Bank Transfer',
        'upi': 'UPI',
        'other': 'Other'
    };
    return mapping[value] || 'Cash';
}

function getStatusDisplay(status) {
    const mapping = {
        'pending': 'Pending',
        'paid': 'Paid',
        'overdue': 'Overdue'
    };
    return mapping[status] || 'Pending';
}

function getStatusBadgeClass(status) {
    const mapping = {
        'pending': 'bg-warning text-dark',
        'paid': 'bg-success text-white',
        'overdue': 'bg-danger text-white'
    };
    return mapping[status] || 'bg-warning text-dark';
}

// Make functions globally available
console.log('Assigning showSellLandModal to window object');
window.showSellLandModal = showSellLandModal;
console.log('showSellLandModal assigned to window:', typeof window.showSellLandModal);

// Test function to verify the modal is working
window.testSellLandModal = function() {
    console.log('Test function called - sell land modal is working');
    alert('Sell Land Modal is working! Function is available.');
    return true;
};
window.populateSellLandForm = populateSellLandForm;
window.populateSellLandFormWithExistingSale = populateSellLandFormWithExistingSale;
window.setSellFormReadOnly = setSellFormReadOnly;
window.updateSellModalForExistingSale = updateSellModalForExistingSale;
window.enableSellFormEdit = enableSellFormEdit;
window.updateExistingSale = updateExistingSale;
window.processSellLand = processSellLand;
window.processLandSale = processLandSale;
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
