// Admin Status Management JavaScript
// Dedicated file for handling employee status changes

// Function to change employee status with improved logic
function changeStatus(employeeId) {
  console.log('changeStatus called for employee ID:', employeeId);
  
  // Get current status by looking at the badge text more carefully
  const statusBadge = document.querySelector(`tr[data-dev-id="${employeeId}"] .status-badge, .employee-card[data-dev-id="${employeeId}"] .status-badge`);
  
  if (!statusBadge) {
    console.error('Status badge not found for employee ID:', employeeId);
    showAlert('danger', 'Could not find status badge');
    return;
  }
  
  const currentStatusText = statusBadge.textContent.trim();
  console.log('Current status text:', currentStatusText);
  
  // Determine current status based on badge text and classes
  let currentStatus = 'active'; // default
  if (currentStatusText.toLowerCase() === 'inactive' || statusBadge.classList.contains('bg-secondary')) {
    currentStatus = 'inactive';
  } else if (currentStatusText.toLowerCase() === 'active' || statusBadge.classList.contains('bg-success')) {
    currentStatus = 'active';
  }
  
  console.log('Detected current status:', currentStatus);
  
  // Toggle status
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  console.log('New status will be:', newStatus);
  
  const confirmMessage = `Do you want to change the status from "${currentStatus}" to "${newStatus}"?`;
  
  if (!confirm(confirmMessage)) {
    console.log('User cancelled status change');
    return;
  }
  
  // Get CSRF token
  function getCSRFToken() {
    const token = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                  document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                  document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    return token;
  }
  
  const csrfToken = getCSRFToken();
  console.log('CSRF Token found:', !!csrfToken);
  
  // Show loading state
  statusBadge.innerHTML = '<i class="bi bi-hourglass-split"></i> Updating...';
  
  fetch(`/change_employee_status/${employeeId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus })
  })
  .then(response => {
    console.log('Response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Response data:', data);
    
    if (data.success) {
             // Update the status badge in both list and grid views
       const statusBadges = document.querySelectorAll(`tr[data-dev-id="${employeeId}"] .status-badge, .employee-card[data-dev-id="${employeeId}"] .status-badge`);
      console.log('Found status badges to update:', statusBadges.length);
      
             statusBadges.forEach(badge => {
         badge.className = newStatus === 'active' ? 'badge status-badge clickable bg-success' : 'badge status-badge clickable bg-secondary';
         badge.textContent = newStatus === 'active' ? 'Active' : 'Inactive';
       });
      
      showAlert('success', `Employee status updated to ${newStatus}`);
      
      // Auto refresh the page after 500ms (faster)
      setTimeout(() => {
        console.log('Refreshing page...');
        window.location.reload();
      }, 500);
         } else {
       // Restore original status on failure
       statusBadge.className = currentStatus === 'active' ? 'badge status-badge clickable bg-success' : 'badge status-badge clickable bg-secondary';
       statusBadge.textContent = currentStatus === 'active' ? 'Active' : 'Inactive';
      
      showAlert('danger', data.message || 'Failed to update status');
    }
  })
     .catch(error => {
     console.error('Error:', error);
     
     // Restore original status on error
     statusBadge.className = currentStatus === 'active' ? 'badge status-badge clickable bg-success' : 'badge status-badge clickable bg-secondary';
     statusBadge.textContent = currentStatus === 'active' ? 'Active' : 'Inactive';
    
    showAlert('danger', 'An error occurred while updating status');
  });
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
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 3000);
}

// Initialize status management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin Status JS loaded');
  
  // Add hover effects for clickable status badges
  const style = document.createElement('style');
  style.textContent = `
    .status-badge.clickable {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .status-badge.clickable:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .status-badge.clickable:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);
  
  // Add click event listeners to all change status links
  document.querySelectorAll('a[onclick*="changeStatus"]').forEach(link => {
    console.log('Found change status link:', link);
  });
});

// Export for global access
window.changeStatus = changeStatus;
window.showAlert = showAlert; 