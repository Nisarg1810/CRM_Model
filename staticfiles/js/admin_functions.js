// Admin Dashboard and Employees Page Functions
// This file contains all the JavaScript functionality for admin pages

console.log('admin_functions.js loaded successfully');
console.log('Setting up global functions...');

// Define deleteEmployee function in global scope immediately
window.deleteEmployee = function(employeeId, name) {
  console.log('deleteEmployee called with:', employeeId, name);
  
  if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `/delete_employee/${employeeId}/`;
      
      // Get CSRF token from multiple possible sources
      let csrfToken = '';
      const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]') || 
                         document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                         document.querySelector('meta[name="csrf-token"]');
      
      console.log('CSRF element found:', csrfElement);
      
      if (csrfElement) {
        csrfToken = csrfElement.value || csrfElement.getAttribute('content') || '';
        console.log('CSRF token value:', csrfToken);
      }
      
      if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Security token not found. Please refresh the page and try again.');
        return;
      }
      
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = csrfToken;
      
      form.appendChild(csrfInput);
      document.body.appendChild(form);
      
      console.log('Form created and submitted:', form);
      form.submit();
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      alert('An error occurred while deleting the employee. Please try again.');
    }
  }
};

console.log('deleteEmployee function defined on window:', typeof window.deleteEmployee);

// Define bulkDeleteEmployees function in global scope immediately
window.bulkDeleteEmployees = function() {
  if (selectedEmployees.size === 0) {
    showAlert('warning', 'Please select employees to delete.');
    return;
  }
  
  if (confirm(`Are you sure you want to delete ${selectedEmployees.size} selected employee(s)?`)) {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/bulk_delete_employees/';
      
      // Get CSRF token from multiple possible sources
      let csrfToken = '';
      const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]') || 
                         document.querySelector('input[name="csrfmiddlewaretoken"]') ||
                         document.querySelector('meta[name="csrf-token"]');
      
      if (csrfElement) {
        csrfToken = csrfElement.value || csrfElement.getAttribute('content') || '';
      }
      
      if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Security token not found. Please refresh the page and try again.');
        return;
      }
      
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfmiddlewaretoken';
      csrfInput.value = csrfToken;
      
      // Add selected employee IDs
      selectedEmployees.forEach(devId => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'employee_ids';
        input.value = devId;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Error in bulkDeleteEmployees:', error);
      alert('An error occurred while deleting employees. Please try again.');
    }
  }
};

// Global variables
let selectedEmployees = new Set();


  const gridSection = document.getElementById('gridViewSection');
  const listSection = document.getElementById('listViewSection');
  const gridBtn = document.getElementById('gridView');
  const listBtn = document.getElementById('listView');
  
  if (view === 'grid') {
    gridSection.style.display = '';
    listSection.style.display = 'none';
    gridBtn.classList.remove('btn-outline-info');
    gridBtn.classList.add('btn-info');
    listBtn.classList.remove('btn-info');
    listBtn.classList.add('btn-outline-secondary');
  } else {
    gridSection.style.display = 'none';
    listSection.style.display = '';
    listBtn.classList.remove('btn-outline-secondary');
    listBtn.classList.add('btn-info');
    gridBtn.classList.remove('btn-info');
    gridBtn.classList.add('btn-outline-info');
  }
}

// Select all functionality
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAllEmployees');
  const checkboxes = document.querySelectorAll('.employee-select');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
    if (selectAll.checked) {
      selectedEmployees.add(checkbox.value);
    } else {
      selectedEmployees.delete(checkbox.value);
    }
  });
  
  updateBulkDeleteButton();
}

// Individual checkbox selection
function toggleEmployeeSelection(checkbox) {
  if (checkbox.checked) {
    selectedEmployees.add(checkbox.value);
  } else {
    selectedEmployees.delete(checkbox.value);
  }
  
  updateBulkDeleteButton();
  updateSelectAllCheckbox();
}

// Update bulk delete button visibility
function updateBulkDeleteButton() {
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  if (bulkDeleteBtn) {
    if (selectedEmployees.size > 0) {
      bulkDeleteBtn.style.display = '';
      bulkDeleteBtn.innerHTML = `<i class="bi bi-trash me-1"></i> Delete Selected (${selectedEmployees.size})`;
    } else {
      bulkDeleteBtn.style.display = 'none';
    }
  }
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const selectAll = document.getElementById('selectAllEmployees');
  const checkboxes = document.querySelectorAll('.employee-select');
  const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('tr').style.display !== 'none');
  const checkedVisibleCheckboxes = visibleCheckboxes.filter(cb => cb.checked);
  
  if (checkedVisibleCheckboxes.length === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
  } else if (checkedVisibleCheckboxes.length === visibleCheckboxes.length) {
    selectAll.checked = true;
    selectAll.indeterminate = false;
  } else {
    selectAll.checked = false;
    selectAll.indeterminate = true;
  }
}

// Delete single employee function is now defined in global scope above

// Bulk delete employees function is now defined in global scope above

// Search and filter functionality
function filterEmployees() {
  const nameSearch = document.getElementById('nameSearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('typeFilter')?.value.toLowerCase() || '';
  const phoneSearch = document.getElementById('phoneSearch')?.value.toLowerCase() || '';
  const emailSearch = document.getElementById('emailSearch')?.value.toLowerCase() || '';
  
  document.querySelectorAll('.employee-item').forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const type = row.getAttribute('data-type') || '';
    const phone = row.getAttribute('data-phone') || '';
    const email = row.getAttribute('data-email') || '';
    
    const matchesName = name.includes(nameSearch);
    const matchesType = !typeFilter || type === typeFilter;
    const matchesPhone = phone.includes(phoneSearch);
    const matchesEmail = email.includes(emailSearch);
    
    if (matchesName && matchesType && matchesPhone && matchesEmail) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
  
  updateSelectAllCheckbox();
}

// Clear filters
function clearFilters() {
  const nameSearch = document.getElementById('nameSearch');
  const typeFilter = document.getElementById('typeFilter');
  const phoneSearch = document.getElementById('phoneSearch');
  const emailSearch = document.getElementById('emailSearch');
  
  if (nameSearch) nameSearch.value = '';
  if (typeFilter) typeFilter.value = '';
  if (phoneSearch) phoneSearch.value = '';
  if (emailSearch) emailSearch.value = '';
  
  filterEmployees();
}

// Refresh page
function refreshPage() {
  window.location.reload();
}

// Export CSV functionality
function exportCSV() {
  const employees = [];
  document.querySelectorAll('.employee-item').forEach(row => {
    if (row.style.display !== 'none') {
      const name = row.querySelector('td:nth-child(4)').textContent.trim();
      const email = row.querySelector('td:nth-child(5)').textContent.trim();
      const mobile = row.querySelector('td:nth-child(6)').textContent.trim();
      const location = row.querySelector('td:nth-child(7)').textContent.trim();
      const status = row.querySelector('td:nth-child(8) .badge').textContent.trim();
      const employeeType = row.querySelector('td:nth-child(9) .badge').textContent.trim();
      
      employees.push([name, email, mobile, location, status, employeeType]);
    }
  });
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Name,Email,Mobile,Location,Status,Employee Type\n"
    + employees.map(row => row.join(',')).join('\n');
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "employees.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}



// Show alert messages
function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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

// Mobile number validation for edit forms
function validateMobileNumberEdit(devId) {
  const mobileField = document.getElementById(`mobileFieldEdit${devId}`);
  const errorDiv = document.getElementById(`mobileErrorEdit${devId}`);
  
  if (mobileField && errorDiv) {
    const mobile = mobileField.value.replace(/\D/g, '');
    
    if (mobile.length !== 10) {
      errorDiv.style.display = 'block';
      mobileField.classList.add('is-invalid');
      return false;
    } else {
      errorDiv.style.display = 'none';
      mobileField.classList.remove('is-invalid');
      mobileField.value = mobile;
      return true;
    }
  }
  return true;
}

// Toggle specialization field visibility
function toggleSpecialization(selectElement, suffix) {
  const specializationGroup = document.querySelector(`.specialization-group-edit${suffix}`);
  const specializationSelect = specializationGroup.querySelector('select');
  
  if (selectElement.value === 'developer') {
    specializationGroup.style.display = '';
    specializationSelect.required = true;
  } else {
    specializationGroup.style.display = 'none';
    specializationSelect.required = false;
    specializationSelect.value = '';
  }
}

// Edit employee form submission
function setupEditEmployeeForm(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const devId = this.getAttribute('data-dev-id');
    
    // Validate mobile number
    if (!validateMobileNumberEdit(devId)) {
      return;
    }
    
    const formData = new FormData(this);
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Saving...';
    
    fetch(this.action, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': formData.get('csrfmiddlewaretoken')
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(`editEmployeeModal${devId}`));
        modal.hide();
        
        // Show success message
        showAlert('success', data.message);
        
        // Reload page to update employee list
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showAlert('danger', data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showAlert('danger', 'An error occurred while updating the employee.');
    })
    .finally(() => {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    });
  });
}

// Initialize all functionality on page load
function initializeAdminFunctions() {

  
  // Select all event listener
  const selectAllCheckbox = document.getElementById('selectAllEmployees');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
  }
  
  // Individual checkbox listeners
  document.querySelectorAll('.employee-select').forEach(checkbox => {
    checkbox.addEventListener('change', () => toggleEmployeeSelection(checkbox));
  });
  
  // Search and filter event listeners
  const nameSearch = document.getElementById('nameSearch');
  const typeFilter = document.getElementById('typeFilter');
  const phoneSearch = document.getElementById('phoneSearch');
  const emailSearch = document.getElementById('emailSearch');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const exportCSVBtn = document.getElementById('exportCSV');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  
  if (nameSearch) nameSearch.addEventListener('input', filterEmployees);
  if (typeFilter) typeFilter.addEventListener('change', filterEmployees);
  if (phoneSearch) phoneSearch.addEventListener('input', filterEmployees);
  if (emailSearch) emailSearch.addEventListener('input', filterEmployees);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
  if (exportCSVBtn) exportCSVBtn.addEventListener('click', exportCSV);
  if (bulkDeleteBtn) bulkDeleteBtn.addEventListener('click', bulkDeleteEmployees);
  
  // Edit Employee Form AJAX Submission
  document.querySelectorAll('.editEmployeeForm').forEach(form => {
    setupEditEmployeeForm(form);
    
    // Add mobile validation for edit forms
    const devId = form.getAttribute('data-dev-id');
    const mobileField = document.getElementById(`mobileFieldEdit${devId}`);
    
    if (mobileField) {
      // Mobile number validation on input
      mobileField.addEventListener('input', function() {
        // Remove non-digits
        this.value = this.value.replace(/\D/g, '');
        
        // Limit to 10 digits
        if (this.value.length > 10) {
          this.value = this.value.slice(0, 10);
        }
        
        // Show/hide error message
        const errorDiv = document.getElementById(`mobileErrorEdit${devId}`);
        if (errorDiv) {
          if (this.value.length !== 10) {
            errorDiv.style.display = 'block';
            this.classList.add('is-invalid');
          } else {
            errorDiv.style.display = 'none';
            this.classList.remove('is-invalid');
          }
        }
      });
    }
  });
  
  // Specialization toggle for edit forms
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', function() {
      const suffix = this.closest('form').getAttribute('data-dev-id');
      toggleSpecialization(this, suffix);
    });
  });
  
  // Initialize mobile validation for all edit forms
  document.querySelectorAll('.editDeveloperForm').forEach(form => {
    const devId = form.getAttribute('data-dev-id');
    const mobileField = document.getElementById(`mobileFieldEdit${devId}`);
    
    if (mobileField) {
      // Initial validation
      mobileField.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value.length > 10) {
          this.value = this.value.slice(0, 10);
        }
      });
    }
  });
  
  // Add refresh button functionality if it exists
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshPage);
  }
}

// Password visibility toggle function
function togglePasswordVisibility(fieldId) {
  const passwordField = document.getElementById(fieldId);
  const toggleBtn = passwordField.nextElementSibling;
  const icon = toggleBtn.querySelector('i');
  
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    passwordField.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}

// Functions are now defined in global scope above

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAdminFunctions); 