/**
 * Village Management JavaScript
 * Handles village CRUD operations and form management
 */

class VillageManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('VillageManager initialized');
        this.setupEventListeners();
        this.loadVillageList();
        
        // Wait for LocationAPI to be ready, then populate districts
        this.waitForLocationAPI();
    }
    
    async waitForLocationAPI() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts && !window.locationAPI) {
            console.log(`Waiting for LocationAPI... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (window.locationAPI) {
            console.log('LocationAPI is ready, populating districts...');
            window.locationAPI.loadDistricts();
        } else {
            console.error('LocationAPI not available after waiting');
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Modal form submission
        const modalForm = document.getElementById('addVillageForm');
        console.log('Modal form element found:', !!modalForm);
        if (modalForm) {
            // Remove any existing event listeners to avoid duplicates
            modalForm.removeEventListener('submit', this.handleFormSubmit);
            
            // Add new event listener
            this.handleFormSubmit = (e) => {
                console.log('Modal form submit event triggered');
                e.preventDefault();
                this.submitVillageForm();
            };
            
            modalForm.addEventListener('submit', this.handleFormSubmit);
            console.log('Submit event listener added to modal form');
        } else {
            console.error('Modal form element not found!');
        }

        // District change event in modal
        const modalDistrictSelect = document.getElementById('modalDistrictSelect');
        if (modalDistrictSelect) {
            modalDistrictSelect.addEventListener('change', () => this.onModalDistrictChange());
        }

        // Taluka change event in modal
        const modalTalukaSelect = document.getElementById('modalTalukaSelect');
        if (modalTalukaSelect) {
            modalTalukaSelect.addEventListener('change', () => this.onModalTalukaChange());
        }
        
        // Enter key support for village name input
        const modalVillageNameInput = document.getElementById('modalVillageName');
        if (modalVillageNameInput) {
            modalVillageNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitVillageForm();
                }
            });
        }
        
        // Submit button click event
        const submitButton = document.querySelector('#addVillageModal .btn-primary');
        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                console.log('Submit button clicked!');
                e.preventDefault();
                this.submitVillageForm();
            });
            console.log('Submit button click event listener added');
        } else {
            console.log('Submit button not found');
        }
        
        // Search functionality
        const searchInput = document.getElementById('villageSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }





    async onModalDistrictChange() {
        const districtId = document.getElementById('modalDistrictSelect').value;
        
        if (!districtId) {
            this.clearModalTalukas();
            this.clearDuplicateWarning();
            return;
        }

        try {
            const response = await fetch(`/api/location/districts/${districtId}/talukas/`);
            const data = await response.json();

            if (data.success) {
                this.populateModalTalukas(data.talukas);
            } else {
                this.showAlert('Failed to load talukas', 'danger');
            }
        } catch (error) {
            console.error('Error loading talukas:', error);
            this.showAlert('Error loading talukas', 'danger');
        }
    }

    async onModalTalukaChange() {
        const talukaId = document.getElementById('modalTalukaSelect').value;
        
        if (!talukaId) {
            return;
        }

        try {
            const response = await fetch(`/api/location/talukas/${talukaId}/villages/`);
            const data = await response.json();

            if (data.success) {
                // Show existing villages for this taluka to help avoid duplicates
                if (data.villages.length > 0) {
                    // Show a simple warning with existing village names
                    this.showDuplicateWarning(data.villages);
                } else {
                    this.showAlert('No villages exist in this taluka yet. You can add the first one!', 'success');
                }
            } else {
                this.showAlert('Failed to load villages', 'danger');
            }
        } catch (error) {
            console.error('Error loading villages:', error);
            this.showAlert('Error loading villages', 'danger');
        }
    }
    
    showDuplicateWarning(existingVillages) {
        // Create a simple warning showing only existing village names
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-warning alert-dismissible fade show mt-2';
        warningDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Existing villages:</strong> ${existingVillages.map(v => v.name).join(', ')}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert the warning after the village name input
        const villageNameInput = document.getElementById('modalVillageName');
        if (villageNameInput && villageNameInput.parentNode) {
            villageNameInput.parentNode.insertBefore(warningDiv, villageNameInput.nextSibling);
        }
    }

    populateModalTalukas(talukas) {
        const talukaSelect = document.getElementById('modalTalukaSelect');
        if (!talukaSelect) return;

        talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
        
        talukas.forEach(taluka => {
            const option = document.createElement('option');
            option.value = taluka.id;
            option.textContent = taluka.name;
            talukaSelect.appendChild(option);
        });
    }



    clearModalTalukas() {
        const talukaSelect = document.getElementById('modalTalukaSelect');
        if (talukaSelect) {
            talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
        }
        this.clearDuplicateWarning();
    }
    
    clearDuplicateWarning() {
        // Remove any existing duplicate warnings
        const existingWarnings = document.querySelectorAll('.alert-warning');
        existingWarnings.forEach(warning => {
            if (warning.textContent.includes('Duplicate Prevention')) {
                warning.remove();
            }
        });
    }

    async loadVillageList() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/location/villages/list/');
            const data = await response.json();

            if (data.success) {
                this.allVillages = data.villages; // Store all villages for search
                this.populateVillageTable(data.villages);
                this.updateRecordCount(data.villages.length);
            } else {
                this.showAlert(data.error || 'Failed to load villages', 'danger');
            }
        } catch (error) {
            console.error('Error loading village list:', error);
            this.showAlert('Error loading village list', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    populateVillageTable(villages) {
        const tbody = document.getElementById('villageTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (villages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No villages found. Add some villages using the form above.
                    </td>
                </tr>
            `;
            return;
        }

        villages.forEach(village => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${village.id}</td>
                <td>
                    <i class="bi bi-list me-2"></i>
                    ${village.name}
                </td>
            `;
            tbody.appendChild(row);
        });
    }



    // Search functionality
    handleSearch(searchTerm) {
        if (!this.allVillages) return;
        
        const filteredVillages = this.allVillages.filter(village => 
            village.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.populateVillageTable(filteredVillages);
        this.updateRecordCount(filteredVillages.length);
    }
    
    // Update record count
    updateRecordCount(count) {
        const recordCountElement = document.getElementById('recordCount');
        if (recordCountElement) {
            recordCountElement.textContent = `Showing: ${count}`;
        }
    }
    

    
    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        console.log('CSRF Token found:', !!token, token ? token.value : 'NOT FOUND');
        return token ? token.value : '';
    }
    
    // Open Add Village Modal
    openAddVillageModal() {
        console.log('Opening Add Village Modal');
        
        // Reset the modal form
        const modalForm = document.getElementById('addVillageForm');
        if (modalForm) {
            modalForm.reset();
        }
        
        // Clear taluka dropdown and any warnings
        this.clearModalTalukas();
        this.clearDuplicateWarning();
        
        // Load districts in modal
        this.loadModalDistricts();
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('addVillageModal'));
        modal.show();
        
        // Focus on district select
        setTimeout(() => {
            const districtSelect = document.getElementById('modalDistrictSelect');
            if (districtSelect) {
                districtSelect.focus();
            }
        }, 500);
    }
    
    // Load districts in modal
    async loadModalDistricts() {
        try {
            const response = await fetch('/api/location/districts/');
            const data = await response.json();
            
            if (data.success) {
                this.populateModalDistricts(data.districts);
            } else {
                this.showAlert('Failed to load districts', 'danger');
            }
        } catch (error) {
            console.error('Error loading districts:', error);
            this.showAlert('Error loading districts', 'danger');
        }
    }
    
    // Populate districts in modal
    populateModalDistricts(districts) {
        const districtSelect = document.getElementById('modalDistrictSelect');
        if (!districtSelect) return;
        
        districtSelect.innerHTML = '<option value="">Select District</option>';
        
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.id;
            option.textContent = district.name;
            districtSelect.appendChild(option);
        });
    }
    
    // Submit village form from modal
    async submitVillageForm() {
        console.log('Submitting village form from modal');
        
        const districtId = document.getElementById('modalDistrictSelect').value;
        const talukaId = document.getElementById('modalTalukaSelect').value;
        const villageName = document.getElementById('modalVillageName').value.trim();
        
        console.log('Form values:', { districtId, talukaId, villageName });
        
        // Enhanced validation
        if (!districtId) {
            this.showAlert('Please select a district', 'warning');
            document.getElementById('modalDistrictSelect').focus();
            return;
        }
        
        if (!talukaId) {
            this.showAlert('Please select a taluka', 'warning');
            document.getElementById('modalTalukaSelect').focus();
            return;
        }
        
        if (!villageName) {
            this.showAlert('Please enter a village name', 'warning');
            document.getElementById('modalVillageName').focus();
            return;
        }
        
        // Check if village name is too short
        if (villageName.length < 2) {
            this.showAlert('Village name must be at least 2 characters long', 'warning');
            document.getElementById('modalVillageName').focus();
            return;
        }
        
        // Check if village name contains only valid characters
        if (!/^[a-zA-Z0-9\s\-\.]+$/.test(villageName)) {
            this.showAlert('Village name contains invalid characters. Use only letters, numbers, spaces, hyphens, and periods.', 'warning');
            document.getElementById('modalVillageName').focus();
            return;
        }
        
        try {
            console.log('Starting API call...');
            this.showLoading(true);
            
            // Disable submit button to prevent double submission
            const submitBtn = document.querySelector('#addVillageModal .btn-primary');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Adding...';
            }
            
            const formData = new FormData();
            formData.append('taluka', talukaId);
            formData.append('village_name', villageName);
            
            console.log('FormData created:', formData);
            
            const response = await fetch('/api/location/villages/add/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            console.log('API response received:', response);
            const data = await response.json();
            console.log('API data:', data);
            
            if (data.success) {
                console.log('Village added successfully!');
                this.showAlert('Village added successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addVillageModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Refresh the village list
                this.loadVillageList();
                
            } else {
                console.log('API returned error:', data.error);
                this.showAlert(data.error || 'Failed to add village', 'danger');
            }
        } catch (error) {
            console.error('Error adding village:', error);
            this.showAlert('An error occurred while adding the village. Please try again.', 'danger');
        } finally {
            this.showLoading(false);
            
            // Re-enable submit button
            const submitBtn = document.querySelector('#addVillageModal .btn-primary');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'SUBMIT';
            }
        }
    }
}

// Initialize when DOM is loaded
let villageManager;
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing VillageManager...');
    villageManager = new VillageManager();
});

// Global function for refresh button
window.refreshVillageList = function() {
    if (villageManager) {
        villageManager.loadVillageList();
    }
};

// Global function for opening add village modal
window.openAddVillageModal = function() {
    if (villageManager) {
        villageManager.openAddVillageModal();
    }
};

// Global function for submitting village form
window.submitVillageForm = function() {
    if (villageManager) {
        villageManager.submitVillageForm();
    }
};
