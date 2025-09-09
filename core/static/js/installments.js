/*
 * INSTALLMENTS MODAL - JavaScript Functionality
 * 
 * This file handles all interactive functionality for the installments modal including:
 * - Dynamic installment rows
 * - Real-time calculations
 * - Form validation
 * - Payment type management
 */

// Global variables
let installmentRowCount = 0;
let totalAmount = 0;
let autoCalculateTimeout = null;

// Initialize installments modal
function initializeInstallmentsModal() {
    console.log('Initializing installments modal...');
    
    // Start with 0 installments - user can add as needed
    // No default rows added
    
    // Update totals
    updateTotals();
}

// Add new installment row
function addInstallmentRow() {
    installmentRowCount++;
    const container = document.getElementById('installmentRowsContainer');
    
    const rowHTML = `
        <div class="installment-row" data-row-id="${installmentRowCount}">
            <div class="row g-3 align-items-center mb-3">
                <div class="col-md-2">
                    <label class="form-label">Days</label>
                    <input type="number" class="form-control installment-days" placeholder="0" min="0" oninput="updateDateFromDays(this); updateTotals()" onchange="updateDateFromDays(this); updateTotals()">
                </div>
                <div class="col-md-2">
                    <label class="form-label">Payment Type</label>
                    <select class="form-control installment-type" onchange="updateTotals()">
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="online">Online</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Percentage</label>
                    <div class="input-group">
                        <input type="number" class="form-control installment-percentage" placeholder="0" min="0" max="100" step="0.01" oninput="debouncedAutoCalculatePercentage(); updateTotals()" onchange="autoCalculatePercentage(); updateTotals()">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Date</label>
                    <div class="input-group">
                        <input type="date" class="form-control installment-date" onchange="updateTotals()">
                        <span class="input-group-text">
                            <i class="bi bi-calendar"></i>
                        </span>
                    </div>
                </div>
                <div class="col-md-2">
                    <label class="form-label">&nbsp;</label>
                    <button type="button" class="btn btn-danger btn-sm w-100" onclick="removeInstallmentRow(${installmentRowCount})" title="Remove Installment">
                        <i class="bi bi-dash-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    
    // Set default date to today
    const dateInput = container.querySelector(`[data-row-id="${installmentRowCount}"] .installment-date`);
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    updateTotals();
}

// Remove installment row
function removeInstallmentRow(rowId) {
    const row = document.querySelector(`[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        updateTotals();
    }
}

// Update date based on days from today
function updateDateFromDays(daysInput) {
    const days = parseInt(daysInput.value) || 0;
    const row = daysInput.closest('.installment-row');
    const dateInput = row.querySelector('.installment-date');
    
    if (dateInput) {
        if (days >= 0) {
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + days);
            
            const formattedDate = futureDate.toISOString().split('T')[0];
            dateInput.value = formattedDate;
        } else {
            // If days is negative or invalid, set to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }
}

// Debounced auto-calculate percentage function
function debouncedAutoCalculatePercentage() {
    // Clear existing timeout
    if (autoCalculateTimeout) {
        clearTimeout(autoCalculateTimeout);
    }
    
    // Set new timeout for 300ms delay
    autoCalculateTimeout = setTimeout(() => {
        autoCalculatePercentage();
    }, 300);
}

// Auto-calculate percentage to make total 100%
function autoCalculatePercentage() {
    const rows = document.querySelectorAll('.installment-row');
    const totalRows = rows.length;
    
    if (totalRows <= 1) return; // No auto-calculation for single row
    
    let totalPercentage = 0;
    let emptyRows = [];
    let filledRows = [];
    let currentEditingRow = null;
    
    // Find which row is currently being edited (has focus)
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('installment-percentage')) {
        currentEditingRow = activeElement.closest('.installment-row');
    }
    
    // Calculate current total and identify empty/filled rows
    rows.forEach((row, index) => {
        const percentage = parseFloat(row.querySelector('.installment-percentage').value) || 0;
        if (percentage > 0) {
            totalPercentage += percentage;
            filledRows.push({ row, percentage, index });
        } else {
            emptyRows.push({ row, index });
        }
    });
    
    // If there are empty rows and total is less than 100%, distribute remaining percentage
    if (emptyRows.length > 0 && totalPercentage < 100) {
        const remainingPercentage = 100 - totalPercentage;
        const percentagePerEmptyRow = remainingPercentage / emptyRows.length;
        
        emptyRows.forEach(({ row }) => {
            // Don't auto-calculate the row that's currently being edited
            if (row !== currentEditingRow) {
                const percentageInput = row.querySelector('.installment-percentage');
                if (percentageInput) {
                    percentageInput.value = percentagePerEmptyRow.toFixed(2);
                    // Add visual feedback for auto-calculated values
                    percentageInput.classList.add('auto-calculated');
                    setTimeout(() => {
                        percentageInput.classList.remove('auto-calculated');
                    }, 2000);
                }
            }
        });
    }
}

// Update totals and validation
function updateTotals() {
    const rows = document.querySelectorAll('.installment-row');
    let totalPercentage = 0;
    let hasValidRows = false;
    
    rows.forEach(row => {
        const percentage = parseFloat(row.querySelector('.installment-percentage').value) || 0;
        
        if (percentage > 0) {
            hasValidRows = true;
            totalPercentage += percentage;
        }
    });
    
    // Update total display
    const totalPercentageElement = document.getElementById('totalPercentage');
    const totalStatusElement = document.getElementById('totalStatus');
    
    if (totalPercentageElement) {
        totalPercentageElement.textContent = `Total: ${totalPercentage.toFixed(2)}%`;
    }
    
    if (totalStatusElement) {
        if (Math.abs(totalPercentage - 100) < 0.01) {
            totalStatusElement.textContent = '(Complete)';
            totalStatusElement.className = 'ms-2 text-success fw-bold';
        } else if (totalPercentage > 100) {
            totalStatusElement.textContent = '(Over 100%)';
            totalStatusElement.className = 'ms-2 text-danger fw-bold';
        } else {
            totalStatusElement.textContent = '(Incomplete)';
            totalStatusElement.className = 'ms-2 text-warning fw-bold';
        }
    }
    
    // Update footer styling
    const footer = document.querySelector('.installments-footer');
    if (footer) {
        if (Math.abs(totalPercentage - 100) < 0.01) {
            footer.className = 'installments-footer complete';
        } else if (totalPercentage > 100) {
            footer.className = 'installments-footer over-complete';
        } else {
            footer.className = 'installments-footer incomplete';
        }
    }
}



// Validate installments before processing
function validateInstallments() {
    const rows = document.querySelectorAll('.installment-row');
    let totalPercentage = 0;
    let hasValidRows = false;
    let errors = [];
    
    rows.forEach((row, index) => {
        const days = row.querySelector('.installment-days').value;
        const percentage = parseFloat(row.querySelector('.installment-percentage').value) || 0;
        const date = row.querySelector('.installment-date').value;
        
        if (percentage > 0) {
            hasValidRows = true;
            totalPercentage += percentage;
            
            // Validate individual row
            if (!date) {
                errors.push(`Row ${index + 1}: Date is required`);
            }
            
            if (percentage > 100) {
                errors.push(`Row ${index + 1}: Percentage cannot exceed 100%`);
            }
            
            if (percentage < 0) {
                errors.push(`Row ${index + 1}: Percentage cannot be negative`);
            }
        }
    });
    
    if (!hasValidRows) {
        errors.push('At least one installment must be defined');
    }
    
    // Strict validation: Total must be exactly 100%
    if (hasValidRows && Math.abs(totalPercentage - 100) > 0.01) {
        if (totalPercentage < 100) {
            errors.push(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}% - missing ${(100 - totalPercentage).toFixed(2)}%)`);
        } else {
            errors.push(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(2)}% - exceeds by ${(totalPercentage - 100).toFixed(2)}%)`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        totalPercentage: totalPercentage
    };
}

// Get installments data for processing
function getInstallmentsData() {
    const rows = document.querySelectorAll('.installment-row');
    const installments = [];
    
    rows.forEach((row, index) => {
        const days = parseInt(row.querySelector('.installment-days').value) || 0;
        const type = row.querySelector('.installment-type').value;
        const percentage = parseFloat(row.querySelector('.installment-percentage').value) || 0;
        const date = row.querySelector('.installment-date').value;
        
        if (percentage > 0) {
            installments.push({
                installment_number: index + 1,
                days: days,
                payment_type: type,
                percentage: percentage,
                due_date: date
            });
        }
    });
    
    return installments;
}

// Export functions for global access
window.addInstallmentRow = addInstallmentRow;
window.removeInstallmentRow = removeInstallmentRow;
window.updateTotals = updateTotals;
window.updateDateFromDays = updateDateFromDays;
window.autoCalculatePercentage = autoCalculatePercentage;
window.debouncedAutoCalculatePercentage = debouncedAutoCalculatePercentage;
window.validateInstallments = validateInstallments;
window.getInstallmentsData = getInstallmentsData;
window.initializeInstallmentsModal = initializeInstallmentsModal;
