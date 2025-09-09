// Marketing Tasks JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Marketing Tasks page loaded');
    
    // Initialize tasks functionality
    initializeMarketingTasks();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load tasks data
    loadTasksData();
});

/**
 * Initialize marketing tasks page
 */
function initializeMarketingTasks() {
    console.log('Initializing Marketing Tasks...');
    
    // Add loading animation to stat cards
    animateStatCards();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        initializeTooltips();
    }
    
    // Set up auto-refresh for real-time updates
    setupAutoRefresh();
    
    // Initialize filters
    initializeFilters();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Task rows for detailed view
    const taskRows = document.querySelectorAll('.table tbody tr');
    taskRows.forEach(row => {
        row.addEventListener('click', handleTaskRowClick);
    });
    
    // Filter form
    const filterForm = document.querySelector('form[method="GET"]');
    if (filterForm) {
        filterForm.addEventListener('submit', handleFilterSubmit);
    }
    
    // Filter inputs for real-time filtering
    const filterInputs = document.querySelectorAll('#status, #search, #sort');
    filterInputs.forEach(input => {
        input.addEventListener('change', handleFilterChange);
    });
    
    // Task action buttons
    const startButtons = document.querySelectorAll('[onclick*="startTask"]');
    startButtons.forEach(button => {
        button.addEventListener('click', handleStartTask);
    });
    
    const completeButtons = document.querySelectorAll('[onclick*="completeTask"]');
    completeButtons.forEach(button => {
        button.addEventListener('click', handleCompleteTask);
    });
}

/**
 * Handle quick action button clicks
 */
function handleQuickAction(event) {
    const button = event.currentTarget;
    const action = button.getAttribute('href') || button.getAttribute('data-action');
    
    console.log('Quick action clicked:', action);
    
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;
    
    // Remove loading state after navigation
    setTimeout(() => {
        button.classList.remove('loading');
        button.disabled = false;
    }, 1000);
}

/**
 * Handle task row clicks
 */
function handleTaskRowClick(event) {
    const row = event.currentTarget;
    const taskId = row.getAttribute('data-task-id');
    
    // Don't trigger if clicking on action buttons
    if (event.target.closest('.action-buttons')) {
        return;
    }
    
    if (taskId) {
        console.log('Task row clicked:', taskId);
        showTaskDetails(taskId);
    }
}

/**
 * Handle filter form submission
 */
function handleFilterSubmit(event) {
    console.log('Filter form submitted');
    
    // Add loading state to form
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
        submitButton.classList.add('loading');
        submitButton.disabled = true;
    }
    
    // Form will submit normally, loading state will be removed on page reload
}

/**
 * Handle filter changes for real-time filtering
 */
function handleFilterChange(event) {
    const input = event.target;
    const form = input.closest('form');
    
    console.log('Filter changed:', input.name, input.value);
    
    // Auto-submit form after a short delay
    clearTimeout(window.filterTimeout);
    window.filterTimeout = setTimeout(() => {
        if (form) {
            form.submit();
        }
    }, 500);
}

/**
 * Handle start task button clicks
 */
function handleStartTask(event) {
    event.stopPropagation(); // Prevent row click
    
    const button = event.currentTarget;
    const taskId = extractTaskIdFromOnclick(button.getAttribute('onclick'));
    
    if (taskId) {
        startTask(taskId);
    }
}

/**
 * Handle complete task button clicks
 */
function handleCompleteTask(event) {
    event.stopPropagation(); // Prevent row click
    
    const button = event.currentTarget;
    const taskId = extractTaskIdFromOnclick(button.getAttribute('onclick'));
    
    if (taskId) {
        completeTask(taskId);
    }
}

/**
 * Extract task ID from onclick attribute
 */
function extractTaskIdFromOnclick(onclick) {
    if (!onclick) return null;
    
    const match = onclick.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : null;
}

/**
 * Show task details modal
 */
function showTaskDetails(taskId) {
    console.log('Showing task details for:', taskId);
    
    // Create and show modal
    const modal = createTaskDetailsModal(taskId);
    document.body.appendChild(modal);
    
    // Show modal using Bootstrap
    if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Remove modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modal);
        });
    }
}

/**
 * Create task details modal
 */
function createTaskDetailsModal(taskId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'taskDetailsModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-list-task me-2"></i>Task Details
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading task details...</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Load task details
    loadTaskDetails(taskId, modal);
    
    return modal;
}

/**
 * Load task details via AJAX
 */
function loadTaskDetails(taskId, modal) {
    // This would typically make an AJAX call to get task details
    // For now, we'll simulate loading
    setTimeout(() => {
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="task-details">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Task Information</h6>
                        <p><strong>Task ID:</strong> ${taskId}</p>
                        <p><strong>Status:</strong> <span class="badge bg-primary">Active</span></p>
                        <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Due Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Land Information</h6>
                        <p><strong>Land Name:</strong> Sample Land</p>
                        <p><strong>Location:</strong> Sample Village, Sample Taluka</p>
                        <p><strong>Area:</strong> 1000 sq m</p>
                    </div>
                </div>
                
                <h6 class="mt-3">Description</h6>
                <p>This is a sample task description. In a real implementation, this would be loaded from the server.</p>
                
                <h6 class="mt-3">Actions</h6>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm" onclick="startTask(${taskId})">
                        <i class="bi bi-play me-1"></i>Start Task
                    </button>
                    <button class="btn btn-success btn-sm" onclick="completeTask(${taskId})">
                        <i class="bi bi-check me-1"></i>Complete Task
                    </button>
                </div>
            </div>
        `;
    }, 1000);
}

/**
 * Animate stat cards on load
 */
function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Set up auto-refresh for tasks data
 */
function setupAutoRefresh() {
    // Refresh tasks data every 3 minutes
    setInterval(() => {
        console.log('Auto-refreshing tasks data...');
        refreshTasksData();
    }, 3 * 60 * 1000);
}

/**
 * Refresh tasks data
 */
function refreshTasksData() {
    // This would typically make an AJAX call to refresh data
    console.log('Refreshing tasks data...');
    
    // Show refresh indicator
    showRefreshIndicator();
    
    // Simulate data refresh
    setTimeout(() => {
        hideRefreshIndicator();
        console.log('Tasks data refreshed');
    }, 2000);
}

/**
 * Show refresh indicator
 */
function showRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'refreshIndicator';
    indicator.className = 'position-fixed top-0 end-0 p-3';
    indicator.style.zIndex = '9999';
    indicator.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-body">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Refreshing tasks...
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(indicator);
}

/**
 * Hide refresh indicator
 */
function hideRefreshIndicator() {
    const indicator = document.getElementById('refreshIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Initialize filters
 */
function initializeFilters() {
    console.log('Initializing filters...');
    
    // Set up search input with debouncing
    const searchInput = document.getElementById('search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                console.log('Search query:', this.value);
                // Auto-submit form after typing stops
                const form = this.closest('form');
                if (form) {
                    form.submit();
                }
            }, 1000);
        });
    }
}

/**
 * Load tasks data
 */
function loadTasksData() {
    console.log('Loading tasks data...');
    
    // This would typically make AJAX calls to load:
    // - Task list
    // - Task statistics
    // - Filter options
    // etc.
    
    // For now, we'll just log that data is loaded
    console.log('Tasks data loaded');
}

/**
 * Start task
 */
function startTask(taskId) {
    if (confirm('Are you sure you want to start this task?')) {
        console.log('Starting task:', taskId);
        
        // Show loading state
        showLoadingState(taskId, 'Starting...');
        
        // This would typically make an AJAX call to start the task
        setTimeout(() => {
            hideLoadingState(taskId);
            updateTaskStatus(taskId, 'in_progress');
            showNotification('Task started successfully', 'success');
        }, 2000);
    }
}

/**
 * Complete task
 */
function completeTask(taskId) {
    if (confirm('Are you sure you want to mark this task as complete?')) {
        console.log('Completing task:', taskId);
        
        // Show loading state
        showLoadingState(taskId, 'Completing...');
        
        // This would typically make an AJAX call to complete the task
        setTimeout(() => {
            hideLoadingState(taskId);
            updateTaskStatus(taskId, 'complete');
            showNotification('Task completed successfully', 'success');
        }, 2000);
    }
}

/**
 * Show loading state for a task
 */
function showLoadingState(taskId, message) {
    const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
    if (taskRow) {
        taskRow.classList.add('loading');
        const actionCell = taskRow.querySelector('.action-buttons');
        if (actionCell) {
            actionCell.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <small>${message}</small>
                </div>
            `;
        }
    }
}

/**
 * Hide loading state for a task
 */
function hideLoadingState(taskId) {
    const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
    if (taskRow) {
        taskRow.classList.remove('loading');
        // Reload the page to get updated data
        window.location.reload();
    }
}

/**
 * Update task status
 */
function updateTaskStatus(taskId, newStatus) {
    console.log(`Updating task ${taskId} status to ${newStatus}`);
    
    // This would typically make an AJAX call to update task status
    // For now, we'll just show a notification
    
    showNotification(`Task status updated to ${newStatus}`, 'success');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

/**
 * Export tasks data
 */
function exportTasksData() {
    console.log('Exporting tasks data...');
    
    // This would typically generate and download a report
    showNotification('Tasks data exported successfully', 'success');
}

/**
 * Print tasks
 */
function printTasks() {
    console.log('Printing tasks...');
    window.print();
}

// Global functions for task management
window.startTask = startTask;
window.completeTask = completeTask;

// Export functions for global access
window.marketingTasks = {
    export: exportTasksData,
    print: printTasks,
    showNotification: showNotification,
    refresh: () => window.location.reload()
};
