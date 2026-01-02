const API_URL = 'http://localhost:3000';

// Task API functions
export const fetchTasks = async (date) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/tasks?date=${targetDate}`);
    const data = await response.json();
    return data;
};

export const createTask = async (title, importance, assignedDate) => {
    const date = assignedDate || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, importance, assigned_date: date }),
    });
    const newTask = await response.json();
    return newTask;
};

export const toggleTaskCompletion = async (taskId) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
        method: 'PATCH',
    });
    const updatedTask = await response.json();
    return updatedTask;
};

export const deleteTask = async (taskId) => {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
    });
    const result = await response.json();
    return result;
};

export const getDailyScore = async (date) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/stats/daily/${targetDate}`);
    const data = await response.json();
    return data;
};

export const getCurrentRating = async () => {
    const response = await fetch(`${API_URL}/stats/rating/current`);
    const data = await response.json();
    return data;
};

export const getRatingHistory = async (days = 30) => {
    const response = await fetch(`${API_URL}/stats/rating/history?days=${days}`);
    const data = await response.json();
    return data;
};
