// Sata Prakar Management JavaScript
class SataPrakarManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupSearch();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('sataSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSata(e.target.value);
            });
        }
    }
    
    setupSearch() {
        // Initialize search functionality
        console.log('Search functionality initialized');
    }
    
    filterSata(searchTerm) {
        const sataRows = document.querySelectorAll('.sata-row');
        const searchLower = searchTerm.toLowerCase();
        
        sataRows.forEach(row => {
            const sataName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            if (sataName.includes(searchLower)) {
                row.classList.remove('filtered');
            } else {
                row.classList.add('filtered');
            }
        });
    }
    
    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.alert');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type} alert-dismissible fade show`;
        messageElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageElement);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!token) {
            console.error('CSRF token not found');
            return '';
        }
        return token.value;
    }
}

// Global functions for modal operations
function openAddSataModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSataModal'));
    modal.show();
    
    // Reset form
    document.getElementById('addSataForm').reset();
    
    // Add Enter key event listener for the input field
    const sataNameInput = document.getElementById('sataName');
    sataNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            submitSata(); // Call the submit function
        }
    });
    
    // Focus on the input field
    setTimeout(() => {
        sataNameInput.focus();
    }, 500);
}

function submitSata() {
    const form = document.getElementById('addSataForm');
    const formData = new FormData(form);
    
    // Validate form
    const sataName = formData.get('sata_name');
    
    if (!sataName || !sataName.trim()) {
        sataManager.showMessage('Please enter a Sata Prakar name', 'danger');
        return;
    }
    
    // Show loading
    sataManager.showLoading();
    
    fetch('/add_sata_prakar/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': sataManager.getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            sataManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSataModal'));
            modal.hide();
            
            // Refresh page after 1 second
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            sataManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        sataManager.showMessage('An error occurred while adding the Sata Prakar', 'danger');
    })
    .finally(() => {
        sataManager.hideLoading();
    });
}

function editSata(sataId) {
    console.log('editSata called with ID:', sataId);
    
    if (!sataId) {
        sataManager.showMessage('Invalid Sata Prakar ID', 'danger');
        return;
    }
    
    // Show loading
    sataManager.showLoading();
    
    fetch(`/get_sata_prakar/${sataId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': sataManager.getCSRFToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Edit data received:', data);
        if (data.success && data.sata) {
            // Populate edit form
            const editIdField = document.getElementById('editSataId');
            const editNameField = document.getElementById('editSataName');
            
            if (editIdField && editNameField) {
                editIdField.value = data.sata.id;
                editNameField.value = data.sata.name;
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('editSataModal'));
                modal.show();
                
                // Add Enter key event listener for the edit input field
                editNameField.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        updateSata(); // Call the update function
                    }
                });
                
                // Focus on the input field
                setTimeout(() => {
                    editNameField.focus();
                }, 500);
            } else {
                throw new Error('Edit form fields not found');
            }
        } else {
            throw new Error(data.message || 'Failed to load Sata Prakar data');
        }
    })
    .catch(error => {
        console.error('Error in editSata:', error);
        sataManager.showMessage(`Error loading Sata Prakar: ${error.message}`, 'danger');
    })
    .finally(() => {
        sataManager.hideLoading();
    });
}

function updateSata() {
    console.log('updateSata called');
    
    const form = document.getElementById('editSataForm');
    if (!form) {
        sataManager.showMessage('Edit form not found', 'danger');
        return;
    }
    
    const formData = new FormData(form);
    
    // Validate form
    const sataName = formData.get('sata_name');
    const sataId = formData.get('sata_id');
    
    if (!sataName || !sataName.trim()) {
        sataManager.showMessage('Please enter a Sata Prakar name', 'danger');
        return;
    }
    
    if (!sataId) {
        sataManager.showMessage('Sata Prakar ID is missing', 'danger');
        return;
    }
    
    console.log('Updating Sata Prakar:', { id: sataId, name: sataName });
    
    // Show loading
    sataManager.showLoading();
    
    fetch('/update_sata_prakar/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': sataManager.getCSRFToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Update response:', data);
        if (data.success) {
            sataManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSataModal'));
            if (modal) {
                modal.hide();
            }
            
            // Update the table row instead of refreshing the page
            updateTableRow(sataId, sataName);
        } else {
            throw new Error(data.message || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Error in updateSata:', error);
        sataManager.showMessage(`Error updating Sata Prakar: ${error.message}`, 'danger');
    })
    .finally(() => {
        sataManager.hideLoading();
    });
}

function deleteSata(sataId) {
    console.log('deleteSata called with ID:', sataId);
    
    if (!sataId) {
        sataManager.showMessage('Invalid Sata Prakar ID', 'danger');
        return;
    }
    
    // Get the sata name for confirmation
    const row = document.querySelector(`[data-sata-id="${sataId}"]`);
    const sataName = row ? row.querySelector('td:nth-child(2)').textContent.trim() : 'this Sata Prakar';
    
    if (confirm(`Are you sure you want to delete "${sataName}"? This action cannot be undone.`)) {
        // Show loading
        sataManager.showLoading();
        
        fetch(`/delete_sata_prakar/${sataId}/`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': sataManager.getCSRFToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Delete response:', data);
            if (data.success) {
                sataManager.showMessage(data.message, 'success');
                
                // Remove row from table
                if (row) {
                    row.remove();
                }
                
                // Check if no sata left
                const remainingRows = document.querySelectorAll('.sata-row');
                if (remainingRows.length === 0) {
                    const tbody = document.getElementById('sataTableBody');
                    tbody.innerHTML = '<tr><td colspan="4" class="no-sata">No Sata Prakar found</td></tr>';
                }
            } else {
                throw new Error(data.message || 'Delete failed');
            }
        })
        .catch(error => {
            console.error('Error in deleteSata:', error);
            sataManager.showMessage(`Error deleting Sata Prakar: ${error.message}`, 'danger');
        })
        .finally(() => {
            sataManager.hideLoading();
        });
    }
}

function updateTableRow(sataId, newName) {
    console.log('updateTableRow called:', { sataId, newName });
    
    const row = document.querySelector(`[data-sata-id="${sataId}"]`);
    if (row) {
        // Update the name in the table
        const nameCell = row.querySelector('td:nth-child(2)');
        if (nameCell) {
            nameCell.innerHTML = `<i class="bi bi-file-text sata-icon"></i> ${newName}`;
        }
        
        // Add a temporary highlight effect
        row.classList.add('updated-row');
        setTimeout(() => {
            row.classList.remove('updated-row');
        }, 2000);
    }
}

function refreshSata() {
    window.location.reload();
}

// Initialize the sata manager when the DOM is loaded
let sataManager;
document.addEventListener('DOMContentLoaded', () => {
    sataManager = new SataPrakarManager();
}); 