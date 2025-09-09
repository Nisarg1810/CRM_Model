// Advocate Management JavaScript

console.log('Advocate JavaScript loaded!');

class AdvocateManager {
    constructor() {
        console.log('AdvocateManager constructor called');
        this.advocates = [];
        this.currentAdvocate = null;
        this.isEditMode = false;
        this.searchTerm = '';
        
        this.init();
    }

    init() {
        console.log('Initializing AdvocateManager...');
        this.bindEvents();
        this.loadAdvocates();
    }

    bindEvents() {
        // Add advocate button
        document.getElementById('addAdvocateBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        // Search functionality
        document.getElementById('searchName').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAdvocates();
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadAdvocates();
        });

        // Form submission
        document.getElementById('submitBtn').addEventListener('click', () => {
            this.handleSubmit();
        });

        // Enter key submission
        document.getElementById('advocateName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Modal events
        const advocateModal = document.getElementById('advocateModal');
        advocateModal.addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteAdvocate();
        });
    }

    async loadAdvocates() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/advocates/', {
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Load Advocates Response:', data);
            this.advocates = data.advocates || data || [];
            console.log(`Loaded ${this.advocates.length} advocates`);
            
            this.renderAdvocates();
            this.updateCount();
        } catch (error) {
            console.error('Error loading advocates:', error);
            this.showError('Failed to load advocates');
        } finally {
            this.showLoading(false);
        }
    }

    renderAdvocates() {
        const tbody = document.getElementById('advocateTableBody');
        tbody.innerHTML = '';

        if (this.advocates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-state">
                        <i class="bi bi-person-x"></i>
                        <h4>No Advocates Found</h4>
                        <p>Start by adding your first advocate using the "+ ADD NAME" button.</p>
                    </td>
                </tr>
            `;
            return;
        }

        this.advocates.forEach(advocate => {
            const row = this.createAdvocateRow(advocate);
            if (row) {
                tbody.appendChild(row);
            }
        });
    }

    createAdvocateRow(advocate) {
        // Safety check for advocate object
        if (!advocate || !advocate.id || !advocate.name) {
            console.error('Invalid advocate object:', advocate);
            return null;
        }

        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.setAttribute('data-advocate-id', advocate.id);

        row.innerHTML = `
            <td>
                <strong class="text-primary">#${advocate.id}</strong>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-list me-2 text-muted"></i>
                    <span class="fw-medium">${this.escapeHtml(advocate.name)}</span>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="advocateManager.editAdvocate(${advocate.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-delete" onclick="advocateManager.showDeleteModal(${advocate.id})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    filterAdvocates() {
        const filteredAdvocates = this.advocates.filter(advocate => 
            advocate.name.toLowerCase().includes(this.searchTerm)
        );

        const tbody = document.getElementById('advocateTableBody');
        tbody.innerHTML = '';

        if (filteredAdvocates.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-state">
                        <i class="bi bi-search"></i>
                        <h4>No Matching Advocates</h4>
                        <p>No advocates found matching "${this.searchTerm}".</p>
                    </td>
                </tr>
            `;
        } else {
            filteredAdvocates.forEach(advocate => {
                const row = this.createAdvocateRow(advocate);
                if (row) {
                    tbody.appendChild(row);
                }
            });
        }

        this.updateCount(filteredAdvocates.length);
    }

    showAddModal() {
        this.isEditMode = false;
        this.currentAdvocate = null;
        document.getElementById('modalTitle').textContent = 'Add Advocate Name';
        document.getElementById('advocateName').value = '';
        document.getElementById('advocateName').focus();
        
        const modal = new bootstrap.Modal(document.getElementById('advocateModal'));
        modal.show();
    }

    editAdvocate(advocateId) {
        const advocate = this.advocates.find(a => a.id === advocateId);
        if (!advocate) {
            this.showError('Advocate not found');
            return;
        }

        this.isEditMode = true;
        this.currentAdvocate = advocate;
        document.getElementById('modalTitle').textContent = 'Edit Advocate Name';
        document.getElementById('advocateName').value = advocate.name;
        document.getElementById('advocateName').focus();

        const modal = new bootstrap.Modal(document.getElementById('advocateModal'));
        modal.show();
    }

    async handleSubmit() {
        const nameInput = document.getElementById('advocateName');
        const name = nameInput.value.trim();

        if (!name) {
            this.showFieldError('advocateName', 'Name is required');
            return;
        }

        try {
            this.showLoading(true);
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Processing...';

            const url = this.isEditMode 
                ? `/api/advocates/${this.currentAdvocate.id}/` 
                : '/api/advocates/create/';
            
            const method = this.isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name })
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('API Response:', result);
            
            if (this.isEditMode) {
                this.showSuccess('Advocate updated successfully');
                // Update the advocate in the local array
                const index = this.advocates.findIndex(a => a.id === this.currentAdvocate.id);
                if (index !== -1) {
                    this.advocates[index].name = name;
                }
            } else {
                this.showSuccess('Advocate added successfully');
                // Add the new advocate to the local array
                // Handle both possible response structures
                const newAdvocate = result.advocate || result;
                if (newAdvocate && newAdvocate.id) {
                    this.advocates.push(newAdvocate);
                } else {
                    console.error('Invalid response structure:', result);
                    this.showError('Advocate added but response format is invalid');
                }
            }

            this.renderAdvocates();
            this.updateCount();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('advocateModal'));
            modal.hide();
            
        } catch (error) {
            console.error('Error saving advocate:', error);
            this.showError(error.message || 'Failed to save advocate');
        } finally {
            this.showLoading(false);
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Submit';
        }
    }

    showDeleteModal(advocateId) {
        const advocate = this.advocates.find(a => a.id === advocateId);
        if (!advocate) {
            this.showError('Advocate not found');
            return;
        }

        this.currentAdvocate = advocate;
        document.getElementById('deleteAdvocateName').textContent = advocate.name;
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    async deleteAdvocate() {
        if (!this.currentAdvocate) {
            this.showError('No advocate selected for deletion');
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`/api/advocates/${this.currentAdvocate.id}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Could not parse error response:', e);
                }
                throw new Error(errorMessage);
            }

            this.showSuccess('Advocate deleted successfully');
            
            // Remove from local array
            this.advocates = this.advocates.filter(a => a.id !== this.currentAdvocate.id);
            this.renderAdvocates();
            this.updateCount();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            
            this.currentAdvocate = null;
            
        } catch (error) {
            console.error('Error deleting advocate:', error);
            this.showError(error.message || 'Failed to delete advocate');
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        this.isEditMode = false;
        this.currentAdvocate = null;
        document.getElementById('advocateForm').reset();
        this.clearFieldErrors();
    }

    updateCount(count = null) {
        const displayCount = count !== null ? count : this.advocates.length;
        document.getElementById('advocateCount').textContent = displayCount;
    }

    showLoading(show) {
        const table = document.getElementById('advocateTable');
        if (show) {
            table.classList.add('loading');
        } else {
            table.classList.remove('loading');
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId.replace('advocate', '') + 'Error');
        
        field.classList.add('is-invalid');
        if (errorDiv) {
            errorDiv.textContent = message;
        }
    }

    clearFieldErrors() {
        const fields = document.querySelectorAll('.is-invalid');
        fields.forEach(field => field.classList.remove('is-invalid'));
        
        const errorDivs = document.querySelectorAll('.invalid-feedback');
        errorDivs.forEach(div => div.textContent = '');
    }

    getCSRFToken() {
        // Try multiple ways to get CSRF token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
                         document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                         document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
        
        if (!csrfToken) {
            console.error('CSRF token not found!');
            this.showError('Security token not found. Please refresh the page.');
        }
        
        return csrfToken;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.advocateManager = new AdvocateManager();
});

// Export for global access
window.AdvocateManager = AdvocateManager;
