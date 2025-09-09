// Installments Management Page JavaScript

let currentLandId = null;
let currentInstallmentId = null;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Use data passed from template
    if (window.landData && window.landSaleData && window.installmentsData) {
        currentLandId = window.landData.id;
        displayLandSaleInfo(window.landSaleData);
        displayInstallments(window.installmentsData);
    } else {
        showError('Data not available');
    }
});

// Display land sale information
function displayLandSaleInfo(sale) {
    if (!sale) return;
    
    // Use land data from window.landData
    document.getElementById('landName').textContent = window.landData.name || '-';
    document.getElementById('landLocation').textContent = window.landData.location || '-';
    document.getElementById('clientName').textContent = sale.client_name || '-';
    document.getElementById('clientContact').textContent = sale.client_contact || '-';
    document.getElementById('marketingEmployeeName').textContent = sale.marketing_employee_name || '-';
    document.getElementById('saleDate').textContent = sale.sale_date || '-';
    document.getElementById('saleNotes').textContent = sale.notes || '-';
    
    // Set status badge
    const statusElement = document.getElementById('saleStatus');
    statusElement.textContent = sale.status || '-';
    statusElement.className = `badge badge-${sale.status === 'paid' ? 'paid' : 'pending'}`;
    
    // Show the land sale info card
    document.getElementById('landSaleInfoCard').style.display = 'block';
}

// Display installments list
function displayInstallments(installments) {
    const container = document.getElementById('installmentsList');
    
    if (!installments || installments.length === 0) {
        showNoData('No installments found for this land sale.');
        return;
    }
    
    let html = '';
    
    installments.forEach((installment, index) => {
        const isPaid = installment.status === 'paid';
        const rowClass = isPaid ? 'installment-management-row paid-installment' : 'installment-management-row';
        const inputClass = isPaid ? 'form-control paid-input' : 'form-control';
        
        html += `
            <div class="${rowClass}">
                <div class="installment-management-fields">
                    <div class="installment-management-field">
                        <label>Payment Method</label>
                        <input type="text" class="${inputClass}" value="${getPaymentMethodDisplay(installment.payment_type)}" readonly>
                    </div>
                    <div class="installment-management-field">
                        <label>%</label>
                        <input type="number" class="${inputClass}" value="${installment.percentage}" readonly>
                    </div>
                    <div class="installment-management-field">
                        <label>Due Date</label>
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
    });
    
    container.innerHTML = html;
    container.style.display = 'block';
    hideAllStates();
}

// Process payment for installment
function processPaymentForInstallment(installmentId) {
    console.log('Processing payment for installment ID:', installmentId);
    
    if (!installmentId || installmentId === 'null' || installmentId === 'undefined') {
        showNotification('Invalid installment ID. Please try again.', 'error');
        return;
    }
    
    currentInstallmentId = installmentId;
    console.log('Stored currentInstallmentId:', currentInstallmentId);
    
    // Clear any existing form data
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('rtgsNumber').value = '';
    document.getElementById('fromBank').value = '';
    document.getElementById('utrReference').value = '';
    document.getElementById('ifscCode').value = '';
    document.getElementById('bankName').value = '';
    document.getElementById('chequePhoto').value = '';
    
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    paymentModal.show();
    
    // Ensure proper z-index
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

// Process payment
function processPayment() {
    console.log('Current installment ID:', currentInstallmentId);
    
    if (!currentInstallmentId) {
        showNotification('Installment ID not found. Please close this modal and try clicking the Pay button again.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('payment_date', document.getElementById('paymentDate').value);
    formData.append('rtgs_number', document.getElementById('rtgsNumber').value);
    formData.append('from_bank', document.getElementById('fromBank').value);
    formData.append('utr_reference', document.getElementById('utrReference').value);
    formData.append('ifsc_code', document.getElementById('ifscCode').value);
    formData.append('bank_name', document.getElementById('bankName').value);
    
    const chequePhoto = document.getElementById('chequePhoto').files[0];
    if (chequePhoto) {
        formData.append('cheque_photo', chequePhoto);
    }
    
    fetch(`/installment/${currentInstallmentId}/pay/`, {
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
        if (data.success) {
            showNotification('Payment processed successfully!', 'success');
            
            // Close payment modal
            const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
            if (paymentModal) {
                paymentModal.hide();
            }
            
            // Reload installments data
            loadInstallmentsData();
        } else {
            showNotification(data.message || 'Error processing payment. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Error processing payment:', error);
        showNotification(`Error processing payment: ${error.message}`, 'error');
    });
}

// Show payment details
function showPaymentDetails(installmentId) {
    // This would typically fetch payment details from the server
    // For now, we'll show a placeholder
    const content = `
        <div class="alert alert-info">
            <h6>Payment Details</h6>
            <p>Payment details for installment ID: ${installmentId}</p>
            <p><em>This feature will be implemented to show detailed payment information.</em></p>
        </div>
    `;
    
    document.getElementById('paymentDetailsContent').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
    modal.show();
    
    // Ensure proper z-index
    setTimeout(() => {
        const modalElement = document.getElementById('paymentDetailsModal');
        if (modalElement) {
            modalElement.style.zIndex = '1065';
        }
        const backdrop = document.querySelector('.modal-backdrop:last-child');
        if (backdrop) {
            backdrop.style.zIndex = '1060';
        }
    }, 100);
}

// Utility functions
function getPaymentMethodDisplay(paymentType) {
    const methods = {
        'cash': 'Cash',
        'cheque': 'Cheque',
        'bank_transfer': 'Bank Transfer',
        'upi': 'UPI',
        'other': 'Other'
    };
    return methods[paymentType] || paymentType;
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

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

// State management functions
function showLoading() {
    hideAllStates();
    document.getElementById('loadingState').style.display = 'flex';
}

function showError(message) {
    hideAllStates();
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').style.display = 'flex';
}

function showNoData(message) {
    hideAllStates();
    document.getElementById('noDataMessage').textContent = message;
    document.getElementById('noDataState').style.display = 'flex';
}

function hideAllStates() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('noDataState').style.display = 'none';
    document.getElementById('installmentsList').style.display = 'none';
}

// Make functions globally available
window.processPaymentForInstallment = processPaymentForInstallment;
window.processPayment = processPayment;
window.showPaymentDetails = showPaymentDetails;
