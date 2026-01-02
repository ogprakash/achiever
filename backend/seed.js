const { pool } = require('./database');

async function seedSampleTasks() {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting database cleanup and sample task creation...');

        // Clear all existing data for fresh start
        await client.query('DELETE FROM rating_history');
        await client.query('DELETE FROM daily_scores');
        await client.query('DELETE FROM tasks');

        console.log('🧹 Cleared existing data');

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Create sample tasks for today with different priorities
        const sampleTasks = [
            { title: 'Complete morning workout', importance: 4 },
            { title: 'Review and respond to emails', importance: 3 },
            { title: 'Work on main project', importance: 4 },
            { title: 'Read for 30 minutes', importance: 2 },
            { title: 'Plan tomorrow\'s tasks', importance: 1 },
        ];

        for (const task of sampleTasks) {
            await client.query(
                'INSERT INTO tasks (title, importance, assigned_date) VALUES ($1, $2, $3)',
                [task.title, task.importance, today]
            );
        }

        console.log(`✅ Created ${sampleTasks.length} sample tasks for today (${today})`);
        console.log('');
        console.log('📊 Rating System Info:');
        console.log('   • Starting rating: 1200');
        console.log('   • Complete tasks to earn points and increase rating');
        console.log('   • Higher priorities = more impact on daily score');
        console.log('');
        console.log('🎯 Sample tasks created:');
        sampleTasks.forEach((task, i) => {
            console.log(`   ${i + 1}. P${task.importance}: ${task.title}`);
        });

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the seed function
seedSampleTasks()
    .then(() => {
        console.log('');
        console.log('🎉 Database seeded successfully!');
        console.log('💡 Complete tasks and check the Stats screen to see your rating change!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    });
