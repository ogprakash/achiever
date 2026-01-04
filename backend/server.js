const express = require('express');
const cors = require('cors');
const { pool, initDatabase, seedMockUsers } = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize database and seed mock users on startup
initDatabase().then(() => seedMockUsers()).catch(console.error);

// Health check
app.get('/', (req, res) => {
    res.send('Achiever API Running! 🚀');
});

// ========== AUTHENTICATION ENDPOINTS ==========

// Google Sign-In (create or return user)
app.post('/auth/google', async (req, res) => {
    try {
        const { email, name, googleId, avatarUrl } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        // Check if user exists
        let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            // Create new user
            const result = await pool.query(
                `INSERT INTO users (email, name, google_id, avatar_url, current_rating)
                 VALUES ($1, $2, $3, $4, 1500)
                 RETURNING *`,
                [email, name, googleId || null, avatarUrl || null]
            );
            user = result;
        }

        res.json({
            id: user.rows[0].id,
            email: user.rows[0].email,
            name: user.rows[0].name,
            avatarUrl: user.rows[0].avatar_url,
            currentRating: user.rows[0].current_rating,
            createdAt: user.rows[0].created_at
        });
    } catch (error) {
        console.error('Error in Google auth:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Get user profile
app.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            currentRating: user.current_rating,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get leaderboard (top 10 + user's rank)
app.get('/leaderboard', async (req, res) => {
    try {
        const { userId } = req.query;

        // Get top 10 users
        const top10 = await pool.query(
            `SELECT id, name, avatar_url, current_rating
             FROM users
             ORDER BY current_rating DESC
             LIMIT 10`
        );

        let userRank = null;
        let userData = null;

        if (userId) {
            // Get user's rank
            const rankResult = await pool.query(
                `SELECT COUNT(*) + 1 as rank
                 FROM users
                 WHERE current_rating > (SELECT current_rating FROM users WHERE id = $1)`,
                [userId]
            );
            userRank = parseInt(rankResult.rows[0].rank);

            // Get user data
            const userResult = await pool.query(
                'SELECT id, name, avatar_url, current_rating FROM users WHERE id = $1',
                [userId]
            );
            if (userResult.rows.length > 0) {
                userData = {
                    id: userResult.rows[0].id,
                    name: userResult.rows[0].name,
                    avatarUrl: userResult.rows[0].avatar_url,
                    currentRating: userResult.rows[0].current_rating,
                    rank: userRank
                };
            }
        }

        res.json({
            leaderboard: top10.rows.map((user, index) => ({
                rank: index + 1,
                id: user.id,
                name: user.name,
                avatarUrl: user.avatar_url,
                currentRating: user.current_rating
            })),
            currentUser: userData
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ========== RATING ALGORITHM ==========

// Rating constants
const STARTING_RATING = 1500;
const MIN_RATING = 800;
const MAX_RATING = 4000;
const K_FACTOR = 32; // How volatile rating changes are

/**
 * Calculate the expected performance score based on current rating
 * Higher rating = higher expected performance
 * Returns a value between 20 and 80
 */
function getExpectedScore(currentRating) {
    // Base expected score is 50% at rating 1200
    // For every 20 rating points above 1200, expected score increases by 1%
    const expectedScore = 50 + (currentRating - STARTING_RATING) / 20;
    // Clamp between 20% and 80%
    return Math.max(20, Math.min(80, expectedScore));
}

/**
 * Calculate rating change based on actual vs expected performance
 * Similar to ELO rating system
 */
function calculateRatingChange(currentRating, actualScore) {
    const expectedScore = getExpectedScore(currentRating);
    // Rating change = K * (actual - expected) / 100
    const ratingChange = Math.round(K_FACTOR * (actualScore - expectedScore) / 100);
    return ratingChange;
}

/**
 * Get current rating from database, or return starting rating if none exists
 */
async function getCurrentRatingFromDB() {
    const result = await pool.query(
        'SELECT rating FROM rating_history ORDER BY date DESC LIMIT 1'
    );
    return result.rows.length > 0 ? result.rows[0].rating : STARTING_RATING;
}

// ========== TASK ENDPOINTS ==========

// Get all tasks for a specific date
app.get('/tasks', async (req, res) => {
    try {
        const { date } = req.query; // Format: YYYY-MM-DD
        const targetDate = date || new Date().toISOString().split('T')[0];

        const result = await pool.query(
            'SELECT * FROM tasks WHERE assigned_date = $1 ORDER BY importance ASC, created_at ASC',
            [targetDate]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a new task
app.post('/tasks', async (req, res) => {
    try {
        const { title, importance, assigned_date, is_daily = false, is_cookie_jar = false, task_type = 'standard' } = req.body;
        const date = assigned_date || new Date().toISOString().split('T')[0];

        const result = await pool.query(
            'INSERT INTO tasks (title, importance, assigned_date, is_daily, is_cookie_jar, task_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, importance, date, is_daily, is_cookie_jar, task_type]
        );

        // If it's a cookie jar task, create a streak for it
        if (is_cookie_jar) {
            await pool.query(
                'INSERT INTO streaks (task_title, streak_type, current_streak, last_completed_date) VALUES ($1, $2, 0, NULL) ON CONFLICT DO NOTHING',
                [title, 'avoidance']
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Toggle task completion
app.patch('/tasks/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE tasks 
       SET completed = NOT completed, 
           completed_at = CASE WHEN NOT completed THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error toggling task:', error);
        res.status(500).json({ error: 'Failed to toggle task' });
    }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// ========== DAILY SCORE ENDPOINTS ==========

// Calculate and get daily score (also updates rating)
app.get('/stats/daily/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // Get all tasks for the date
        const tasksResult = await pool.query(
            'SELECT * FROM tasks WHERE assigned_date = $1',
            [date]
        );

        const tasks = tasksResult.rows;

        // Calculate weights: P0 = 5 points, P1 = 4 points, P2 = 3 points, P3 = 2 points, P4 = 1 point
        // Cookie Jar tasks get 1.5x bonus because they're harder (resisting temptations)
        const getWeight = (task) => {
            const baseWeight = 5 - task.importance;
            const cookieJarBonus = task.is_cookie_jar ? 1.5 : 1;
            return Math.round(baseWeight * cookieJarBonus);
        };

        const totalPossiblePoints = tasks.reduce((sum, task) => sum + getWeight(task), 0);
        const earnedPoints = tasks
            .filter(task => task.completed)
            .reduce((sum, task) => sum + getWeight(task), 0);

        const percentageScore = totalPossiblePoints > 0
            ? (earnedPoints / totalPossiblePoints) * 100
            : 0;

        // Update or insert daily score
        await pool.query(
            `INSERT INTO daily_scores (date, total_possible_points, earned_points, percentage_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date) 
       DO UPDATE SET 
         total_possible_points = $2,
         earned_points = $3,
         percentage_score = $4`,
            [date, totalPossiblePoints, earnedPoints, percentageScore]
        );

        // ========== RATING CALCULATION ==========
        // Get rating from BEFORE today to use as baseline
        const prevRatingResult = await pool.query(
            'SELECT rating FROM rating_history WHERE date < $1 ORDER BY date DESC LIMIT 1',
            [date]
        );

        let previousRating = prevRatingResult.rows.length > 0 ? prevRatingResult.rows[0].rating : STARTING_RATING;
        let newRating = previousRating;
        let ratingChange = 0;

        if (totalPossiblePoints > 0) {
            // Calculate rating change based on performance vs PREVIOUS rating
            ratingChange = calculateRatingChange(previousRating, percentageScore);
            newRating = Math.max(MIN_RATING, Math.min(MAX_RATING, previousRating + ratingChange));

            // Check if we already have a rating entry for today
            const existingRating = await pool.query(
                'SELECT id FROM rating_history WHERE date = $1',
                [date]
            );

            if (existingRating.rows.length > 0) {
                // Update existing rating for today
                await pool.query(
                    'UPDATE rating_history SET rating = $1, daily_score = $2 WHERE date = $3',
                    [newRating, percentageScore, date]
                );
            } else {
                // Insert new rating entry
                await pool.query(
                    'INSERT INTO rating_history (date, rating, daily_score) VALUES ($1, $2, $3)',
                    [date, newRating, percentageScore]
                );
            }
        }

        res.json({
            date,
            totalPossiblePoints,
            earnedPoints,
            percentageScore: Math.round(percentageScore * 100) / 100,
            tasksCompleted: tasks.filter(t => t.completed).length,
            totalTasks: tasks.length,
            // Rating info
            previousRating: previousRating,
            currentRating: newRating,
            ratingChange: ratingChange,
            expectedScore: Math.round(getExpectedScore(previousRating) * 100) / 100
        });
    } catch (error) {
        console.error('Error calculating daily score:', error);
        res.status(500).json({ error: 'Failed to calculate daily score' });
    }
});

// ========== RATING ENDPOINTS ==========

// Get current rating
app.get('/stats/rating/current', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM rating_history ORDER BY date DESC LIMIT 1'
        );

        const currentRating = result.rows.length > 0 ? result.rows[0].rating : 1200; // Default starting rating
        res.json({ rating: currentRating });
    } catch (error) {
        console.error('Error fetching rating:', error);
        res.status(500).json({ error: 'Failed to fetch rating' });
    }
});

// Get rating history
app.get('/stats/rating/history', async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const result = await pool.query(
            'SELECT * FROM rating_history ORDER BY date DESC LIMIT $1',
            [days]
        );

        res.json(result.rows.reverse()); // Oldest first for charts
    } catch (error) {
        console.error('Error fetching rating history:', error);
        res.status(500).json({ error: 'Failed to fetch rating history' });
    }
});

// Reset rating history (start fresh)
app.post('/stats/rating/reset', async (req, res) => {
    try {
        await pool.query('DELETE FROM rating_history');
        res.json({ message: 'Rating history reset. Starting fresh at ' + STARTING_RATING, startingRating: STARTING_RATING });
    } catch (error) {
        console.error('Error resetting rating:', error);
        res.status(500).json({ error: 'Failed to reset rating' });
    }
});

// ========== COOKIE JAR / STREAK ENDPOINTS ==========

// Get all active streaks
app.get('/streaks', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM streaks WHERE is_active = true ORDER BY current_streak DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching streaks:', error);
        res.status(500).json({ error: 'Failed to fetch streaks' });
    }
});

// Create or update a streak (daily check-in for avoidance tasks)
app.post('/streaks/check-in', async (req, res) => {
    try {
        const { task_title, streak_type = 'avoidance' } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Check if streak exists
        const existing = await pool.query(
            'SELECT * FROM streaks WHERE task_title = $1 AND is_active = true',
            [task_title]
        );

        if (existing.rows.length > 0) {
            const streak = existing.rows[0];
            const lastDate = streak.last_completed_date;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let newStreak = streak.current_streak;

            // If last check-in was yesterday, continue streak
            if (lastDate === yesterdayStr) {
                newStreak = streak.current_streak + 1;
            } else if (lastDate !== today) {
                // If not yesterday and not today, reset streak
                newStreak = 1;
            }
            // If last check-in was today, keep same streak

            const longestStreak = Math.max(newStreak, streak.longest_streak);

            await pool.query(
                'UPDATE streaks SET current_streak = $1, longest_streak = $2, last_completed_date = $3 WHERE id = $4',
                [newStreak, longestStreak, today, streak.id]
            );

            // Add to cookie jar on milestone days (3, 7, 14, 30, etc.)
            const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
            if (milestones.includes(newStreak)) {
                await pool.query(
                    'INSERT INTO cookie_jar (title, description, streak_days, streak_id, earned_date) VALUES ($1, $2, $3, $4, $5)',
                    [
                        `${task_title} - ${newStreak} Day Streak! 🔥`,
                        `You maintained "${task_title}" for ${newStreak} consecutive days!`,
                        newStreak,
                        streak.id,
                        today
                    ]
                );
            }

            res.json({ ...streak, current_streak: newStreak, longest_streak: longestStreak });
        } else {
            // Create new streak
            const result = await pool.query(
                'INSERT INTO streaks (task_title, streak_type, current_streak, last_completed_date) VALUES ($1, $2, 1, $3) RETURNING *',
                [task_title, streak_type, today]
            );
            res.status(201).json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error checking in streak:', error);
        res.status(500).json({ error: 'Failed to check in streak' });
    }
});

// Get Cookie Jar achievements (consolidated streaks)
app.get('/cookie-jar', async (req, res) => {
    try {
        // Get achievements from cookie_jar table
        const achievements = await pool.query(
            'SELECT * FROM cookie_jar ORDER BY earned_date DESC, streak_days DESC'
        );

        // Get current active streaks for display
        const activeStreaks = await pool.query(
            'SELECT * FROM streaks WHERE is_active = true AND current_streak > 0 ORDER BY current_streak DESC'
        );

        // Consolidate: show only the highest streak for each task
        const consolidatedStreaks = {};
        for (const streak of activeStreaks.rows) {
            if (!consolidatedStreaks[streak.task_title] ||
                streak.current_streak > consolidatedStreaks[streak.task_title].current_streak) {
                consolidatedStreaks[streak.task_title] = streak;
            }
        }

        res.json({
            achievements: achievements.rows,
            activeStreaks: Object.values(consolidatedStreaks),
            totalCookies: achievements.rows.length
        });
    } catch (error) {
        console.error('Error fetching cookie jar:', error);
        res.status(500).json({ error: 'Failed to fetch cookie jar' });
    }
});

// Break a streak (when user fails)
app.post('/streaks/:id/break', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            'UPDATE streaks SET current_streak = 0, is_active = false WHERE id = $1',
            [id]
        );

        res.json({ message: 'Streak broken. Stay strong, start again!' });
    } catch (error) {
        console.error('Error breaking streak:', error);
        res.status(500).json({ error: 'Failed to break streak' });
    }
});

// Add manual cookie to jar (for past achievements)
app.post('/cookie-jar', async (req, res) => {
    try {
        const { title, description, icon = '🍪' } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const result = await pool.query(
            'INSERT INTO cookie_jar (title, description, icon, earned_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, icon, today]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding to cookie jar:', error);
        res.status(500).json({ error: 'Failed to add to cookie jar' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Achiever API running at http://localhost:${port}`);
    console.log(`📊 PostgreSQL connected on port 5433`);
});
