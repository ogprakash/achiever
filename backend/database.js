const { Pool } = require('pg');

// PostgreSQL connection pool
// Uses DATABASE_URL in production (Railway provides this automatically)
// Falls back to local config for development
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Required for Railway
    }
    : {
      host: 'localhost',
      port: 5433,
      user: 'achiever',
      password: 'achiever123',
      database: 'achiever_db',
    }
);

// Initialize database tables
const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        importance INTEGER CHECK (importance >= 0 AND importance <= 4),
        completed BOOLEAN DEFAULT FALSE,
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_daily BOOLEAN DEFAULT FALSE,
        is_cookie_jar BOOLEAN DEFAULT FALSE,
        task_type VARCHAR(20) DEFAULT 'standard'
      );
    `);

    // Add new columns if they don't exist (for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_daily') THEN
          ALTER TABLE tasks ADD COLUMN is_daily BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'is_cookie_jar') THEN
          ALTER TABLE tasks ADD COLUMN is_cookie_jar BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'task_type') THEN
          ALTER TABLE tasks ADD COLUMN task_type VARCHAR(20) DEFAULT 'standard';
        END IF;
      END $$;
    `);

    // Update importance constraint to allow 0-4 (drop old constraint, add new one)
    await client.query(`
      DO $$
      BEGIN
        -- Drop old constraint if it exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_importance_check') THEN
          ALTER TABLE tasks DROP CONSTRAINT tasks_importance_check;
        END IF;
        -- Add new constraint allowing 0-4
        ALTER TABLE tasks ADD CONSTRAINT tasks_importance_check CHECK (importance >= 0 AND importance <= 4);
      EXCEPTION WHEN duplicate_object THEN
        NULL; -- Constraint already exists with correct values
      END $$;
    `);

    // Create daily_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_scores (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        total_possible_points INTEGER DEFAULT 0,
        earned_points INTEGER DEFAULT 0,
        percentage_score NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create rating_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rating_history (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        rating INTEGER NOT NULL,
        daily_score NUMERIC(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create streaks table for Cookie Jar tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        task_title VARCHAR(255) NOT NULL,
        streak_type VARCHAR(50) DEFAULT 'avoidance',
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_completed_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create cookie_jar table for achievements
    await client.query(`
      CREATE TABLE IF NOT EXISTS cookie_jar (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        streak_days INTEGER DEFAULT 0,
        streak_id INTEGER REFERENCES streaks(id) ON DELETE SET NULL,
        earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        icon VARCHAR(10) DEFAULT '🍪',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
