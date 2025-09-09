// Marketing Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Marketing Dashboard loaded');
    
    // Initialize dashboard functionality
    initializeMarketingDashboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load dashboard data
    loadDashboardData();
});

/**
 * Initialize marketing dashboard
 */
function initializeMarketingDashboard() {
    console.log('Initializing Marketing Dashboard...');
    
    // Add loading animation to stat cards
    animateStatCards();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        initializeTooltips();
    }
    
    // Set up auto-refresh for real-time updates
    setupAutoRefresh();
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
    
    // Task items for detailed view
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.addEventListener('click', handleTaskItemClick);
    });
    
    // Refresh button (if exists)
    const refreshButton = document.querySelector('.refresh-btn');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshDashboard);
    }
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
 * Handle task item clicks
 */
function handleTaskItemClick(event) {
    const taskItem = event.currentTarget;
    const taskId = taskItem.getAttribute('data-task-id');
    
    if (taskId) {
        console.log('Task item clicked:', taskId);
        // You can implement task details modal here
        showTaskDetails(taskId);
    }
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
                <h6>Task Information</h6>
                <p><strong>Task ID:</strong> ${taskId}</p>
                <p><strong>Status:</strong> <span class="badge bg-primary">Active</span></p>
                <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                
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
 * Set up auto-refresh for dashboard data
 */
function setupAutoRefresh() {
    // Refresh dashboard data every 5 minutes
    setInterval(() => {
        console.log('Auto-refreshing dashboard data...');
        refreshDashboardData();
    }, 5 * 60 * 1000);
}

/**
 * Refresh dashboard data
 */
function refreshDashboardData() {
    // This would typically make an AJAX call to refresh data
    console.log('Refreshing dashboard data...');
    
    // Show refresh indicator
    showRefreshIndicator();
    
    // Simulate data refresh
    setTimeout(() => {
        hideRefreshIndicator();
        console.log('Dashboard data refreshed');
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
                    Refreshing dashboard...
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
 * Refresh entire dashboard
 */
function refreshDashboard() {
    console.log('Refreshing entire dashboard...');
    window.location.reload();
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // This would typically make AJAX calls to load:
    // - Task statistics
    // - Recent tasks
    // - Notifications
    // - etc.
    
    // For now, we'll just log that data is loaded
    console.log('Dashboard data loaded');
}

/**
 * Handle task status updates
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
 * Export dashboard data
 */
function exportDashboardData() {
    console.log('Exporting dashboard data...');
    
    // This would typically generate and download a report
    showNotification('Dashboard data exported successfully', 'success');
}

/**
 * Print dashboard
 */
function printDashboard() {
    console.log('Printing dashboard...');
    window.print();
}

// Global functions for task management
window.startTask = function(taskId) {
    console.log('Starting task:', taskId);
    updateTaskStatus(taskId, 'in_progress');
};

window.completeTask = function(taskId) {
    console.log('Completing task:', taskId);
    updateTaskStatus(taskId, 'complete');
};

// Export functions for global access
window.marketingDashboard = {
    refresh: refreshDashboard,
    export: exportDashboardData,
    print: printDashboard,
    showNotification: showNotification
};
