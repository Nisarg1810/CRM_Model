// Global variables for tracking selected employees
let selectedEmployees = [];
let editSelectedEmployees = [];

// Task Management JavaScript
class TaskManager {
    constructor() {
        console.log('TaskManager constructor called');
        this.init();
    }
    
    init() {
        console.log('TaskManager init called');
        this.setupEventListeners();
        this.setupSearch();
        this.setupEmployeeSelection();
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTasks(e.target.value);
            });
        }
    }
    
    setupSearch() {
        // Initialize search functionality
        console.log('Search functionality initialized');
    }
    
    setupEmployeeSelection() {
        console.log('setupEmployeeSelection called');
        
        // Setup employee selection for add modal
        const assignEmployeeSelect = document.getElementById('assignEmployee');
        if (assignEmployeeSelect) {
            console.log('Found assignEmployee select element');
            assignEmployeeSelect.addEventListener('change', function() {
                console.log('Employee selected:', this.value, this.options[this.selectedIndex].text);
                if (this.value) {
                    addEmployeeToSelection(this.value, this.options[this.selectedIndex].text, 'add');
                    this.value = ''; // Reset dropdown
                }
            });
        } else {
            console.log('assignEmployee select element not found');
        }
        
        // Setup employee selection for edit modal
        const editAssignEmployeeSelect = document.getElementById('editAssignEmployee');
        if (editAssignEmployeeSelect) {
            console.log('Found editAssignEmployee select element');
            editAssignEmployeeSelect.addEventListener('change', function() {
                console.log('Edit employee selected:', this.value, this.options[this.selectedIndex].text);
                if (this.value) {
                    addEmployeeToSelection(this.value, this.options[this.selectedIndex].text, 'edit');
                    this.value = ''; // Reset dropdown
                }
            });
        } else {
            console.log('editAssignEmployee select element not found');
        }
    }
    
    filterTasks(searchTerm) {
        const taskRows = document.querySelectorAll('.task-row');
        const searchLower = searchTerm.toLowerCase();
        
        taskRows.forEach(row => {
            const taskName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            if (taskName.includes(searchLower)) {
                row.classList.remove('filtered');
            } else {
                row.classList.add('filtered');
            }
        });
    }
    
    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.alert');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `alert alert-${type} alert-dismissible fade show`;
        messageElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageElement);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!token) {
            console.error('CSRF token not found');
            return '';
        }
        return token.value;
    }
}

// Employee selection functions
function addEmployeeToSelection(employeeId, employeeName, modalType) {
    console.log('addEmployeeToSelection called:', employeeId, employeeName, modalType);
    
    const employeesArray = modalType === 'edit' ? editSelectedEmployees : selectedEmployees;
    
    // Check if employee is already selected - handle both string and number ID types
    if (employeesArray.some(emp => emp.id == employeeId)) {
        console.log('Employee already selected');
        return;
    }
    
    // Add employee to array
    employeesArray.push({ id: employeeId, name: employeeName });
    
    // Update display
    const listId = modalType === 'edit' ? 'editSelectedEmployeesList' : 'selectedEmployeesList';
    const boxId = modalType === 'edit' ? 'editSelectedEmployeesBox' : 'selectedEmployeesBox';
    const inputId = modalType === 'edit' ? 'editSelectedEmployeesInput' : 'selectedEmployeesInput';
    
    updateEmployeeDisplay(employeesArray, listId, boxId, inputId);
    
    console.log('Employee added successfully');
}

function removeEmployeeFromSelection(employeeId, modalType) {
    console.log('removeEmployeeFromSelection called:', { employeeId, modalType });
    
    const isEdit = modalType === 'edit';
    const employeesArray = isEdit ? editSelectedEmployees : selectedEmployees;
    const employeesList = isEdit ? 'editSelectedEmployeesList' : 'selectedEmployeesList';
    const employeesBox = isEdit ? 'editSelectedEmployeesBox' : 'selectedEmployeesBox';
    const employeesInput = isEdit ? 'editSelectedEmployeesInput' : 'selectedEmployeesInput';
    
    console.log('Modal type:', isEdit ? 'edit' : 'add');
    console.log('Employees array before removal:', employeesArray);
    
    // Remove employee from array - handle both string and number ID types
    const index = employeesArray.findIndex(emp => emp.id == employeeId);
    if (index > -1) {
        const removedEmployee = employeesArray.splice(index, 1)[0];
        console.log('Removed employee:', removedEmployee);
    } else {
        console.warn('Employee not found in array:', employeeId);
        console.log('Available employees:', employeesArray.map(emp => ({ id: emp.id, name: emp.name, idType: typeof emp.id })));
        console.log('Searching for ID:', employeeId, 'Type:', typeof employeeId);
    }
    
    console.log('Employees array after removal:', employeesArray);
    
    // Update visual display
    updateEmployeeDisplay(employeesArray, employeesList, employeesBox, employeesInput);
    
    // Re-enable option in dropdown - handle both string and number ID types
    const selectElement = isEdit ? document.getElementById('editAssignEmployee') : document.getElementById('assignEmployee');
    if (selectElement) {
        // Try to find option by value, handling both string and number types
        let option = selectElement.querySelector(`option[value="${employeeId}"]`);
        if (!option) {
            // If not found, try to find by comparing values
            option = Array.from(selectElement.querySelectorAll('option')).find(opt => opt.value == employeeId);
        }
        if (option) {
            option.disabled = false;
            console.log('Re-enabled option for employee:', employeeId);
        } else {
            console.warn('Option not found for employee:', employeeId);
        }
    } else {
        console.error('Select element not found for modal type:', modalType);
    }
}

function updateEmployeeDisplay(employeesArray, listId, boxId, inputId) {
    console.log('updateEmployeeDisplay called:', { employeesArray, listId, boxId, inputId });
    
    const listElement = document.getElementById(listId);
    const boxElement = document.getElementById(boxId);
    const inputElement = document.getElementById(inputId);
    
    if (!listElement || !boxElement || !inputElement) {
        console.error('Required elements not found:', { listElement, boxElement, inputElement });
        return;
    }
    
    // Clear current display
    listElement.innerHTML = '';
    
    // Determine modal type more reliably
    const modalType = listId.includes('edit') ? 'edit' : 'add';
    console.log('Modal type detected:', modalType);
    
    // Add employee tags
    employeesArray.forEach((employee, index) => {
        const tag = document.createElement('div');
        tag.className = 'employee-tag bg-primary';
        tag.setAttribute('data-employee-id', employee.id);
        
        tag.innerHTML = `
            <span>${employee.name}</span>
            <button type="button" class="remove-btn" onclick="removeEmployeeFromSelection('${employee.id}', '${modalType}')">
                <i class="bi bi-x"></i>
            </button>
        `;
        listElement.appendChild(tag);
        console.log('Added employee tag:', employee.name, 'with modal type:', modalType);
    });
    
    // Show/hide box based on whether there are selected employees
    if (employeesArray.length > 0) {
        boxElement.style.display = 'block';
        // Update hidden input with comma-separated employee IDs
        inputElement.value = employeesArray.map(emp => emp.id).join(',');
        console.log('Updated hidden input value:', inputElement.value);
    } else {
        boxElement.style.display = 'none';
        inputElement.value = '';
        console.log('Hidden input cleared, box hidden');
    }
}

function clearAllEmployees() {
    selectedEmployees = [];
    updateEmployeeDisplay(selectedEmployees, 'selectedEmployeesList', 'selectedEmployeesBox', 'selectedEmployeesInput');
    
    // Re-enable all options in dropdown
    const selectElement = document.getElementById('assignEmployee');
    selectElement.querySelectorAll('option').forEach(option => {
        option.disabled = false;
    });
}

function clearAllEditEmployees() {
    editSelectedEmployees = [];
    updateEmployeeDisplay(editSelectedEmployees, 'editSelectedEmployeesList', 'editSelectedEmployeesBox', 'editSelectedEmployeesInput');
    
    // Re-enable all options in dropdown
    const selectElement = document.getElementById('editAssignEmployee');
    selectElement.querySelectorAll('option').forEach(option => {
        option.disabled = false;
    });
}

// Global functions for modal operations
function openAddTaskModal() {
    console.log('openAddTaskModal called');
    
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
    
    // Reset form and clear selected employees
    document.getElementById('addTaskForm').reset();
    clearAllEmployees();
}

function submitTask() {
    console.log('submitTask called');
    
    const form = document.getElementById('addTaskForm');
    const formData = new FormData(form);
    
    // Validate form
    const taskName = formData.get('task_name');
    const position = formData.get('position');
    const isDefault = formData.get('is_default');
    const completionDays = formData.get('completion_days');
    
    console.log('Form data:', { taskName, position, isDefault, completionDays, selectedEmployees });
    
    if (!taskName || !position || !isDefault || !completionDays) {
        taskManager.showMessage('Please fill in all required fields', 'danger');
        return;
    }
    
    // Check if employees are selected
    if (selectedEmployees.length === 0) {
        taskManager.showMessage('Please select at least one employee', 'danger');
        return;
    }
    
    // Update the hidden input with selected employees
    const selectedEmployeesInput = document.getElementById('selectedEmployeesInput');
    selectedEmployeesInput.value = selectedEmployees.map(emp => emp.id).join(',');
    
    console.log('Submitting form with employees:', selectedEmployeesInput.value);
    
    // Show loading
    taskManager.showLoading();
    
    fetch('/add_task/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': taskManager.getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            taskManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            modal.hide();
            
            // Reset form and clear selected employees
            form.reset();
            clearAllEmployees();
            
            // Reload page to show new task (fast refresh)
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while adding the task', 'danger');
    })
    .finally(() => {
        taskManager.hideLoading();
    });
}

// Function to add new task row to table
function addTaskRowToTable(taskData) {
    const tbody = document.getElementById('taskTableBody');
    
    // Remove "no tasks" message if it exists
    const noTasksRow = tbody.querySelector('.no-tasks');
    if (noTasksRow) {
        noTasksRow.remove();
    }
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.className = 'task-row';
    newRow.setAttribute('data-task-id', taskData.id);
    
    // Create row content - no animations
    newRow.innerHTML = `
        <td>${taskData.id}</td>
        <td>
            <i class="bi bi-list task-icon"></i>
            ${taskData.name}
        </td>
        <td>${taskData.position}</td>
        <td>
            <i class="bi bi-people employee-icon"></i>
            ${taskData.employee_name}
        </td>
        <td>
            <span class="badge ${taskData.is_default ? 'bg-success' : 'bg-secondary'}">
                ${taskData.is_default ? 'Yes' : 'No'}
            </span>
        </td>
        <td>${taskData.completion_days} days</td>
        <td class="actions-cell">
            <button class="btn btn-sm btn-primary edit-btn" onclick="editTask(${taskData.id})" title="Edit Task">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-btn" onclick="deleteTask(${taskData.id})" title="Delete Task">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    // Add row to table - no animations
    tbody.appendChild(newRow);
}

function editTask(taskId) {
    console.log('editTask called with taskId:', taskId);
    
    // Show loading
    taskManager.showLoading();
    
    fetch(`/get_task/${taskId}/`, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': taskManager.getCSRFToken()
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            // Populate the edit form
            document.getElementById('editTaskId').value = data.task.id;
            document.getElementById('editTaskName').value = data.task.name;
            document.getElementById('editTaskPosition').value = data.task.position;
            document.getElementById('editIsDefault').value = data.task.is_default.toString();
            document.getElementById('editCompletionDays').value = data.task.completion_days;
            
            // Populate assigned employees - handle both old and new data structure
            if (data.task.assigned_employees && data.task.assigned_employees.length > 0) {
                editSelectedEmployees = data.task.assigned_employees;
                console.log('Using assigned_employees array:', editSelectedEmployees);
            } else if (data.task.assigned_employee_id) {
                // New structure - create employee object from assigned employee
                editSelectedEmployees = [{
                    id: data.task.assigned_employee_id,
                    name: data.task.assigned_employee_name || 'Unknown Employee'
                }];
                console.log('Using assigned_employee_id, created array:', editSelectedEmployees);
            } else {
                editSelectedEmployees = [];
                console.log('No assigned employees found, using empty array');
            }
            
            console.log('Final editSelectedEmployees array:', editSelectedEmployees);
            updateEmployeeDisplay(editSelectedEmployees, 'editSelectedEmployeesList', 'editSelectedEmployeesBox', 'editSelectedEmployeesInput');
            
            // Disable selected employees in dropdown - handle both string and number ID types
            const selectElement = document.getElementById('editAssignEmployee');
            selectElement.querySelectorAll('option').forEach(option => {
                option.disabled = editSelectedEmployees.some(emp => emp.id == option.value);
            });
            
            // Open modal
            const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
            modal.show();
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while loading the task', 'danger');
    })
    .finally(() => {
        taskManager.hideLoading();
    });
}

function updateTask() {
    const form = document.getElementById('editTaskForm');
    const formData = new FormData(form);
    
    // Validate form
    const taskName = formData.get('task_name');
    const position = formData.get('position');
    const selectedEmployees = formData.get('selected_employees');
    const isDefault = formData.get('is_default');
    const completionDays = formData.get('completion_days');
    
    if (!taskName || !position || !selectedEmployees || !isDefault || !completionDays) {
        taskManager.showMessage('Please fill in all required fields and select at least one employee', 'danger');
        return;
    }
    
    // Show loading
    taskManager.showLoading();
    
    fetch('/update_task/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': taskManager.getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            taskManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            modal.hide();
            
            // Reload page to show updated task (fast refresh)
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while updating the task', 'danger');
    })
    .finally(() => {
        taskManager.hideLoading();
    });
}

function updateTaskRowInTable(taskId, taskData) {
    const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
    if (row) {
        // Update row content
        row.querySelector('td:nth-child(2)').innerHTML = `
            <i class="bi bi-list task-icon"></i>
            ${taskData.name}
        `;
        row.querySelector('td:nth-child(3)').textContent = taskData.position;
        row.querySelector('td:nth-child(4)').innerHTML = `
            <i class="bi bi-people employee-icon"></i>
            ${taskData.employee_name}
        `;
        row.querySelector('td:nth-child(5)').innerHTML = `
            <span class="badge ${taskData.is_default ? 'bg-success' : 'bg-secondary'}">
                ${taskData.is_default ? 'Yes' : 'No'}
            </span>
        `;
        row.querySelector('td:nth-child(6)').textContent = `${taskData.completion_days} days`;
        
        // Add highlight effect
        row.classList.add('highlight-update');
        setTimeout(() => {
            row.classList.remove('highlight-update');
        }, 2000);
    }
}

function deleteTask(taskId) {
    console.log('deleteTask called with taskId:', taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    // Show loading
    taskManager.showLoading();
    
    fetch(`/delete_task/${taskId}/`, {
        method: 'DELETE',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': taskManager.getCSRFToken()
        }
    })
    .then(response => {
        console.log('Delete response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Delete response data:', data);
        if (data.success) {
            taskManager.showMessage(data.message, 'success');
            
            // Reload page to show updated task list (fast refresh)
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while deleting the task', 'danger');
    })
    .finally(() => {
        taskManager.hideLoading();
    });
}

function refreshTasks() {
    window.location.reload();
}

// Add Employee Modal Functions
function openAddEmployeeModal() {
    // Reset form
    document.getElementById('addEmployeeForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    modal.show();
}

function submitNewEmployee() {
    console.log('submitNewEmployee function called from task.js');
    const form = document.getElementById('addEmployeeForm');
    const formData = new FormData(form);
    
    // Debug: log all form data
    console.log('Form data contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    // Validate required fields
    const requiredFields = ['username', 'full_name', 'email', 'employee_type', 'password', 'mobile', 'location', 'status'];
    console.log('Checking required fields:', requiredFields);
    
    for (let field of requiredFields) {
        const value = formData.get(field);
        console.log(`Checking field ${field}: ${value}`);
        if (!value) {
            console.log(`Field ${field} is empty, showing error message`);
            taskManager.showMessage(`Please fill in the ${field.replace('_', ' ')} field`, 'danger');
            return;
        }
    }
    
    console.log('All required fields are filled, proceeding with submission');
    
    // Show loading
    taskManager.showLoading();
    
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
            taskManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
            modal.hide();
            
            // Add new employee to both dropdowns
            addEmployeeToDropdowns(data.employee);
            
            // Clear form
            form.reset();
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while adding the employee', 'danger');
    })
    .finally(() => {
        taskManager.hideLoading();
    });
}

function addEmployeeToDropdowns(employee) {
    // Only add non-marketing employees to the dropdowns
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
        console.log('Added non-marketing employee to Add Task dropdown:', employee.full_name || employee.username);
    }
    
    // Add to Edit Task modal dropdown
    const editDropdown = document.getElementById('editAssignEmployee');
    if (editDropdown) {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.full_name || employee.username;
        editDropdown.appendChild(option);
        console.log('Added non-marketing employee to Edit Task dropdown:', employee.full_name || employee.username);
    }
}

// Initialize the task manager
const taskManager = new TaskManager(); 