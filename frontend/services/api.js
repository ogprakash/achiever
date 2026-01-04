const API_URL = 'https://achiever-production-e895.up.railway.app';

// Task API functions
export const fetchTasks = async (date) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/tasks?date=${targetDate}`);
    const data = await response.json();
    return data;
};

export const createTask = async (title, importance, assignedDate, options = {}) => {
    const date = assignedDate || new Date().toISOString().split('T')[0];
    const { is_daily = false, is_cookie_jar = false, task_type = 'standard' } = options;

    const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            importance,
            assigned_date: date,
            is_daily,
            is_cookie_jar,
            task_type
        }),
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

// ========== COOKIE JAR / STREAK API ==========

export const getStreaks = async () => {
    const response = await fetch(`${API_URL}/streaks`);
    const data = await response.json();
    return data;
};

export const checkInStreak = async (taskTitle, streakType = 'avoidance') => {
    const response = await fetch(`${API_URL}/streaks/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_title: taskTitle, streak_type: streakType }),
    });
    const data = await response.json();
    return data;
};

export const getCookieJar = async () => {
    const response = await fetch(`${API_URL}/cookie-jar`);
    const data = await response.json();
    return data;
};

export const breakStreak = async (streakId) => {
    const response = await fetch(`${API_URL}/streaks/${streakId}/break`, {
        method: 'POST',
    });
    const data = await response.json();
    return data;
};

export const addToCookieJar = async (title, description, icon = '🍪') => {
    const response = await fetch(`${API_URL}/cookie-jar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, icon }),
    });
    const data = await response.json();
    return data;
};

// ========== AUTH & USER API ==========

export const googleSignIn = async (email, name, googleId = null, avatarUrl = null) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, googleId, avatarUrl }),
    });
    const data = await response.json();
    return data;
};

export const getUserProfile = async (userId) => {
    const response = await fetch(`${API_URL}/user/${userId}`);
    const data = await response.json();
    return data;
};

export const getLeaderboard = async (userId = null) => {
    const url = userId ? `${API_URL}/leaderboard?userId=${userId}` : `${API_URL}/leaderboard`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};
