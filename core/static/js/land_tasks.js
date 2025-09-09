// Land Tasks Page JavaScript

// Global variables
let currentTasks = [];
let currentTaskId = null;
let employees = [];
let currentApprovalTaskId = null;
let currentReassignmentTaskId = null;
let currentMarkCompleteTaskId = null;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Land Tasks page initialized');
    loadTasks();
    loadEmployees();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add task form submission
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', handleAddTask);
    }

    // Search input debouncing
    const searchInput = document.getElementById('searchTask');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterTasks();
            }, 300);
        });
    }

    // Setup approval and rejection forms
    setupApprovalForms();
}

// Load tasks for the current land
async function loadTasks() {
    try {
        console.log('Loading tasks for land ID:', window.landData.id);
        showLoadingSpinner();
        
        const response = await fetch(`/api/land/${window.landData.id}/tasks/`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success) {
            currentTasks = data.tasks || [];
            console.log('Loaded tasks:', currentTasks);
            displayTasks(currentTasks);
        } else {
            console.error('Error loading tasks:', data.message);
            showNoTasksMessage();
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showErrorMessage('Failed to load tasks. Please try again.');
        showNoTasksMessage();
    } finally {
        hideLoadingSpinner();
    }
}

// Load available employees
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees/', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            employees = data.employees || [];
            populateEmployeeFilters();
            populateEmployeeSelects();
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Get action buttons based on task status (same logic as admin_assigned_task)
function getActionButtons(task) {
    let buttons = '';
    
    // Show different buttons based on status
    if (task.status === 'pending_approval') {
        // For pending approval tasks, show View, Approve, and Reassign buttons
        buttons += `<button class="btn btn-sm btn-view" onclick="viewTaskDetails(${task.id})" title="View Task Details">
            <i class="bi bi-eye"></i>
        </button>`;
        
        // Only show admin actions for admin users
        if (window.userRole === 'admin') {
            buttons += `<button class="btn btn-sm btn-success" onclick="showApprovalModal(${task.id})" title="Approve Task">
                <i class="bi bi-check-circle"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-warning" onclick="showReassignModal(${task.id})" title="Reassign Task">
                <i class="bi bi-arrow-repeat"></i>
            </button>`;
        }
    } else if (task.status === 'complete') {
        // For completed tasks, show only View Details button with text
        buttons += `<button class="btn btn-sm btn-view" onclick="viewTaskDetails(${task.id})" title="View Task Details">
            <i class="bi bi-eye me-1"></i>View Details
        </button>`;
    } else if (task.status === 'pending' || task.status === 'in_progress') {
        // For pending and in_progress tasks, show View, Mark Complete, and Delete buttons
        buttons += `<button class="btn btn-sm btn-view" onclick="viewTaskDetails(${task.id})" title="View Task Details">
            <i class="bi bi-eye"></i>
        </button>`;
        
        // Only show admin actions for admin users
        if (window.userRole === 'admin') {
            buttons += `<button class="btn btn-sm btn-success" onclick="showMarkCompleteModal(${task.id})" title="Mark Task Complete">
                <i class="bi bi-check-circle"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-delete" onclick="deleteTask(${task.id})" title="Delete Task">
                <i class="bi bi-trash"></i>
            </button>`;
        }
    }
    
    return buttons;
}

// Get status display name helper function
function getStatusDisplayName(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'pending_approval': 'Pending Approval',
        'complete': 'Completed'
    };
    return statusMap[status] || status;
}

// Get status CSS class helper function
function getStatusCSSClass(status) {
    const statusMap = {
        'pending': 'pending',
        'in_progress': 'in-progress',
        'pending_approval': 'pending-approval',
        'complete': 'complete'
    };
    return statusMap[status] || 'pending';
}

// Display tasks in the table
function displayTasks(tasks) {
    console.log('Displaying tasks:', tasks);
    const tableBody = document.getElementById('tasksTableBody');
    const noTasksMessage = document.getElementById('noTasksMessage');
    
    if (!tableBody) {
        console.error('Table body element not found!');
        return;
    }
    
    if (tasks.length === 0) {
        console.log('No tasks to display, showing no tasks message');
        tableBody.innerHTML = '';
        showNoTasksMessage();
        return;
    }
    
    console.log('Hiding no tasks message and displaying tasks');
    hideNoTasksMessage();
    
    tableBody.innerHTML = tasks.map(task => `
        <tr class="fade-in">
            <td>
                <div class="task-name">
                    <strong>${escapeHtml(task.task_name || task.name)}</strong>
                </div>
                ${task.description ? `<div class="task-description text-muted">${escapeHtml(task.description)}</div>` : ''}
            </td>
            <td>
                <div class="employee-info">
                    <span class="employee-avatar">${getInitials(task.employee_name || task.assigned_employee)}</span>
                    <span>${escapeHtml(task.employee_name || task.assigned_employee || 'Unassigned')}</span>
                </div>
            </td>
            <td>
                <span class="status-badge ${getStatusCSSClass(task.status || 'pending')}">${getStatusDisplayName(task.status || 'pending')}</span>
            </td>
            <td>
                <div class="due-date">
                    ${formatDate(task.due_date)}
                    ${isOverdue(task.due_date) ? '<span class="text-danger ms-2">⚠ Overdue</span>' : ''}
                </div>
            </td>
            <td>
                <div class="created-date">
                    ${formatDate(task.created_date || task.created_at)}
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    ${getActionButtons(task)}
                </div>
            </td>
        </tr>
    `).join('');
}



// Filter tasks based on current filters
function filterTasks() {
    const statusFilter = document.getElementById('statusFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value;
    const searchTerm = document.getElementById('searchTask').value.toLowerCase();
    
    let filteredTasks = currentTasks.filter(task => {
        // Status filter
        if (statusFilter && task.status !== statusFilter) {
            return false;
        }
        
        // Employee filter
        if (employeeFilter && task.employee_name !== employeeFilter && task.assigned_employee !== employeeFilter) {
            return false;
        }
        
        // Search filter
        if (searchTerm) {
            const taskName = (task.task_name || task.name || '').toLowerCase();
            const description = (task.description || '').toLowerCase();
            const employeeName = (task.employee_name || task.assigned_employee || '').toLowerCase();
            
            if (!taskName.includes(searchTerm) && !description.includes(searchTerm) && !employeeName.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
    
    displayTasks(filteredTasks);
}

// Populate employee filters
function populateEmployeeFilters() {
    const employeeFilter = document.getElementById('employeeFilter');
    if (!employeeFilter) return;
    
    employeeFilter.innerHTML = '<option value="">All Employees</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.full_name || employee.username;
        option.textContent = employee.full_name || employee.username;
        employeeFilter.appendChild(option);
    });
}

// Populate employee selects in forms
function populateEmployeeSelects() {
    const employeeSelects = document.querySelectorAll('select[name="employee"]');
    employeeSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Employee</option>';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.full_name || employee.username;
            select.appendChild(option);
        });
    });
}

// Handle add task form submission
async function handleAddTask(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const taskData = {
        land_id: window.landData.id,
        task_name: formData.get('task_name'),
        due_date: formData.get('due_date'),
        priority: formData.get('priority'),
        employee_id: formData.get('employee'),
        description: formData.get('description')
    };
    
    try {
        showLoadingOverlay();
        
        const response = await fetch('/api/tasks/add/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Task added successfully!');
            bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
            event.target.reset();
            loadTasks(); // Reload tasks
        } else {
            showErrorMessage('Error adding task: ' + data.message);
        }
    } catch (error) {
        console.error('Error adding task:', error);
        showErrorMessage('Failed to add task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// View task details
async function viewTaskDetails(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            const task = data.task;
            showTaskDetailsModal(task);
        } else {
            showErrorMessage('Error loading task details: ' + data.message);
        }
    } catch (error) {
        console.error('Error loading task details:', error);
        showErrorMessage('Failed to load task details. Please try again.');
    }
}

// Show task details modal with comprehensive information (same as admin_assigned_task)
function showTaskDetailsModal(task) {
    const modalBody = document.getElementById('taskDetailsContent');
    

    
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

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    // Escape HTML helper
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    let modalContent = `
                    <div class="row g-3">
                        <div class="col-md-6">
                <h6 class="text-primary"><strong>Task Information</strong></h6>
                <p><strong>Task Name:</strong> ${escapeHtml(task.task_name || task.name)}</p>
                <p><strong>Status:</strong> <span class="status-badge ${getStatusCSSClass(task.status)}">${getStatusDisplayName(task.status)}</span></p>
                <p><strong>Assigned Date:</strong> ${formatDate(task.assigned_date || task.created_date || task.created_at)}</p>
                <p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>
                <p><strong>Completion Days:</strong> ${task.completion_days || 'Not set'}</p>
                ${task.completion_submitted_date ? `<p><strong>Submitted Date:</strong> ${formatDate(task.completion_submitted_date)}</p>` : ''}
                ${task.status === 'complete' && task.completed_date ? `<p><strong>Completed Date:</strong> ${formatDate(task.completed_date)}</p>` : ''}
                        </div>
                        <div class="col-md-6">
                <h6 class="text-success"><strong>Employee Information</strong></h6>
                <p><strong>Name:</strong> ${escapeHtml(task.employee_name || task.assigned_employee || 'Unassigned')}</p>
                <p><strong>Type:</strong> ${escapeHtml(task.employee_type || 'N/A')}</p>
                <p><strong>Location:</strong> ${escapeHtml(task.employee_location || 'N/A')}</p>
                        </div>
                        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6 class="text-info"><i class="bi bi-building me-2"></i><strong>Land Information</strong></h6>
                <div class="card border-info">
                    <div class="card-body p-3">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <p><strong>Land Name:</strong> ${escapeHtml(window.landData.name || 'N/A')}</p>
                                <p><strong>Location:</strong> ${escapeHtml(window.landData.village || 'N/A')}, ${escapeHtml(window.landData.taluka || 'N/A')}, ${escapeHtml(window.landData.district || 'N/A')}</p>
                                <p><strong>State:</strong> ${escapeHtml(window.landData.state || 'Gujarat')}</p>
                                <p><strong>Document Type:</strong> ${escapeHtml(window.landData.sata_prakar || 'N/A')}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Total Area:</strong> ${window.landData.total_area || 'N/A'} sq m</p>
                                <p><strong>Built-up Area:</strong> ${window.landData.built_up_area || 'N/A'} sq m</p>
                                <p><strong>Unutilized Area:</strong> ${window.landData.unutilized_area || 'N/A'} sq m</p>
                                <p><strong>Broker:</strong> ${escapeHtml(window.landData.broker_name || 'Not specified')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <h6 class="text-warning"><i class="bi bi-calendar-event me-2"></i><strong>Important Dates & Numbers</strong></h6>
                <div class="card border-warning">
                    <div class="card-body p-3">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <p><strong>Past Date:</strong> ${window.landData.past_date ? new Date(window.landData.past_date).toLocaleDateString('en-IN') : 'Not set'}</p>
                                <p><strong>Soda Tarikh:</strong> ${window.landData.soda_tarikh ? new Date(window.landData.soda_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                            </div>
                            <div class="col-md-3">
                                <p><strong>Banakhat Tarikh:</strong> ${window.landData.banakhat_tarikh ? new Date(window.landData.banakhat_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                <p><strong>Dastavej Tarikh:</strong> ${window.landData.dastavej_tarikh ? new Date(window.landData.dastavej_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                            </div>
                            <div class="col-md-3">
                                <p><strong>Old SR No:</strong> ${escapeHtml(window.landData.old_sr_no || 'Not specified')}</p>
                                <p><strong>New SR No:</strong> ${escapeHtml(window.landData.new_sr_no || 'Not specified')}</p>
                            </div>
                            <div class="col-md-3">
                                <p><strong>Land ID:</strong> ${window.landData.id || 'N/A'}</p>
                                <p><strong>Document Type:</strong> ${escapeHtml(window.landData.sata_prakar || 'N/A')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Show completion details if available (for pending_approval and complete tasks)
    if (task.completion_notes || task.completion_photos || task.completion_pdf) {
        modalContent += `<hr class="my-4">`;
        modalContent += `<h6 class="text-info mb-3"><i class="bi bi-upload me-2"></i>Employee Uploads</h6>`;
        
        if (task.completion_notes) {
            modalContent += `
                <div class="row mb-3">
                    <div class="col-12">
                        <h6 class="text-primary">Completion Notes</h6>
                        <div class="alert alert-light border p-3">${escapeHtml(task.completion_notes)}</div>
                        </div>
                        </div>
            `;
        }
        
        if (task.completion_photos) {
            modalContent += `
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
            modalContent += `
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
        modalContent += `<hr class="my-4">`;
        modalContent += `
            <div class="row">
                <div class="col-12">
                    <h6 class="text-success"><i class="bi bi-shield-check me-2"></i>Admin Approval Notes</h6>
                    <div class="alert alert-success border p-3">${escapeHtml(task.admin_approval_notes)}</div>
                </div>
            </div>
        `;
    }

    // Show reassignment notes if available (for in_progress tasks that were reassigned)
    if (task.admin_approval_notes && task.status === 'in_progress' && task.admin_approval_notes.includes('Task reassigned with notes:')) {
        const reassignmentNotes = task.admin_approval_notes.replace('Task reassigned with notes:', '').trim();
        modalContent += `<hr class="my-4">`;
        modalContent += `
            <div class="row">
                <div class="col-12">
                    <h6 class="text-warning"><i class="bi bi-arrow-repeat me-2"></i>Reassignment Notes</h6>
                    <div class="alert alert-warning border p-3">
                        <strong>Task was reassigned with the following notes:</strong><br>
                        ${escapeHtml(reassignmentNotes)}
                    </div>
                </div>
            </div>
        `;
    }

    // Show appropriate message for tasks without completion data
    if (!task.completion_notes && !task.completion_photos && !task.completion_pdf) {
        if (task.status === 'pending' || task.status === 'in_progress') {
            modalContent += `
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
            modalContent += `
                <hr class="my-4">
                <div class="row">
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="bi bi-check-circle me-2"></i>
                            <strong>Task Completed:</strong> This task has been completed and approved. No additional completion details were uploaded by the employee.
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    modalBody.innerHTML = modalContent;

    const modal = new bootstrap.Modal(document.getElementById('taskDetailsModal'));
    modal.show();
}

// Approve/Complete task
async function approveTask(taskId) {
    if (!confirm('Are you sure you want to mark this task as completed?')) {
        return;
    }
    
    try {
        showLoadingOverlay();
        
        // Check if task is in the right status for this action
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) {
            showErrorMessage('Task not found');
            return;
        }
        
        if (task.status === 'pending_approval') {
            showErrorMessage('This task is pending approval. Use the "Review & Approve" button instead.');
            return;
        }
        
        if (task.status === 'complete') {
            showErrorMessage('This task is already completed.');
            return;
        }
        
        const response = await fetch(`/api/tasks/${taskId}/approve-completion/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCSRFToken()
            },
            body: `admin_notes=Task marked as completed by admin`
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Task marked as completed!');
            loadTasks(); // Reload tasks
        } else {
            showErrorMessage('Error updating task: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving task:', error);
        showErrorMessage('Failed to update task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// View completion details
async function viewCompletionDetails(taskId) {
    try {
        // Find the task in the current tasks array
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) {
            showErrorMessage('Task not found');
            return;
        }

        // Debug: Log the task data to see what's available
        console.log('Task data for completion details:', task);
        console.log('Task ID:', task.id);
        console.log('Task Status:', task.status);
        console.log('Completion notes:', task.completion_notes);
        console.log('Completion photos:', task.completion_photos);
        console.log('Completion PDF:', task.completion_pdf);
        console.log('Completion submitted date:', task.completion_submitted_date);
        console.log('Completed date:', task.completed_date);
        console.log('Admin approval notes:', task.admin_approval_notes);
        
        // Check if completion data exists
        const hasCompletionData = task.completion_notes || task.completion_photos || task.completion_pdf;
        console.log('Has completion data:', hasCompletionData);

            const modal = document.getElementById('completionDetailsModal');
            const content = document.getElementById('completionDetailsContent');
        
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
            
            let completionContent = `
                <div class="row g-3">
                    <div class="col-md-6">
                        <h6 class="text-primary">Task Information</h6>
                        <p><strong>Task:</strong> ${escapeHtml(task.task_name || task.name)}</p>
                        <p><strong>Employee:</strong> ${escapeHtml(task.employee_name || task.assigned_employee || 'Unassigned')}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${getStatusCSSClass(task.status)}">${getStatusDisplayName(task.status)}</span></p>
                    <p><strong>Assigned Date:</strong> ${formatDate(task.assigned_date || task.created_date)}</p>
                    ${task.completion_submitted_date ? `<p><strong>Submitted Date:</strong> ${formatDate(task.completion_submitted_date)}</p>` : ''}
                    ${task.status === 'complete' && task.completed_date ? `<p><strong>Completed Date:</strong> ${formatDate(task.completed_date)}</p>` : ''}
                    </div>
                    <div class="col-md-6">
                        <h6 class="text-success">Land Information</h6>
                        <p><strong>Land:</strong> ${escapeHtml(window.landData.name)}</p>
                        <p><strong>Location:</strong> ${escapeHtml(window.landData.village)}</p>
                    ${task.due_date ? `<p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>` : ''}
                    </div>
                </div>
            `;
        
        // Show completion details if available
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
        showErrorMessage('Failed to load completion details. Please try again.');
    }
}

// Show admin approval modal
function showAdminApprovalModal(taskId) {
    window.currentApprovalTaskId = taskId;
    const modal = new bootstrap.Modal(document.getElementById('adminApprovalModal'));
    modal.show();
}

// Approve task completion (from employee submission)
async function approveTaskCompletion(taskId) {
    const taskIdToUse = taskId || window.currentApprovalTaskId;
    if (!taskIdToUse) return;
    
    const adminNotes = document.getElementById('adminNotes').value.trim();
    
    try {
        showLoadingOverlay();
        
        const formData = new FormData();
        formData.append('admin_notes', adminNotes);
        
        const response = await fetch(`/api/tasks/${taskIdToUse}/approve-completion/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Task completion approved successfully!');
            bootstrap.Modal.getInstance(document.getElementById('adminApprovalModal')).hide();
            document.getElementById('adminApprovalForm').reset();
            loadTasks(); // Reload tasks
        } else {
            showErrorMessage('Error approving task completion: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving task completion:', error);
        showErrorMessage('Failed to approve task completion. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Reject task completion
async function rejectTaskCompletion(taskId) {
    const taskIdToUse = taskId || window.currentApprovalTaskId;
    if (!taskIdToUse) return;
    
    const adminNotes = document.getElementById('adminNotes').value.trim();
    
    if (!adminNotes) {
        alert('Please provide rejection notes to explain why the completion was rejected.');
        return;
    }
    
    try {
        showLoadingOverlay();
        
        const formData = new FormData();
        formData.append('admin_notes', adminNotes);
        
        const response = await fetch(`/api/tasks/${taskIdToUse}/reject-completion/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Task completion rejected. Task returned to "In Progress" status.');
            bootstrap.Modal.getInstance(document.getElementById('adminApprovalModal')).hide();
            document.getElementById('adminApprovalForm').reset();
            loadTasks(); // Reload tasks
        } else {
            showErrorMessage('Error rejecting task completion: ' + data.message);
        }
    } catch (error) {
        console.error('Error rejecting task completion:', error);
        showErrorMessage('Failed to reject task completion. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Delete task
function deleteTask(taskId) {
    console.log('Delete task called with ID:', taskId);
    currentTaskId = taskId;
    const modal = document.getElementById('deleteTaskModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } else {
        console.error('Delete modal not found');
        showErrorMessage('Delete modal not found');
    }
}

// Confirm delete task
async function confirmDeleteTask() {
    console.log('Confirm delete task called, currentTaskId:', currentTaskId);
    if (!currentTaskId) {
        showErrorMessage('No task selected for deletion');
        return;
    }
    
    try {
        showLoadingOverlay();
        
        console.log('Sending delete request for task:', currentTaskId);
        const response = await fetch(`/api/tasks/${currentTaskId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Delete response data:', data);
        
        if (data.success) {
            showSuccessMessage('Task deleted successfully!');
            bootstrap.Modal.getInstance(document.getElementById('deleteTaskModal')).hide();
            loadTasks(); // Reload tasks
        } else {
            showErrorMessage('Error deleting task: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showErrorMessage('Failed to delete task. Please try again.');
    } finally {
        hideLoadingOverlay();
        currentTaskId = null;
    }
}

// Go back to previous page
function goBack() {
    window.history.back();
}

// Utility functions
function showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'block';
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    try {
        const due = new Date(dueDate);
        const now = new Date();
        return due < now;
    } catch (e) {
        return false;
    }
}

function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function showNoTasksMessage() {
    const message = document.getElementById('noTasksMessage');
    if (message) message.style.display = 'block';
}

function hideNoTasksMessage() {
    const message = document.getElementById('noTasksMessage');
    if (message) message.style.display = 'none';
}

function showSuccessMessage(message) {
    // You can implement a toast notification system here
    alert('Success: ' + message);
}

function showErrorMessage(message) {
    // You can implement a toast notification system here
    alert('Error: ' + message);
}

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
}

// Export functions for global access
window.viewTaskDetails = viewTaskDetails;
window.approveTask = approveTask;
window.approveTaskCompletion = approveTaskCompletion;
window.rejectTaskCompletion = rejectTaskCompletion;
window.deleteTask = deleteTask;
window.goBack = goBack;
window.filterTasks = filterTasks;
window.confirmDeleteTask = confirmDeleteTask;

// Task Approval and Rejection Functions

// Show approval modal
function showApprovalModal(taskId) {
    currentApprovalTaskId = taskId;
    const modal = new bootstrap.Modal(document.getElementById('adminApprovalModal'));
    modal.show();
}

// Show reassignment modal
function showReassignModal(taskId) {
    currentReassignmentTaskId = taskId;
    const modal = new bootstrap.Modal(document.getElementById('taskReassignmentModal'));
    modal.show();
}

// Show mark complete modal
function showMarkCompleteModal(taskId) {
    currentMarkCompleteTaskId = taskId;
    const modal = new bootstrap.Modal(document.getElementById('markCompleteModal'));
    modal.show();
}

// Handle task reassignment
async function reassignTask() {
    if (!currentReassignmentTaskId) {
        showErrorMessage('No task selected for reassignment');
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
            showSuccessMessage('Task reassigned successfully!');
            bootstrap.Modal.getInstance(document.getElementById('taskReassignmentModal')).hide();
            document.getElementById('taskReassignmentForm').reset();
            currentReassignmentTaskId = null;
            
            // Reload tasks to update the display
            loadTasks();
        } else {
            showErrorMessage('Failed to reassign task: ' + data.message);
        }
    } catch (error) {
        console.error('Error reassigning task:', error);
        showErrorMessage('Failed to reassign task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Handle mark complete
async function handleMarkComplete() {
    if (!currentMarkCompleteTaskId) {
        showErrorMessage('No task selected for marking complete');
        return;
    }

    const markCompleteNotes = document.getElementById('markCompleteNotes').value.trim();
    
    try {
        showLoadingOverlay();
        
        console.log('Marking task complete:', currentMarkCompleteTaskId);
        console.log('Notes:', markCompleteNotes);
        
        const response = await fetch(`/api/tasks/${currentMarkCompleteTaskId}/mark-complete/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                mark_complete_notes: markCompleteNotes
            })
        });

        console.log('Mark complete response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Mark complete response data:', data);
        
        if (data.success) {
            showSuccessMessage('Task marked as complete successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('markCompleteModal'));
            if (modal) {
                modal.hide();
            } else {
                // Fallback if modal instance not found
                document.getElementById('markCompleteModal').classList.remove('show');
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
            document.getElementById('markCompleteForm').reset();
            currentMarkCompleteTaskId = null;
            
            // Reload tasks to update the display
            loadTasks();
        } else {
            showErrorMessage('Failed to mark task complete: ' + data.message);
        }
    } catch (error) {
        console.error('Error marking task complete:', error);
        showErrorMessage('Failed to mark task complete. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Handle task approval
async function approveTaskCompletion() {
    if (!currentApprovalTaskId) {
        showErrorMessage('No task selected for approval');
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
            showSuccessMessage('Task approved successfully!');
            bootstrap.Modal.getInstance(document.getElementById('adminApprovalModal')).hide();
            document.getElementById('adminApprovalForm').reset();
            currentApprovalTaskId = null;
            
            // Reload tasks to update the display
            loadTasks();
        } else {
            showErrorMessage('Failed to approve task: ' + data.message);
        }
    } catch (error) {
        console.error('Error approving task:', error);
        showErrorMessage('Failed to approve task. Please try again.');
    } finally {
        hideLoadingOverlay();
    }
}

// Setup form event listeners for approval and reassignment
function setupApprovalForms() {
    const approvalForm = document.getElementById('adminApprovalForm');
    const reassignmentForm = document.getElementById('taskReassignmentForm');
    const markCompleteForm = document.getElementById('markCompleteForm');
    
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
    
    if (markCompleteForm) {
        markCompleteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleMarkComplete();
        });
    }
}

// Add missing functions that are referenced in the template
function filterTasks() {
    const searchTerm = document.getElementById('searchTask').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const employeeFilter = document.getElementById('employeeFilter').value;
    
    const filteredTasks = currentTasks.filter(task => {
        const matchesSearch = task.task_name.toLowerCase().includes(searchTerm) ||
                            task.assigned_employee.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || task.status === statusFilter;
        const matchesEmployee = !employeeFilter || task.assigned_employee === employeeFilter;
        
        return matchesSearch && matchesStatus && matchesEmployee;
    });
    
    displayTasks(filteredTasks);
}

// Make functions globally available
window.showApprovalModal = showApprovalModal;
window.showReassignModal = showReassignModal;
window.showMarkCompleteModal = showMarkCompleteModal;
window.viewCompletionDetails = viewCompletionDetails;
window.filterTasks = filterTasks;
window.confirmDeleteTask = confirmDeleteTask;

// Helper functions
function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

function showSuccessMessage(message) {
    // You can implement a proper toast notification here
    alert('Success: ' + message);
}

function showErrorMessage(message) {
    // You can implement a proper toast notification here
    alert('Error: ' + message);
}

function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}
