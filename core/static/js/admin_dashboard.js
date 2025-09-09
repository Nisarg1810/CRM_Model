function toggleSpecialization(select, suffix) {
  var val = select.value;
  var group = document.querySelector('.specialization-group-' + suffix);
  if (group) group.style.display = (val === 'developer') ? '' : 'none';
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

// Mobile number validation for edit forms
function validateMobileNumberEdit(devId) {
  const mobileField = document.getElementById(`mobileFieldEdit${devId}`);
  const mobileError = document.getElementById(`mobileErrorEdit${devId}`);
  const mobileValue = mobileField.value.replace(/\D/g, ''); // Remove non-digits
  
  if (mobileValue.length !== 10) {
    mobileError.style.display = 'block';
    mobileField.classList.add('is-invalid');
    return false;
  } else {
    mobileError.style.display = 'none';
    mobileField.classList.remove('is-invalid');
    mobileField.value = mobileValue; // Set the cleaned value
    return true;
  }
}

// Edit employee form submission handler
function setupEditEmployeeForms() {
  document.querySelectorAll('.editEmployeeForm').forEach(form => {
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
          if (modal) {
            modal.hide();
          }
          
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
}

// Land selection and task loading functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize edit employee forms
  setupEditEmployeeForms();
  
  const landSelect = document.getElementById('landSelect');
  const taskNameSelect = document.getElementById('taskNameSelect');
  const customTaskDiv = document.getElementById('customTaskDiv');
  
  if (landSelect) {
    landSelect.addEventListener('change', function() {
      const landId = this.value;
      if (landId) {
        loadLandTasksForAssignment(landId);
      } else {
        // Clear task dropdown if no land is selected
        taskNameSelect.innerHTML = '<option value="">Select Task</option>';
        customTaskDiv.style.display = 'none';
      }
    });
  }
  
  if (taskNameSelect) {
    taskNameSelect.addEventListener('change', function() {
      if (this.value === 'Custom Task') {
        customTaskDiv.style.display = 'block';
        customTaskDiv.querySelector('input').required = true;
      } else {
        customTaskDiv.style.display = 'none';
        customTaskDiv.querySelector('input').required = false;
      }
    });
  }
});

function loadLandTasksForAssignment(landId) {
  const taskNameSelect = document.getElementById('taskNameSelect');
  
  // Make AJAX call to get land data
  fetch(`/land/${landId}/data/`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const landData = data.land;
        
        // Clear existing options except the first one
        taskNameSelect.innerHTML = '<option value="">Select Task</option>';
        
        // Add land's selected tasks
        if (landData.selected_tasks) {
          const tasks = landData.selected_tasks.split(',').map(task => task.trim()).filter(task => task);
          tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task;
            option.textContent = task;
            taskNameSelect.appendChild(option);
          });
        }
        
        // Add "Custom Task" option at the end
        const customOption = document.createElement('option');
        customOption.value = 'Custom Task';
        customOption.textContent = 'Custom Task';
        taskNameSelect.appendChild(customOption);
        
      } else {
        console.error('Error loading land tasks:', data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Task Approval and Rejection Functions (Same as land_tasks.js)

// Global variables for task management
let currentApprovalTaskId = null;
let currentReassignmentTaskId = null;
let pendingApprovalTasks = [];

// Show approval modal
function showApprovalModal(taskId) {
    console.log('showApprovalModal called with taskId:', taskId);
    currentApprovalTaskId = taskId;
    
    const modalElement = document.getElementById('adminApprovalModal');
    console.log('Modal element found:', modalElement);
    
    if (!modalElement) {
        console.error('Modal element not found!');
        showAlert('danger', 'Modal not found. Please refresh the page.');
        return;
    }
    
    try {
        const modal = new bootstrap.Modal(modalElement);
        console.log('Bootstrap Modal created:', modal);
        modal.show();
        console.log('Modal show() called');
    } catch (error) {
        console.error('Error creating/showing modal:', error);
        showAlert('danger', 'Error opening modal: ' + error.message);
    }
}

// Show reassignment modal
function showReassignModal(taskId) {
    console.log('showReassignModal called with taskId:', taskId);
    currentReassignmentTaskId = taskId;
    
    const modalElement = document.getElementById('taskReassignmentModal');
    console.log('Reassignment modal element found:', modalElement);
    
    if (!modalElement) {
        console.error('Reassignment modal element not found!');
        showAlert('danger', 'Reassignment modal not found. Please refresh the page.');
        return;
    }
    
    try {
        const modal = new bootstrap.Modal(modalElement);
        console.log('Bootstrap Reassignment Modal created:', modal);
        modal.show();
        console.log('Reassignment modal show() called');
    } catch (error) {
        console.error('Error creating/showing reassignment modal:', error);
        showAlert('danger', 'Error opening reassignment modal: ' + error.message);
    }
}

// View completion details (same as land_tasks.js)
async function viewCompletionDetails(taskId) {
    console.log('viewCompletionDetails called with taskId:', taskId);
    try {
        // Fetch task data from API instead of extracting from DOM
        const response = await fetch(`/api/tasks/${taskId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            showAlert('danger', 'Error loading task details: ' + data.message);
            return;
        }
        
        const task = data.task;
        console.log('Task data loaded:', task);
        console.log('Completion data check:');
        console.log('  - completion_notes:', task.completion_notes);
        console.log('  - completion_photos:', task.completion_photos);
        console.log('  - completion_pdf:', task.completion_pdf);
        console.log('  - completion_submitted_date:', task.completion_submitted_date);
        console.log('  - admin_approval_notes:', task.admin_approval_notes);

        const modal = document.getElementById('completionDetailsModal');
        const content = document.getElementById('completionDetailsContent');
        
        console.log('Completion details modal found:', modal);
        console.log('Completion details content found:', content);
        
        if (!modal || !content) {
            console.error('Modal or content elements not found');
            showAlert('danger', 'Modal elements not found. Please refresh the page.');
            return;
        }
        
        // Update modal title based on task status
        const modalTitle = document.getElementById('completionDetailsModalLabel');
        if (modalTitle) {
            if (task.status === 'complete') {
                modalTitle.innerHTML = '<i class="bi bi-check-circle text-success me-2"></i>Task Complete Details';
            } else if (task.status === 'pending_approval') {
                modalTitle.innerHTML = '<i class="bi bi-clock-history text-warning me-2"></i>Task Completion Details';
            } else {
                modalTitle.innerHTML = '<i class="bi bi-info-circle text-info me-2"></i>Task Details';
            }
        }
        
        // Get status badge color based on task status
        const getStatusBadge = (status) => {
            const statusMap = {
                'pending': 'bg-secondary',
                'in_progress': 'bg-primary',
                'pending_approval': 'bg-warning',
                'complete': 'bg-success'
            };
            return statusMap[status] || 'bg-secondary';
        };
        
        // Get status display name
        const getStatusDisplayName = (status) => {
            const statusMap = {
                'pending': 'Pending',
                'in_progress': 'In Progress',
                'pending_approval': 'Pending Approval',
                'complete': 'Completed'
            };
            return statusMap[status] || status;
        };
        
        // Build completion content
        let completionContent = `
            <div class="row g-3">
                <div class="col-md-6">
                    <h6 class="text-primary">Task Information</h6>
                    <p><strong>Task:</strong> ${escapeHtml(task.task_name || task.name)}</p>
                    <p><strong>Employee:</strong> ${escapeHtml(task.employee_name || task.assigned_employee || 'Unassigned')}</p>
                    <p><strong>Status:</strong> <span class="badge ${getStatusBadge(task.status)}">${getStatusDisplayName(task.status)}</span></p>
                    <p><strong>Assigned Date:</strong> ${formatDate(task.assigned_date || task.created_date)}</p>
                    ${task.completion_submitted_date ? `<p><strong>Submitted Date:</strong> ${formatDate(task.completion_submitted_date)}</p>` : ''}
                    ${task.status === 'complete' && task.completed_date ? `<p><strong>Completed Date:</strong> ${formatDate(task.completed_date)}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6 class="text-success">Land Information</h6>
                    <p><strong>Land:</strong> ${escapeHtml(task.land_name || 'Unknown')}</p>
                    <p><strong>Location:</strong> ${escapeHtml(task.land_location || task.land_village || 'Unknown')}</p>
                    ${task.due_date ? `<p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>` : ''}
                </div>
            </div>
        `;
        
        // Show completion details if available (same as land_tasks.js)
        if (task.completion_notes || task.completion_photos || task.completion_pdf) {
            completionContent += `<hr class="my-4">`;
            completionContent += `<h6 class="text-info mb-3"><i class="bi bi-upload me-2"></i>Employee Uploads</h6>`;
            
            if (task.completion_notes) {
                completionContent += `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6 class="text-primary">Completion Notes</h6>
                            <div class="alert alert-light border p-3">${escapeHtml(task.completion_notes)}</div>
                        </div>
                    </div>
                `;
            }
            
            if (task.completion_photos) {
                completionContent += `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6 class="text-primary">Completion Photos</h6>
                            <div class="text-center">
                                <img src="${task.completion_photos}" alt="Completion Photo" class="img-fluid rounded shadow-sm" style="max-width: 100%; max-height: 400px;">
                            </div>
                        </div>
                    </div>
                `;
            }
            
            if (task.completion_pdf) {
                completionContent += `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h6 class="text-primary">Completion Documents</h6>
                            <div class="text-center">
                                <a href="${task.completion_pdf}" target="_blank" class="btn btn-outline-primary">
                                    <i class="bi bi-file-earmark-pdf me-2"></i>
                                    View Document
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // Show admin notes if available (for completed tasks)
        if (task.admin_approval_notes && task.status === 'complete') {
            completionContent += `<hr class="my-4">`;
            completionContent += `
                <div class="row">
                    <div class="col-12">
                        <h6 class="text-success"><i class="bi bi-shield-check me-2"></i>Admin Approval Notes</h6>
                        <div class="alert alert-success border p-3">${escapeHtml(task.admin_approval_notes)}</div>
                    </div>
                </div>
            `;
        }
        
        // Show appropriate message for tasks without completion data
        if (!task.completion_notes && !task.completion_photos && !task.completion_pdf) {
            if (task.status === 'pending' || task.status === 'in_progress') {
                completionContent += `
                    <hr class="my-4">
                    <div class="row">
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <strong>Task in Progress:</strong> This task is currently being worked on. Completion details will appear here once the employee submits their work.
                            </div>
                        </div>
                    </div>
                `;
            } else if (task.status === 'complete') {
                completionContent += `
                    <hr class="my-4">
                    <div class="row">
                        <div class="col-12">
                            <div class="alert alert-success">
                                <i class="bi bi-check-circle me-2"></i>
                                <strong>Task Completed:</strong> This task has been completed and approved. No additional completion details were uploaded by the employee.
                            </div>
                        </div>
                    </div>
                `;
            } else if (task.status === 'pending_approval') {
                completionContent += `
                    <hr class="my-4">
                    <div class="row">
                        <div class="col-12">
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>No Completion Details:</strong> This task is pending approval but no completion details were found. The employee may not have submitted completion information.
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        content.innerHTML = completionContent;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (error) {
        console.error('Error loading completion details:', error);
        showAlert('danger', 'Failed to load completion details. Please try again.');
    }
}

// Handle task approval
async function approveTaskCompletion() {
    if (!currentApprovalTaskId) {
        showAlert('danger', 'No task selected for approval');
        return;
    }

    const adminNotes = document.getElementById('adminNotes').value.trim();
    
    try {
        showLoadingOverlay();
        
        console.log('Approving task completion:', currentApprovalTaskId);
        console.log('Admin notes:', adminNotes);
        
        const response = await fetch(`/api/tasks/${currentApprovalTaskId}/approve-completion/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCSRFToken()
            },
            body: `admin_notes=${encodeURIComponent(adminNotes)}`
        });

        console.log('Approval response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Approval response data:', data);
        
        if (data.success) {
            showAlert('success', 'Task approved successfully!');
            bootstrap.Modal.getInstance(document.getElementById('adminApprovalModal')).hide();
            document.getElementById('adminApprovalForm').reset();
            currentApprovalTaskId = null;
            
            // Reload page to update dashboard
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showAlert('danger', 'Failed to approve task: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving task:', error);
        showAlert('danger', 'Failed to approve task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Handle task reassignment
async function reassignTask() {
    if (!currentReassignmentTaskId) {
        showAlert('danger', 'No task selected for reassignment');
        return;
    }

    const reassignmentNotes = document.getElementById('reassignmentNotes').value.trim();
    
    try {
        showLoadingOverlay();
        
        console.log('Reassigning task:', currentReassignmentTaskId);
        console.log('Notes:', reassignmentNotes);
        
        const formData = new FormData();
        formData.append('reassignment_notes', reassignmentNotes);
        
        const response = await fetch(`/api/tasks/${currentReassignmentTaskId}/reassign/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        console.log('Reassignment response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Reassignment response data:', data);
        
        if (data.success) {
            showAlert('success', 'Task reassigned successfully!');
            bootstrap.Modal.getInstance(document.getElementById('taskReassignmentModal')).hide();
            document.getElementById('taskReassignmentForm').reset();
            currentReassignmentTaskId = null;
            
            // Reload page to update dashboard
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showAlert('danger', 'Failed to reassign task: ' + data.message);
        }
    } catch (error) {
        console.error('Error reassigning task:', error);
        showAlert('danger', 'Failed to reassign task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Setup form event listeners for approval and reassignment
function setupApprovalForms() {
    const approvalForm = document.getElementById('adminApprovalForm');
    const reassignmentForm = document.getElementById('taskReassignmentForm');
    
    if (approvalForm) {
        approvalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            approveTaskCompletion();
        });
    }
    
    if (reassignmentForm) {
        reassignmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            reassignTask();
        });
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility function to format dates (same as land_tasks.js)
function formatDate(dateString) {
    if (!dateString) return 'Not set';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

// Utility function to get CSRF token
function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// Loading overlay functions
function showLoadingOverlay() {
    // Create loading overlay if it doesn't exist
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        overlay.innerHTML = `
            <div class="loading-content text-center text-white">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Processing...</p>
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

// Initialize approval forms when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up approval forms');
    setupApprovalForms();
    
    // Check if functions are available
    console.log('showApprovalModal function available:', typeof showApprovalModal);
    console.log('showReassignModal function available:', typeof showReassignModal);
    console.log('viewCompletionDetails function available:', typeof viewCompletionDetails);
    
    // Check if modals are found
    console.log('adminApprovalModal found:', document.getElementById('adminApprovalModal'));
    console.log('taskReassignmentModal found:', document.getElementById('taskReassignmentModal'));
    console.log('completionDetailsModal found:', document.getElementById('completionDetailsModal'));
    
    // Check if Bootstrap is available
    console.log('Bootstrap Modal available:', typeof bootstrap !== 'undefined' && bootstrap.Modal);
    
    // Setup Add Task modal employee selection
    const assignEmployeeSelect = document.getElementById('assignEmployee');
    if (assignEmployeeSelect) {
        console.log('Employee select found, adding event listener');
        assignEmployeeSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            console.log('Employee selected:', selectedOption.value, selectedOption.text);
            if (selectedOption.value && selectedOption.value !== '') {
                addEmployeeToSelection(selectedOption.value, selectedOption.text);
                this.selectedIndex = 0; // Reset to first option
            }
        });
    } else {
        console.error('Employee select not found!');
    }
});

// Make functions globally available (same as land_tasks.js)
window.showApprovalModal = showApprovalModal;
window.showReassignModal = showReassignModal;
window.viewCompletionDetails = viewCompletionDetails;

// Add Task Modal Functions
let selectedEmployees = [];

function openAddTaskModal() {
    console.log('openAddTaskModal called');
    
    const modalElement = document.getElementById('addTaskModal');
    console.log('Modal element found:', modalElement);
    
    if (!modalElement) {
        console.error('Add Task Modal not found!');
        showAlert('Modal not found. Please refresh the page.', 'danger');
        return;
    }
    
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap not loaded!');
        showAlert('Bootstrap not loaded. Please refresh the page.', 'danger');
        return;
    }
    
    try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('Modal opened successfully');
        
        // Reset form and clear selected employees
        const form = document.getElementById('addTaskForm');
        if (form) {
            form.reset();
            console.log('Form reset successfully');
        } else {
            console.error('Add Task Form not found!');
        }
        
        clearAllEmployees();
        console.log('Employees cleared successfully');
        
        // Setup Marketing Task toggle after a small delay to ensure DOM is ready
        setTimeout(() => {
            setupMarketingTaskToggle();
            console.log('Marketing Task toggle setup completed');
        }, 100);
        
    } catch (error) {
        console.error('Error opening modal:', error);
        showAlert('Error opening modal: ' + error.message, 'danger');
    }
}

// Setup Marketing Task toggle functionality
function setupMarketingTaskToggle() {
    console.log('Setting up marketing task toggle...');
    const marketingTaskToggle = document.getElementById('marketingTask');
    const marketingTaskLabel = document.getElementById('marketingTaskLabel');
    
    console.log('Toggle element:', marketingTaskToggle);
    console.log('Label element:', marketingTaskLabel);
    
    if (marketingTaskToggle && marketingTaskLabel) {
        // Remove any existing event listeners
        marketingTaskToggle.removeEventListener('change', handleToggleChange);
        
        // Add new event listener
        marketingTaskToggle.addEventListener('change', handleToggleChange);
        
        // Set initial state
        marketingTaskToggle.checked = false;
        marketingTaskToggle.value = 'false';
        marketingTaskLabel.textContent = 'No';
        marketingTaskLabel.classList.remove('text-success');
        marketingTaskLabel.classList.add('text-muted');
        
        console.log('Marketing task toggle initialized successfully');
    } else {
        console.error('Marketing task toggle elements not found!');
    }
}

// Handle toggle change event
function handleToggleChange() {
    const marketingTaskLabel = document.getElementById('marketingTaskLabel');
    
    if (this.checked) {
        this.value = 'true';
        marketingTaskLabel.textContent = 'Yes';
        marketingTaskLabel.classList.add('text-success');
        marketingTaskLabel.classList.remove('text-muted');
        // Show Marketing Employee option in dropdown
        showMarketingEmployeeOption();
    } else {
        this.value = 'false';
        marketingTaskLabel.textContent = 'No';
        marketingTaskLabel.classList.add('text-muted');
        marketingTaskLabel.classList.remove('text-success');
        // Hide Marketing Employee option in dropdown
        hideMarketingEmployeeOption();
    }
}

// Function to show Marketing Employee option in dropdown
function showMarketingEmployeeOption() {
    const assignEmployeeSelect = document.getElementById('assignEmployee');
    if (assignEmployeeSelect) {
        // Check if Marketing Employee option already exists
        const existingOption = assignEmployeeSelect.querySelector('option[value="marketing_employee"]');
        if (!existingOption) {
            // Create and add Marketing Employee option
            const marketingOption = document.createElement('option');
            marketingOption.value = 'marketing_employee';
            marketingOption.textContent = 'Marketing Employee';
            marketingOption.disabled = false;
            marketingOption.style.fontStyle = 'italic';
            marketingOption.style.color = '#007bff';
            
            // Insert after the first "Select Employee" option
            const firstOption = assignEmployeeSelect.querySelector('option[value=""]');
            if (firstOption) {
                firstOption.insertAdjacentElement('afterend', marketingOption);
            } else {
                assignEmployeeSelect.insertBefore(marketingOption, assignEmployeeSelect.firstChild);
            }
        }
    }
}

// Function to hide Marketing Employee option in dropdown
function hideMarketingEmployeeOption() {
    const assignEmployeeSelect = document.getElementById('assignEmployee');
    if (assignEmployeeSelect) {
        const marketingOption = assignEmployeeSelect.querySelector('option[value="marketing_employee"]');
        if (marketingOption) {
            marketingOption.remove();
        }
    }
}

function submitTask() {
    console.log('submitTask called');
    
    const form = document.getElementById('addTaskForm');
    if (!form) {
        console.error('Add Task Form not found!');
        showAlert('Form not found. Please refresh the page.', 'danger');
        return;
    }
    
    const formData = new FormData(form);
    
    // Validate form
    const taskName = formData.get('task_name');
    const position = formData.get('position');
    const isDefault = formData.get('is_default');
    const completionDays = formData.get('completion_days');
    
    console.log('Form data:', { taskName, position, isDefault, completionDays, selectedEmployees });
    
    if (!taskName || !position || !isDefault || !completionDays) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    // Check if employees are selected
    if (selectedEmployees.length === 0) {
        showAlert('Please select at least one employee', 'danger');
        return;
    }
    
    // Update the hidden input with selected employees
    const selectedEmployeesInput = document.getElementById('selectedEmployeesInput');
    if (selectedEmployeesInput) {
        selectedEmployeesInput.value = selectedEmployees.map(emp => emp.id).join(',');
        console.log('Updated hidden input with employees:', selectedEmployeesInput.value);
    } else {
        console.error('Selected employees input not found!');
    }
    
    console.log('Submitting form with employees:', selectedEmployeesInput ? selectedEmployeesInput.value : 'No input found');
    
    // Show loading
    showLoadingOverlay();
    
    fetch('/add_task/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => {
        console.log('Response received:', response);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            showAlert(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            if (modal) {
                modal.hide();
                console.log('Modal closed successfully');
            }
            
            // Reset form and clear selected employees
            form.reset();
            clearAllEmployees();
            
            // Reload page to show new task (fast refresh)
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } else {
            showAlert(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('An error occurred while adding the task', 'danger');
    })
    .finally(() => {
        hideLoadingOverlay();
    });
}

function clearAllEmployees() {
    selectedEmployees = [];
    const selectedEmployeesBox = document.getElementById('selectedEmployeesBox');
    const selectedEmployeesList = document.getElementById('selectedEmployeesList');
    const selectedEmployeesInput = document.getElementById('selectedEmployeesInput');
    
    if (selectedEmployeesBox) selectedEmployeesBox.style.display = 'none';
    if (selectedEmployeesList) selectedEmployeesList.innerHTML = '';
    if (selectedEmployeesInput) selectedEmployeesInput.value = '';
}

function addEmployeeToSelection(employeeId, employeeName) {
    console.log('Adding employee to selection:', employeeId, employeeName);
    
    // Check if employee is already selected
    if (selectedEmployees.find(emp => emp.id === employeeId)) {
        console.log('Employee already selected, skipping');
        return;
    }
    
    selectedEmployees.push({ id: employeeId, name: employeeName });
    console.log('Employee added to selection. Total selected:', selectedEmployees.length);
    updateSelectedEmployeesDisplay();
}

function removeEmployeeFromSelection(employeeId) {
    selectedEmployees = selectedEmployees.filter(emp => emp.id !== employeeId);
    updateSelectedEmployeesDisplay();
}

function updateSelectedEmployeesDisplay() {
    console.log('Updating selected employees display. Count:', selectedEmployees.length);
    
    const selectedEmployeesBox = document.getElementById('selectedEmployeesBox');
    const selectedEmployeesList = document.getElementById('selectedEmployeesList');
    const selectedEmployeesInput = document.getElementById('selectedEmployeesInput');
    
    console.log('Elements found:', {
        box: selectedEmployeesBox,
        list: selectedEmployeesList,
        input: selectedEmployeesInput
    });
    
    if (selectedEmployees.length === 0) {
        if (selectedEmployeesBox) selectedEmployeesBox.style.display = 'none';
        if (selectedEmployeesInput) selectedEmployeesInput.value = '';
        console.log('No employees selected, hiding display');
        return;
    }
    
    if (selectedEmployeesBox) {
        selectedEmployeesBox.style.display = 'block';
        console.log('Showing employees box');
    }
    
    if (selectedEmployeesList) {
        const html = selectedEmployees.map(emp => 
            `<div class="selected-employee-item">
                <span>${emp.name}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeEmployeeFromSelection('${emp.id}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>`
        ).join('');
        selectedEmployeesList.innerHTML = html;
        console.log('Updated employees list HTML');
    }
    
    if (selectedEmployeesInput) {
        selectedEmployeesInput.value = selectedEmployees.map(emp => emp.id).join(',');
        console.log('Updated hidden input value:', selectedEmployeesInput.value);
    }
}

// Make Add Task functions globally available
window.openAddTaskModal = openAddTaskModal;
window.submitTask = submitTask;
window.clearAllEmployees = clearAllEmployees;
window.addEmployeeToSelection = addEmployeeToSelection;
window.removeEmployeeFromSelection = removeEmployeeFromSelection;
window.updateSelectedEmployeesDisplay = updateSelectedEmployeesDisplay;

// Add Employee Modal Functions
function openAddEmployeeModal() {
    // Reset form
    document.getElementById('addEmployeeForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
}

function submitNewEmployee() {
    const form = document.getElementById('addEmployeeForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const requiredFields = ['username', 'full_name', 'email', 'employee_type', 'password', 'mobile', 'location', 'status'];
    for (let field of requiredFields) {
        if (!formData.get(field)) {
            showAlert('danger', `Please fill in the ${field.replace('_', ' ')} field`);
            return;
        }
    }
    
    // Show loading
    showLoadingOverlay();
    
    fetch('/add_employee/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', data.message);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
            modal.hide();
            
            // Add new employee to dropdown
            addEmployeeToDropdown(data.employee);
            
            // Clear form
            form.reset();
            
        } else {
            showAlert('danger', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('danger', 'An error occurred while adding the employee');
    })
    .finally(() => {
        hideLoadingOverlay();
    });
}

function addEmployeeToDropdown(employee) {
    // Only add non-marketing employees to the Add Task modal dropdown
    if (employee.employee_type === 'marketing') {
        console.log('Skipping marketing employee:', employee.full_name || employee.username);
        return;
    }
    
    // Add to Add Task modal dropdown
    const addDropdown = document.getElementById('assignEmployee');
    if (addDropdown) {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.full_name || employee.username;
        addDropdown.appendChild(option);
        console.log('Added non-marketing employee to dropdown:', employee.full_name || employee.username);
    }
}

// Make employee functions globally available
window.openAddEmployeeModal = openAddEmployeeModal;
window.submitNewEmployee = submitNewEmployee;

// Export CSV functionality for Admin Dashboard
function exportDashboardData() {
  try {
    // Get all visible employees data
    const employees = [];
    document.querySelectorAll('.employee-item').forEach(row => {
      if (row.style.display !== 'none') {
        const id = row.querySelector('td:nth-child(1)')?.textContent.trim() || '';
        const name = row.querySelector('td:nth-child(2) .fw-bold')?.textContent.trim() || '';
        const type = row.querySelector('td:nth-child(3) .contact-type')?.textContent.trim() || '';
        const phone = row.querySelector('td:nth-child(4) .phone-number')?.textContent.trim().replace(/[^\d]/g, '') || '';
        const email = row.querySelector('td:nth-child(5) .email-address')?.textContent.trim() || '';
        const address = row.querySelector('td:nth-child(6)')?.textContent.trim() || '';
        const status = row.querySelector('td:nth-child(7) .badge')?.textContent.trim() || '';
        
        employees.push([id, name, type, phone, email, address, status]);
      }
    });

    // Get all tasks data
    const tasks = [];
    document.querySelectorAll('.task-row').forEach(row => {
      if (row.style.display !== 'none') {
        const taskName = row.querySelector('td:nth-child(1) .fw-bold')?.textContent.trim() || '';
        const position = row.querySelector('td:nth-child(2) .task-position')?.textContent.trim() || '';
        const isDefault = row.querySelector('td:nth-child(3) .badge')?.textContent.trim() || '';
        const completionDays = row.querySelector('td:nth-child(4) .completion-days')?.textContent.trim().replace(/\D/g, '') || '';
        const assignedEmployees = row.querySelector('td:nth-child(5) .assigned-employees')?.textContent.trim() || '';
        
        tasks.push([taskName, position, isDefault, completionDays, assignedEmployees]);
      }
    });

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add employees data
    if (employees.length > 0) {
      csvContent += "=== EMPLOYEES DATA ===\n";
      csvContent += "ID,Name,Type,Phone,Email,Address,Status\n";
      csvContent += employees.map(row => row.join(',')).join('\n');
      csvContent += "\n\n";
    }
    
    // Add tasks data
    if (tasks.length > 0) {
      csvContent += "=== TASKS DATA ===\n";
      csvContent += "Task Name,Position,Default,Completion Days,Assigned Employees\n";
      csvContent += tasks.map(row => row.join(',')).join('\n');
    }

    // Download CSV file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('success', 'Dashboard data exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    showAlert('danger', 'Error exporting data. Please try again.');
  }
}

// Refresh functionality for Admin Dashboard
function refreshDashboard() {
  try {
    // Simple refresh without animations - just like export button
    window.location.reload();
  } catch (error) {
    console.error('Refresh error:', error);
    // Fallback: immediate refresh
    window.location.reload();
  }
}

// Simple refresh functionality - no animations needed

 