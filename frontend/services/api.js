const API_URL = 'https://achiever-production-e895.up.railway.app';

// Helper to get local date string YYYY-MM-DD
// format: 2026-01-04
export const getLocalDateString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    return localDate.toISOString().split('T')[0];
};

// Task API functions
export const fetchTasks = async (date, userId) => {
    // If date is provided, use it. Otherwise use correct LOCAL date.
    const targetDate = date || getLocalDateString();

    const url = userId
        ? `${API_URL}/tasks?date=${targetDate}&userId=${userId}`
        : `${API_URL}/tasks?date=${targetDate}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

export const createTask = async (title, importance, assignedDate, userId, options = {}) => {
    const date = assignedDate || getLocalDateString();
    const { is_daily = false, is_cookie_jar = false, task_type = 'standard' } = options;


    const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            importance,
            assigned_date: date,
            user_id: userId,
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

export const getDailyScore = async (date, userId) => {
    const targetDate = date || getLocalDateString();
    const url = userId
        ? `${API_URL}/stats/daily/${targetDate}?userId=${userId}`
        : `${API_URL}/stats/daily/${targetDate}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

export const getCurrentRating = async (userId) => {
    const url = userId
        ? `${API_URL}/stats/rating/current?userId=${userId}`
        : `${API_URL}/stats/rating/current`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

export const getRatingHistory = async (days = 30, userId) => {
    const url = userId
        ? `${API_URL}/stats/rating/history?days=${days}&userId=${userId}`
        : `${API_URL}/stats/rating/history?days=${days}`;
    const response = await fetch(url);
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

export const signup = async (email, name, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
    }
    return data;
};

export const signin = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Sign in failed');
    }
    return data;
};

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
