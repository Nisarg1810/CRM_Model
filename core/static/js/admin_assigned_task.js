// Admin Assigned Tasks Page JavaScript

console.log('Admin Assigned Tasks JavaScript loaded!');

class AdminAssignedTasks {
    constructor() {
        console.log('AdminAssignedTasks constructor called');
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.totalItems = 0;
        this.currentTaskId = null;
        this.currentFilters = {
            status: '',
            task: '',
            employee: '',
            land: '',
            search: ''
        };
        this.allTasks = []; // Store all tasks for local filtering
        console.log('Initial filters set to:', this.currentFilters);
        
        this.init();
    }

    init() {
        // Check if all required DOM elements exist
        if (!this.checkRequiredElements()) {
            console.error('Required DOM elements not found. Waiting for DOM to be ready...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.bindEvents();
        this.loadFilters();
        this.loadInitialDataAndTasks();
        this.testAPIEndpoints();
    }

    checkRequiredElements() {
        const requiredElements = [
            'statusFilter',
            'taskFilter', 
            'employeeFilter',
            'landFilter',
            'searchInput',
            'pageSizeSelector',
            'applyFilters',
            'clearFilters',
            'exportData'
        ];
        
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                console.error(`Required element not found: ${elementId}`);
                return false;
            }
        }
        
        console.log('All required DOM elements found');
        return true;
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Filter events
        document.getElementById('applyFilters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        
        // Search input event - use local filtering like employee_tasks page
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.debounce(() => this.filterTasksLocally(), 300);
        });

        // Page size selector event
        document.getElementById('pageSizeSelector').addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1; // Reset to first page when changing page size
            console.log('Page size changed to:', this.itemsPerPage);
            this.applyFilters();
        });
        
        // Set initial page size selector value
        const pageSizeSelector = document.getElementById('pageSizeSelector');
        if (pageSizeSelector) {
            pageSizeSelector.value = this.itemsPerPage.toString();
            console.log('Initialized page size selector with value:', this.itemsPerPage);
        }

        // Filter change events - auto-apply filters when changed
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            console.log('Status filter changed to:', e.target.value);
            this.applyFilters();
        });

        document.getElementById('taskFilter').addEventListener('change', (e) => {
            this.currentFilters.task = e.target.value;
            console.log('Task filter changed to:', e.target.value);
            this.applyFilters();
        });

        document.getElementById('employeeFilter').addEventListener('change', (e) => {
            this.currentFilters.employee = e.target.value;
            console.log('Employee filter changed to:', e.target.value);
            this.applyFilters();
        });

        document.getElementById('landFilter').addEventListener('change', (e) => {
            this.currentFilters.land = e.target.value;
            console.log('Land filter changed to:', e.target.value);
            this.applyFilters();
        });
        
        console.log('Events bound successfully');
    }

    async loadInitialData() {
        this.showLoading(true);
        if (typeof showLoader === 'function') {
            showLoader();
        }
        try {
            await this.loadTasks();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load initial data');
        } finally {
            this.showLoading(false);
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    // Load both initial data and all tasks for filtering
    async loadInitialDataAndTasks() {
        this.showLoading(true);
        if (typeof showLoader === 'function') {
            showLoader();
        }
        try {
            console.log('Starting loadInitialDataAndTasks...');
            
            // First load all tasks for filtering
            await this.loadAllTasksForFiltering();
            console.log(`Loaded ${this.allTasks.length} tasks for local filtering`);
            
            // Then load initial paginated data
            await this.loadTasks();
            console.log('Initial data loaded successfully');
            
                    // After loading, apply any existing filters locally
        if (this.currentFilters.status || this.currentFilters.task || this.currentFilters.employee || this.currentFilters.land || this.currentFilters.search) {
            console.log('Applying existing filters locally...');
            this.filterTasksLocally();
        } else {
            console.log('No existing filters, showing all tasks');
            // Ensure pagination is set correctly for all tasks
            this.totalItems = this.allTasks.length;
            this.totalPages = Math.ceil(this.allTasks.length / this.itemsPerPage);
            console.log(`Set pagination for all tasks: ${this.totalItems} items, ${this.totalPages} pages`);
            
            // Also render the first page of all tasks locally
            console.log('Rendering first page of all tasks locally');
            this.renderTasks(this.allTasks, this.allTasks.length);
            this.renderPagination(this.allTasks.length);
        }
        } catch (error) {
            console.error('Error loading initial data and tasks:', error);
            this.showError('Failed to load initial data');
        } finally {
            this.showLoading(false);
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    async loadFilters() {
        try {
            console.log('Loading filters...');
            console.log('Current user role:', document.body.dataset.userRole || 'unknown');
            
            // Get CSRF token
            const csrfToken = this.getCSRFToken();
            console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
            
            // Load employees for filter
            console.log('Fetching employees from /api/employees/');
            const employeesResponse = await fetch('/api/employees/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Employees response status:', employeesResponse.status);
            console.log('Employees response headers:', Object.fromEntries(employeesResponse.headers.entries()));
            
            if (employeesResponse.ok) {
                const employeesData = await employeesResponse.json();
                console.log('Employees data:', employeesData);
                if (employeesData.success && employeesData.employees) {
                    this.populateEmployeeFilter(employeesData.employees);
                } else if (Array.isArray(employeesData)) {
                    // Handle case where API returns array directly
                    this.populateEmployeeFilter(employeesData);
                } else {
                    console.warn('Employees data format unexpected:', employeesData);
                }
            } else {
                console.error('Failed to load employees:', employeesResponse.status);
                const errorText = await employeesResponse.text();
                console.error('Error response:', errorText);
            }

            // Load lands for filter
            console.log('Fetching lands from /api/lands/');
            const landsResponse = await fetch('/api/lands/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Lands response status:', landsResponse.status);
            
            if (landsResponse.ok) {
                const lands = await landsResponse.json();
                console.log('Lands data:', lands);
                // Handle both array format and success object format
                if (Array.isArray(lands)) {
                    this.populateLandFilter(lands);
                } else if (lands.success && Array.isArray(lands.data)) {
                    this.populateLandFilter(lands.data);
                } else {
                    console.warn('Unexpected lands data format:', lands);
                }
            } else {
                console.error('Failed to load lands:', landsResponse.status);
                const errorText = await landsResponse.text();
                console.error('Error response:', errorText);
            }

            // Load tasks for filter
            console.log('Fetching tasks from /api/tasks/');
            const tasksResponse = await fetch('/api/tasks/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Tasks response status:', tasksResponse.status);
            
            if (tasksResponse.ok) {
                const tasks = await tasksResponse.json();
                console.log('Tasks data:', tasks);
                // Handle both array format and success object format
                if (Array.isArray(tasks)) {
                    this.populateTaskFilter(tasks);
                } else if (tasks.success && Array.isArray(tasks.data)) {
                    this.populateTaskFilter(tasks.data);
                } else {
                    console.warn('Unexpected tasks data format:', tasks);
                }
            } else {
                console.error('Failed to load tasks:', tasksResponse.status);
                const errorText = await tasksResponse.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('Error loading filters:', error);
            console.error('Error stack:', error.stack);
        }
    }

    populateEmployeeFilter(employees) {
        console.log('populateEmployeeFilter called with:', employees);
        const employeeFilter = document.getElementById('employeeFilter');
        if (!employeeFilter) {
            console.error('Employee filter element not found');
            console.error('Available elements with similar names:');
            document.querySelectorAll('[id*="employee"]').forEach(el => console.log('Found:', el.id));
            return;
        }
        
        console.log('Populating employee filter with:', employees);
        employeeFilter.innerHTML = '<option value="">All Employees</option>';
        
        if (Array.isArray(employees)) {
            employees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = employee.full_name || employee.username;
                employeeFilter.appendChild(option);
            });
            console.log(`Added ${employees.length} employee options`);
        } else {
            console.error('Employees data is not an array:', employees);
        }
    }

    populateLandFilter(lands) {
        console.log('populateLandFilter called with:', lands);
        const landFilter = document.getElementById('landFilter');
        if (!landFilter) {
            console.error('Land filter element not found');
            console.error('Available elements with similar names:');
            document.querySelectorAll('[id*="land"]').forEach(el => console.log('Found:', el.id));
            return;
        }
        
        console.log('Populating land filter with:', lands);
        landFilter.innerHTML = '<option value="">All Lands</option>';
        
        if (Array.isArray(lands)) {
            lands.forEach(land => {
                const option = document.createElement('option');
                option.value = land.id;
                option.textContent = `${land.name} - ${land.village_name}`;
                landFilter.appendChild(option);
            });
            console.log(`Added ${lands.length} land options`);
        } else {
            console.error('Lands data is not an array:', lands);
        }
    }

    populateTaskFilter(tasks) {
        console.log('populateTaskFilter called with:', tasks);
        const taskFilter = document.getElementById('taskFilter');
        if (!taskFilter) {
            console.error('Task filter element not found');
            console.error('Available elements with similar names:');
            document.querySelectorAll('[id*="task"]').forEach(el => console.log('Found:', el.id));
            return;
        }
        
        console.log('Populating task filter with:', tasks);
        taskFilter.innerHTML = '<option value="">All Tasks</option>';
        
        if (Array.isArray(tasks)) {
            tasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                option.setAttribute('data-position', task.position);
                taskFilter.appendChild(option);
            });
            console.log(`Added ${tasks.length} task options`);
        } else {
            console.error('Tasks data is not an array:', tasks);
        }
    }

    async loadTasks() {
        if (typeof showLoader === 'function') {
            showLoader();
        }
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage,
                page_size: this.itemsPerPage,
                ...this.currentFilters
            });

            console.log('Loading tasks with params:', queryParams.toString());
            const response = await fetch(`/api/admin/assigned-tasks/?${queryParams}`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('Tasks response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Tasks response data:', data);
            console.log('Tasks count:', data.count);
            console.log('Tasks results:', data.results?.length || 0);
            
            this.renderTasks(data.results, data.count);
            this.renderPagination(data.count);
            this.totalItems = data.count;
            this.totalPages = Math.ceil(data.count / this.itemsPerPage);

        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Failed to load tasks');
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    // Load all tasks for local filtering (without pagination)
    async loadAllTasksForFiltering() {
        try {
            console.log('Loading all tasks for local filtering...');
            const response = await fetch('/api/admin/assigned-tasks/?page_size=1000', {
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            this.allTasks = data.results || [];
            console.log(`Loaded ${this.allTasks.length} tasks for local filtering`);
            
            // Log first few tasks for debugging
            if (this.allTasks.length > 0) {
                console.log('First task sample:', this.allTasks[0]);
            }
        } catch (error) {
            console.error('Error loading all tasks for filtering:', error);
        }
    }



    renderTasks(tasks, totalCount = null) {
        console.log('renderTasks called with:', tasks.length, 'tasks, totalCount:', totalCount);
        const tbody = document.getElementById('tasksTableBody');
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            console.log('No tasks to render, showing empty message');
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="text-muted">
                            <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                            <p class="mt-2">No tasks found matching your criteria</p>
                        </div>
                    </td>
                </tr>
            `;
            // Update tasks count
            document.getElementById('tasksCount').textContent = '0';
            return;
        }

        // Apply pagination for local filtering
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, tasks.length);
        const tasksToShow = tasks.slice(startIndex, endIndex);

        console.log(`Pagination calculation: startIndex=${startIndex}, endIndex=${endIndex}, tasks.length=${tasks.length}`);
        console.log(`Showing tasks ${startIndex + 1}-${endIndex} of ${tasks.length} total tasks`);
        console.log(`tasksToShow.length: ${tasksToShow.length}`);
        console.log(`Current page: ${this.currentPage}, Items per page: ${this.itemsPerPage}`);
        
        // Debug: Show the actual task IDs being displayed
        if (tasksToShow.length > 0) {
            const taskIds = tasksToShow.map(task => task.id);
            console.log(`Task IDs on current page: [${taskIds.join(', ')}]`);
        } else {
            console.log('WARNING: No tasks to show on current page!');
            console.log('This might indicate a pagination calculation error.');
        }
        
        tasksToShow.forEach(task => {
            const row = this.createTaskRow(task);
            tbody.appendChild(row);
        });

        // Update tasks count to show total count (either totalCount parameter or tasks.length for local filtering)
        const displayCount = totalCount !== null ? totalCount : tasks.length;
        document.getElementById('tasksCount').textContent = displayCount;
        console.log('Updated tasks count to:', displayCount);
        console.log(`Showing page ${this.currentPage} of ${this.totalPages} (${tasksToShow.length} tasks on this page, ${displayCount} total)`);
    }

    createTaskRow(task) {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.setAttribute('data-task-id', task.id);
        
        const statusBadge = this.getStatusBadge(task.status);
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set';
        const assignedDate = new Date(task.assigned_date).toLocaleDateString();

        // Generate action buttons based on task status
        const actionButtons = this.getActionButtons(task);

        row.innerHTML = `
            <td><strong>#${task.id}</strong></td>
            <td>
                <div>
                    <strong>${task.land.name}</strong><br>
                                            <small class="text-muted">${task.land.village_name}, ${task.land.taluka}</small>
                </div>
            </td>
            <td><strong>${task.task.name}</strong></td>
            <td>
                <div>
                    <strong>${task.employee.full_name || task.employee.username}</strong><br>
                    <small class="text-muted">${task.employee.employee_type || 'N/A'}</small>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td>${assignedDate}</td>
            <td>${dueDate}</td>
            <td>
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </td>
        `;

        return row;
    }

    getActionButtons(task) {
        let buttons = '';
        
        // Show different buttons based on status
        if (task.status === 'pending_approval') {
            // For pending approval tasks, show View, Approve, and Reassign buttons
            buttons += `<button class="btn btn-sm btn-view" onclick="adminAssignedTasks.viewTaskDetails(${task.id})" title="View Task Details">
                <i class="bi bi-eye"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-success" onclick="adminAssignedTasks.showApprovalModal(${task.id})" title="Approve Task">
                <i class="bi bi-check-circle"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-warning" onclick="adminAssignedTasks.showReassignModal(${task.id})" title="Reassign Task">
                <i class="bi bi-arrow-repeat"></i>
            </button>`;
        } else if (task.status === 'complete') {
            // For completed tasks, show only View Details button with text
            buttons += `<button class="btn btn-sm btn-view" onclick="adminAssignedTasks.viewTaskDetails(${task.id})" title="View Task Details">
                <i class="bi bi-eye me-1"></i>View Details
            </button>`;
        } else if (task.status === 'pending' || task.status === 'in_progress') {
            // For pending and in_progress tasks, show View, Mark Complete, and Delete buttons
            buttons += `<button class="btn btn-sm btn-view" onclick="adminAssignedTasks.viewTaskDetails(${task.id})" title="View Task Details">
                <i class="bi bi-eye"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-success" onclick="adminAssignedTasks.showMarkCompleteModal(${task.id})" title="Mark Task Complete">
                <i class="bi bi-check-circle"></i>
            </button>`;
            buttons += `<button class="btn btn-sm btn-delete" onclick="adminAssignedTasks.deleteTask(${task.id})" title="Delete Task">
                <i class="bi bi-trash"></i>
            </button>`;
        }
        
        return buttons;
    }

    getStatusBadge(status) {
        const statusMap = {
            'pending': 'pending',
            'in_progress': 'in-progress',
            'pending_approval': 'pending-approval',
            'complete': 'complete'
        };

        const statusText = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<span class="status-badge ${statusMap[status]}">${statusText}</span>`;
    }

    renderPagination(totalCount) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (totalCount <= this.itemsPerPage) {
            return;
        }

        const totalPages = Math.ceil(totalCount / this.itemsPerPage);
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="adminAssignedTasks.goToPage(${this.currentPage - 1})">
                <i class="bi bi-chevron-left"></i> Previous
            </a>
        `;
        pagination.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                li.innerHTML = `
                    <a class="page-link" href="#" onclick="adminAssignedTasks.goToPage(${i})">${i}</a>
                `;
                pagination.appendChild(li);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const li = document.createElement('li');
                li.className = 'page-item disabled';
                li.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(li);
            }
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="adminAssignedTasks.goToPage(${this.currentPage + 1})">
                Next <i class="bi bi-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextLi);
    }

    async goToPage(page) {
        console.log(`goToPage called with page: ${page}, currentPage: ${this.currentPage}, totalPages: ${this.totalPages}`);
        console.log(`allTasks length: ${this.allTasks.length}, itemsPerPage: ${this.itemsPerPage}`);
        
        if (page < 1 || page > this.totalPages) {
            console.log(`Invalid page number: ${page}. Valid range: 1-${this.totalPages}`);
            return;
        }

        this.currentPage = page;
        console.log(`Updated currentPage to: ${this.currentPage}`);
        
        // Always use local filtering if we have all tasks loaded
        if (this.allTasks.length > 0) {
            console.log('Using local filtering for page navigation');
            this.filterTasksLocally();
        } else {
            // Fallback to API if no local tasks
            console.log('No local tasks available, loading from API');
            await this.loadTasks();
        }
        
        // Scroll to top of table
        document.getElementById('tasksTable').scrollIntoView({ behavior: 'smooth' });
    }

    async applyFilters() {
        this.currentPage = 1;
        this.showLoading(true);
        if (typeof showLoader === 'function') {
            showLoader();
        }
        
        try {
            await this.loadTasks();
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError('Failed to apply filters');
        } finally {
            this.showLoading(false);
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    // Local filtering function for search (like employee_tasks page)
    filterTasksLocally() {
        console.log('filterTasksLocally called with filters:', this.currentFilters);
        console.log('allTasks length:', this.allTasks.length);
        console.log('Current page:', this.currentPage);
        
        if (this.allTasks.length === 0) {
            console.log('No tasks available for local filtering, falling back to API call');
            // Fallback to API call if no local tasks
            this.applyFilters();
            return;
        }

        let filteredTasks = this.allTasks.filter(task => {
            // Status filter
            if (this.currentFilters.status && task.status !== this.currentFilters.status) {
                return false;
            }
            
            // Task filter
            if (this.currentFilters.task && task.task.id !== parseInt(this.currentFilters.task)) {
                return false;
            }
            
            // Employee filter
            if (this.currentFilters.employee && task.employee.id !== parseInt(this.currentFilters.employee)) {
                return false;
            }
            
            // Land filter
            if (this.currentFilters.land && task.land.id !== parseInt(this.currentFilters.land)) {
                return false;
            }
            
            // Search filter
            if (this.currentFilters.search && this.currentFilters.search.trim() !== '') {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const taskName = (task.task.name || '').toLowerCase();
                const landName = (task.land.name || '').toLowerCase();
                const employeeName = (task.employee.full_name || task.employee.username || '').toLowerCase();
                
                if (!taskName.includes(searchTerm) && !landName.includes(searchTerm) && !employeeName.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });

        console.log(`Filtered ${filteredTasks.length} tasks from ${this.allTasks.length} total tasks`);

        // Check if current page is valid for the filtered results
        const maxPages = Math.ceil(filteredTasks.length / this.itemsPerPage);
        if (this.currentPage > maxPages && maxPages > 0) {
            console.log(`Current page ${this.currentPage} exceeds max pages ${maxPages}, resetting to page 1`);
            this.currentPage = 1;
        }
        
        // Render filtered tasks without making API call
        console.log(`About to render ${filteredTasks.length} filtered tasks on page ${this.currentPage} of ${maxPages} total pages`);
        this.renderTasks(filteredTasks, filteredTasks.length);
        this.renderPagination(filteredTasks.length);
        this.totalItems = filteredTasks.length;
        this.totalPages = maxPages;
        
        // Log pagination info for debugging
        console.log(`Pagination: ${this.totalItems} total items, ${this.totalPages} pages, ${this.itemsPerPage} per page`);
        console.log(`Current page: ${this.currentPage}, Total pages: ${this.totalPages}`);
    }

    clearFilters() {
        document.getElementById('statusFilter').value = '';
        document.getElementById('taskFilter').value = '';
        document.getElementById('employeeFilter').value = '';
        document.getElementById('landFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        this.currentFilters = {
            status: '',
            task: '',
            employee: '',
            land: '',
            search: ''
        };
        
        // Use local filtering for instant response
        this.filterTasksLocally();
    }

    async viewTaskDetails(taskId) {
        try {
            const response = await fetch(`/api/admin/assigned-tasks/${taskId}/`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const task = await response.json();
            this.showTaskDetailsModal(task);

        } catch (error) {
            console.error('Error loading task details:', error);
            this.showError('Failed to load task details');
        }
    }

    showTaskDetailsModal(task) {
        const modalBody = document.getElementById('taskDetailsModalBody');
        
        // Debug: Log the task data to see what's being received
        console.log('Task data received:', task);
        console.log('Land data:', task.land);
        console.log('Date fields:', {
            past_date: task.land.past_date,
            soda_tarikh: task.land.soda_tarikh,
            banakhat_tarikh: task.land.banakhat_tarikh,
            dastavej_tarikh: task.land.dastavej_tarikh
        });
        
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
                    <p><strong>Task Name:</strong> ${escapeHtml(task.task.name)}</p>
                    <p><strong>Status:</strong> <span class="badge ${getStatusBadge(task.status)}">${getStatusDisplayName(task.status)}</span></p>
                    <p><strong>Assigned Date:</strong> ${formatDate(task.assigned_date)}</p>
                    <p><strong>Due Date:</strong> ${formatDate(task.due_date)}</p>
                    <p><strong>Completion Days:</strong> ${task.completion_days || 'Not set'}</p>
                    ${task.completion_submitted_date ? `<p><strong>Submitted Date:</strong> ${formatDate(task.completion_submitted_date)}</p>` : ''}
                    ${task.status === 'complete' && task.completed_date ? `<p><strong>Completed Date:</strong> ${formatDate(task.completed_date)}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <h6 class="text-success"><strong>Employee Information</strong></h6>
                    <p><strong>Name:</strong> ${escapeHtml(task.employee.full_name || task.employee.username)}</p>
                    <p><strong>Type:</strong> ${escapeHtml(task.employee.employee_type || 'N/A')}</p>
                    <p><strong>Location:</strong> ${escapeHtml(task.employee.location || 'N/A')}</p>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <h6 class="text-info"><i class="bi bi-building me-2"></i><strong>Land Information</strong></h6>
                    <div class="card border-info">
                        <div class="card-body p-3">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <p><strong>Land Name:</strong> ${escapeHtml(task.land.name)}</p>
                                    <p><strong>Location:</strong> ${escapeHtml(task.land.village_name)}, ${escapeHtml(task.land.taluka)}, ${escapeHtml(task.land.district)}</p>
                                    <p><strong>State:</strong> ${escapeHtml(task.land.state || 'Gujarat')}</p>
                                    <p><strong>Document Type:</strong> ${escapeHtml(task.land.sata_prakar || 'N/A')}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Total Area:</strong> ${task.land.total_area || 'N/A'} sq m</p>
                                    <p><strong>Built-up Area:</strong> ${task.land.built_up_area || 'N/A'} sq m</p>
                                    <p><strong>Unutilized Area:</strong> ${task.land.unutilized_area || 'N/A'} sq m</p>
                                    <p><strong>Broker:</strong> ${escapeHtml(task.land.broker_name || 'Not specified')}</p>
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
                                    <p><strong>Past Date:</strong> ${task.land.past_date ? new Date(task.land.past_date).toLocaleDateString('en-IN') : 'Not set'}</p>
                                    <p><strong>Soda Tarikh:</strong> ${task.land.soda_tarikh ? new Date(task.land.soda_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                </div>
                                <div class="col-md-3">
                                    <p><strong>Banakhat Tarikh:</strong> ${task.land.banakhat_tarikh ? new Date(task.land.banakhat_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                    <p><strong>Dastavej Tarikh:</strong> ${task.land.dastavej_tarikh ? new Date(task.land.dastavej_tarikh).toLocaleDateString('en-IN') : 'Not set'}</p>
                                </div>
                                <div class="col-md-3">
                                    <p><strong>Old SR No:</strong> ${escapeHtml(task.land.old_sr_no || 'Not specified')}</p>
                                    <p><strong>New SR No:</strong> ${escapeHtml(task.land.new_sr_no || 'Not specified')}</p>
                                </div>
                                <div class="col-md-3">
                                    <p><strong>Land ID:</strong> ${task.land.id || 'N/A'}</p>
                                    <p><strong>Document Type:</strong> ${escapeHtml(task.land.sata_prakar || 'N/A')}</p>
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
                            <div class="alert alert-success">
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

    async editTask(taskId) {
        // Redirect to edit page or show edit modal
        window.location.href = `/dashboard/admin/assigned-tasks/${taskId}/edit/`;
    }

    async deleteTask(taskId) {
        // Find the task details for better confirmation message
        const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
        let taskName = 'this task';
        let landName = 'this land';
        
        if (taskRow) {
            const taskNameCell = taskRow.querySelector('td:nth-child(3)'); // Task Name column
            const landNameCell = taskRow.querySelector('td:nth-child(2)'); // Land Details column
            
            if (taskNameCell) {
                const taskNameElement = taskNameCell.querySelector('strong');
                if (taskNameElement) {
                    taskName = taskNameElement.textContent;
                }
            }
            
            if (landNameCell) {
                const landNameElement = landNameCell.querySelector('strong');
                if (landNameElement) {
                    landName = landNameElement.textContent;
                }
            }
        }
        
        const confirmMessage = `Are you sure you want to delete the task assignment "${taskName}" on land "${landName}"?\n\nThis action cannot be undone and will remove all task progress and completion data.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        if (typeof showLoader === 'function') {
            showLoader();
        }
        
        try {
            console.log('Attempting to delete task:', taskId);
            
            const response = await fetch(`/api/admin/assigned-tasks/${taskId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            console.log('Delete response status:', response.status);

            if (response.ok) {
                const result = await response.json().catch(() => ({}));
                this.showSuccess(result.message || 'Task deleted successfully');
                await this.loadTasks();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError(`Failed to delete task: ${error.message}`);
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    showApprovalModal(taskId) {
        // Store the task ID for the form submission
        this.currentTaskId = taskId;
        
        // Show the approval modal
        const modal = new bootstrap.Modal(document.getElementById('adminApprovalModal'));
        modal.show();
        
        // Bind the form submission event
        this.bindApprovalForm();
    }

    showReassignModal(taskId) {
        // Store the task ID for the form submission
        this.currentTaskId = taskId;
        
        // Show the reassignment modal
        const modal = new bootstrap.Modal(document.getElementById('taskReassignmentModal'));
        modal.show();
        
        // Bind the form submission event
        this.bindReassignmentForm();
    }

    showMarkCompleteModal(taskId) {
        // Store the task ID for the form submission
        this.currentTaskId = taskId;
        
        // Show the mark complete modal
        const modal = new bootstrap.Modal(document.getElementById('markCompleteModal'));
        modal.show();
        
        // Bind the form submission event
        this.bindMarkCompleteForm();
    }

    bindApprovalForm() {
        const form = document.getElementById('adminApprovalForm');
        if (form) {
            form.onsubmit = (e) => this.handleTaskApproval(e);
        }
    }

    bindReassignmentForm() {
        const form = document.getElementById('taskReassignmentForm');
        if (form) {
            form.onsubmit = (e) => this.handleTaskReassignment(e);
        }
    }

    bindMarkCompleteForm() {
        const form = document.getElementById('markCompleteForm');
        if (form) {
            form.onsubmit = (e) => this.handleMarkComplete(e);
        }
    }

    async handleTaskApproval(e) {
        e.preventDefault();
        
        const adminNotes = document.getElementById('adminNotes').value;
        
        if (typeof showLoader === 'function') {
            showLoader();
        }
        
        try {
            const response = await fetch(`/api/admin/assigned-tasks/${this.currentTaskId}/approve/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    admin_notes: adminNotes
                })
            });

            if (response.ok) {
                this.showSuccess('Task approved successfully');
                
                // Close the modal
                const modalElement = document.getElementById('adminApprovalModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    } else {
                        // Fallback: hide manually
                        modalElement.classList.remove('show');
                        modalElement.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
                
                // Reset form
                document.getElementById('adminNotes').value = '';
                
                // Reload tasks
                await this.loadTasks();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error approving task:', error);
            this.showError(`Failed to approve task: ${error.message}`);
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    async handleTaskReassignment(e) {
        e.preventDefault();
        
        const reassignmentNotes = document.getElementById('reassignmentNotes').value;
        
        if (!reassignmentNotes.trim()) {
            this.showError('Reassignment notes are required');
            return;
        }
        
        if (typeof showLoader === 'function') {
            showLoader();
        }
        
        try {
            const response = await fetch(`/api/admin/assigned-tasks/${this.currentTaskId}/reassign/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reassignment_notes: reassignmentNotes
                })
            });

            if (response.ok) {
                this.showSuccess('Task reassigned successfully');
                
                // Close the modal
                const modalElement = document.getElementById('taskReassignmentModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    } else {
                        // Fallback: hide manually
                        modalElement.classList.remove('show');
                        modalElement.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
                
                // Reset form
                document.getElementById('reassignmentNotes').value = '';
                
                // Reload tasks
                await this.loadTasks();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error reassigning task:', error);
            this.showError(`Failed to reassign task: ${error.message}`);
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    async handleMarkComplete(e) {
        e.preventDefault();
        
        const markCompleteNotes = document.getElementById('markCompleteNotes').value;
        
        if (typeof showLoader === 'function') {
            showLoader();
        }
        
        try {
            const response = await fetch(`/api/admin/assigned-tasks/${this.currentTaskId}/mark-complete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mark_complete_notes: markCompleteNotes
                })
            });

            if (response.ok) {
                this.showSuccess('Task marked as complete successfully');
                
                // Close the modal
                const modalElement = document.getElementById('markCompleteModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    } else {
                        // Fallback: hide manually
                        modalElement.classList.remove('show');
                        modalElement.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.remove();
                    }
                }
                
                // Reset form
                document.getElementById('markCompleteNotes').value = '';
                
                // Reload tasks
                await this.loadTasks();
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error marking task complete:', error);
            this.showError(`Failed to mark task complete: ${error.message}`);
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    async exportData() {
        if (typeof showLoader === 'function') {
            showLoader();
        }
        try {
            const queryParams = new URLSearchParams({
                export: 'true',
                ...this.currentFilters
            });

            const response = await fetch(`/api/admin/assigned-tasks/export/?${queryParams}`, {
                headers: {
                    'X-CSRFToken': this.getCSRFToken(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assigned_tasks_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showSuccess('Data exported successfully');

        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export data');
        } finally {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
        }
    }

    showLoading(show) {
        const table = document.getElementById('tasksTable');
        const pagination = document.getElementById('pagination');
        
        if (show) {
            if (typeof showLoader === 'function') {
                showLoader();
            }
            if (table) table.style.opacity = '0.6';
            if (pagination) pagination.style.opacity = '0.6';
        } else {
            if (typeof hideLoader === 'function') {
                hideLoader();
            }
            if (table) table.style.opacity = '1';
            if (pagination) pagination.style.opacity = '1';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showNotification(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
               document.querySelector('meta[name=csrf-token]')?.getAttribute('content');
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }

    async testAPIEndpoints() {
        const csrfToken = this.getCSRFToken();
        console.log('Testing API endpoints with CSRF token:', csrfToken ? 'Found' : 'Not found');
        
        try {
            const response = await fetch('/api/employees/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('API Endpoint /api/employees/ is accessible.');
            } else {
                console.warn('API Endpoint /api/employees/ is not accessible. Status:', response.status);
            }
        } catch (error) {
            console.error('Error testing /api/employees/:', error);
        }

        try {
            const response = await fetch('/api/lands/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('API Endpoint /api/lands/ is accessible.');
            } else {
                console.warn('API Endpoint /api/lands/ is not accessible. Status:', response.status);
            }
        } catch (error) {
            console.error('Error testing /api/lands/:', error);
        }

        try {
            const response = await fetch('/api/tasks/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('API Endpoint /api/tasks/ is accessible.');
            } else {
                console.warn('API Endpoint /api/tasks/ is not accessible. Status:', response.status);
            }
        } catch (error) {
            console.error('Error testing /api/tasks/:', error);
        }

        try {
            const response = await fetch('/api/admin/assigned-tasks/', {
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                console.log('API Endpoint /api/admin/assigned-tasks/ is accessible.');
            } else {
                console.warn('API Endpoint /api/admin/assigned-tasks/ is not accessible. Status:', response.status);
            }
        } catch (error) {
            console.error('Error testing /api/admin/assigned-tasks/:', error);
        }

        // Test pagination logic
        this.testPaginationLogic();
    }
    
    testPaginationLogic() {
        console.log('Testing pagination logic...');
        const testTasks = Array.from({length: 12}, (_, i) => ({id: i + 1}));
        const testPageSize = 10;
        
        console.log(`Test: ${testTasks.length} tasks, page size ${testPageSize}`);
        
        for (let page = 1; page <= Math.ceil(testTasks.length / testPageSize); page++) {
            const startIndex = (page - 1) * testPageSize;
            const endIndex = Math.min(startIndex + testPageSize, testTasks.length);
            const pageTasks = testTasks.slice(startIndex, endIndex);
            
            console.log(`Page ${page}: startIndex=${startIndex}, endIndex=${endIndex}, tasks=${pageTasks.length}, IDs=[${pageTasks.map(t => t.id).join(', ')}]`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminAssignedTasks = new AdminAssignedTasks();
});

// Export for global access
window.AdminAssignedTasks = AdminAssignedTasks;
