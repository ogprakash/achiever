const express = require('express');
const cors = require('cors');
const { pool, initDatabase } = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize database on startup
initDatabase().catch(console.error);

// Health check
app.get('/', (req, res) => {
    res.send('Achiever API Running! 🚀');
});

// ========== RATING ALGORITHM ==========

// Rating constants
const STARTING_RATING = 1200;
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
            'SELECT * FROM tasks WHERE assigned_date = $1 ORDER BY importance DESC, created_at ASC',
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
        const { title, importance, assigned_date } = req.body;
        const date = assigned_date || new Date().toISOString().split('T')[0];

        const result = await pool.query(
            'INSERT INTO tasks (title, importance, assigned_date) VALUES ($1, $2, $3) RETURNING *',
            [title, importance, date]
        );

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
        const totalPossiblePoints = tasks.reduce((sum, task) => sum + task.importance, 0);
        const earnedPoints = tasks
            .filter(task => task.completed)
            .reduce((sum, task) => sum + task.importance, 0);

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
        // Only update rating if there are tasks for the day
        let currentRating = await getCurrentRatingFromDB();
        let newRating = currentRating;
        let ratingChange = 0;

        if (totalPossiblePoints > 0) {
            // Calculate rating change based on performance
            ratingChange = calculateRatingChange(currentRating, percentageScore);
            newRating = Math.max(MIN_RATING, Math.min(MAX_RATING, currentRating + ratingChange));

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
            previousRating: currentRating,
            currentRating: newRating,
            ratingChange: ratingChange
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

app.listen(port, () => {
    console.log(`🚀 Achiever API running at http://localhost:${port}`);
    console.log(`📊 PostgreSQL connected on port 5433`);
});
