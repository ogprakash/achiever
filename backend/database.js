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
    // Create users table FIRST (other tables reference it)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        current_rating INTEGER DEFAULT 1500,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add password column if missing (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
          ALTER TABLE users ADD COLUMN password VARCHAR(255);
        END IF;
      END $$;
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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

    // Add user_id column to tasks if it doesn't exist (migration for existing DBs)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
          ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
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
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_importance_check') THEN
          ALTER TABLE tasks DROP CONSTRAINT tasks_importance_check;
        END IF;
        ALTER TABLE tasks ADD CONSTRAINT tasks_importance_check CHECK (importance >= 0 AND importance <= 4);
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    // Create daily_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        total_possible_points INTEGER DEFAULT 0,
        earned_points INTEGER DEFAULT 0,
        percentage_score NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      );
    `);

    // Add user_id to daily_scores if missing
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_scores' AND column_name = 'user_id') THEN
          ALTER TABLE daily_scores ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create rating_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rating_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        rating INTEGER NOT NULL,
        daily_score NUMERIC(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add user_id to rating_history if missing
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rating_history' AND column_name = 'user_id') THEN
          ALTER TABLE rating_history ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Create streaks table for Cookie Jar tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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

// Seed mock leaderboard users
const seedMockUsers = async () => {
  const mockUsers = [
    { name: 'Cristiano Ronaldo', email: 'ronaldo@mock.com', rating: 3847, avatar: 'https://i.pravatar.cc/150?u=ronaldo' },
    { name: 'Virat Kohli', email: 'kohli@mock.com', rating: 3756, avatar: 'https://i.pravatar.cc/150?u=kohli' },
    { name: 'David Goggins', email: 'goggins@mock.com', rating: 3698, avatar: 'https://i.pravatar.cc/150?u=goggins' },
    { name: 'Lionel Messi', email: 'messi@mock.com', rating: 3634, avatar: 'https://i.pravatar.cc/150?u=messi' },
    { name: 'Kobe Bryant', email: 'kobe@mock.com', rating: 3589, avatar: 'https://i.pravatar.cc/150?u=kobe' },
    { name: 'Sachin Tendulkar', email: 'sachin@mock.com', rating: 3534, avatar: 'https://i.pravatar.cc/150?u=sachin' },
    { name: 'Michael Jordan', email: 'mj@mock.com', rating: 3487, avatar: 'https://i.pravatar.cc/150?u=mj' },
    { name: 'Usain Bolt', email: 'bolt@mock.com', rating: 3356, avatar: 'https://i.pravatar.cc/150?u=bolt' },
    { name: 'Roger Federer', email: 'federer@mock.com', rating: 3312, avatar: 'https://i.pravatar.cc/150?u=federer' },
    { name: 'Elon Musk', email: 'elon@mock.com', rating: 3289, avatar: 'https://i.pravatar.cc/150?u=elon' },
  ];

  for (const user of mockUsers) {
    try {
      await pool.query(
        `INSERT INTO users (email, name, avatar_url, current_rating)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET current_rating = $4`,
        [user.email, user.name, user.avatar, user.rating]
      );
    } catch (error) {
      console.log(`Mock user ${user.name} already exists or error:`, error.message);
    }
  }
  console.log('✅ Mock leaderboard users seeded');
};

module.exports = { pool, initDatabase, seedMockUsers };
