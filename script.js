// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const prioritySelect = document.getElementById('priority-select');
const categorySelect = document.getElementById('category-select');
const dueDateInput = document.getElementById('due-date');
const searchInput = document.getElementById('search');
const statusFilter = document.getElementById('status-filter');
const priorityFilter = document.getElementById('priority-filter');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');
const progressBar = document.getElementById('completion-progress');
const statsModal = document.getElementById('stats-modal');
const showStatsBtn = document.getElementById('show-stats');
const closeStatsBtn = document.getElementById('close-stats');
const statsContainer = document.getElementById('stats-container');

// Additional DOM Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editText = document.getElementById('edit-text');
const editPriority = document.getElementById('edit-priority');
const editCategory = document.getElementById('edit-category');
const editDueDate = document.getElementById('edit-due-date');
const editReminder = document.getElementById('edit-reminder');
const editNotes = document.getElementById('edit-notes');
const closeEdit = document.getElementById('close-edit');

const selectAll = document.getElementById('select-all');
const bulkComplete = document.getElementById('bulk-complete');
const bulkDelete = document.getElementById('bulk-delete');
const bulkPriority = document.getElementById('bulk-priority');
const bulkCategory = document.getElementById('bulk-category');

// State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let selectedTasks = new Set();
let taskOrder = [];

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
}

// Set default date to today
dueDateInput.valueAsDate = new Date();

// Event Listeners
todoForm.addEventListener('submit', addTodo);
searchInput.addEventListener('input', filterTodos);
statusFilter.addEventListener('change', filterTodos);
priorityFilter.addEventListener('change', filterTodos);
categoryFilter.addEventListener('change', filterTodos);
sortSelect.addEventListener('change', filterTodos);
clearCompletedBtn.addEventListener('click', clearCompleted);
themeToggle.addEventListener('click', toggleTheme);
showStatsBtn.addEventListener('click', () => {
    updateStats();
    statsModal.style.display = 'block';
});
closeStatsBtn.addEventListener('click', () => {
    statsModal.style.display = 'none';
});

// Functions
function addTodo(e) {
    e.preventDefault();
    
    const todoText = todoInput.value.trim();
    if (!todoText) return;

    const todo = {
        id: Date.now(),
        text: todoText,
        completed: false,
        priority: prioritySelect.value,
        category: categorySelect.value,
        dueDate: dueDateInput.value,
        reminder: document.getElementById('reminder-time').value,
        notes: document.getElementById('todo-notes').value.trim(),
        createdAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item priority-${todo.priority}${todo.completed ? ' completed' : ''}${selectedTasks.has(todo.id) ? ' selected' : ''}`;
    li.dataset.id = todo.id;
    li.draggable = true;

    // Add drag event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    checkbox.addEventListener('click', (e) => e.stopPropagation());

    const selectionCheckbox = document.createElement('input');
    selectionCheckbox.type = 'checkbox';
    selectionCheckbox.className = 'selection-checkbox';
    selectionCheckbox.checked = selectedTasks.has(todo.id);
    selectionCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleTaskSelection(todo.id);
    });

    const content = document.createElement('div');
    content.className = 'todo-content';
    content.innerHTML = `
        <div class="todo-text">${todo.text}</div>
        <div class="todo-details">
            <span class="priority ${todo.priority}">${todo.priority}</span>
            <span class="category">${todo.category}</span>
            ${todo.dueDate ? `<span class="due-date">Due: ${formatDate(todo.dueDate)}</span>` : ''}
            ${todo.reminder ? `<span class="reminder">⏰ ${todo.reminder}</span>` : ''}
        </div>
        ${todo.notes ? `<div class="notes">${todo.notes}</div>` : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '✎';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(todo);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTodo(todo.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(selectionCheckbox);
    li.appendChild(checkbox);
    li.appendChild(content);
    li.appendChild(actions);

    return li;
}

function toggleTodo(id) {
    todos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}

function filterTodos() {
    const searchText = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    const category = categoryFilter.value;
    const sortBy = sortSelect.value;

    let filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.text.toLowerCase().includes(searchText);
        const matchesStatus = status === 'all' ||
            (status === 'active' && !todo.completed) ||
            (status === 'completed' && todo.completed);
        const matchesPriority = priority === 'all' || todo.priority === priority;
        const matchesCategory = category === 'all' || todo.category === category;

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    // Sort todos
    filteredTodos.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortBy === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else {
            return a.category.localeCompare(b.category);
        }
    });

    renderTodoList(filteredTodos);
}

function renderTodoList(filteredTodos) {
    todoList.innerHTML = '';
    filteredTodos.forEach(todo => {
        todoList.appendChild(createTodoElement(todo));
    });
}

function renderTodos() {
    filterTodos();
    updateItemsLeft();
}

function updateItemsLeft() {
    const remainingTodos = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `${remainingTodos} item${remainingTodos !== 1 ? 's' : ''} left`;
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    updateUI();
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function updateUI() {
    // Clear existing list
    todoList.innerHTML = '';

    // Apply filters
    let filteredTodos = [...todos];
    
    // Status filter
    const statusFilter = document.getElementById('status-filter').value;
    if (statusFilter !== 'all') {
        filteredTodos = filteredTodos.filter(todo => 
            statusFilter === 'completed' ? todo.completed : !todo.completed
        );
    }

    // Priority filter
    const priorityFilter = document.getElementById('priority-filter').value;
    if (priorityFilter !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.priority === priorityFilter);
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter').value;
    if (categoryFilter !== 'all') {
        filteredTodos = filteredTodos.filter(todo => todo.category === categoryFilter);
    }

    // Sort
    const sortBy = document.getElementById('sort-select').value;
    filteredTodos.sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });

    // Render filtered and sorted todos
    filteredTodos.forEach(todo => {
        todoList.appendChild(createTodoElement(todo));
    });

    // Update items left count
    const activeCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;

    // Update progress bar
    const completionPercentage = todos.length > 0 
        ? (todos.filter(todo => todo.completed).length / todos.length) * 100 
        : 0;
    progressBar.style.width = `${completionPercentage}%`;

    // Update select all checkbox
    selectAll.checked = todos.length > 0 && selectedTasks.size === todos.length;
    
    // Update bulk action buttons
    updateBulkActionButtons();
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    const priorityCount = {
        high: todos.filter(todo => todo.priority === 'high').length,
        medium: todos.filter(todo => todo.priority === 'medium').length,
        low: todos.filter(todo => todo.priority === 'low').length
    };
    const categoryCount = {};
    todos.forEach(todo => {
        categoryCount[todo.category] = (categoryCount[todo.category] || 0) + 1;
    });

    statsContainer.innerHTML = `
        <div class="stat-item">Total Tasks: ${total}</div>
        <div class="stat-item">Completed: ${completed}</div>
        <div class="stat-item">Active: ${active}</div>
        <div class="stat-item">
            Priority Distribution:
            <ul>
                <li>High: ${priorityCount.high}</li>
                <li>Medium: ${priorityCount.medium}</li>
                <li>Low: ${priorityCount.low}</li>
            </ul>
        </div>
        <div class="stat-item">
            Category Distribution:
            <ul>
                ${Object.entries(categoryCount)
                    .map(([category, count]) => `<li>${category}: ${count}</li>`)
                    .join('')}
            </ul>
        </div>
    `;
}

// Search functionality
document.getElementById('search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const todoItems = todoList.getElementsByClassName('todo-item');
    
    Array.from(todoItems).forEach(item => {
        const text = item.querySelector('.todo-text').textContent.toLowerCase();
        const notes = item.querySelector('.notes')?.textContent.toLowerCase() || '';
        item.style.display = text.includes(searchTerm) || notes.includes(searchTerm) ? '' : 'none';
    });
});

// Quick action buttons
document.getElementById('sort-due-today').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    todos = todos.filter(todo => todo.dueDate === today);
    updateUI();
});

document.getElementById('sort-priority-high').addEventListener('click', () => {
    document.getElementById('priority-filter').value = 'high';
    updateUI();
});

// Filter change handlers
document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', updateUI);
});

// Task Selection Functions
function toggleTaskSelection(id) {
    if (selectedTasks.has(id)) {
        selectedTasks.delete(id);
    } else {
        selectedTasks.add(id);
    }
    updateBulkActionButtons();
    updateUI();
}

function updateBulkActionButtons() {
    const hasSelection = selectedTasks.size > 0;
    bulkComplete.disabled = !hasSelection;
    bulkDelete.disabled = !hasSelection;
    bulkPriority.disabled = !hasSelection;
    bulkCategory.disabled = !hasSelection;
}

// Bulk Actions
function handleBulkComplete() {
    todos = todos.map(todo => 
        selectedTasks.has(todo.id) 
            ? { ...todo, completed: true }
            : todo
    );
    selectedTasks.clear();
    saveTodos();
}

function handleBulkDelete() {
    todos = todos.filter(todo => !selectedTasks.has(todo.id));
    selectedTasks.clear();
    saveTodos();
}

function handleBulkPriorityChange(priority) {
    if (!priority) return;
    todos = todos.map(todo =>
        selectedTasks.has(todo.id)
            ? { ...todo, priority }
            : todo
    );
    saveTodos();
    bulkPriority.value = '';
}

function handleBulkCategoryChange(category) {
    if (!category) return;
    todos = todos.map(todo =>
        selectedTasks.has(todo.id)
            ? { ...todo, category }
            : todo
    );
    saveTodos();
    bulkCategory.value = '';
}

// Edit Modal Functions
function openEditModal(todo) {
    editId.value = todo.id;
    editText.value = todo.text;
    editPriority.value = todo.priority;
    editCategory.value = todo.category;
    editDueDate.value = todo.dueDate;
    editReminder.value = todo.reminder;
    editNotes.value = todo.notes;
    editModal.style.display = 'block';
}

function handleEditSubmit(e) {
    e.preventDefault();
    const id = parseInt(editId.value);
    todos = todos.map(todo =>
        todo.id === id
            ? {
                ...todo,
                text: editText.value,
                priority: editPriority.value,
                category: editCategory.value,
                dueDate: editDueDate.value,
                reminder: editReminder.value,
                notes: editNotes.value
            }
            : todo
    );
    editModal.style.display = 'none';
    saveTodos();
}

// Drag and Drop Functions
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.closest('.todo-item')?.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    const dropTarget = e.target.closest('.todo-item');
    
    if (dropTarget && draggedId !== parseInt(dropTarget.dataset.id)) {
        const dropId = parseInt(dropTarget.dataset.id);
        reorderTasks(draggedId, dropId);
    }
}

function reorderTasks(draggedId, dropId) {
    const draggedIndex = todos.findIndex(t => t.id === draggedId);
    const dropIndex = todos.findIndex(t => t.id === dropId);
    
    const [draggedTask] = todos.splice(draggedIndex, 1);
    todos.splice(dropIndex, 0, draggedTask);
    
    saveTodos();
}

// Add Event Listeners
selectAll.addEventListener('change', () => {
    if (selectAll.checked) {
        todos.forEach(todo => selectedTasks.add(todo.id));
    } else {
        selectedTasks.clear();
    }
    updateBulkActionButtons();
    updateUI();
});

bulkComplete.addEventListener('click', handleBulkComplete);
bulkDelete.addEventListener('click', handleBulkDelete);
bulkPriority.addEventListener('change', (e) => handleBulkPriorityChange(e.target.value));
bulkCategory.addEventListener('change', (e) => handleBulkCategoryChange(e.target.value));

editForm.addEventListener('submit', handleEditSubmit);
closeEdit.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Initialize
initializeTheme();
updateUI(); 