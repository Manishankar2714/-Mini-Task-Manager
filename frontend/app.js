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
     * UI: Render tasks and update stats
     */
    function render() {
        const filtered = allTasks.filter(t => {
            if (currentFilter === 'pending') return t.status === 'pending';
            if (currentFilter === 'completed') return t.status === 'completed';
            return true;
        });

        // Update list
        elements.taskList.innerHTML = filtered.map(task => `
            <li class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                <div class="task-checkbox ${task.status === 'completed' ? 'completed' : ''}" 
                     onclick="toggleTask(${task.id})"></div>
                <span class="task-text">${escapeHtml(task.title)}</span>
                <button class="btn-delete" onclick="deleteTask(${task.id})" aria-label="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </li>
        `).join('');

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

    init();
});
