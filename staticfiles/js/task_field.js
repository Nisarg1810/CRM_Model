// Task Field Management JavaScript
class TaskFieldManager {
    constructor() {
        this.tasks = [];
        this.draggedElement = null;
        this.originalOrder = [];
        
        this.init();
    }
    
    init() {
        this.loadTasksFromDOM();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    loadTasksFromDOM() {
        const taskElements = document.querySelectorAll('.task-item');
        this.tasks = [];
        
        taskElements.forEach((element, index) => {
            const taskId = parseInt(element.dataset.taskId);
            const taskName = element.querySelector('.task-name').textContent;
            const taskIcon = element.querySelector('.task-icon i').className;
            
            this.tasks.push({
                id: taskId,
                name: taskName,
                icon: taskIcon,
                order: index + 1
            });
        });
        
        this.originalOrder = [...this.tasks];
    }
    
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('taskSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterTasks(e.target.value);
        });
        
        // Save order button
        const saveBtn = document.getElementById('saveOrderBtn');
        saveBtn.addEventListener('click', () => {
            this.saveOrder();
        });
        
        // Reset order button
        const resetBtn = document.getElementById('resetOrderBtn');
        resetBtn.addEventListener('click', () => {
            this.resetOrder();
        });
    }
    
    setupDragAndDrop() {
        const taskList = document.getElementById('taskList');
        let dragCounter = 0;
        
        // Drag start
        taskList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
                
                // Add a small delay to make the drag effect more visible
                setTimeout(() => {
                    e.target.style.opacity = '0.8';
                }, 0);
            }
        });
        
        // Drag end
        taskList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                e.target.style.opacity = '';
                this.draggedElement = null;
                this.clearDragIndicators();
            }
        });
        
        // Drag over - Enhanced for smoother experience
        taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const taskItem = e.target.closest('.task-item');
            if (taskItem && taskItem !== this.draggedElement) {
                const rect = taskItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                // Clear previous indicators
                this.clearDragIndicators();
                
                // Add smooth visual feedback
                if (e.clientY < midY) {
                    taskItem.classList.add('drag-over-top');
                    taskItem.style.transform = 'translateY(-2px)';
                } else {
                    taskItem.classList.add('drag-over-bottom');
                    taskItem.style.transform = 'translateY(2px)';
                }
            }
        });
        
        // Drag enter
        taskList.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
        });
        
        // Drag leave
        taskList.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                this.clearDragIndicators();
            }
        });
        
        // Drop - Enhanced with smoother animations
        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            
            const taskItem = e.target.closest('.task-item');
            if (taskItem && this.draggedElement && taskItem !== this.draggedElement) {
                const rect = taskItem.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                // Smooth animation for the drop
                this.draggedElement.style.transition = 'all 0.2s ease';
                
                if (e.clientY < midY) {
                    taskItem.parentNode.insertBefore(this.draggedElement, taskItem);
                } else {
                    taskItem.parentNode.insertBefore(this.draggedElement, taskItem.nextSibling);
                }
                
                // Add reordering animation
                this.draggedElement.classList.add('reordering');
                
                // Update order after a small delay for smooth animation
                setTimeout(() => {
                    this.updateOrder();
                    this.draggedElement.style.transition = '';
                    this.draggedElement.classList.remove('reordering');
                }, 200);
            }
            
            this.clearDragIndicators();
        });
    }
    
    clearDragIndicators() {
        const allTasks = document.querySelectorAll('.task-item');
        allTasks.forEach(task => {
            task.classList.remove('drag-over-top', 'drag-over-bottom');
            task.style.transform = '';
        });
    }
    
    updateOrder() {
        const taskElements = document.querySelectorAll('.task-item');
        const newOrder = [];
        
        taskElements.forEach((element, index) => {
            const taskId = parseInt(element.dataset.taskId);
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.order = index + 1;
                newOrder.push(task);
                element.dataset.order = index + 1;
            }
        });
        
        this.tasks = newOrder;
    }
    
    filterTasks(searchTerm) {
        const taskElements = document.querySelectorAll('.task-item');
        const searchLower = searchTerm.toLowerCase();
        
        taskElements.forEach(element => {
            const taskName = element.querySelector('.task-name').textContent.toLowerCase();
            if (taskName.includes(searchLower)) {
                element.classList.remove('filtered');
            } else {
                element.classList.add('filtered');
            }
        });
    }
    
    async saveOrder() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';
        
        try {
            const orderData = this.tasks.map((task, index) => ({
                id: task.id,
                name: task.name,
                order: index + 1
            }));
            
            console.log('Sending order data:', orderData);
            
            const csrfToken = this.getCSRFToken();
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }
            
            const response = await fetch('/save_task_order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ tasks: orderData })
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Success response:', result);
                this.showMessage('Task order saved successfully!', 'success');
                this.originalOrder = [...this.tasks];
            } else {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving task order:', error);
            this.showMessage(`Failed to save task order: ${error.message}`, 'error');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }
    
    async resetOrder() {
        if (confirm('Are you sure you want to reset the task order to the default?')) {
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.style.display = 'flex';
            
            try {
                const response = await fetch('/reset_task_order/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCSRFToken()
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('Reset response:', result);
                    
                    // Reload the page to show the reset order
                    window.location.reload();
                } else {
                    const errorText = await response.text();
                    console.error('Reset error:', errorText);
                    throw new Error(`Reset failed: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                console.error('Error resetting task order:', error);
                this.showMessage(`Failed to reset task order: ${error.message}`, 'error');
            } finally {
                loadingOverlay.style.display = 'none';
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
    
    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Insert message at the top of the container
        const container = document.querySelector('.task-field-container');
        container.insertBefore(messageElement, container.firstChild);
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
}

// Initialize the task field manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskFieldManager();
}); 