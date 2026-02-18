const API_URL = 'http://localhost:8000';

/**
 * Task Manager Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        taskInput: document.getElementById('taskInput'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        taskList: document.getElementById('taskList'),
        pendingCount: document.getElementById('pendingCount'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        emptyState: document.getElementById('emptyState')
    };

    let currentFilter = 'all';
    let allTasks = [];
    let isSubmitting = false;
    let editingTaskId = null;

    /**
     * UI: Show Toast Notification
     */
    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Initialize application state
     */
    async function init() {
        await fetchTasks();
        render();
    }

    /**
     * API: Fetch all tasks
     */
    async function fetchTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`);
            if (!response.ok) throw new Error('Could not fetch tasks');
            allTasks = await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showNotification('Error loading tasks from server', 'error');
        }
    }

    /**
     * API: Add new task
     */
    async function addTask() {
        if (isSubmitting) return;

        const title = elements.taskInput.value.trim();
        if (!title) {
            showNotification('Please enter a task title', 'warning');
            return;
        }

        try {
            isSubmitting = true;
            elements.addTaskBtn.disabled = true;

            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description: "" })
            });

            if (response.ok) {
                elements.taskInput.value = '';
                await fetchTasks();
                render();
                showNotification('Task added successfully', 'success');
            } else {
                throw new Error('Failed to save task');
            }
        } catch (error) {
            showNotification('Failed to add task', 'error');
        } finally {
            isSubmitting = false;
            elements.addTaskBtn.disabled = false;
        }
    }

    /**
     * API: Toggle status (pending <-> completed)
     */
    async function toggleTask(id) {
        const task = allTasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'pending' : 'completed';

        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                await fetchTasks();
                render();
            }
        } catch (error) {
            showNotification('Failed to update task status', 'error');
        }
    }

    /**
     * API: Update task title
     */
    async function saveTask(id, newTitle) {
        const title = newTitle.trim();
        if (!title) {
            showNotification('Task title cannot be empty', 'warning');
            render(); // Reset to original state
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                editingTaskId = null;
                await fetchTasks();
                render();
                showNotification('Task updated', 'success');
            }
        } catch (error) {
            showNotification('Failed to update task', 'error');
        }
    }

    /**
     * API: Delete single task
     */
    async function deleteTask(id) {
        try {
            const response = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchTasks();
                render();
                showNotification('Task deleted', 'info');
            }
        } catch (error) {
            showNotification('Failed to delete task', 'error');
        }
    }

    /**
     * API: Bulk clear completed
     */
    async function clearCompleted() {
        if (!allTasks.some(t => t.status === 'completed')) return;

        try {
            const response = await fetch(`${API_URL}/tasks/completed/clear`, { method: 'DELETE' });
            if (response.ok) {
                await fetchTasks();
                render();
                showNotification('Cleared completed tasks', 'info');
            }
        } catch (error) {
            showNotification('Failed to clear tasks', 'error');
        }
    }

    /**
     * UI: Start editing a task
     */
    function startEditing(id) {
        editingTaskId = id;
        render();
        const input = document.getElementById(`edit-input-${id}`);
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }

    /**
     * UI: Cancel editing
     */
    function cancelEditing() {
        editingTaskId = null;
        render();
    }

    /**
     * UI: Render tasks and update stats
     */
    function render() {
        const filtered = allTasks.filter(t => {
            if (currentFilter === 'pending') return t.status === 'pending';
            if (currentFilter === 'completed') return t.status === 'completed';
            return true;
        });

        // Update list
        elements.taskList.innerHTML = filtered.map(task => {
            const isEditing = task.id === editingTaskId;

            return `
                <li class="task-item ${task.status === 'completed' ? 'completed' : ''} ${isEditing ? 'is-editing' : ''}">
                    <div class="task-checkbox ${task.status === 'completed' ? 'completed' : ''}" 
                         onclick="${isEditing ? '' : `toggleTask(${task.id})`}"></div>
                    
                    ${isEditing ? `
                        <input type="text" class="edit-input" id="edit-input-${task.id}" 
                               value="${escapeHtml(task.title)}" 
                               onkeydown="if(event.key === 'Enter') saveTask(${task.id}, this.value); if(event.key === 'Escape') cancelEditing();">
                        <div class="edit-actions">
                            <button class="btn-save" onclick="saveTask(${task.id}, document.getElementById('edit-input-${task.id}').value)" aria-label="Save">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button class="btn-cancel" onclick="cancelEditing()" aria-label="Cancel">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ` : `
                        <span class="task-text">${escapeHtml(task.title)}</span>
                        <div class="task-actions">
                            <button class="btn-edit" onclick="startEditing(${task.id})" aria-label="Edit task">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn-delete" onclick="deleteTask(${task.id})" aria-label="Delete task">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    `}
                </li>
            `;
        }).join('');

        // Handle empty state
        const hasTasks = allTasks.length > 0;
        const hasFiltered = filtered.length > 0;
        elements.emptyState.style.display = hasFiltered ? 'none' : 'block';

        if (!hasFiltered) {
            const msg = !hasTasks ? 'No tasks yet. Start by adding one!' :
                (currentFilter === 'pending' ? 'No pending tasks. Great job!' : 'No completed tasks yet.');
            elements.emptyState.querySelector('p').textContent = msg;
        }

        // Update stats
        const pendingCount = allTasks.filter(t => t.status !== 'completed').length;
        elements.pendingCount.textContent = `${pendingCount} item${pendingCount !== 1 ? 's' : ''} left`;
    }

    // Helper: Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Event Listeners
    elements.addTaskBtn.addEventListener('click', addTask);
    elements.taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    elements.clearCompletedBtn.addEventListener('click', clearCompleted);
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            elements.filterBtns.forEach(b => b.classList.toggle('active', b === btn));
            render();
        });
    });

    // Globals for inline events
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
    window.startEditing = startEditing;
    window.cancelEditing = cancelEditing;
    window.saveTask = saveTask;

    init();
});
