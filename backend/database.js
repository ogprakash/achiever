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
        importance INTEGER CHECK (importance >= 1 AND importance <= 4),
        completed BOOLEAN DEFAULT FALSE,
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
