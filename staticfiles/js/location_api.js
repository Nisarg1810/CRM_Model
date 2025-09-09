/**
 * Location API Handler for Gujarat State
 * Handles district, taluka, and village dropdowns via API calls
 */

class LocationAPI {
    constructor() {
        this.baseURL = '/api/location';
        this.districtSelect = null;
        this.talukaSelect = null;
        this.villageSelect = null;
        this.init();
    }

    init() {
        console.log('LocationAPI initialized');
        this.setupElements();
        this.loadDistricts();
        this.setupEventListeners();
    }

    setupElements() {
        // Find elements by common selectors
        this.districtSelect = document.querySelector('select[name="district"], #districtSelect, #edit_district');
        this.talukaSelect = document.querySelector('select[name="taluka"], #talukaSelect, #edit_taluka');
        this.villageSelect = document.querySelector('select[name="village"], #villageSelect, #edit_village_name');
        
        console.log('Location elements found:', {
            district: !!this.districtSelect,
            taluka: !!this.talukaSelect,
            village: !!this.villageSelect
        });
        
        // Debug: Log the actual elements found
        console.log('District select element:', this.districtSelect);
        console.log('Taluka select element:', this.talukaSelect);
        console.log('Village select element:', this.villageSelect);
        
        // Debug: Check if elements exist in DOM
        if (this.districtSelect) {
            console.log('District select found with name:', this.districtSelect.name);
            console.log('District select id:', this.districtSelect.id);
        }
        if (this.talukaSelect) {
            console.log('Taluka select found with name:', this.talukaSelect.name);
            console.log('Taluka select id:', this.talukaSelect.id);
        }
        if (this.villageSelect) {
            console.log('Village select found with name:', this.villageSelect.name);
            console.log('Village select id:', this.villageSelect.id);
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        if (this.districtSelect) {
            console.log('Adding change event listener to district select');
            this.districtSelect.addEventListener('change', () => {
                console.log('District change event triggered');
                this.onDistrictChange();
            });
        } else {
            console.error('District select not found, cannot add event listener');
        }
        
        if (this.talukaSelect) {
            console.log('Adding change event listener to taluka select');
            this.talukaSelect.addEventListener('change', () => {
                console.log('Taluka change event triggered');
                this.onTalukaChange();
            });
        } else {
            console.error('Taluka select not found, cannot add event listener');
        }
        
        console.log('Event listeners setup completed');
    }

    async loadDistricts() {
        try {
            console.log('Loading districts...');
            const response = await fetch(`${this.baseURL}/districts/`);
            const data = await response.json();
            
            if (data.success) {
                this.populateDistricts(data.districts);
            } else {
                console.error('Failed to load districts:', data.error);
            }
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    }

    populateDistricts(districts) {
        if (!this.districtSelect) return;
        
        console.log('Populating districts with data:', districts);
        
        // Clear existing options
        this.districtSelect.innerHTML = '<option value="">Select District</option>';
        
        // Add district options
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district.id;
            option.textContent = district.name;
            this.districtSelect.appendChild(option);
            console.log(`Added district option: value="${district.id}", text="${district.name}"`);
        });
        
        console.log(`Loaded ${districts.length} districts`);
        console.log('Final district select options:', Array.from(this.districtSelect.options).map(opt => ({value: opt.value, text: opt.text})));
    }

    async onDistrictChange() {
        const districtId = this.districtSelect.value;
        
        console.log('District changed - Selected value:', districtId);
        console.log('District select element:', this.districtSelect);
        console.log('District select options:', Array.from(this.districtSelect.options).map(opt => ({value: opt.value, text: opt.text})));
        
        if (!districtId) {
            console.log('No district selected, clearing talukas and villages');
            this.clearTalukas();
            this.clearVillages();
            return;
        }
        
        try {
            console.log('Loading talukas for district ID:', districtId);
            const response = await fetch(`${this.baseURL}/districts/${districtId}/talukas/`);
            console.log('API response:', response);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response data:', data);
            
            if (data.success) {
                console.log('Successfully loaded talukas:', data.talukas);
                this.populateTalukas(data.talukas);
                this.clearVillages();
            } else {
                console.error('Failed to load talukas:', data.error);
            }
        } catch (error) {
            console.error('Error loading talukas:', error);
        }
    }

    populateTalukas(talukas) {
        if (!this.talukaSelect) return;
        
        // Clear existing options
        this.talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
        
        // Add taluka options
        talukas.forEach(taluka => {
            const option = document.createElement('option');
            option.value = taluka.id;
            option.textContent = taluka.name;
            this.talukaSelect.appendChild(option);
        });
        
        console.log(`Loaded ${talukas.length} talukas`);
    }

    async onTalukaChange() {
        const talukaId = this.talukaSelect.value;
        
        if (!talukaId) {
            this.clearVillages();
            return;
        }
        
        try {
            console.log('Loading villages for taluka:', talukaId);
            const response = await fetch(`${this.baseURL}/talukas/${talukaId}/villages/`);
            const data = await response.json();
            
            if (data.success) {
                this.populateVillages(data.villages);
            } else {
                console.error('Failed to load villages:', data.error);
            }
        } catch (error) {
            console.error('Error loading villages:', error);
        }
    }

    populateVillages(villages) {
        if (!this.villageSelect) return;
        
        // Clear existing options
        this.villageSelect.innerHTML = '<option value="">Select Village Name</option>';
        
        // Add village options
        villages.forEach(village => {
            const option = document.createElement('option');
            option.value = village.id;
            option.textContent = village.name;
            this.villageSelect.appendChild(option);
        });
        
        console.log(`Loaded ${villages.length} villages`);
    }

    clearTalukas() {
        if (this.talukaSelect) {
            this.talukaSelect.innerHTML = '<option value="">Select Taluka</option>';
        }
    }

    clearVillages() {
        if (this.villageSelect) {
            this.villageSelect.innerHTML = '<option value="">Select Village Name</option>';
        }
    }



    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        return token ? token.value : '';
    }

    // Public methods for external use
    refreshDistricts() {
        this.loadDistricts();
    }

    refreshTalukas() {
        if (this.districtSelect?.value) {
            this.onDistrictChange();
        }
    }

    refreshVillages() {
        if (this.talukaSelect?.value) {
            this.onTalukaChange();
        }
    }
}

// Initialize when DOM is loaded
let locationAPI;
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing LocationAPI...');
    locationAPI = new LocationAPI();
    window.locationAPI = locationAPI; // Make it globally accessible
    console.log('LocationAPI initialized and made globally accessible');
});

// Global functions for backward compatibility
window.updateDistricts = function() {
    console.log('updateDistricts called, locationAPI available:', !!window.locationAPI);
    if (window.locationAPI) {
        window.locationAPI.refreshDistricts();
    } else {
        console.error('LocationAPI not available');
    }
};

window.updateTalukas = function() {
    console.log('updateTalukas called, locationAPI available:', !!window.locationAPI);
    if (window.locationAPI) {
        window.locationAPI.refreshTalukas();
    } else {
        console.error('LocationAPI not available');
    }
};

window.updateVillages = function() {
    console.log('updateVillages called, locationAPI available:', !!window.locationAPI);
    if (window.locationAPI) {
        window.locationAPI.refreshVillages();
    } else {
        console.error('LocationAPI not available');
    }
};


