// Sold Land Page JavaScript Functions

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sold Land page initialized');
    setupSearchFilters();
});

// Set up search filters
function setupSearchFilters() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
            input.addEventListener('input', function() {
            filterSoldLands();
        });
    });
}

// Filter sold lands based on search criteria
function filterSoldLands() {
    const landIdSearch = document.getElementById('landIdSearch').value.toLowerCase();
    const buyerSearch = document.getElementById('buyerSearch').value.toLowerCase();
    const villageSearch = document.getElementById('villageSearch').value.toLowerCase();
    const statusSearch = document.getElementById('statusSearch').value;
    
    const landCards = document.querySelectorAll('.land-card');
    
    landCards.forEach(card => {
        const landId = card.querySelector('.land-id').textContent.toLowerCase();
        const buyerName = card.querySelector('.sale-details') ? 
            card.querySelector('.sale-details').textContent.toLowerCase() : '';
        const villageName = card.querySelector('.location-main strong').textContent.toLowerCase();
        const statusBadge = card.querySelector('.status-badge');
        const status = statusBadge ? statusBadge.textContent.toLowerCase() : '';
        
        let showCard = true;
        
        if (landIdSearch && !landId.includes(landIdSearch)) {
            showCard = false;
        }
        
        if (buyerSearch && !buyerName.includes(buyerSearch)) {
            showCard = false;
        }
        
        if (villageSearch && !villageName.includes(villageSearch)) {
            showCard = false;
        }
        
        if (statusSearch && !status.includes(statusSearch)) {
            showCard = false;
        }
        
        card.closest('.col-lg-4').style.display = showCard ? 'block' : 'none';
    });
}

// Refresh data
function refreshData() {
    console.log('Refreshing sold lands data...');
    window.location.reload();
}

// Export data
function exportData() {
    console.log('Exporting sold lands data...');
    alert('Export functionality will be implemented');
}

// Task Assignment Functions
function addTaskAssignmentRow() {
    console.log('Adding task assignment row...');
    
    if (!window.availableTasks || window.availableTasks.length === 0) {
        alert('No tasks available. Please add tasks first.');
        return;
    }
    
    const container = document.getElementById('taskAssignmentsContainer');
    const rowCount = container.children.length;
    
    const taskRow = document.createElement('div');
    taskRow.className = 'task-assignment-row mb-2 p-2 border rounded';
    taskRow.innerHTML = `
        <div class="row g-2 align-items-center">
            <div class="col-md-4">
                <label class="form-label small">Task Name</label>
                <select class="form-select form-select-sm task-name-select" name="task_name_${rowCount}" onchange="updateCompletionDaysFromTask(this)">
                    <option value="">Select Task...</option>
                    ${window.availableTasks.map(task => 
                        `<option value="${task.name}" data-completion-days="${task.completion_days}">${task.name}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label small">Completion Days</label>
                <input type="number" class="form-control form-control-sm completion-days-input" 
                       name="completion_days_${rowCount}" min="1" max="365" value="10">
            </div>
            <div class="col-md-4">
                <label class="form-label small">Assigned Employee</label>
                <input type="text" class="form-control form-control-sm assigned-employee-input" 
                       name="assigned_employee_${rowCount}" readonly placeholder="Auto-assigned to Marketing Employee">
            </div>
            <div class="col-md-1">
                <label class="form-label small">&nbsp;</label>
                <button type="button" class="btn btn-danger btn-sm d-block" onclick="removeTaskAssignmentRow(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(taskRow);
    updateTaskAssignmentSummary();
    updateTaskAssignmentInfo();
    
    console.log('Task assignment row added');
}

function removeTaskAssignmentRow(button) {
    console.log('Removing task assignment row...');
    const row = button.closest('.task-assignment-row');
    row.remove();
    updateTaskAssignmentSummary();
    console.log('Task assignment row removed');
}

function updateCompletionDaysFromTask(selectElement) {
    console.log('Updating completion days from task selection...');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const completionDays = selectedOption.getAttribute('data-completion-days');
    
    if (completionDays) {
        const row = selectElement.closest('.task-assignment-row');
        const completionDaysInput = row.querySelector('.completion-days-input');
        completionDaysInput.value = completionDays;
        console.log(`Set completion days to: ${completionDays}`);
    }
}

function updateTaskAssignmentInfo() {
    console.log('Updating task assignment employee info...');
    const marketingEmployeeSelect = document.getElementById('sellMarketingEmployee');
    const selectedEmployeeId = marketingEmployeeSelect.value;
    
    if (selectedEmployeeId && window.marketingEmployees) {
        const selectedEmployee = window.marketingEmployees.find(emp => emp.id == selectedEmployeeId);
        const employeeName = selectedEmployee ? selectedEmployee.full_name : '';
        
        // Update all assigned employee inputs
        const assignedEmployeeInputs = document.querySelectorAll('.assigned-employee-input');
        assignedEmployeeInputs.forEach(input => {
            input.value = employeeName;
        });
        
        console.log(`Updated assigned employee to: ${employeeName}`);
    }
}

function updateTaskAssignmentSummary() {
    console.log('Updating task assignment summary...');
    const taskRows = document.querySelectorAll('.task-assignment-row');
    const taskCount = taskRows.length;
    
    const taskCountElement = document.getElementById('taskCount');
    if (taskCountElement) {
        taskCountElement.textContent = taskCount;
    }
    
    console.log(`Task count updated to: ${taskCount}`);
}

function getTaskAssignmentData() {
    console.log('Collecting task assignment data...');
    
    const taskAssignments = [];
    const taskRows = document.querySelectorAll('#taskAssignmentsContainer .task-assignment-row');
    
    taskRows.forEach((row, index) => {
        const taskNameSelect = row.querySelector('.task-name-select');
        const completionDaysInput = row.querySelector('.completion-days-input');
        const assignedEmployeeInput = row.querySelector('.assigned-employee-input');
        
        if (taskNameSelect.value) {
            const taskAssignment = {
                task_name: taskNameSelect.value,
                completion_days: parseInt(completionDaysInput.value) || 10,
                assigned_employee: assignedEmployeeInput.value
            };
            
            taskAssignments.push(taskAssignment);
            console.log(`Task assignment ${index + 1}:`, taskAssignment);
        }
    });
    
    console.log('Total task assignments collected:', taskAssignments.length);
    return taskAssignments;
}

// Process sell land form
function processSellLand() {
    const form = document.getElementById('sellLandForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const clientId = formData.get('client_id');
    const marketingEmployeeId = formData.get('marketing_employee_id');
    const saleDate = formData.get('sale_date');
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    if (!marketingEmployeeId) {
        alert('Please select a marketing employee');
        return;
    }
    
    if (!saleDate) {
        alert('Please select a sale date');
        return;
    }
    
    // Confirm the sale
    if (confirm('Are you sure you want to sell this land?')) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Get installment data (if installments functionality exists)
        let installments = [];
        let totalPercentage = 0;
        
        try {
            if (typeof getInstallmentData === 'function') {
                installments = getInstallmentData();
                totalPercentage = installments.reduce((sum, inst) => sum + inst.percentage, 0);
                
                // Validate installments if any exist
                if (installments.length > 0 && totalPercentage !== 100) {
                    alert('Total installment percentage must be exactly 100%');
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    return;
                }
            }
        } catch (error) {
            console.log('Installment functionality not available:', error);
        }
        
        // Get task assignment data
        const taskAssignments = getTaskAssignmentData();
        console.log('Task assignments collected:', taskAssignments);
        
        // Get current land ID from the form
        const currentLandId = formData.get('land_id');
        
        // Prepare sale data
        const saleData = {
            land_id: currentLandId,
            client_id: clientId,
            marketing_employee_id: marketingEmployeeId,
            sale_date: saleDate,
            notes: formData.get('notes') || '',
            installments: installments,
            total_percentage: totalPercentage,
            task_assignments: taskAssignments
        };
        
        console.log('Processing land sale with data:', saleData);
        console.log('Task assignments in payload:', saleData.task_assignments);
        
        // Get CSRF token
        function getCSRFToken() {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
            return csrfToken ? csrfToken.value : '';
        }
        
        // Make API call to backend
        fetch('/process-land-sale/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saleData),
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            if (data.success) {
                alert(data.message);
                // Close modal and refresh page
                const modal = bootstrap.Modal.getInstance(document.getElementById('sellLandModal'));
                if (modal) {
                    modal.hide();
                }
                window.location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error processing sale:', error);
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            alert('Error processing sale: ' + error.message);
        });
    }
}

// Edit Mode Functions
function enableEditMode() {
    console.log('Enabling edit mode...');
    
    // Change modal title
    const modalTitle = document.getElementById('sellLandModalLabel');
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Land Sale';
    
    // Enable form fields
    document.getElementById('sellClient').disabled = false;
    document.getElementById('sellMarketingEmployee').disabled = false;
    document.getElementById('sellDate').readOnly = false;
    document.getElementById('sellNotes').readOnly = false;
    
    // Show add buttons
    document.getElementById('addClientBtn').style.display = 'block';
    document.getElementById('addEmployeeBtn').style.display = 'block';
    document.getElementById('addTaskAssignmentBtn').style.display = 'block';
    document.getElementById('addInstallmentBtn').style.display = 'block';
    
    // Show/hide modal buttons
    document.getElementById('editSaleBtn').style.display = 'none';
    document.getElementById('saveSaleBtn').style.display = 'block';
    document.getElementById('cancelEditBtn').style.display = 'block';
    
    // Clear existing task assignments for new editing
    const taskContainer = document.getElementById('taskAssignmentsContainer');
    taskContainer.innerHTML = '';
    updateTaskAssignmentSummary();
    
    console.log('Edit mode enabled');
}

function disableEditMode() {
    console.log('Disabling edit mode...');
    
    // Change modal title back
    const modalTitle = document.getElementById('sellLandModalLabel');
    modalTitle.innerHTML = '<i class="bi bi-info-circle me-2"></i>Land Sale Details';
    
    // Disable form fields
    document.getElementById('sellClient').disabled = true;
    document.getElementById('sellMarketingEmployee').disabled = true;
    document.getElementById('sellDate').readOnly = true;
    document.getElementById('sellNotes').readOnly = true;
    
    // Hide add buttons
    document.getElementById('addClientBtn').style.display = 'none';
    document.getElementById('addEmployeeBtn').style.display = 'none';
    document.getElementById('addTaskAssignmentBtn').style.display = 'none';
    document.getElementById('addInstallmentBtn').style.display = 'none';
    
    // Show/hide modal buttons
    document.getElementById('editSaleBtn').style.display = 'block';
    document.getElementById('saveSaleBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    // Reload existing task assignments
    const landId = document.getElementById('sellLandId').value;
    if (landId) {
        loadExistingTaskAssignments(landId);
    }
    
    console.log('Edit mode disabled');
}

// Load existing task assignments from database
function loadExistingTaskAssignments(landId) {
    console.log('Loading existing task assignments for land:', landId);
    
    fetch(`/api/land/${landId}/tasks/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Task assignments loaded:', data);
            displayExistingTaskAssignments(data.tasks || []);
        })
        .catch(error => {
            console.error('Error loading task assignments:', error);
            displayExistingTaskAssignments([]);
        });
}

// Display existing task assignments in read-only format
function displayExistingTaskAssignments(tasks) {
    console.log('Displaying existing task assignments:', tasks);
    
    const container = document.getElementById('taskAssignmentsContainer');
    container.innerHTML = '';
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No task assignments found for this land.
            </div>
        `;
        return;
    }
    
    tasks.forEach((task, index) => {
        const taskRow = document.createElement('div');
        taskRow.className = 'task-assignment-row mb-2 p-2 border rounded bg-light';
        taskRow.innerHTML = `
            <div class="row g-2 align-items-center">
                <div class="col-md-4">
                    <label class="form-label small text-muted">Task Name</label>
                    <div class="form-control-plaintext">${task.name}</div>
                </div>
                <div class="col-md-3">
                    <label class="form-label small text-muted">Completion Days</label>
                    <div class="form-control-plaintext">${task.completion_days} days</div>
                </div>
                <div class="col-md-3">
                    <label class="form-label small text-muted">Assigned Employee</label>
                    <div class="form-control-plaintext">${task.assigned_employee}</div>
                </div>
                <div class="col-md-2">
                    <label class="form-label small text-muted">Status</label>
                    <span class="badge ${getTaskStatusBadgeClass(task.status)}">${task.status}</span>
                </div>
            </div>
            ${task.due_date ? `
                <div class="row mt-1">
                    <div class="col-12">
                        <small class="text-muted">
                            <i class="bi bi-calendar me-1"></i>Due: ${task.due_date}
                        </small>
                    </div>
                </div>
            ` : ''}
        `;
        
        container.appendChild(taskRow);
    });
    
    // Update task count
    const taskCountElement = document.getElementById('taskCount');
    if (taskCountElement) {
        taskCountElement.textContent = tasks.length;
    }
    
    console.log(`Displayed ${tasks.length} task assignments`);
}

// Get CSS class for task status badge
function getTaskStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'completed':
            return 'bg-success';
        case 'in_progress':
            return 'bg-warning text-dark';
        case 'pending':
            return 'bg-secondary';
        case 'overdue':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Export functions to global scope
window.refreshData = refreshData;
window.exportData = exportData;
window.addTaskAssignmentRow = addTaskAssignmentRow;
window.removeTaskAssignmentRow = removeTaskAssignmentRow;
window.updateCompletionDaysFromTask = updateCompletionDaysFromTask;
window.updateTaskAssignmentInfo = updateTaskAssignmentInfo;
window.getTaskAssignmentData = getTaskAssignmentData;
window.processSellLand = processSellLand;
window.enableEditMode = enableEditMode;
window.disableEditMode = disableEditMode;
window.loadExistingTaskAssignments = loadExistingTaskAssignments;
window.displayExistingTaskAssignments = displayExistingTaskAssignments;
