/*
 * ADD LAND PAGE - COMPLETE TASK MANAGEMENT SYSTEM
 * 
 * This file handles both the location dropdowns and the complete task management functionality
 * for the add land page, identical to the task page.
 */

// Global variables for tracking selected employees and tasks
let selectedEmployees = [];
let selectedTasks = [];

// Task Management JavaScript
class TaskManager {
    constructor() {
        console.log('TaskManager constructor called');
        this.init();
    }
    
    init() {
        console.log('TaskManager init called');
        this.setupEventListeners();
        this.setupEmployeeSelection();
        this.setupTaskSelection();
    }
    
    setupEventListeners() {
        // Initialize location data
        this.initializeLocationData();
        

        
        // Set up form validation
        this.setupFormValidation();
        
        // Set up village select for "Add New Village" option
        this.setupVillageSelect();
        
        // Restore form data if validation failed
        this.restoreFormData();
        
        // Set up Sata Prakar modal event listeners
        this.setupSataPrakarModal();
        
        // Set up modal event listeners for form data preservation
        this.setupModalEventListeners();
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
    }
    
    setupTaskSelection() {
        // Initialize selected tasks with only default tasks from the template
        selectedTasks = [];
        const initialTaskRows = document.querySelectorAll('#taskTableBody .task-row');
        console.log('Found initial task rows:', initialTaskRows.length);
        initialTaskRows.forEach(row => {
            const taskName = row.getAttribute('data-task');
            if (taskName && !selectedTasks.includes(taskName)) {
                selectedTasks.push(taskName);
            }
        });
        console.log('Initial selectedTasks:', selectedTasks);
        
        // Check for not selected tasks
        const notSelectedChips = document.querySelectorAll('#notSelectedTasks .task-chip');
        console.log('Found not selected task chips:', notSelectedChips.length);
        notSelectedChips.forEach(chip => {
            console.log('Not selected chip:', chip.textContent.trim(), chip);
        });
        
        this.updateSelectedTasks();
        
        // Setup employee checkbox event listeners
        this.setupEmployeeCheckboxes();
    }
    
    setupEmployeeCheckboxes() {
        const checkboxes = document.querySelectorAll('.employee-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                taskManager.handleEmployeeSelection(this);
            });
        });
    }
    
    handleEmployeeSelection(checkbox) {
        const taskId = checkbox.getAttribute('data-task-id');
        const employeeId = checkbox.value;
        const employeeName = checkbox.getAttribute('data-employee-name');
        
        // Update the selected employees data attribute
        const taskRow = checkbox.closest('.task-row');
        const selectedEmployeeIds = [];
        const checkboxes = taskRow.querySelectorAll('.employee-checkbox:checked');
        checkboxes.forEach(cb => {
            selectedEmployeeIds.push(cb.value);
        });
        
        taskRow.setAttribute('data-selected-employees', selectedEmployeeIds.join(','));
        
        // Update the global selected tasks array
        this.setupTaskSelection();
        
        console.log(`Employee ${employeeName} ${checkbox.checked ? 'selected' : 'unselected'} for task ${taskId}`);
    }
    

    
    setupFormValidation() {
        const form = document.getElementById('addLandForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                // Validate required fields before submission
                if (!taskManager.validateRequiredFields()) {
                    e.preventDefault();
                    return false;
                }
                
                // Only validate on form submission, not on task operations
                if (selectedTasks.length === 0) {
                    e.preventDefault();
                    taskManager.showMessage('Please select at least one task!', 'danger');
                    return false;
                }
                
                // Update selected tasks hidden input before form submission
                taskManager.updateSelectedTasks();
                
                // Collect selected employees from tasks and add to form
                collectTaskEmployeeSelections();
                
                // Collect completion days from tasks and add to form
                updateTaskCompletionDays();
            });
        }
    }
    
    validateRequiredFields() {
        const requiredFields = [
            'name', 'state', 'district', 'taluka', 'village',
            'old_sr_no', 'new_sr_no', 'sata_prakar', 'built_up_area',
            'unutilized_area', 'total_area', 'soda_tarikh',
            'banakhat_tarikh', 'dastavej_tarikh', 'broker_name'
        ];
        
        let isValid = true;
        const errors = {};
        
        // Clear previous error states
        requiredFields.forEach(field => {
            const element = document.querySelector(`[name="${field}"]`);
            if (element) {
                element.classList.remove('is-invalid');
                const feedback = element.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.remove();
                }
            }
        });
        
        // Validate each required field
        requiredFields.forEach(field => {
            const element = document.querySelector(`[name="${field}"]`);
            if (!element) return;
            
            const value = element.value.trim();
            if (!value) {
                isValid = false;
                errors[field] = `${field.replace('_', ' ').replace(/([A-Z])/g, ' $1').trim()} is required`;
                
                // Add error styling
                element.classList.add('is-invalid');
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = errors[field];
                element.parentNode.appendChild(errorDiv);
            }
        });
        

        
        if (!isValid) {
            this.showMessage('Please fill in all required fields correctly', 'danger');
            // Scroll to first error
            const firstError = document.querySelector('.is-invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return isValid;
    }
    
    setupVillageSelect() {
        const villageSelect = document.getElementById('villageSelect');
        if (villageSelect) {
            villageSelect.addEventListener('change', function() {
                if (this.value === 'add_new') {
                    this.value = ''; // Reset to empty
                    this.addNewVillage();
                }
            });
        }
    }
    
    initializeLocationData() {
  try {
    console.log('Initializing location data...');
    
            // Location data is now handled by the LocationAPI class
            // The API will automatically populate districts when the page loads
            console.log('Location data will be loaded via API');
            
            // Wait a bit for LocationAPI to initialize
            setTimeout(() => {
                if (window.locationAPI) {
                    console.log('LocationAPI is available');
    } else {
                    console.log('LocationAPI not yet available');
    }
            }, 100);
  } catch (error) {
    console.error('Error initializing location data:', error);
  }
    }

    // Location methods are now handled by LocationAPI class
    updateDistricts() {
        console.log('updateDistricts called - handled by LocationAPI');
        if (window.locationAPI) {
            window.locationAPI.refreshDistricts();
        }
    }

    // Location methods are now handled by LocationAPI class
    updateTalukas() {
        console.log('updateTalukas called - handled by LocationAPI');
        if (window.locationAPI) {
            window.locationAPI.refreshTalukas();
        }
    }

    // Location methods are now handled by LocationAPI class
    updateVillages() {
        console.log('updateVillages called - handled by LocationAPI');
        if (window.locationAPI) {
            window.locationAPI.refreshVillages();
        }
    }
    

    
    updateSelectedTasks() {
        const selectedTasksInput = document.getElementById('selected_tasks');
        if (selectedTasksInput) {
            // Collect task names from the table rows
            const selectedTaskRows = document.querySelectorAll('#taskTableBody .task-row');
            const taskNames = [];
            
            selectedTaskRows.forEach(taskRow => {
                const taskName = taskRow.getAttribute('data-task');
                if (taskName) {
                    taskNames.push(taskName);
                }
            });
            
            // Update both the hidden input and the global selectedTasks array
            selectedTasksInput.value = taskNames.join(',');
            selectedTasks = taskNames; // Update the global array
            
            console.log('Updated selected tasks input:', selectedTasksInput.value);
            console.log('Updated global selectedTasks array:', selectedTasks);
        } else {
            console.error('selected_tasks input element not found');
        }
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
        
        // Insert message after the page header instead of at the bottom
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader && pageHeader.nextElementSibling) {
            pageHeader.parentNode.insertBefore(messageElement, pageHeader.nextElementSibling);
        } else {
            // Fallback to body if header not found
            document.body.appendChild(messageElement);
        }
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
    
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    setupSataPrakarModal() {
        console.log('Setting up Sata Prakar modal event listeners');
        
        // Add Enter key event listener for the Sata Prakar input field
        const sataNameInput = document.getElementById('sataNameFromLand');
        if (sataNameInput) {
            sataNameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    submitSataFromLand(); // Call the submit function
                }
            });
        }
    }
    
    setupModalEventListeners() {
        // Set up event listeners for add task modal
        const addTaskModal = document.getElementById('addTaskModal');
        if (addTaskModal) {
            // Restore form data when modal is hidden
            addTaskModal.addEventListener('hidden.bs.modal', function() {
                restoreFormData();
            });
        }
        
        // Set up event listeners for add village modal
        const addVillageModal = document.getElementById('addVillageModalFromLand');
        if (addVillageModal) {
            // Add Enter key event listener for the village input field
            const villageNameInput = document.getElementById('villageNameFromLand');
            if (villageNameInput) {
                villageNameInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission
                        submitVillageFromLand(); // Call the submit function
                    }
                });
            }
        }
    }
    
    getCSRFToken() {
        const token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (!token) {
            console.error('CSRF token not found');
            return '';
        }
        return token.value;
    }

    restoreFormData() {
        console.log('restoreFormData called');
        
        // Restore location dropdowns if form data exists
        this.restoreLocationData();
        
        // Restore task employee selections if they exist
        const taskEmployeeSelectionsInput = document.getElementById('task_employee_selections');
        if (taskEmployeeSelectionsInput && taskEmployeeSelectionsInput.value) {
            try {
                const parsedSelections = JSON.parse(taskEmployeeSelectionsInput.value);
                console.log('Restoring task employee selections:', parsedSelections);
                
                for (const taskName in parsedSelections) {
                    const taskTag = document.querySelector(`#taskTags .task-tag[data-task="${taskName}"]`);
                    if (taskTag) {
                        taskTag.setAttribute('data-selected-employees', parsedSelections[taskName]);
                        taskTag.setAttribute('data-selected-employee-count', '1');
                        
                        // Update info icon title
                        const infoIcon = taskTag.querySelector('.info-icon');
                        if (infoIcon) {
                            infoIcon.title = `Selected: ${parsedSelections[taskName]}`;
                        }
                        
                        console.log(`Restored employee selection for task "${taskName}": ${parsedSelections[taskName]}`);
                    }
                }
            } catch (e) {
                console.error('Error parsing task_employee_selections:', e);
            }
        }
        
        // Restore selected tasks if they exist
        const selectedTasksInput = document.getElementById('selected_tasks');
        if (selectedTasksInput && selectedTasksInput.value) {
            const taskNames = selectedTasksInput.value.split(',').filter(name => name.trim());
            console.log('Restoring selected tasks:', taskNames);
            
            // Clear current selection
            selectedTasks = [];
            
            // Restore each selected task
            taskNames.forEach(taskName => {
                if (taskName.trim()) {
                    // Find the task chip in not selected tasks
                    const taskChip = document.querySelector(`#notSelectedTasks .task-chip[data-task-name="${taskName.trim()}"]`);
                    if (taskChip) {
                        // Simulate clicking the task chip to select it
                        selectTask(taskChip);
                    }
                }
            });
        }
    }
    
    restoreLocationData() {
        console.log('Restoring location data...');
        
        // Get the form data from hidden inputs or data attributes
        const stateSelect = document.getElementById('stateSelect');
        const districtSelect = document.getElementById('districtSelect');
        const talukaSelect = document.getElementById('talukaSelect');
        const villageSelect = document.getElementById('villageSelect');
        
        if (!stateSelect || !districtSelect || !talukaSelect || !villageSelect) {
            console.error('Location select elements not found');
            return;
        }
        
        // Check if we have form data to restore
        const formData = this.getFormDataFromPage();
        if (!formData) {
            console.log('No form data to restore');
            return;
        }
        
        console.log('Form data to restore:', formData);
        
        // Restore state (should already be set to Gujarat)
        if (formData.state && stateSelect.value !== formData.state) {
            stateSelect.value = formData.state;
        }
        
        // Wait for LocationAPI to be ready, then restore values
        const restoreValues = () => {
            if (window.locationAPI) {
                console.log('LocationAPI ready, restoring values...');
                
                // Restore district
            if (formData.district) {
                districtSelect.value = formData.district;
                
                    // Restore taluka
                    if (formData.taluka) {
                        talukaSelect.value = formData.taluka;
                        
                        // Restore village
                                    if (formData.village) {
            villageSelect.value = formData.village;
        }
                    }
                }
            } else {
                console.log('LocationAPI not ready yet, retrying...');
                setTimeout(restoreValues, 100);
            }
        };
        
        // Start restoration process
        restoreValues();
    }
    
    getFormDataFromPage() {
        // Get form data from the global variable set by Django
        if (window.formDataToRestore) {
            console.log('Found form data to restore:', window.formDataToRestore);
            return window.formDataToRestore;
        }
        
        // Fallback: try to get from individual form fields
        const form = document.getElementById('addLandForm');
        if (form) {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                if (value) data[key] = value;
            }
            return data;
        }
        
        return null;
    }
}

// Function to calculate completion date based on completion days
function calculateCompletionDate(completionDays) {
    if (completionDays && completionDays > 0) {
        try {
            const today = new Date();
            const completionDate = new Date(today.getTime() + (parseInt(completionDays) * 24 * 60 * 60 * 1000));
            return completionDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        } catch (error) {
            console.error('Error calculating completion date:', error);
            return 'Invalid days';
        }
    }
    return 'Not set';
}

// Global functions for task selection
window.selectTask = function(taskElement) {
    console.log('selectTask function called!', taskElement);
    
    const taskName = taskElement.getAttribute('data-task-name');
    const taskId = taskElement.getAttribute('data-task-id');
    
    console.log('Task details:', { taskName, taskId });
    
    // Check if task is already selected
    if (selectedTasks.includes(taskName)) {
        // Task is already selected, show info message (removed to reduce spam)
        // taskManager.showMessage(`Task "${taskName}" is already selected!`, 'info');
        return;
    }
    
    // Add task to selection
    selectedTasks.push(taskName);
    console.log('Task added to selectedTasks:', selectedTasks);
    
    // Add to selected tasks display
    const taskTableBody = document.getElementById('taskTableBody');
    const taskRow = document.createElement('tr');
    
    // Check if this is a default task
    const isDefault = taskElement.classList.contains('default-task');
    taskRow.className = `task-row ${isDefault ? 'default-task' : 'custom-task'}`;
    taskRow.setAttribute('data-task', taskName);
    taskRow.setAttribute('data-task-id', taskId);
    
    // Copy assigned employee information if available
    const assignedEmployees = taskElement.getAttribute('data-assigned-employees');
    const employeeCount = taskElement.getAttribute('data-employee-count');
    
    console.log('Employee data from task element:', { assignedEmployees, employeeCount });
    
    // Create table row content
    let employeeDisplay = 'No employee assigned';
    if (assignedEmployees && employeeCount && parseInt(employeeCount) > 0) {
        console.log('Setting employee data on task row');
        taskRow.setAttribute('data-assigned-employees', assignedEmployees);
        taskRow.setAttribute('data-assigned-employees-count', employeeCount);
        
        // Create employee checkboxes - ALL pre-selected by default
        const employeeNames = assignedEmployees.split(', ');
        employeeDisplay = '<div class="employee-selection-container">';
        employeeNames.forEach((empName, index) => {
            const empId = `emp_${taskId}_${index}`;
            employeeDisplay += `
                <div class="employee-checkbox-item">
                    <input type="checkbox" 
                           id="${empId}" 
                           name="selected_employees" 
                           value="${empName.trim()}"
                           data-task-id="${taskId}"
                           data-employee-name="${empName.trim()}"
                           class="employee-checkbox"
                           checked>
                    <label for="${empId}" class="employee-checkbox-label">
                        ${empName.trim()}
                    </label>
                </div>
            `;
        });
        employeeDisplay += '</div>';
        
        // Store the assigned employees as available employees for this task (not pre-selected)
        taskRow.setAttribute('data-available-employees', assignedEmployees);
        taskRow.setAttribute('data-available-employee-count', employeeCount);
    } else {
        console.log('No employee data found, creating task row without employee info');
    }
    
    // Get completion days from the task element or default to 0
    const completionDays = taskElement.getAttribute('data-completion-days') || '0';
    
    taskRow.innerHTML = `
        <td>
            <span class="task-name">${taskName}</span>
            <button class="remove-btn" onclick="removeTask(this)">×</button>
        </td>
        <td>
            ${employeeDisplay}
        </td>
        <td>
            <div class="completion-days-container">
                <input type="number" 
                       class="completion-days-input" 
                       name="completion_days_${taskId}"
                       id="completion_days_${taskId}"
                       value="${completionDays}" 
                       min="1" 
                       max="365"
                       data-task-id="${taskId}"
                       data-original-days="${completionDays}"
                       onchange="updateCompletionDays(this)">
                <span class="completion-days-label">days</span>
            </div>
        </td>
        <td>
            <div class="completion-date-container">
                <span class="completion-date" id="completion_date_${taskId}">
                    ${calculateCompletionDate(completionDays)}
                </span>
            </div>
        </td>
    `;
    
    // Setup employee checkbox event listeners for the new row
    const newCheckboxes = taskRow.querySelectorAll('.employee-checkbox');
    newCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            taskManager.handleEmployeeSelection(this);
        });
    });
    
    taskTableBody.appendChild(taskRow);
    
    // Remove from not selected tasks
    taskElement.remove();
    
    // Update the selected tasks input
    taskManager.updateSelectedTasks();
    
    // Update task message visibility
    if (window.updateTaskMessageVisibility) {
        window.updateTaskMessageVisibility();
    }
    
    // Show success message (removed to reduce spam)
    // taskManager.showMessage(`Task "${taskName}" added to selected tasks!`, 'success');
};

window.removeTask = function(button) {
    console.log('removeTask function called!', button);
    
    const row = button.closest('tr');
    const taskName = row.getAttribute('data-task');
    const taskId = row.getAttribute('data-task-id');
    const isDefault = row.classList.contains('default-task');
    
    console.log('Task details:', { taskName, taskId, isDefault });
    console.log('Current selectedTasks before removal:', selectedTasks);
    
    // Remove from selected tasks (both default and custom tasks can be removed)
    selectedTasks = selectedTasks.filter(task => task !== taskName);
    console.log('selectedTasks after removal:', selectedTasks);
    
    row.remove();
    
    // Add it back to not selected tasks
    const notSelectedContainer = document.getElementById('notSelectedTasks');
    console.log('notSelectedContainer:', notSelectedContainer);
    
    const taskChip = document.createElement('div');
    taskChip.className = `task-chip ${isDefault ? 'default-task' : 'custom-task'}`;
    taskChip.setAttribute('data-task-name', taskName);
    taskChip.setAttribute('data-task-id', taskId);
    taskChip.setAttribute('onclick', 'selectTask(this)');
    
    // Preserve assigned employee information - try to get from row attributes first, then from checkboxes
    let assignedEmployees = row.getAttribute('data-assigned-employees');
    let employeeCount = row.getAttribute('data-assigned-employees-count');
    
    // If not available on row attributes, extract from employee checkboxes
    if (!assignedEmployees || !employeeCount) {
        const employeeCheckboxes = row.querySelectorAll('.employee-checkbox');
        if (employeeCheckboxes.length > 0) {
            const employeeNames = [];
            employeeCheckboxes.forEach(checkbox => {
                const employeeName = checkbox.getAttribute('data-employee-name');
                if (employeeName) {
                    employeeNames.push(employeeName);
                }
            });
            assignedEmployees = employeeNames.join(', ');
            employeeCount = employeeNames.length.toString();
        }
    }
    
    if (assignedEmployees && employeeCount) {
        taskChip.setAttribute('data-assigned-employees', assignedEmployees);
        taskChip.setAttribute('data-employee-count', employeeCount);
        console.log('Employee data preserved:', { assignedEmployees, employeeCount });
    }
    
    // Preserve saved employee selections
    const savedSelectedEmployees = row.getAttribute('data-selected-employees');
    if (savedSelectedEmployees) {
        taskChip.setAttribute('data-selected-employees', savedSelectedEmployees);
        taskChip.setAttribute('data-selected-employee-count', savedSelectedEmployees.split(', ').length);
    }
    
    // Preserve completion days
    const completionDaysInput = row.querySelector('.completion-days-input');
    if (completionDaysInput) {
        const completionDays = completionDaysInput.value;
        taskChip.setAttribute('data-completion-days', completionDays);
    }
    
    // No default label for default tasks in not selected tasks
    taskChip.textContent = taskName;
    
    notSelectedContainer.appendChild(taskChip);
    console.log('Task chip added back to not selected tasks');
    
    taskManager.updateSelectedTasks();
    
    // Update task message visibility
    if (window.updateTaskMessageVisibility) {
        window.updateTaskMessageVisibility();
    }
};



// Employee selection functions
window.addEmployeeToSelection = function(employeeId, employeeName, modalType) {
    console.log('addEmployeeToSelection called:', employeeId, employeeName, modalType);
    
    const employeesArray = modalType === 'edit' ? editSelectedEmployees : selectedEmployees;
    
    // Check if employee is already selected
    if (employeesArray.some(emp => emp.id === employeeId)) {
        console.log('Employee already selected');
        return;
    }
    
    // Add employee to array
    employeesArray.push({ id: employeeId, name: employeeName });
    
    console.log(`Employee added to ${modalType} array. New length: ${employeesArray.length}`);
    
    // Update display
    const listId = modalType === 'edit' ? 'editSelectedEmployeesList' : 'selectedEmployeesList';
    const boxId = modalType === 'edit' ? 'editSelectedEmployeesBox' : 'selectedEmployeesBox';
    const inputId = modalType === 'edit' ? 'editSelectedEmployeesInput' : 'selectedEmployeesInput';
    
    updateEmployeeDisplay(employeesArray, listId, boxId, inputId);
    
    console.log('Employee added successfully');
};

window.removeEmployeeFromSelection = function(employeeId, modalType) {
    const isEdit = modalType === 'edit';
    const employeesArray = isEdit ? editSelectedEmployees : selectedEmployees;
    const employeesList = isEdit ? 'editSelectedEmployeesList' : 'selectedEmployeesList';
    const employeesBox = isEdit ? 'editSelectedEmployeesBox' : 'selectedEmployeesBox';
    const employeesInput = isEdit ? 'editSelectedEmployeesInput' : 'selectedEmployeesInput';
    
    // Remove employee from array
    const index = employeesArray.findIndex(emp => emp.id === employeeId);
    if (index > -1) {
        const removedEmployee = employeesArray.splice(index, 1)[0];
        console.log(`Removed employee: ${removedEmployee.name} (ID: ${removedEmployee.id})`);
    } else {
        console.warn(`Employee with ID ${employeeId} not found in array`);
    }
    
    console.log(`Array length after removal: ${employeesArray.length}`);
    
    // Update visual display
    updateEmployeeDisplay(employeesArray, employeesList, employeesBox, employeesInput);
    
    // Re-enable option in dropdown
    const selectElement = isEdit ? document.getElementById('editAssignEmployee') : document.getElementById('assignEmployee');
    if (selectElement) {
        const option = selectElement.querySelector(`option[value="${employeeId}"]`);
        if (option) {
            option.disabled = false;
            console.log(`Re-enabled option for employee ID: ${employeeId}`);
        } else {
            console.warn(`Option not found for employee ID: ${employeeId}`);
        }
    } else {
        console.error(`Select element not found for ${isEdit ? 'edit' : 'add'} modal`);
    }
};

window.updateEmployeeDisplay = function(employeesArray, listId, boxId, inputId) {
    const listElement = document.getElementById(listId);
    const boxElement = document.getElementById(boxId);
    const inputElement = document.getElementById(inputId);
    
    // Clear current display
    listElement.innerHTML = '';
    
    // Determine modal type more reliably
    const modalType = listId.includes('edit') ? 'edit' : 'add';
    
    // Add employee tags
    employeesArray.forEach(employee => {
        const tag = document.createElement('div');
        tag.className = 'employee-tag';
        tag.innerHTML = `
            <span>${employee.name}</span>
            <button type="button" class="remove-btn" onclick="removeEmployeeFromSelection('${employee.id}', '${modalType}')">
                <i class="bi bi-x"></i>
            </button>
        `;
        listElement.appendChild(tag);
    });
    
    // Show/hide box based on whether there are selected employees
    if (employeesArray.length > 0) {
        boxElement.style.display = 'block';
        // Update hidden input with comma-separated employee IDs
        inputElement.value = employeesArray.map(emp => emp.id).join(',');
    } else {
        boxElement.style.display = 'none';
        inputElement.value = '';
    }
    
    console.log(`updateEmployeeDisplay: ${modalType} modal, ${employeesArray.length} employees`);
};

window.clearAllEmployees = function() {
    selectedEmployees = [];
    updateEmployeeDisplay(selectedEmployees, 'selectedEmployeesList', 'selectedEmployeesBox', 'selectedEmployeesInput');
    
    // Re-enable all options in dropdown
    const selectElement = document.getElementById('assignEmployee');
    if (selectElement) {
        selectElement.querySelectorAll('option').forEach(option => {
            option.disabled = false;
        });
    }
};

// Modal functions for add task
window.openAddTaskModal = function() {
    console.log('openAddTaskModal called');
    
    // Preserve current form data before opening modal
    preserveFormData();
    
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
    
    // Reset form and clear selected employees
    document.getElementById('addTaskForm').reset();
    clearAllEmployees();
};

window.submitTask = function() {
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
            
            // Capture form data before resetting
            const capturedFormData = {
                taskName: taskName,
                isDefault: isDefault === 'true',
                completionDays: completionDays,
                selectedEmployees: [...selectedEmployees] // Copy the array
            };
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            modal.hide();
            
            // Reset form and clear selected employees
            form.reset();
            clearAllEmployees();
            
            // Dynamically add the new task with captured form data
            addNewTaskToListWithData(data.task_id, capturedFormData);
            
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
    

};

// Function to update completion days for a specific task
function updateCompletionDays(input) {
    const taskId = input.getAttribute('data-task-id');
    const newDays = input.value;
    const originalDays = input.getAttribute('data-original-days');
    
    // Validate input
    if (newDays < 1 || newDays > 365) {
        input.value = originalDays;
        alert('Completion days must be between 1 and 365');
        return;
    }
    
    // Update the data attribute
    input.setAttribute('data-original-days', newDays);
    
    // Log the change
    console.log(`Task ${taskId} completion days updated from ${originalDays} to ${newDays} days`);
    
    // Update the hidden input for form submission
    updateTaskCompletionDays();
}

// Function to collect task completion days for form submission
function updateTaskCompletionDays() {
    const taskCompletionDaysInput = document.getElementById('task_completion_days');
    if (!taskCompletionDaysInput) {
        console.error('task_completion_days input element not found');
        return;
    }
    
    const completionDaysData = {};
    
    // Get all completion days inputs from the table
    const completionDaysInputs = document.querySelectorAll('#taskTableBody .completion-days-input');
    
    completionDaysInputs.forEach(input => {
        const taskId = input.getAttribute('data-task-id');
        const taskName = input.closest('.task-row').getAttribute('data-task');
        const days = input.value;
        
        if (taskId && taskName && days) {
            completionDaysData[taskName] = {
                task_id: taskId,
                days: parseInt(days)
            };
            console.log(`Task "${taskName}" completion days: ${days}`);
        }
    });
    
    // Update the hidden input
    taskCompletionDaysInput.value = JSON.stringify(completionDaysData);
    console.log('Task completion days updated:', taskCompletionDaysInput.value);
}

// Function to collect task employee selections for form submission
function collectTaskEmployeeSelections() {
    console.log('Collecting task employee selections...');
    
    const taskEmployeeSelections = {};
    
    // Get all selected task rows from the table
    const selectedTaskRows = document.querySelectorAll('#taskTableBody .task-row');
    
    selectedTaskRows.forEach(taskRow => {
        const taskName = taskRow.getAttribute('data-task');
        const taskId = taskRow.getAttribute('data-task-id');
        
        console.log(`Processing task row: ${taskName} (ID: ${taskId})`);
        
        // Get all checked employee checkboxes for this task
        const employeeCheckboxes = taskRow.querySelectorAll('.employee-checkbox:checked');
        const selectedEmployees = [];
        
        employeeCheckboxes.forEach(checkbox => {
            const employeeName = checkbox.getAttribute('data-employee-name');
            if (employeeName) {
                selectedEmployees.push(employeeName);
            }
        });
        
        if (selectedEmployees.length > 0) {
            taskEmployeeSelections[taskName] = selectedEmployees.join(', ');
            console.log(`Task "${taskName}" assigned to: ${selectedEmployees.join(', ')}`);
        } else {
            taskEmployeeSelections[taskName] = '';
            console.log(`Task "${taskName}" has no assigned employees`);
        }
    });
    
    // Update the hidden input
    const taskEmployeeSelectionsInput = document.getElementById('task_employee_selections');
    if (taskEmployeeSelectionsInput) {
        taskEmployeeSelectionsInput.value = JSON.stringify(taskEmployeeSelections);
        console.log('Task employee selections updated:', taskEmployeeSelectionsInput.value);
    } else {
        console.error('task_employee_selections input element not found');
    }
    
    return taskEmployeeSelections;
}

// Function to dynamically add new task to the appropriate list
function addNewTaskToList(taskId, taskName, isDefault) {
    console.log('Adding new task to list:', { taskId, taskName, isDefault });
    
    // Get the selected employees for this task
    const selectedEmployeesInput = document.getElementById('selectedEmployeesInput');
    const selectedEmployeeIds = selectedEmployeesInput.value.split(',').filter(id => id.trim());
    
    // Create employee display string (similar to backend format)
    let assignedEmployeesDisplay = '';
    let employeeCount = 0;
    
    if (selectedEmployeeIds.length > 0) {
        // Get employee names from the selected employees array
        const employeeNames = selectedEmployees.map(emp => emp.name);
        assignedEmployeesDisplay = employeeNames.join(', ');
        employeeCount = selectedEmployeeIds.length;
    }
    
    if (isDefault) {
        // For default tasks, add directly to selected tasks table and remove from not selected
        addDefaultTaskToSelectedTable(taskId, taskName, assignedEmployeesDisplay, employeeCount);
        
        // Remove the task from not selected tasks if it exists there
        removeTaskFromNotSelected(taskId);
        
        console.log('Default task added to selected tasks table:', {
            taskId, taskName, assignedEmployeesDisplay, employeeCount
        });
    } else {
        // For non-default tasks, add to not selected tasks list
        addNonDefaultTaskToNotSelected(taskId, taskName, assignedEmployeesDisplay, employeeCount);
        
        console.log('Non-default task added to not selected tasks list:', {
            taskId, taskName, assignedEmployeesDisplay, employeeCount
        });
    }
}

// Function to dynamically add new task with captured form data
function addNewTaskToListWithData(taskId, formData) {
    console.log('Adding new task with captured data:', { taskId, formData });
    
    const { taskName, isDefault, completionDays, selectedEmployees } = formData;
    
    // Create employee display string from captured data
    let assignedEmployeesDisplay = '';
    let employeeCount = 0;
    
    if (selectedEmployees && selectedEmployees.length > 0) {
        const employeeNames = selectedEmployees.map(emp => emp.name);
        assignedEmployeesDisplay = employeeNames.join(', ');
        employeeCount = selectedEmployees.length;
    }
    
    if (isDefault) {
        // For default tasks, add directly to selected tasks table and remove from not selected
        addDefaultTaskToSelectedTableWithData(taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays);
        
        // Remove the task from not selected tasks if it exists there
        removeTaskFromNotSelected(taskId);
        
        // Add to selectedTasks array and update the hidden input
        if (!selectedTasks.includes(taskName)) {
            selectedTasks.push(taskName);
        }
        
        console.log('Default task added to selected tasks table with captured data:', {
            taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays
        });
    } else {
        // For non-default tasks, add to not selected tasks list
        addNonDefaultTaskToNotSelectedWithData(taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays);
        
        console.log('Non-default task added to not selected tasks list with captured data:', {
            taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays
        });
    }
    
    // Update the selected tasks input and task message visibility
    updateSelectedTasks();
    if (window.updateTaskMessageVisibility) {
        window.updateTaskMessageVisibility();
    }
    
    // Force a refresh of the task display to ensure proper state
    console.log('Task added successfully, current selectedTasks:', selectedTasks);
    console.log('Task added successfully, current selected_tasks input value:', document.getElementById('selected_tasks')?.value);
    
    // Additional debugging: check if the task is visible in the UI
    setTimeout(() => {
        const taskRows = document.querySelectorAll('#taskTableBody .task-row');
        const taskNames = Array.from(taskRows).map(row => row.getAttribute('data-task'));
        console.log('Current visible tasks in table:', taskNames);
        console.log('Task should be visible:', taskName);
        console.log('Is task visible?', taskNames.includes(taskName));
    }, 100);
}

// Function to add default task directly to selected tasks table
function addDefaultTaskToSelectedTable(taskId, taskName, assignedEmployeesDisplay, employeeCount) {
    const taskTableBody = document.getElementById('taskTableBody');
    if (!taskTableBody) {
        console.error('Task table body not found');
        return;
    }
    
    // Get the actual completion days from the form
    const completionDaysInput = document.getElementById('completion_days');
    const completionDays = completionDaysInput ? completionDaysInput.value : '5';
    
    // Create new row for the selected tasks table
    const newRow = document.createElement('tr');
    newRow.className = 'task-row default-task';
    newRow.setAttribute('data-task', taskName);
    newRow.setAttribute('data-task-id', taskId);
    newRow.setAttribute('data-assigned-employees', assignedEmployeesDisplay);
    newRow.setAttribute('data-employee-count', employeeCount.toString());
    newRow.setAttribute('data-completion-days', completionDays);
    
    // Create employee checkboxes based on actual selected employees
    let employeeCheckboxesHTML = '';
    if (assignedEmployeesDisplay && assignedEmployeesDisplay.trim() !== '') {
        // Split the employee names and create checkboxes for each
        const employeeNames = assignedEmployeesDisplay.split(', ');
        employeeNames.forEach((employeeName, index) => {
            employeeCheckboxesHTML += `
                <div class="employee-checkbox-item">
                    <input type="checkbox" 
                           id="emp_${taskId}_${index}" 
                           name="selected_employees" 
                           value="emp_${index}"
                           data-task-id="${taskId}"
                           data-employee-name="${employeeName.trim()}"
                           class="employee-checkbox"
                           checked>
                    <label for="emp_${taskId}_${index}" class="employee-checkbox-label">
                        ${employeeName.trim()}
                    </label>
                </div>
            `;
        });
    } else {
        // Fallback to default employee if no specific employees selected
        employeeCheckboxesHTML = `
            <div class="employee-checkbox-item">
                <input type="checkbox" 
                       id="emp_${taskId}_default" 
                       name="selected_employees" 
                       value="default"
                       data-task-id="${taskId}"
                       data-employee-name="Default Employee"
                       class="employee-checkbox"
                       checked>
                    <label for="emp_${taskId}_default" class="employee-checkbox-label">
                        Default Employee
                    </label>
                </div>
            `;
    }
    
    newRow.innerHTML = `
        <td>
            <span class="task-name">${taskName}</span>
            <button class="remove-btn" onclick="removeTask(this)">×</button>
        </td>
        <td>
            <div class="employee-selection-container">
                ${employeeCheckboxesHTML}
            </div>
        </td>
        <td>
            <div class="completion-days-container">
                <input type="number" 
                       class="completion-days-input" 
                       name="completion_days_${taskId}"
                       id="completion_days_${taskId}"
                       value="${completionDays}" 
                       min="1" 
                       max="365"
                       data-task-id="${taskId}"
                       data-original-days="${completionDays}"
                       onchange="updateCompletionDays(this)">
                <span class="completion-days-label">days</span>
            </div>
        </td>
    `;
    
    taskTableBody.appendChild(newRow);
    
    // Setup employee checkbox event listeners for the new row
    const newCheckboxes = newRow.querySelectorAll('.employee-checkbox');
    newCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            taskManager.handleEmployeeSelection(this);
        });
    });
    
    // Update the selected tasks array
    updateSelectedTasks();
    
    // Update task message visibility
    if (window.updateTaskMessageVisibility) {
        window.updateTaskMessageVisibility();
    }
    
    // Debug: verify the task row was added correctly
    console.log('New task row added to table:', newRow);
    console.log('Task row data attributes:', {
        task: newRow.getAttribute('data-task'),
        taskId: newRow.getAttribute('data-task-id'),
        assignedEmployees: newRow.getAttribute('data-assigned-employees'),
        employeeCount: newRow.getAttribute('data-employee-count'),
        completionDays: newRow.getAttribute('data-completion-days')
    });
}

// Function to add default task directly to selected tasks table with captured data
function addDefaultTaskToSelectedTableWithData(taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays) {
    const taskTableBody = document.getElementById('taskTableBody');
    if (!taskTableBody) {
        console.error('Task table body not found');
        return;
    }
    
    // Use the captured completion days
    completionDays = completionDays || '5';
    
    // Create new row for the selected tasks table
    const newRow = document.createElement('tr');
    newRow.className = 'task-row default-task';
    newRow.setAttribute('data-task', taskName);
    newRow.setAttribute('data-task-id', taskId);
    newRow.setAttribute('data-assigned-employees', assignedEmployeesDisplay);
    newRow.setAttribute('data-employee-count', employeeCount.toString());
    newRow.setAttribute('data-completion-days', completionDays);
    
    // Create employee checkboxes based on actual selected employees
    let employeeCheckboxesHTML = '';
    if (assignedEmployeesDisplay && assignedEmployeesDisplay.trim() !== '') {
        // Split the employee names and create checkboxes for each
        const employeeNames = assignedEmployeesDisplay.split(', ');
        employeeNames.forEach((employeeName, index) => {
            employeeCheckboxesHTML += `
                <div class="employee-checkbox-item">
                    <input type="checkbox" 
                           id="emp_${taskId}_${index}" 
                           name="selected_employees" 
                           value="emp_${index}"
                           data-task-id="${taskId}"
                           data-employee-name="${employeeName.trim()}"
                           class="employee-checkbox"
                           checked>
                    <label for="emp_${taskId}_${index}" class="employee-checkbox-label">
                        ${employeeName.trim()}
                    </label>
                </div>
            `;
        });
    } else {
        // Fallback to default employee if no specific employees selected
        employeeCheckboxesHTML = `
            <div class="employee-checkbox-item">
                <input type="checkbox" 
                       id="emp_${taskId}_default" 
                       name="selected_employees" 
                       value="default"
                       data-task-id="${taskId}"
                       data-employee-name="Default Employee"
                       class="employee-checkbox"
                       checked>
                    <label for="emp_${taskId}_default" class="employee-checkbox-label">
                        Default Employee
                    </label>
                </div>
            `;
    }
    
    newRow.innerHTML = `
        <td>
            <span class="task-name">${taskName}</span>
            <button class="remove-btn" onclick="removeTask(this)">×</button>
        </td>
        <td>
            <div class="employee-selection-container">
                ${employeeCheckboxesHTML}
            </div>
        </td>
        <td>
            <div class="completion-days-container">
                <input type="number" 
                       class="completion-days-input" 
                       name="completion_days_${taskId}"
                       id="completion_days_${taskId}"
                       value="${completionDays}" 
                       min="1" 
                       max="365"
                       data-task-id="${taskId}"
                       data-original-days="${completionDays}"
                       onchange="updateCompletionDays(this)">
                <span class="completion-days-label">days</span>
            </div>
        </td>
    `;
    
    taskTableBody.appendChild(newRow);
    
    // Setup employee checkbox event listeners for the new row
    const newCheckboxes = newRow.querySelectorAll('.employee-checkbox');
    newCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            taskManager.handleEmployeeSelection(this);
        });
    });
    
    // Update the selected tasks array
    updateSelectedTasks();
    
    // Update task message visibility
    if (window.updateTaskMessageVisibility) {
        window.updateTaskMessageVisibility();
    }
    
    // Debug: verify the task row was added correctly
    console.log('New task row added to table (with data):', newRow);
    console.log('Task row data attributes (with data):', {
        task: newRow.getAttribute('data-task'),
        taskId: newRow.getAttribute('data-task-id'),
        assignedEmployees: newRow.getAttribute('data-assigned-employees'),
        employeeCount: newRow.getAttribute('data-assigned-employees-count'),
        completionDays: newRow.getAttribute('data-completion-days')
    });
}

// Function to add non-default task to not selected tasks list
function addNonDefaultTaskToNotSelected(taskId, taskName, assignedEmployeesDisplay, employeeCount) {
    const notSelectedContainer = document.getElementById('notSelectedTasks');
    if (!notSelectedContainer) {
        console.error('Not selected tasks container not found');
        return;
    }
    
    // Get the actual completion days from the form
    const completionDaysInput = document.getElementById('completion_days');
    const completionDays = completionDaysInput ? completionDaysInput.value : '5';
    
    // Create new task chip
    const taskChip = document.createElement('div');
    taskChip.className = 'task-chip custom-task';
    taskChip.setAttribute('data-task-name', taskName);
    taskChip.setAttribute('data-is-default', 'false');
    taskChip.setAttribute('data-assigned-employees', assignedEmployeesDisplay);
    taskChip.setAttribute('data-employee-count', employeeCount.toString());
    taskChip.setAttribute('data-completion-days', completionDays);
    taskChip.setAttribute('onclick', 'selectTask(this)');
    taskChip.textContent = taskName;
    
    // Add the new task chip to the beginning of the list
    notSelectedContainer.insertBefore(taskChip, notSelectedContainer.firstChild);
}

// Function to add non-default task to not selected tasks list with captured data
function addNonDefaultTaskToNotSelectedWithData(taskId, taskName, assignedEmployeesDisplay, employeeCount, completionDays) {
    const notSelectedContainer = document.getElementById('notSelectedTasks');
    if (!notSelectedContainer) {
        console.error('Not selected tasks container not found');
        return;
    }
    
    // Use the captured completion days
    completionDays = completionDays || '5';
    
    // Create new task chip
    const taskChip = document.createElement('div');
    taskChip.className = 'task-chip custom-task';
    taskChip.setAttribute('data-task-name', taskName);
    taskChip.setAttribute('data-task-id', taskId);
    taskChip.setAttribute('data-is-default', 'false');
    taskChip.setAttribute('data-assigned-employees', assignedEmployeesDisplay);
    taskChip.setAttribute('data-employee-count', employeeCount.toString());
    taskChip.setAttribute('data-completion-days', completionDays);
    taskChip.setAttribute('onclick', 'selectTask(this)');
    taskChip.textContent = taskName;
    
    // Add the new task chip to the beginning of the list
    notSelectedContainer.insertBefore(taskChip, notSelectedContainer.firstChild);
}

// Function to remove task from not selected tasks list
function removeTaskFromNotSelected(taskId) {
    const notSelectedContainer = document.getElementById('notSelectedTasks');
    if (!notSelectedContainer) return;
    
    const taskChip = notSelectedContainer.querySelector(`[data-task-id="${taskId}"]`);
    if (taskChip) {
        taskChip.remove();
        console.log(`Removed task ${taskId} from not selected tasks list`);
    }
}



// Form data preservation system
let preservedFormData = {};

// Function to preserve form data before opening task modal
function preserveFormData() {
    const form = document.getElementById('addLandForm');
    if (!form) return;
    
    const formData = new FormData(form);
    preservedFormData = {};
    
    // Preserve all form fields
    for (let [key, value] of formData.entries()) {
        preservedFormData[key] = value;
    }
    
    // Also preserve selected tasks
    preservedFormData.selected_tasks = selectedTasks.join(',');
    

    
    console.log('Form data preserved:', preservedFormData);
}

// Function to restore form data after closing task modal
function restoreFormData() {
    if (Object.keys(preservedFormData).length === 0) return;
    
    const form = document.getElementById('addLandForm');
    if (!form) return;
    
    console.log('Restoring form data:', preservedFormData);
    
    // Restore form fields
    for (let [key, value] of preservedFormData.entries()) {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = value === 'on' || value === 'true';
            } else if (field.type === 'select-one') {
                field.value = value;
            } else {
                field.value = value;
            }
        }
    }
    
    // Restore selected tasks
    if (preservedFormData.selected_tasks) {
        selectedTasks = preservedFormData.selected_tasks.split(',').filter(task => task.trim());
        updateSelectedTasks();
    }
    

    
    // Clear preserved data
    preservedFormData = {};
    console.log('Form data restored successfully');
}

// Global functions for location management


// Location data is now handled by the LocationAPI class via API calls

// Initialize when DOM is loaded
let taskManager;
document.addEventListener('DOMContentLoaded', function() {
    console.log('Add Land page loaded, initializing...');
    
    // Initialize task manager
    taskManager = new TaskManager();
});

// Global function for HTML onchange event - now handled by LocationAPI
window.updateDistricts = function() {
    if (window.locationAPI) {
        window.locationAPI.refreshDistricts();
    }
};

window.updateTalukas = function() {
    if (window.locationAPI) {
        window.locationAPI.refreshTalukas();
    }
};

window.updateVillages = function() {
    if (window.locationAPI) {
        window.locationAPI.refreshVillages();
    }
};

// Add Village button functionality
window.addNewVillage = function() {
    console.log('Add Village button clicked');
    
    // Check if we have a district and taluka selected
    const districtSelect = document.getElementById('districtSelect');
    const talukaSelect = document.getElementById('talukaSelect');
    
    if (!districtSelect || !talukaSelect) {
        console.error('District or Taluka select elements not found');
        return;
    }
    
    const selectedDistrict = districtSelect.value;
    const selectedTaluka = talukaSelect.value;
    
    if (!selectedDistrict || !selectedTaluka) {
        // Show alert if district or taluka not selected
        alert('Please select a District and Taluka first before adding a new village.');
        return;
    }
    
    // Get the district and taluka names for better user experience
    const districtName = districtSelect.options[districtSelect.selectedIndex].text;
    const talukaName = talukaSelect.options[talukaSelect.selectedIndex].text;
    
    // Populate the modal with district and taluka information
    document.getElementById('modalDistrictName').value = districtName;
    document.getElementById('modalTalukaName').value = talukaName;
    
    // Reset the village name input
    document.getElementById('villageNameFromLand').value = '';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('addVillageModalFromLand'));
    modal.show();
    
    // Focus on the village name input
    setTimeout(() => {
        const villageNameInput = document.getElementById('villageNameFromLand');
        if (villageNameInput) {
            villageNameInput.focus();
        }
    }, 500);
};



// Submit Village from add land page
window.submitVillageFromLand = function() {
    console.log('Submitting Village from add land page');
    
    const form = document.getElementById('addVillageFormFromLand');
    const formData = new FormData(form);
    
    // Validate form
            const villageName = formData.get('village');
    
    if (!villageName || !villageName.trim()) {
        alert('Please enter a village name');
        return;
    }
    
    // Get district and taluka IDs from the main form
    const districtSelect = document.getElementById('districtSelect');
    const talukaSelect = document.getElementById('talukaSelect');
    
    if (!districtSelect.value || !talukaSelect.value) {
        alert('Please select a district and taluka first');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    // Create form data for village creation
    const villageFormData = new FormData();
    villageFormData.append('taluka', talukaSelect.value);
    villageFormData.append('village_name', villageName.trim());
    
    fetch('/api/location/villages/add/', {
        method: 'POST',
        body: villageFormData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Village added successfully!');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addVillageModalFromLand'));
            if (modal) {
                modal.hide();
            }
            
            // Refresh the village dropdown automatically
            if (window.locationAPI) {
                window.locationAPI.refreshVillages();
            }
            
        } else {
            alert('Failed to add village: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the village. Please try again.');
    })
    .finally(() => {
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    });
};











// ===== SATA PRAKAR FUNCTIONS FOR ADD LAND PAGE =====

// Open Sata Prakar modal from add land page
window.openAddSataModalFromLand = function() {
    console.log('Opening Sata Prakar modal from add land page');
    
    const modal = new bootstrap.Modal(document.getElementById('addSataModalFromLand'));
    modal.show();
    
    // Reset form
    document.getElementById('addSataFormFromLand').reset();
    
    // Focus on the input field
    setTimeout(() => {
        const sataNameInput = document.getElementById('sataNameFromLand');
        if (sataNameInput) {
            sataNameInput.focus();
        }
    }, 500);
};

// Submit Sata Prakar from add land page
window.submitSataFromLand = function() {
    console.log('Submitting Sata Prakar from add land page');
    
    const form = document.getElementById('addSataFormFromLand');
    const formData = new FormData(form);
    
    // Validate form
    const sataName = formData.get('sata_name');
    
    if (!sataName || !sataName.trim()) {
        taskManager.showMessage('Please enter a Sata Prakar name', 'danger');
        return;
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    fetch('/add_sata_prakar/', {
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
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSataModalFromLand'));
            if (modal) {
                modal.hide();
            }
            
            // Update the Sata Prakar dropdown
            updateSataPrakarDropdown(sataName.trim());
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while adding the Sata Prakar', 'danger');
    })
    .finally(() => {
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    });
};

// Update Sata Prakar dropdown after adding new entry
function updateSataPrakarDropdown(newSataName) {
    console.log('Updating Sata Prakar dropdown with:', newSataName);
    
    const sataPrakarSelect = document.querySelector('select[name="sata_prakar"]');
    if (!sataPrakarSelect) {
        console.error('Sata Prakar select element not found');
        return;
    }
    
    // Remove the "No Sata Prakar available" option if it exists
    const noSataOption = sataPrakarSelect.querySelector('option[value=""][disabled]');
    if (noSataOption) {
        noSataOption.remove();
    }
    
    // Add the new Sata Prakar option
    const newOption = document.createElement('option');
    newOption.value = newSataName;
    newOption.textContent = newSataName;
    sataPrakarSelect.appendChild(newOption);
    
    // Select the newly added Sata Prakar
    sataPrakarSelect.value = newSataName;
    
    // Remove the warning message if it exists
    const warningMessage = document.querySelector('.form-text.text-warning');
    if (warningMessage) {
        warningMessage.remove();
    }
    
    console.log('Sata Prakar dropdown updated successfully');
}

// Add Employee Modal Functions
function openAddEmployeeModal() {
    console.log('openAddEmployeeModal called');
    
    // Check if form exists
    const form = document.getElementById('addEmployeeForm');
    if (!form) {
        console.error('addEmployeeForm not found');
        return;
    }
    
    // Check if modal exists
    const modalElement = document.getElementById('addEmployeeModal');
    if (!modalElement) {
        console.error('addEmployeeModal not found');
        return;
    }
    
    // Reset form
    form.reset();
    
    // Show modal
    try {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

function submitNewEmployee() {
    const form = document.getElementById('addEmployeeForm');
    const formData = new FormData(form);
    
    // Validate required fields
    const requiredFields = ['username', 'full_name', 'email', 'employee_type', 'password', 'mobile', 'location', 'status'];
    for (let field of requiredFields) {
        if (!formData.get(field)) {
            taskManager.showMessage(`Please fill in the ${field.replace('_', ' ')} field`, 'danger');
            return;
        }
    }
    
    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    fetch('/add_employee/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': taskManager.getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (data.success) {
            taskManager.showMessage(data.message, 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
            modal.hide();
            
            // Add new employee to dropdown
            addEmployeeToDropdown(data.employee);
            
            // Clear form
            form.reset();
            
        } else {
            taskManager.showMessage(data.message, 'danger');
        }
    })
    .catch(error => {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        console.error('Error:', error);
        taskManager.showMessage('An error occurred while adding the employee', 'danger');
    });
}

function addEmployeeToDropdown(employee) {
    // Add to Add Task modal dropdown
    const addDropdown = document.getElementById('assignEmployee');
    if (addDropdown) {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.full_name || employee.username;
        addDropdown.appendChild(option);
    }
}

// Make employee functions globally available
window.openAddEmployeeModal = openAddEmployeeModal;
window.submitNewEmployee = submitNewEmployee; 