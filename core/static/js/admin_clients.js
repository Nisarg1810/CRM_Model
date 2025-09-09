// Admin Clients Page JavaScript

// Global variables
let currentClientId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Clients page loaded');
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Add client form submission (only if form exists)
    const addClientForm = document.getElementById('addClientForm');
    if (addClientForm) {
        addClientForm.addEventListener('submit', handleAddClient);
    }
    
    // Edit client form submission (only if form exists)
    const editClientForm = document.getElementById('editClientForm');
    if (editClientForm) {
        editClientForm.addEventListener('submit', handleEditClient);
    }
    
    // Search input enter key (only if element exists)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchClients();
        }
    });
    }
    
    // Client type filter change (only if element exists)
    const clientTypeFilter = document.getElementById('clientTypeFilter');
    if (clientTypeFilter) {
        clientTypeFilter.addEventListener('change', function() {
        searchClients();
    });
    }
}

// Show add client modal
function showAddClientModal() {
    console.log('Showing add client modal');
    
    // Reset form
    document.getElementById('addClientForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();
}

// Handle add client form submission
async function handleAddClient(event) {
    event.preventDefault();
    console.log('Adding new client');
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validate form before submission
    if (!validateClientForm(form)) {
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/clients/add/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Client added successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
            modal.hide();
            
            // Check if we're on the inventory page and refresh the client dropdown
            if (typeof window.refreshClientDropdown === 'function') {
                // We're on the inventory page, refresh the client dropdown
                await window.refreshClientDropdown();
            } else {
                // We're on the admin clients page, reload the page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error adding client:', error);
        showNotification('Failed to add client. Please try again.', 'error');
    } finally {
        // Hide loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Edit client
async function editClient(clientId) {
    console.log('Editing client:', clientId);
    currentClientId = clientId;
    
    try {
        // Show loading state in modal
        const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
        modal.show();
        
        // Show loading in modal body
        const modalBody = document.querySelector('#editClientModal .modal-body');
        const originalContent = modalBody.innerHTML;
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading client data...</p>
            </div>
        `;
        
        // Fetch client data
        const response = await fetch(`/api/clients/${clientId}/edit/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Restore original content
            modalBody.innerHTML = originalContent;
            
            // Populate edit form
            populateEditForm(data.client);
            
            // Show success message
            showNotification('Client data loaded successfully!', 'success');
        } else {
            // Restore original content
            modalBody.innerHTML = originalContent;
            showNotification('Error: ' + data.message, 'error');
            modal.hide();
        }
    } catch (error) {
        console.error('Error fetching client data:', error);
        showNotification('Failed to load client data. Please try again.', 'error');
        
        // Hide modal if it's open
        const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
        if (modal) {
            modal.hide();
        }
    }
}

// Populate edit form with client data
function populateEditForm(client) {
    document.getElementById('editClientId').value = client.id;
    document.getElementById('editClientType').value = client.client_type;
    document.getElementById('editSearchPropertyTitle').value = client.search_property_title || '';
    document.getElementById('editClientName').value = client.client_name;
    document.getElementById('editEmail').value = client.email;
    document.getElementById('editMobileNo').value = client.mobile_no;
    document.getElementById('editAnotherMobileNo').value = client.another_mobile_no || '';
    document.getElementById('editWhatsappNo').value = client.whatsapp_no;
    document.getElementById('editPanNo').value = client.pan_no || '';
    document.getElementById('editAdharCardNo').value = client.adhar_card_no || '';
    document.getElementById('editAddress').value = client.address || '';
    document.getElementById('editApproxInvestment').value = client.approx_investment || '';
    document.getElementById('editChoiceInParticularProperty').value = client.choice_in_particular_property || '';
    
    // Format dates for input fields
    document.getElementById('editDob').value = client.dob || '';
    document.getElementById('editAnniversary').value = client.anniversary || '';
    document.getElementById('editAnyEvent').value = client.any_event || '';
    document.getElementById('editRemark').value = client.remark || '';
    
    // Set is_active checkbox
    document.getElementById('editIsActive').checked = client.is_active;
}

// Handle edit client form submission
async function handleEditClient(event) {
    event.preventDefault();
    console.log('Updating client:', currentClientId);
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Validate form before submission
    if (!validateClientForm(form)) {
        return;
    }
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`/api/clients/${currentClientId}/edit/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Client updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
            modal.hide();
            
            // Update the table row with new data
            updateClientRowInTable(currentClientId, formData);
            
            // Reload page after a short delay to show updated client
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating client:', error);
        showNotification('Failed to update client. Please try again.', 'error');
    } finally {
        // Hide loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Delete client
async function deleteClient(clientId) {
    console.log('Deleting client:', clientId);
    
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/${clientId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Client deleted successfully!', 'success');
            
            // Remove client row from table
            const clientRow = document.querySelector(`tr[data-client-id="${clientId}"]`);
            if (clientRow) {
                clientRow.remove();
            }
            
            // Check if table is empty
            const tbody = document.querySelector('#clientsTable tbody');
            if (tbody.children.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="text-muted">
                                <i class="bi bi-people" style="font-size: 48px;"></i>
                                <h5 class="mt-3">No Clients Found</h5>
                                <p>Start by adding your first client.</p>
                                <button class="btn btn-primary" onclick="showAddClientModal()">
                                    <i class="bi bi-plus-circle me-1"></i>Add Client
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        } else {
            showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('Failed to delete client. Please try again.', 'error');
    }
}

// View client details
async function viewClientDetails(clientId) {
    console.log('Viewing client details:', clientId);
    
    try {
        // Show loading state
        document.getElementById('clientDetailsContent').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading client details...</p>
            </div>
        `;
        
        // Show modal first
        const modal = new bootstrap.Modal(document.getElementById('clientDetailsModal'));
        modal.show();
        
        // Fetch detailed client data
        const response = await fetch(`/api/clients/${clientId}/details/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const client = data.client;
            
            const detailsContent = `
                <div class="client-details">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-person me-2"></i>Client Information
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-12">
                                            <strong>Name:</strong> ${client.client_name}
                                        </div>
                                        <div class="col-12">
                                            <strong>Type:</strong> 
                                            <span class="badge bg-info ms-1">${client.client_type_display}</span>
                                        </div>
                                        <div class="col-12">
                                            <strong>Property Title:</strong> ${client.search_property_title}
                                        </div>
                                        <div class="col-12">
                                            <strong>Created:</strong> ${client.created_at}
                                        </div>
                                        <div class="col-12">
                                            <strong>Created By:</strong> ${client.created_by}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-telephone me-2"></i>Contact Information
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-12">
                                            <strong>Email:</strong> 
                                            <a href="mailto:${client.email}" class="text-decoration-none">${client.email}</a>
                                        </div>
                                        <div class="col-12">
                                            <strong>Mobile:</strong> 
                                            <a href="tel:${client.mobile_no}" class="text-decoration-none">${client.mobile_no}</a>
                                        </div>
                                        <div class="col-12">
                                            <strong>Another Mobile:</strong> ${client.another_mobile_no}
                                        </div>
                                        <div class="col-12">
                                            <strong>WhatsApp:</strong> 
                                            <a href="https://wa.me/${client.whatsapp_no}" target="_blank" class="text-decoration-none">
                                                ${client.whatsapp_no} <i class="bi bi-whatsapp text-success"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-card-text me-2"></i>Document Information
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-12">
                                            <strong>PAN No:</strong> ${client.pan_no}
                                        </div>
                                        <div class="col-12">
                                            <strong>Aadhar Card:</strong> ${client.adhar_card_no}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-currency-rupee me-2"></i>Investment Details
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-12">
                                            <strong>Approx Investment:</strong> ${client.approx_investment}
                                        </div>
                                        <div class="col-12">
                                            <strong>Property Choice:</strong> ${client.choice_in_particular_property}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-geo-alt me-2"></i>Address
                                    </h6>
                                    <p class="mb-0">${client.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-4">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-calendar me-2"></i>Important Dates
                                    </h6>
                                    <div class="row g-2">
                                        <div class="col-12">
                                            <strong>DOB:</strong> ${client.dob}
                                        </div>
                                        <div class="col-12">
                                            <strong>Anniversary:</strong> ${client.anniversary}
                                        </div>
                                        <div class="col-12">
                                            <strong>Other Event:</strong> ${client.any_event}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="card border-0 bg-light">
                                <div class="card-body">
                                    <h6 class="card-title text-primary border-bottom pb-2">
                                        <i class="bi bi-chat-text me-2"></i>Remarks
                                    </h6>
                                    <p class="mb-0">${client.remark || 'No remarks added'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('clientDetailsContent').innerHTML = detailsContent;
        } else {
            document.getElementById('clientDetailsContent').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error: ${data.message}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error viewing client details:', error);
        document.getElementById('clientDetailsContent').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Failed to load client details. Please try again.
            </div>
        `;
    }
}

// Search clients
function searchClients() {
    const searchQuery = document.getElementById('searchInput').value;
    const clientType = document.getElementById('clientTypeFilter').value;
    
    // Build URL with search parameters
    const url = new URL(window.location);
    url.searchParams.set('search', searchQuery);
    url.searchParams.set('client_type', clientType);
    
    // Redirect to filtered results
    window.location.href = url.toString();
}

// Clear filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clientTypeFilter').value = '';
    
    // Redirect to unfiltered results
    const url = new URL(window.location);
    url.searchParams.delete('search');
    url.searchParams.delete('client_type');
    
    window.location.href = url.toString();
}

// Get CSRF token
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
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
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Client form validation
function validateClientForm(form) {
    let isValid = true;
    const errors = [];
    
    // Get form elements
    const mobileNo = form.querySelector('input[name="mobile_no"]');
    const anotherMobileNo = form.querySelector('input[name="another_mobile_no"]');
    const whatsappNo = form.querySelector('input[name="whatsapp_no"]');
    const panNo = form.querySelector('input[name="pan_no"]');
    const adharCardNo = form.querySelector('input[name="adhar_card_no"]');
    const email = form.querySelector('input[name="email"]');
    
    // Clear previous error styles
    clearValidationErrors(form);
    
    // Mobile number validation (10 digits)
    if (mobileNo && mobileNo.value) {
        if (!/^\d{10}$/.test(mobileNo.value)) {
            showFieldError(mobileNo, 'Mobile number must be exactly 10 digits.');
            isValid = false;
        }
    }
    
    // Another mobile number validation (10 digits)
    if (anotherMobileNo && anotherMobileNo.value) {
        if (!/^\d{10}$/.test(anotherMobileNo.value)) {
            showFieldError(anotherMobileNo, 'Another mobile number must be exactly 10 digits.');
            isValid = false;
        }
    }
    
    // WhatsApp number validation (10 digits)
    if (whatsappNo && whatsappNo.value) {
        if (!/^\d{10}$/.test(whatsappNo.value)) {
            showFieldError(whatsappNo, 'WhatsApp number must be exactly 10 digits.');
            isValid = false;
        }
    }
    
    // PAN number validation (10 characters: 5 letters, 4 digits, 1 letter)
    if (panNo && panNo.value) {
        if (!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/.test(panNo.value)) {
            showFieldError(panNo, 'PAN number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter).');
            isValid = false;
        } else {
            // Convert to uppercase
            panNo.value = panNo.value.toUpperCase();
        }
    }
    
    // Aadhar card validation (12 digits)
    if (adharCardNo && adharCardNo.value) {
        if (!/^\d{12}$/.test(adharCardNo.value)) {
            showFieldError(adharCardNo, 'Aadhar card number must be exactly 12 digits.');
            isValid = false;
        }
    }
    
    // Email validation (basic)
    if (email && email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            showFieldError(email, 'Please enter a valid email address.');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showNotification('Please correct the validation errors before submitting.', 'error');
    }
    
    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// Clear validation errors
function clearValidationErrors(form) {
    const invalidFields = form.querySelectorAll('.is-invalid');
    invalidFields.forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    const errorMessages = form.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(error => {
        error.remove();
    });
}

// Add real-time validation on input
function addRealTimeValidation() {
    // Mobile number validation
    const mobileInputs = document.querySelectorAll('input[name="mobile_no"], input[name="another_mobile_no"], input[name="whatsapp_no"]');
    mobileInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Only allow digits and limit to 10 characters
            this.value = this.value.replace(/\D/g, '').substring(0, 10);
        });
    });
    
    // PAN number validation
    const panInputs = document.querySelectorAll('input[name="pan_no"]');
    panInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Convert to uppercase and limit to 10 characters
            this.value = this.value.toUpperCase().substring(0, 10);
        });
    });
    
    // Aadhar card validation
    const adharInputs = document.querySelectorAll('input[name="adhar_card_no"]');
    adharInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Only allow digits and limit to 12 characters
            this.value = this.value.replace(/\D/g, '').substring(0, 12);
        });
    });
}

// Initialize real-time validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    addRealTimeValidation();
});

// Update client row in table with new data
function updateClientRowInTable(clientId, formData) {
    const clientRow = document.querySelector(`tr[data-client-id="${clientId}"]`);
    if (clientRow) {
        // Highlight the row to show it was updated
        clientRow.style.backgroundColor = '#d4edda';
        clientRow.style.transition = 'background-color 0.3s ease';
        
        // Update the client name
        const nameCell = clientRow.cells[0];
        const nameElement = nameCell.querySelector('strong');
        if (nameElement) {
            nameElement.textContent = formData.get('client_name');
        }
        
        // Update the client type
        const typeCell = clientRow.cells[1];
        const typeBadge = typeCell.querySelector('.badge');
        if (typeBadge) {
            const typeValue = formData.get('client_type');
            const typeDisplay = {
                'property_owner': 'Property Owner',
                'lead_generation': 'Lead Generation',
                'web_by_reference': 'Web By Reference',
                'direct_visit': 'Direct Visit'
            };
            typeBadge.textContent = typeDisplay[typeValue] || typeValue;
        }
        
        // Update email
        if (clientRow.cells[2]) {
            clientRow.cells[2].textContent = formData.get('email');
        }
        
        // Update mobile
        if (clientRow.cells[3]) {
            clientRow.cells[3].textContent = formData.get('mobile_no');
        }
        
        // Update WhatsApp
        if (clientRow.cells[4]) {
            clientRow.cells[4].textContent = formData.get('whatsapp_no');
        }
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            clientRow.style.backgroundColor = '';
        }, 3000);
    }
}

// Export functions for global access
window.showAddClientModal = showAddClientModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewClientDetails = viewClientDetails;
window.searchClients = searchClients;
window.clearFilters = clearFilters;
