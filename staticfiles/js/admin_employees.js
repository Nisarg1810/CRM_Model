// Admin Employees JavaScript functionality

// Toggle specialization field based on role
function toggleSpecialization(select, suffix) {
  var val = select.value;
  var group = document.querySelector('.specialization-group-' + suffix);
  if (group) group.style.display = (val === 'employee') ? '' : 'none';
}

// Password generation function
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('passwordField').value = password;
}

// Toggle password visibility
function togglePasswordVisibility() {
  const passwordField = document.getElementById('passwordField');
  const toggleBtn = document.getElementById('togglePassword');
  const icon = toggleBtn.querySelector('i');
  
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    passwordField.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// File upload functionality
function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('profilePicInput');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn = document.getElementById('removeImage');
  
  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0d6efd';
    uploadArea.style.backgroundColor = '#f8f9fa';
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#6c757d';
    uploadArea.style.backgroundColor = 'transparent';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#6c757d';
    uploadArea.style.backgroundColor = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });
  
  // Remove image
  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    imagePreview.style.display = 'none';
    uploadArea.style.display = 'block';
  });
  
  function handleFileSelect(file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.style.display = 'block';
        uploadArea.querySelector('.border-dashed').style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file.');
    }
  }
}

// Function to show alerts
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

// Function to add new employee to the list
function addEmployeeToList(employee) {
  // Always add to list view
  const listItem = createListItem(employee);
  const tbody = document.querySelector('#employeesTableBody');
  if (tbody) {
    tbody.appendChild(listItem);
  }
}

// Function to create list item
function createListItem(employee) {
  const tr = document.createElement('tr');
  tr.className = 'employee-row employee-item';
  tr.setAttribute('data-dev-id', employee.id);
  tr.setAttribute('data-name', (employee.full_name || employee.username).toLowerCase());
  tr.setAttribute('data-type', (employee.employee_type || '').toLowerCase());
  tr.setAttribute('data-phone', (employee.mobile || '').toLowerCase());
  tr.setAttribute('data-email', (employee.email || '').toLowerCase());
  tr.setAttribute('data-address', (employee.address || '').toLowerCase());
  
  tr.innerHTML = `
    <td>${employee.id}</td>
    <td>
      <div class="d-flex align-items-center">
        <i class="bi bi-person me-2"></i>
        <div>
          <div class="fw-bold">${employee.full_name || employee.username}</div>
          <div class="small">
            <a href="#" class="text-primary me-2" data-bs-toggle="modal" data-bs-target="#editEmployeeModal${employee.id}">Edit</a>
            <a href="/admin/chat/${employee.username}/" class="text-info me-2">Chat</a>
            <a href="#" class="text-danger" onclick="deleteEmployee('${employee.id}', '${employee.full_name || employee.username}')">Delete</a>
          </div>
        </div>
      </div>
    </td>
    <td>
      <span class="contact-type">${employee.get_employee_type_display || 'Not specified'}</span>
    </td>
    <td>
      <div class="phone-number">
        <i class="bi bi-telephone phone-icon"></i>
        ${employee.mobile || 'Not specified'}
      </div>
    </td>
    <td>
      <div class="email-address">
        <i class="bi bi-envelope email-icon"></i>
        ${employee.email || 'Not specified'}
      </div>
    </td>
    <td>
      ${employee.address ? `<i class="bi bi-geo-alt me-1"></i>${employee.address}` : '-'}
    </td>
    <td>
      <span class="badge status-badge clickable bg-success" 
            onclick="changeStatus('${employee.id}')" 
            data-employee-id="${employee.id}"
            style="cursor: pointer;">
        ${employee.get_status_display || 'Active'}
      </span>
    </td>
  `;
  
  return tr;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize specialization toggle for add modal
  var addRole = document.querySelector('.role-select[name="role"]');
  if (addRole) toggleSpecialization(addRole, 'add');
  
  // Password functionality
  const generatePasswordBtn = document.getElementById('generatePassword');
  const togglePasswordBtn = document.getElementById('togglePassword');
  
  if (generatePasswordBtn) {
    generatePasswordBtn.addEventListener('click', generatePassword);
  }
  
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
  }
  
  // File upload functionality
  setupFileUpload();
  
  // Add Employee Form AJAX Submission
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  if (addEmployeeForm) {
    addEmployeeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      // Disable submit button and show loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Adding...';
      
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
          // Add new employee to the list
          if (data.employee) {
            addEmployeeToList(data.employee);
          }
          
          // Close modal and reset form
          const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
          modal.hide();
          this.reset();
          
          // Reset image preview
          const imagePreview = document.getElementById('imagePreview');
          const uploadArea = document.getElementById('uploadArea');
          if (imagePreview) imagePreview.style.display = 'none';
          if (uploadArea) uploadArea.querySelector('.border-dashed').style.display = 'block';
          
          // Show success message
          showAlert('success', data.message);
          
          // Reload page to update the list properly
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showAlert('danger', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showAlert('danger', 'An error occurred while adding the employee.');
      })
      .finally(() => {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      });
    });
  }
});

// Global exports for HTML onclick handlers
window.toggleSpecialization = toggleSpecialization;
window.generatePassword = generatePassword;
window.togglePasswordVisibility = togglePasswordVisibility;
