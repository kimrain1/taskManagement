/**
 * Task Manager Application
 * Pure JavaScript implementation with localStorage persistence
 */

// ==================== Storage Module ====================
const Storage = {
    STORAGE_KEY: 'taskManager_tasks',

    /**
     * Get all tasks from localStorage
     * @returns {Promise<Array>} Array of tasks
     */
    async getTasks() {
        return new Promise((resolve, reject) => {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                const tasks = data ? JSON.parse(data) : [];
                resolve(tasks);
            } catch (error) {
                reject(new Error(`Failed to read tasks from storage: ${error.message}`));
            }
        });
    },

    /**
     * Save tasks to localStorage
     * @param {Array} tasks - Array of tasks to save
     * @returns {Promise<void>}
     */
    async saveTasks(tasks) {
        return new Promise((resolve, reject) => {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
                resolve();
            } catch (error) {
                reject(new Error(`Failed to save tasks to storage: ${error.message}`));
            }
        });
    },

    /**
     * Clear all tasks from localStorage
     * @returns {Promise<void>}
     */
    async clearTasks() {
        return new Promise((resolve, reject) => {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
                resolve();
            } catch (error) {
                reject(new Error(`Failed to clear tasks from storage: ${error.message}`));
            }
        });
    }
};

// ==================== Validation Module ====================
const Validation = {
    /**
     * Validate task data
     * @param {Object} task - Task object to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateTask(task) {
        const errors = [];

        // Title validation
        if (!task.title || typeof task.title !== 'string') {
            errors.push('Title is required and must be a string');
        } else if (task.title.trim().length === 0) {
            errors.push('Title cannot be empty');
        } else if (task.title.length > 100) {
            errors.push('Title cannot exceed 100 characters');
        }

        // Description validation
        if (task.description !== undefined && task.description !== null) {
            if (typeof task.description !== 'string') {
                errors.push('Description must be a string');
            } else if (task.description.length > 500) {
                errors.push('Description cannot exceed 500 characters');
            }
        }

        // Status validation
        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (task.status && !validStatuses.includes(task.status)) {
            errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
        }

        // Priority validation
        const validPriorities = ['low', 'medium', 'high'];
        if (task.priority && !validPriorities.includes(task.priority)) {
            errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
        }

        // Due date validation
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            if (isNaN(date.getTime())) {
                errors.push('Due date must be a valid date');
            }
        }

        // Due time validation
        if (task.dueTime) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(task.dueTime)) {
                errors.push('Due time must be in HH:MM format');
            }
        }

        // Reminder validation
        if (task.reminderEnabled) {
            if (task.reminderTime) {
                const reminderDate = new Date(task.reminderTime);
                if (isNaN(reminderDate.getTime())) {
                    errors.push('Reminder time must be a valid date/time');
                }
            }
            if (typeof task.reminderMinutes !== 'number' || task.reminderMinutes < 0) {
                errors.push('Reminder minutes must be a non-negative number');
            }
        }

        // Tags validation
        if (task.tags !== undefined && task.tags !== null) {
            if (!Array.isArray(task.tags)) {
                errors.push('Tags must be an array');
            } else {
                for (const tag of task.tags) {
                    if (typeof tag !== 'string') {
                        errors.push('Each tag must be a string');
                        break;
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate search query
     * @param {string} query - Search query
     * @returns {Object} Validation result
     */
    validateSearchQuery(query) {
        const errors = [];
        if (query !== undefined && query !== null && typeof query !== 'string') {
            errors.push('Search query must be a string');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// ==================== Task Manager Module ====================
const TaskManager = {
    /**
     * Generate a unique ID for a task
     * @returns {string} Unique ID
     */
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Add a new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} Created task
     */
    async addTask(taskData) {
        try {
            const tasks = await Storage.getTasks();

            const task = {
                id: this.generateId(),
                title: taskData.title.trim(),
                description: taskData.description?.trim() || '',
                status: taskData.status || 'pending',
                priority: taskData.priority || 'medium',
                dueDate: taskData.dueDate || null,
                dueTime: taskData.dueTime || null,
                reminderEnabled: taskData.reminderEnabled || false,
                reminderTime: taskData.reminderTime || null,
                reminderMinutes: taskData.reminderMinutes || 0,
                reminderNotified: false,
                tags: Array.isArray(taskData.tags) ? taskData.tags.map(t => t.trim()).filter(t => t) : [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const validation = Validation.validateTask(task);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }

            tasks.push(task);
            await Storage.saveTasks(tasks);

            return task;
        } catch (error) {
            throw new Error(`Failed to add task: ${error.message}`);
        }
    },

    /**
     * List all tasks
     * @returns {Promise<Array>} Array of tasks
     */
    async listTasks() {
        try {
            return await Storage.getTasks();
        } catch (error) {
            throw new Error(`Failed to list tasks: ${error.message}`);
        }
    },

    /**
     * Get a single task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object|null>} Task object or null
     */
    async getTask(id) {
        try {
            const tasks = await Storage.getTasks();
            return tasks.find(task => task.id === id) || null;
        } catch (error) {
            throw new Error(`Failed to get task: ${error.message}`);
        }
    },

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated task
     */
    async updateTask(id, updates) {
        try {
            const tasks = await Storage.getTasks();
            const index = tasks.findIndex(task => task.id === id);

            if (index === -1) {
                throw new Error('Task not found');
            }

            const updatedTask = {
                ...tasks[index],
                ...updates,
                id: tasks[index].id, // Preserve original ID
                createdAt: tasks[index].createdAt, // Preserve creation date
                updatedAt: new Date().toISOString()
            };

            // Reset reminder notification if reminder time changed
            if (updates.reminderTime && updates.reminderTime !== tasks[index].reminderTime) {
                updatedTask.reminderNotified = false;
            }

            // Ensure tags is an array
            if (updates.tags !== undefined) {
                updatedTask.tags = Array.isArray(updates.tags) 
                    ? updates.tags.map(t => t.trim()).filter(t => t) 
                    : [];
            }

            const validation = Validation.validateTask(updatedTask);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }

            tasks[index] = updatedTask;
            await Storage.saveTasks(tasks);

            return updatedTask;
        } catch (error) {
            throw new Error(`Failed to update task: ${error.message}`);
        }
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteTask(id) {
        try {
            const tasks = await Storage.getTasks();
            const index = tasks.findIndex(task => task.id === id);

            if (index === -1) {
                throw new Error('Task not found');
            }

            tasks.splice(index, 1);
            await Storage.saveTasks(tasks);

            return true;
        } catch (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    },

    /**
     * Filter tasks by criteria
     * @param {Object} criteria - Filter criteria
     * @returns {Promise<Array>} Filtered tasks
     */
    async filterTasks(criteria) {
        try {
            let tasks = await Storage.getTasks();

            if (criteria.status) {
                tasks = tasks.filter(task => task.status === criteria.status);
            }

            if (criteria.priority) {
                tasks = tasks.filter(task => task.priority === criteria.priority);
            }

            if (criteria.dueDate) {
                const filterDate = new Date(criteria.dueDate);
                tasks = tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate.toDateString() === filterDate.toDateString();
                });
            }

            if (criteria.tag) {
                tasks = tasks.filter(task => 
                    task.tags && task.tags.some(tag => 
                        tag.toLowerCase() === criteria.tag.toLowerCase()
                    )
                );
            }

            return tasks;
        } catch (error) {
            throw new Error(`Failed to filter tasks: ${error.message}`);
        }
    },

    /**
     * Search tasks by query
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching tasks
     */
    async searchTasks(query) {
        try {
            const validation = Validation.validateSearchQuery(query);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('; '));
            }

            const tasks = await Storage.getTasks();
            const searchTerm = query.toLowerCase().trim();

            if (!searchTerm) {
                return tasks;
            }

            return tasks.filter(task => {
                const titleMatch = task.title.toLowerCase().includes(searchTerm);
                const descMatch = task.description?.toLowerCase().includes(searchTerm);
                const tagMatch = task.tags?.some(tag => 
                    tag.toLowerCase().includes(searchTerm)
                );
                return titleMatch || descMatch || tagMatch;
            });
        } catch (error) {
            throw new Error(`Failed to search tasks: ${error.message}`);
        }
    },

    /**
     * Get task statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        try {
            const tasks = await Storage.getTasks();
            return {
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                completed: tasks.filter(t => t.status === 'completed').length,
                highPriority: tasks.filter(t => t.priority === 'high').length
            };
        } catch (error) {
            throw new Error(`Failed to get stats: ${error.message}`);
        }
    }
};

// ==================== Reminder Service Module ====================
const ReminderService = {
    checkInterval: null,
    notificationPermission: 'default',

    /**
     * Initialize the reminder service
     */
    async init() {
        // Request notification permission
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                this.notificationPermission = permission;
            }
        }

        // Start checking for reminders every minute
        this.startChecking();
    },

    /**
     * Start the reminder check interval
     */
    startChecking() {
        // Check immediately
        this.checkReminders();
        
        // Then check every minute
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 60000); // Check every minute
    },

    /**
     * Stop the reminder check interval
     */
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    },

    /**
     * Check all tasks for due reminders
     */
    async checkReminders() {
        try {
            const tasks = await Storage.getTasks();
            const now = new Date();

            for (const task of tasks) {
                // Skip if no reminder or already notified or completed
                if (!task.reminderEnabled || !task.reminderTime || 
                    task.reminderNotified || task.status === 'completed') {
                    continue;
                }

                const reminderTime = new Date(task.reminderTime);
                
                // Check if reminder is due (within 1 minute window)
                const timeDiff = reminderTime.getTime() - now.getTime();
                if (timeDiff <= 60000 && timeDiff > -60000) {
                    this.showNotification(task);
                    await this.markAsNotified(task.id);
                }
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    },

    /**
     * Show a notification for a task
     * @param {Object} task - Task object
     */
    showNotification(task) {
        if (this.notificationPermission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        const notification = new Notification('Task Reminder', {
            body: `${task.title}${task.dueTime ? ` - Due at ${task.dueTime}` : ''}`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
            tag: task.id,
            requireInteraction: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        // Auto close after 30 seconds
        setTimeout(() => notification.close(), 30000);
    },

    /**
     * Mark a task as notified
     * @param {string} taskId - Task ID
     */
    async markAsNotified(taskId) {
        try {
            const tasks = await Storage.getTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.reminderNotified = true;
                await Storage.saveTasks(tasks);
            }
        } catch (error) {
            console.error('Error marking task as notified:', error);
        }
    },

    /**
     * Get upcoming reminders
     * @returns {Promise<Array>} Array of tasks with upcoming reminders
     */
    async getUpcomingReminders() {
        try {
            const tasks = await Storage.getTasks();
            const now = new Date();
            
            return tasks.filter(task => {
                if (!task.reminderEnabled || !task.reminderTime || 
                    task.status === 'completed') {
                    return false;
                }
                const reminderTime = new Date(task.reminderTime);
                return reminderTime > now;
            }).sort((a, b) => {
                const timeA = new Date(a.reminderTime).getTime();
                const timeB = new Date(b.reminderTime).getTime();
                return timeA - timeB;
            });
        } catch (error) {
            console.error('Error getting upcoming reminders:', error);
            return [];
        }
    }
};

// ==================== UI Controller Module ====================
const UIController = {
    elements: {},

    /**
     * Initialize UI controller
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTasks();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            taskForm: document.getElementById('task-form'),
            taskId: document.getElementById('task-id'),
            title: document.getElementById('title'),
            description: document.getElementById('description'),
            status: document.getElementById('status'),
            priority: document.getElementById('priority'),
            dueDate: document.getElementById('due-date'),
            dueTime: document.getElementById('due-time'),
            reminderEnabled: document.getElementById('reminder-enabled'),
            reminderTime: document.getElementById('reminder-time'),
            reminderTimeGroup: document.getElementById('reminder-time-group'),
            reminderMinutes: document.getElementById('reminder-minutes'),
            reminderMinutesGroup: document.getElementById('reminder-minutes-group'),
            tags: document.getElementById('tags'),
            submitBtn: document.getElementById('submit-btn'),
            cancelBtn: document.getElementById('cancel-btn'),
            formTitle: document.getElementById('form-title'),
            tasksContainer: document.getElementById('tasks-container'),
            searchInput: document.getElementById('search-input'),
            filterStatus: document.getElementById('filter-status'),
            filterPriority: document.getElementById('filter-priority'),
            errorMessage: document.getElementById('error-message'),
            successMessage: document.getElementById('success-message'),
            totalTasks: document.getElementById('total-tasks'),
            pendingTasks: document.getElementById('pending-tasks'),
            inProgressTasks: document.getElementById('in-progress-tasks'),
            completedTasks: document.getElementById('completed-tasks')
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        this.elements.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Cancel button
        this.elements.cancelBtn.addEventListener('click', () => this.resetForm());

        // Search input with debounce
        let searchTimeout;
        this.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.handleSearch(e.target.value), 300);
        });

        // Filter changes
        this.elements.filterStatus.addEventListener('change', () => this.applyFilters());
        this.elements.filterPriority.addEventListener('change', () => this.applyFilters());

        // Reminder checkbox toggle
        this.elements.reminderEnabled.addEventListener('change', (e) => {
            const showReminder = e.target.checked;
            this.elements.reminderTimeGroup.style.display = showReminder ? 'block' : 'none';
            this.elements.reminderMinutesGroup.style.display = showReminder ? 'block' : 'none';
            
            if (showReminder && this.elements.dueDate.value) {
                this.updateReminderTimeFromMinutes();
            }
        });

        // Quick set reminder minutes
        this.elements.reminderMinutes.addEventListener('change', () => {
            this.updateReminderTimeFromMinutes();
        });

        // Due date/time change updates reminder
        this.elements.dueDate.addEventListener('change', () => {
            if (this.elements.reminderEnabled.checked) {
                this.updateReminderTimeFromMinutes();
            }
        });
        this.elements.dueTime.addEventListener('change', () => {
            if (this.elements.reminderEnabled.checked) {
                this.updateReminderTimeFromMinutes();
            }
        });
    },

    /**
     * Update reminder time based on due date/time and minutes offset
     */
    updateReminderTimeFromMinutes() {
        const dueDate = this.elements.dueDate.value;
        const dueTime = this.elements.dueTime.value || '00:00';
        const minutes = parseInt(this.elements.reminderMinutes.value) || 0;

        if (dueDate) {
            const dueDateTime = new Date(`${dueDate}T${dueTime}`);
            dueDateTime.setMinutes(dueDateTime.getMinutes() - minutes);
            
            // Format for datetime-local input
            const year = dueDateTime.getFullYear();
            const month = String(dueDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(dueDateTime.getDate()).padStart(2, '0');
            const hours = String(dueDateTime.getHours()).padStart(2, '0');
            const mins = String(dueDateTime.getMinutes()).padStart(2, '0');
            
            this.elements.reminderTime.value = `${year}-${month}-${day}T${hours}:${mins}`;
        }
    },

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        this.clearMessages();

        const taskData = {
            title: this.elements.title.value,
            description: this.elements.description.value,
            status: this.elements.status.value,
            priority: this.elements.priority.value,
            dueDate: this.elements.dueDate.value || null,
            dueTime: this.elements.dueTime.value || null,
            reminderEnabled: this.elements.reminderEnabled.checked,
            reminderTime: this.elements.reminderTime.value || null,
            reminderMinutes: parseInt(this.elements.reminderMinutes.value) || 0,
            tags: this.elements.tags.value.split(',').map(t => t.trim()).filter(t => t)
        };

        try {
            const taskId = this.elements.taskId.value;

            if (taskId) {
                // Update existing task
                await TaskManager.updateTask(taskId, taskData);
                this.showSuccess('Task updated successfully!');
            } else {
                // Add new task
                await TaskManager.addTask(taskData);
                this.showSuccess('Task added successfully!');
            }

            this.resetForm();
            await this.loadTasks();
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Load and display tasks
     */
    async loadTasks() {
        try {
            const tasks = await TaskManager.listTasks();
            this.renderTasks(tasks);
            await this.updateStats();
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Render tasks to the DOM
     * @param {Array} tasks - Tasks to render
     */
    renderTasks(tasks) {
        if (tasks.length === 0) {
            this.elements.tasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Create your first task!</p>
                    <small>Use the form on the left to get started</small>
                </div>
            `;
            return;
        }

        const html = tasks.map(task => this.createTaskHTML(task)).join('');
        this.elements.tasksContainer.innerHTML = html;

        // Bind task action buttons
        this.bindTaskActions();
    },

    /**
     * Create HTML for a single task
     * @param {Object} task - Task object
     * @returns {string} HTML string
     */
    createTaskHTML(task) {
        const dueDate = task.dueDate 
            ? new Date(task.dueDate).toLocaleDateString() 
            : 'No due date';

        const dueDateTime = task.dueDate && task.dueTime 
            ? `${dueDate} at ${task.dueTime}` 
            : dueDate;

        const tagsHTML = task.tags && task.tags.length > 0
            ? task.tags.map(tag => `<span class="tag">${this.escapeHTML(tag)}</span>`).join('')
            : '';

        const isCompleted = task.status === 'completed';

        // Reminder display
        let reminderHTML = '';
        if (task.reminderEnabled && task.reminderTime) {
            const reminderDate = new Date(task.reminderTime);
            const isUpcoming = reminderDate > new Date() && !isCompleted;
            reminderHTML = `
                <span class="task-reminder ${isUpcoming ? 'reminder-upcoming' : ''}" title="Reminder set">
                    🔔 ${reminderDate.toLocaleString()}
                </span>
            `;
        }

        return `
            <div class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <span class="task-title">${this.escapeHTML(task.title)}</span>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHTML(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="task-status status-${task.status}">${task.status.replace('-', ' ')}</span>
                    <span>📅 ${dueDateTime}</span>
                    ${reminderHTML}
                    <span>🕐 ${new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
                ${tagsHTML ? `<div class="task-tags">${tagsHTML}</div>` : ''}
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary btn-edit" data-id="${task.id}">Edit</button>
                    <button class="btn btn-sm btn-success btn-complete" data-id="${task.id}">
                        ${isCompleted ? 'Reopen' : 'Complete'}
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${task.id}">Delete</button>
                </div>
            </div>
        `;
    },

    /**
     * Bind event listeners for task actions
     */
    bindTaskActions() {
        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editTask(e.target.dataset.id));
        });

        // Complete buttons
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleComplete(e.target.dataset.id));
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteTask(e.target.dataset.id));
        });
    },

    /**
     * Edit a task
     * @param {string} id - Task ID
     */
    async editTask(id) {
        try {
            const task = await TaskManager.getTask(id);
            if (!task) {
                this.showError('Task not found');
                return;
            }

            // Populate form
            this.elements.taskId.value = task.id;
            this.elements.title.value = task.title;
            this.elements.description.value = task.description || '';
            this.elements.status.value = task.status;
            this.elements.priority.value = task.priority;
            this.elements.dueDate.value = task.dueDate || '';
            this.elements.dueTime.value = task.dueTime || '';
            this.elements.reminderEnabled.checked = task.reminderEnabled || false;
            this.elements.reminderTime.value = task.reminderTime || '';
            this.elements.reminderMinutes.value = task.reminderMinutes || 0;
            this.elements.tags.value = task.tags ? task.tags.join(', ') : '';

            // Show/hide reminder fields based on checkbox
            const showReminder = task.reminderEnabled;
            this.elements.reminderTimeGroup.style.display = showReminder ? 'block' : 'none';
            this.elements.reminderMinutesGroup.style.display = showReminder ? 'block' : 'none';

            // Update UI
            this.elements.formTitle.textContent = 'Edit Task';
            this.elements.submitBtn.textContent = 'Update Task';
            this.elements.cancelBtn.style.display = 'inline-block';

            // Scroll to form
            this.elements.taskForm.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Toggle task completion status
     * @param {string} id - Task ID
     */
    async toggleComplete(id) {
        try {
            const task = await TaskManager.getTask(id);
            if (!task) {
                this.showError('Task not found');
                return;
            }

            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await TaskManager.updateTask(id, { status: newStatus });
            await this.loadTasks();
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     */
    async deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await TaskManager.deleteTask(id);
            this.showSuccess('Task deleted successfully!');
            await this.loadTasks();
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Handle search
     * @param {string} query - Search query
     */
    async handleSearch(query) {
        try {
            const tasks = await TaskManager.searchTasks(query);
            this.renderTasks(tasks);
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Apply filters
     */
    async applyFilters() {
        try {
            const criteria = {
                status: this.elements.filterStatus.value || undefined,
                priority: this.elements.filterPriority.value || undefined
            };

            // Remove undefined criteria
            Object.keys(criteria).forEach(key => {
                if (criteria[key] === undefined) delete criteria[key];
            });

            if (Object.keys(criteria).length === 0) {
                await this.loadTasks();
            } else {
                const tasks = await TaskManager.filterTasks(criteria);
                this.renderTasks(tasks);
            }
        } catch (error) {
            this.showError(error.message);
        }
    },

    /**
     * Update statistics display
     */
    async updateStats() {
            try {
                const stats = await TaskManager.getStats();
                this.elements.totalTasks.textContent = stats.total;
                this.elements.pendingTasks.textContent = stats.pending;
                this.elements.inProgressTasks.textContent = stats.inProgress;
                this.elements.completedTasks.textContent = stats.completed;
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        },

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.elements.taskForm.reset();
        this.elements.taskId.value = '';
        this.elements.formTitle.textContent = 'Add New Task';
        this.elements.submitBtn.textContent = 'Add Task';
        this.elements.cancelBtn.style.display = 'none';
        
        // Reset reminder fields
        this.elements.reminderTimeGroup.style.display = 'none';
        this.elements.reminderMinutesGroup.style.display = 'none';
        
        this.clearMessages();
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.successMessage.style.display = 'none';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.elements.errorMessage.style.display = 'none';
        }, 5000);
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.elements.successMessage.textContent = message;
        this.elements.successMessage.style.display = 'block';
        this.elements.errorMessage.style.display = 'none';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.elements.successMessage.style.display = 'none';
        }, 3000);
    },

    /**
     * Clear all messages
     */
    clearMessages() {
        this.elements.errorMessage.style.display = 'none';
        this.elements.successMessage.style.display = 'none';
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== Command Interface ====================
/**
 * Command interface for programmatic task management
 * Can be used via browser console
 */
const Commands = {
    /**
     * Add a new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} Created task
     */
    async add(taskData) {
        return await TaskManager.addTask(taskData);
    },

    /**
     * List all tasks
     * @returns {Promise<Array>} Array of tasks
     */
    async list() {
        return await TaskManager.listTasks();
    },

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Updated task
     */
    async update(id, updates) {
        return await TaskManager.updateTask(id, updates);
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<boolean>} Success status
     */
    async delete(id) {
        return await TaskManager.deleteTask(id);
    },

    /**
     * Filter tasks
     * @param {Object} criteria - Filter criteria
     * @returns {Promise<Array>} Filtered tasks
     */
    async filter(criteria) {
        return await TaskManager.filterTasks(criteria);
    },

    /**
     * Search tasks
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching tasks
     */
    async search(query) {
        return await TaskManager.searchTasks(query);
    }
};

// ==================== Initialize Application ====================
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (typeof AuthController !== 'undefined' && !AuthController.requireAuth()) {
        return; // Will redirect to login
    }

    // Update user info in header
    updateUserHeader();

    // Initialize UI
    UIController.init();
    
    // Initialize reminder service
    ReminderService.init();
    
    console.log('Task Manager initialized. Use Commands object for CLI operations:');
    console.log('Commands.add({title: "Task", priority: "high"})');
    console.log('Commands.list()');
    console.log('Commands.update(id, {status: "completed"})');
    console.log('Commands.delete(id)');
    console.log('Commands.filter({status: "pending"})');
    console.log('Commands.search("keyword")');
});

/**
 * Update user header with current user info
 */
function updateUserHeader() {
    if (typeof AuthController === 'undefined') return;

    const user = AuthController.getCurrentUser();
    if (!user) return;

    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    // Get display name from firstName or email
    const displayName = user.firstName || user.email?.split('@')[0] || 'User';
    
    if (userAvatar) {
        userAvatar.textContent = displayName.charAt(0).toUpperCase();
    }
    if (userName) {
        userName.textContent = displayName;
    }
    if (userEmail) {
        userEmail.textContent = user.email || '';
    }
    if (logoutBtn) {
        // Remove any existing listener by cloning the button
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', async () => {
            await AuthController.logout();
        });
    }
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TaskManager, Storage, Validation, Commands };
}
