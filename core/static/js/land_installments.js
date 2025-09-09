// Enhanced Land Installments JavaScript with Real API Integration

document.addEventListener('DOMContentLoaded', function() {
    initializeInstallmentsPage();
});

function initializeInstallmentsPage() {
    setupFilterEventListeners();
    setupModalEventListeners();
    setupActionButtonListeners();
    updateInstallmentsCount();
}

// Setup filter event listeners
function setupFilterEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const landFilter = document.getElementById('landFilter');
    const clientFilter = document.getElementById('clientFilter');
    const employeeFilter = document.getElementById('employeeFilter');
    const searchInput = document.getElementById('searchInput');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const exportDataBtn = document.getElementById('exportData');

    // Add oninput event listeners for real-time filtering
    if (statusFilter) statusFilter.addEventListener('change', applyInstallmentFilters);
    if (landFilter) landFilter.addEventListener('change', applyInstallmentFilters);
    if (clientFilter) clientFilter.addEventListener('change', applyInstallmentFilters);
    if (employeeFilter) employeeFilter.addEventListener('change', applyInstallmentFilters);
    if (searchInput) searchInput.addEventListener('input', applyInstallmentFilters);
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyInstallmentFilters);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearInstallmentFilters);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportInstallmentData);
}

// Setup action button listeners using event delegation
function setupActionButtonListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-action]')) {
            const button = e.target.closest('[data-action]');
            const action = button.getAttribute('data-action');
            const installmentId = button.getAttribute('data-installment-id');
            
            switch(action) {
                case 'view':
                    viewInstallmentDetails(installmentId);
                    break;
                case 'process-payment':
                    openProcessPaymentModal(installmentId);
                    break;
                case 'pay':
                    processPayment(installmentId);
                    break;
                case 'reminder':
                    sendReminder(installmentId);
                    break;
            }
        }
    });
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Process payment form submission
    const processPaymentForm = document.getElementById('processPaymentForm');
    if (processPaymentForm) {
        processPaymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProcessPayment();
        });
    }

    // New Process payment form submission
    const processPaymentFormNew = document.getElementById('processPaymentFormNew');
    if (processPaymentFormNew) {
        processPaymentFormNew.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSubmitProcessPayment();
        });
    }

    // Reminder form submission
    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) {
        reminderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateReminder();
        });
    }

    // Global reminder form submission
    const globalReminderForm = document.getElementById('globalReminderForm');
    if (globalReminderForm) {
        globalReminderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCreateGlobalReminder();
        });
    }

    // Set today's date as default for payment date
    const today = new Date().toISOString().split('T')[0];
    const paidDateInput = document.getElementById('paidDate');
    if (paidDateInput) {
        paidDateInput.value = today;
    }

    // Set today's date as default for process payment date
    const processPaymentDateInput = document.getElementById('processPaymentDate');
    if (processPaymentDateInput) {
        processPaymentDateInput.value = today;
    }
}

// Apply filters to installments table
function applyInstallmentFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const landFilter = document.getElementById('landFilter').value;
    const clientFilter = document.getElementById('clientFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const tableRows = document.querySelectorAll('#installmentsTableBody tr[data-installment-id]');
    let visibleCount = 0;

    tableRows.forEach(row => {
        let showRow = true;

        // Status filter
        if (statusFilter) {
            const statusCell = row.querySelector('td:nth-child(7)');
            if (statusCell) {
                const statusBadge = statusCell.querySelector('.badge');
                const rowStatus = getRowStatus(statusBadge);
                if (statusFilter !== rowStatus) {
                    showRow = false;
                }
            } else {
                showRow = false;
            }
        }

        // Land filter
        if (landFilter && showRow) {
            const landCell = row.querySelector('td:nth-child(2)');
            if (landCell) {
                // Get the selected land name from the dropdown
                const selectedLandOption = document.querySelector(`#landFilter option[value="${landFilter}"]`);
                const selectedLandName = selectedLandOption ? selectedLandOption.textContent.trim() : '';
                
                // Compare with the actual land name in the cell (first line of the cell content)
                const cellLandName = landCell.querySelector('strong') ? landCell.querySelector('strong').textContent.trim() : landCell.textContent.trim();
                
                if (selectedLandName && cellLandName !== selectedLandName) {
                    showRow = false;
                }
            } else {
                showRow = false;
            }
        }

        // Client filter
        if (clientFilter && showRow) {
            const clientCell = row.querySelector('td:nth-child(3)');
            if (clientCell) {
                // Get the selected client name from the dropdown
                const selectedClientOption = document.querySelector(`#clientFilter option[value="${clientFilter}"]`);
                const selectedClientName = selectedClientOption ? selectedClientOption.textContent.trim() : '';
                
                // Compare with the actual client name in the cell (first line of the cell content)
                const cellClientName = clientCell.querySelector('strong') ? clientCell.querySelector('strong').textContent.trim() : clientCell.textContent.trim();
                
                if (selectedClientName && cellClientName !== selectedClientName) {
                    showRow = false;
                }
            } else {
                showRow = false;
            }
        }

        // Employee filter
        if (employeeFilter && showRow) {
            const employeeCell = row.querySelector('td:nth-child(8)');
            if (employeeCell) {
                // Get the selected employee name from the dropdown
                const selectedEmployeeOption = document.querySelector(`#employeeFilter option[value="${employeeFilter}"]`);
                const selectedEmployeeName = selectedEmployeeOption ? selectedEmployeeOption.textContent.trim() : '';
                
                // Compare with the actual employee name in the cell
                const cellEmployeeName = employeeCell.textContent.trim();
                
                if (selectedEmployeeName && cellEmployeeName !== selectedEmployeeName) {
                    showRow = false;
                }
            } else {
                showRow = false;
            }
        }

        // Search filter
        if (searchTerm && showRow) {
            const rowText = row.textContent.toLowerCase();
            if (!rowText.includes(searchTerm)) {
                showRow = false;
            }
        }

        // Show/hide row
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });

    // Update count
    document.getElementById('installmentsCount').textContent = visibleCount;

    // Show/hide empty state
    toggleEmptyState(visibleCount === 0);
}

// Clear all filters
function clearInstallmentFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('landFilter').value = '';
    document.getElementById('clientFilter').value = '';
    document.getElementById('employeeFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    // Show all rows
    const tableRows = document.querySelectorAll('#installmentsTableBody tr[data-installment-id]');
    tableRows.forEach(row => {
        row.style.display = '';
    });

    // Update count
    updateInstallmentsCount();
    toggleEmptyState(false);
}

// Get status from badge element
function getRowStatus(statusBadge) {
    if (!statusBadge) return '';
    
    const badgeText = statusBadge.textContent.trim().toLowerCase();
    if (badgeText.includes('overdue')) return 'overdue';
    if (badgeText.includes('pending')) return 'pending';
    if (badgeText.includes('paid')) return 'paid';
    return '';
}

// Update installments count
function updateInstallmentsCount() {
    const totalRows = document.querySelectorAll('#installmentsTableBody tr[data-installment-id]').length;
    document.getElementById('installmentsCount').textContent = totalRows;
}

// Toggle empty state display
function toggleEmptyState(show) {
    const emptyRow = document.querySelector('#installmentsTableBody tr td[colspan]');
    if (emptyRow) {
        emptyRow.parentElement.style.display = show ? '' : 'none';
    }
}

// View installment payment details using API
function viewInstallmentDetails(installmentId) {
    // Show loading state
    showLoadingOverlay();
    
    // Fetch payment details from API
    fetch(`/installment/${installmentId}/payment-details/`, {
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
            const paymentDetails = data.payment_details;
            
            // Update modal title with installment number
            document.getElementById('installmentNumber').textContent = paymentDetails.installment_number;
            
            let paymentDetailsHtml = '';
            
            // Check if this is a detailed payment or simple mark-as-paid
            if (paymentDetails.is_detailed_payment) {
                // Show full detailed payment information
                paymentDetailsHtml = `
                    <!-- Payment Summary Section -->
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-info-circle me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Payment Summary</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Installment Number:</span>
                                        <span class="detail-value">${paymentDetails.installment_number}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Payment Method:</span>
                                        <span class="detail-value">${paymentDetails.payment_method}</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Received Date:</span>
                                        <span class="detail-value">${paymentDetails.received_date ? new Date(paymentDetails.received_date).toLocaleDateString() : 'Not received'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Received By:</span>
                                        <span class="detail-value">${paymentDetails.received_by || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Information Section -->
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-credit-card me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Payment Information</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">RTGS Number:</span>
                                        <span class="detail-value">${paymentDetails.rtgs_number || '-'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">From Bank:</span>
                                        <span class="detail-value">${paymentDetails.from_bank || '-'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">UTR Reference:</span>
                                        <span class="detail-value">${paymentDetails.utr_reference || '-'}</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">IFSC Code:</span>
                                        <span class="detail-value">${paymentDetails.ifsc_code || '-'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Bank Name:</span>
                                        <span class="detail-value">${paymentDetails.bank_name || '-'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Payment Reference:</span>
                                        <span class="detail-value">${paymentDetails.payment_reference || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Remark Section -->
                    ${paymentDetails.remark ? `
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-chat-text me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Payment Remark</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded">
                            <div class="remark-content">
                                <p class="mb-0 text-muted">${paymentDetails.remark}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    ${paymentDetails.cheque_photo ? `
                    <!-- Cheque Photo Section -->
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-image me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Cheque Photo</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded text-center">
                            <div class="cheque-photo-container mb-3">
                                <img src="${paymentDetails.cheque_photo}" alt="Cheque Photo" class="img-fluid border rounded" style="max-width: 100%; max-height: 400px;">
                            </div>
                            <div class="cheque-actions">
                                <a href="${paymentDetails.cheque_photo}" download class="btn btn-primary btn-sm me-2">
                                    <i class="bi bi-download me-1"></i>Download Photo
                                </a>
                                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="viewFullSize('${paymentDetails.cheque_photo}')">
                                    <i class="bi bi-arrows-fullscreen me-1"></i>View Full Size
                                </button>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                `;
            } else {
                // Show only basic information and remark for mark-as-paid installments
                paymentDetailsHtml = `
                    <!-- Basic Payment Info Section -->
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-info-circle me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Payment Summary</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Installment Number:</span>
                                        <span class="detail-value">${paymentDetails.installment_number}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Payment Method:</span>
                                        <span class="detail-value">${paymentDetails.payment_method}</span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Received Date:</span>
                                        <span class="detail-value">${paymentDetails.received_date ? new Date(paymentDetails.received_date).toLocaleDateString() : 'Not received'}</span>
                                    </div>
                                    <div class="detail-item mb-2">
                                        <span class="detail-label">Received By:</span>
                                        <span class="detail-value">${paymentDetails.received_by || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Remark Section (Main content for mark-as-paid) -->
                    <div class="payment-section mb-4">
                        <div class="section-header d-flex align-items-center mb-3">
                            <i class="bi bi-chat-text me-2 text-primary"></i>
                            <h6 class="mb-0 text-primary">Payment Remark</h6>
                        </div>
                        <div class="section-content bg-light p-3 rounded">
                            <div class="remark-content">
                                ${paymentDetails.remark ? 
                                    `<p class="mb-0 text-dark">${paymentDetails.remark}</p>` : 
                                    `<p class="mb-0 text-muted fst-italic">No remark provided</p>`
                                }
                            </div>
                        </div>
                    </div>
                `;
            }

            document.getElementById('paymentDetailsModalBody').innerHTML = paymentDetailsHtml;
            
            const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
            modal.show();
        } else {
            showNotification(data.message || 'Error loading payment details', 'error');
        }
    })
    .catch(error => {
        hideLoadingOverlay();
        console.error('Error loading payment details:', error);
        showNotification('Error loading payment details', 'error');
    });
}

// Function to view full size image
function viewFullSize(imageUrl) {
    // Create a modal to display the full-size image
    const fullSizeModal = document.createElement('div');
    fullSizeModal.className = 'modal fade';
    fullSizeModal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Cheque Photo - Full Size</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${imageUrl}" alt="Full Size Cheque Photo" class="img-fluid">
                </div>
                <div class="modal-footer">
                    <a href="${imageUrl}" download class="btn btn-primary">
                        <i class="bi bi-download me-1"></i>Download
                    </a>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(fullSizeModal);
    const modal = new bootstrap.Modal(fullSizeModal);
    modal.show();
    
    // Remove modal from DOM when hidden
    fullSizeModal.addEventListener('hidden.bs.modal', function () {
        document.body.removeChild(fullSizeModal);
    });
}

// Open Process Payment Modal with installment details
function openProcessPaymentModal(installmentId) {
    // Find the installment row to get details
    const installmentRow = document.querySelector(`tr[data-installment-id="${installmentId}"]`);
    if (!installmentRow) {
        showNotification('Installment not found', 'error');
        return;
    }

    // Extract installment details from the row
    const landName = installmentRow.querySelector('td:nth-child(2) strong').textContent.trim();
    const clientName = installmentRow.querySelector('td:nth-child(3) strong').textContent.trim();
    const percentage = installmentRow.querySelector('td:nth-child(4)').textContent.trim();
    const dueDate = installmentRow.querySelector('td:nth-child(5)').textContent.trim();

    // Set installment ID in modal
    document.getElementById('processPaymentInstallmentId').value = installmentId;
    
    // Populate installment information in modal
    document.getElementById('processPaymentLandName').textContent = landName;
    document.getElementById('processPaymentClientName').textContent = clientName;
    document.getElementById('processPaymentPercentage').textContent = percentage.replace('%', '');
    document.getElementById('processPaymentDueDate').textContent = dueDate;
    
    // Clear all form fields
    clearProcessPaymentForm();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('processPaymentDate').value = today;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('processPaymentModalNew'));
    modal.show();
}

// Clear process payment form
function clearProcessPaymentForm() {
    document.getElementById('processPaymentDate').value = '';
    document.getElementById('processRtgsNumber').value = '';
    document.getElementById('processFromBank').value = '';
    document.getElementById('processUtrReference').value = '';
    document.getElementById('processIfscCode').value = '';
    document.getElementById('processBankName').value = '';
    document.getElementById('processPaymentRemark').value = '';
    
    // Clear file input and preview
    const fileInput = document.getElementById('processPaymentPhoto');
    if (fileInput) {
        fileInput.value = '';
    }
    const preview = document.getElementById('processPaymentPhotoPreview');
    if (preview) {
        preview.style.display = 'none';
    }
}

// Handle process payment form submission with comprehensive data
function submitProcessPayment() {
    const installmentId = document.getElementById('processPaymentInstallmentId').value;
    const paymentDate = document.getElementById('processPaymentDate').value;
    const rtgsNumber = document.getElementById('processRtgsNumber').value;
    const fromBank = document.getElementById('processFromBank').value;
    const utrReference = document.getElementById('processUtrReference').value;
    const ifscCode = document.getElementById('processIfscCode').value;
    const bankName = document.getElementById('processBankName').value;
    const remark = document.getElementById('processPaymentRemark').value;
    const paymentPhoto = document.getElementById('processPaymentPhoto').files[0];

    // Validate required fields
    if (!paymentDate || !remark.trim()) {
        showNotification('Please fill all required fields (Payment Date and Remarks)', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#processPaymentModalNew .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Processing...';
    submitBtn.disabled = true;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('installment_id', installmentId);
    formData.append('payment_date', paymentDate);
    formData.append('rtgs_number', rtgsNumber);
    formData.append('from_bank', fromBank);
    formData.append('utr_reference', utrReference);
    formData.append('ifsc_code', ifscCode);
    formData.append('bank_name', bankName);
    formData.append('remark', remark);
    
    if (paymentPhoto) {
        formData.append('payment_photo', paymentPhoto);
    }

    // Make API call to process payment
    fetch(`/api/installments/${installmentId}/process-payment/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showNotification('Payment processed successfully', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('processPaymentModalNew'));
            modal.hide();
            
            // Refresh page to show updated data
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Error processing payment', 'error');
        }
    })
    .catch(error => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        console.error('Error:', error);
        showNotification('Error processing payment', 'error');
    });
}

// Handle submit process payment (wrapper function)
function handleSubmitProcessPayment() {
    submitProcessPayment();
}

// Preview payment photo before upload
function previewPaymentPhoto(input) {
    const preview = document.getElementById('processPaymentPhotoPreview');
    const previewImage = document.getElementById('processPreviewImage');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select a valid image file', 'error');
            input.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('File size must be less than 5MB', 'error');
            input.value = '';
            return;
        }
        
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

// Remove payment photo preview
function removePaymentPhoto() {
    document.getElementById('processPaymentPhoto').value = '';
    document.getElementById('processPaymentPhotoPreview').style.display = 'none';
}

// Process payment for installment (existing function for mark as paid)
function processPayment(installmentId) {
    // Set installment ID in modal
    document.getElementById('paymentInstallmentId').value = installmentId;
    
    // Clear remark field
    document.getElementById('paymentRemark').value = '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('processPaymentModal'));
    modal.show();
}

// Handle process payment form submission with real API call
function handleProcessPayment() {
    const installmentId = document.getElementById('paymentInstallmentId').value;
    const remark = document.getElementById('paymentRemark').value;

    if (!remark.trim()) {
        showNotification('Please enter a remark', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#processPaymentForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Processing...';
    submitBtn.disabled = true;

    // Create simple data object for mark as paid
    const data = {
        installment_id: installmentId,
        remark: remark
    };

    // Make API call to mark as paid
    fetch(`/api/installments/${installmentId}/mark-paid/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showNotification('Installment marked as paid successfully', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('processPaymentModal'));
            modal.hide();
            
            // Refresh page to show updated data
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification(data.message || 'Error marking installment as paid', 'error');
        }
    })
    .catch(error => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        console.error('Error:', error);
        showNotification('Error marking installment as paid', 'error');
    });
}

// Preview cheque photo before upload
function previewChequePhoto(input) {
    const preview = document.getElementById('chequePhotoPreview');
    const previewImage = document.getElementById('previewImage');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            preview.style.display = 'block';
        };
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
    }
}

// Remove cheque photo preview
function removeChequePhoto() {
    document.getElementById('chequePhoto').value = '';
    document.getElementById('chequePhotoPreview').style.display = 'none';
}

// Send reminder for installment
function sendReminder(installmentId) {
    // Set installment ID in modal
    document.getElementById('reminderInstallmentId').value = installmentId;
    
    // Clear form fields
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderDescription').value = '';
    document.getElementById('reminderTime').value = '';
    document.getElementById('reminderPriority').value = 'medium';
    
    // Set default values
    document.getElementById('reminderTitle').value = `Payment Reminder - Installment #${installmentId}`;
    document.getElementById('reminderDescription').value = "Follow up on installment payment with client.";
    
    // Set default reminder time to tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    document.getElementById('reminderTime').value = tomorrow.toISOString().slice(0, 16);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
    modal.show();
}

// Handle create reminder form submission
function handleCreateReminder() {
    const installmentId = document.getElementById('reminderInstallmentId').value;
    const title = document.getElementById('reminderTitle').value;
    const description = document.getElementById('reminderDescription').value;
    const reminderTime = document.getElementById('reminderTime').value;
    const priority = document.getElementById('reminderPriority').value;

    if (!title.trim() || !description.trim() || !reminderTime) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#reminderForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Creating...';
    submitBtn.disabled = true;

    // Create data object for reminder
    const data = {
        title: title,
        description: description,
        reminder_time: reminderTime,
        priority: priority,
        installment_id: installmentId || null
    };

    // Make API call to create reminder
    fetch('/api/reminders/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showNotification('Reminder created successfully', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('reminderModal'));
            modal.hide();
        } else {
            showNotification(data.message || 'Error creating reminder', 'error');
        }
    })
    .catch(error => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        console.error('Error:', error);
        showNotification('Error creating reminder', 'error');
    });
}

// Handle create global reminder form submission
function handleCreateGlobalReminder() {
    const title = document.getElementById('globalReminderTitle').value;
    const description = document.getElementById('globalReminderDescription').value;
    const reminderTime = document.getElementById('globalReminderTime').value;
    const priority = document.getElementById('globalReminderPriority').value;

    if (!title.trim() || !description.trim() || !reminderTime) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#globalReminderForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Creating...';
    submitBtn.disabled = true;

    // Create data object for global reminder
    const data = {
        title: title,
        description: description,
        reminder_time: reminderTime,
        priority: priority,
        installment_id: null
    };

    // Make API call to create reminder
    fetch('/api/reminders/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showNotification('Global reminder created successfully', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('globalReminderModal'));
            modal.hide();
            
            // Clear form
            document.getElementById('globalReminderTitle').value = '';
            document.getElementById('globalReminderDescription').value = '';
            document.getElementById('globalReminderTime').value = '';
            document.getElementById('globalReminderPriority').value = 'medium';
        } else {
            showNotification(data.message || 'Error creating global reminder', 'error');
        }
    })
    .catch(error => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        console.error('Error:', error);
        showNotification('Error creating global reminder', 'error');
    });
}

// Export installment data
function exportInstallmentData() {
    showNotification('Export functionality will be implemented soon', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type;
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility functions
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfToken) {
        return csrfToken.value;
    }
    
    // Fallback: get from meta tag
    const metaToken = document.querySelector('meta[name="csrf-token"]');
    if (metaToken) {
        return metaToken.getAttribute('content');
    }
    
    // Fallback: get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    
    return '';
}

function getStatusBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'paid': return 'success';
        case 'pending': return 'warning';
        case 'overdue': return 'danger';
        case 'cancelled': return 'secondary';
        default: return 'info';
    }
}

function showLoadingOverlay() {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Global functions for onclick handlers (keeping for backward compatibility)
window.viewInstallmentDetails = viewInstallmentDetails;
window.markAsPaid = markAsPaid;
window.sendReminder = sendReminder;
