const db = require('../src/config/database');
const { logger } = require('../src/utils/logger');

async function seedEventsWithRsvp() {
    try {
        // Check if events table exists
        const tableCheckQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'events'
            );
        `;

        const tableExists = await db.query(tableCheckQuery);
        if (!tableExists.rows[0].exists) {
            logger.info('Events table does not exist. Please run the migration first.');
            return;
        }

        // Check if event_participants table exists
        const participantsTableCheckQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'event_participants'
            );
        `;

        const participantsTableExists = await db.query(participantsTableCheckQuery);
        if (!participantsTableExists.rows[0].exists) {
            logger.info('Event participants table does not exist. Please run the migration first.');
            return;
        }

        // Check if we already have events
        const existingEvents = await db.query('SELECT COUNT(*) as count FROM events');
        if (parseInt(existingEvents.rows[0].count) > 0) {
            logger.info('Events already exist. Skipping seeding.');
            return;
        }

        // Get some users to create events for
        const users = await db.query('SELECT id, role FROM users LIMIT 10');
        if (users.rows.length === 0) {
            logger.info('No users found. Please seed users first.');
            return;
        }

        const lecturers = users.rows.filter(user => user.role === 'lecturer');
        const students = users.rows.filter(user => user.role === 'student');

        if (lecturers.length === 0) {
            logger.info('No lecturers found. Please seed users with lecturer role first.');
            return;
        }

        // Sample event data
        const sampleEvents = [
            {
                title: 'Computer Science Department Seminar',
                description: 'Join us for an exciting seminar on the latest developments in artificial intelligence and machine learning.',
                event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                location: 'Main Auditorium, Building A',
                created_by: lecturers[0].id
            },
            {
                title: 'Student Leadership Workshop',
                description: 'Develop your leadership skills through interactive workshops and team-building activities.',
                event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                location: 'Conference Room 101, Student Center',
                created_by: lecturers[0].id
            },
            {
                title: 'Career Fair 2024',
                description: 'Connect with top employers and explore career opportunities in various industries.',
                event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
                location: 'Exhibition Hall, Main Campus',
                created_by: lecturers[0].id
            },
            {
                title: 'Research Presentation Day',
                description: 'Graduate students present their research findings to faculty and peers.',
                event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                location: 'Research Lab 3, Science Building',
                created_by: lecturers[0].id
            },
            {
                title: 'Campus Cultural Festival',
                description: 'Celebrate diversity with music, dance, food, and cultural performances.',
                event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                location: 'Central Plaza, Campus Grounds',
                created_by: lecturers[0].id
            }
        ];

        // Insert events
        const insertedEvents = [];
        for (const eventData of sampleEvents) {
            const insertEventQuery = `
                INSERT INTO events (title, description, event_date, location, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const eventResult = await db.query(insertEventQuery, [
                eventData.title,
                eventData.description,
                eventData.event_date,
                eventData.location,
                eventData.created_by
            ]);

            insertedEvents.push(eventResult.rows[0]);
            logger.info(`Created event: ${eventData.title}`);
        }

        // Create RSVP data for events
        if (students.length > 0) {
            for (const event of insertedEvents) {
                // Randomly select students to RSVP
                const numParticipants = Math.floor(Math.random() * students.length) + 1;
                const selectedStudents = students
                    .sort(() => 0.5 - Math.random())
                    .slice(0, numParticipants);

                for (const student of selectedStudents) {
                    const rsvpStatuses = ['interested', 'going', 'not going'];
                    const randomStatus = rsvpStatuses[Math.floor(Math.random() * rsvpStatuses.length)];

                    const insertRsvpQuery = `
                        INSERT INTO event_participants (event_id, user_id, status)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (event_id, user_id) DO NOTHING
                    `;

                    await db.query(insertRsvpQuery, [event.id, student.id, randomStatus]);
                    logger.info(`Student ${student.id} RSVP'd as ${randomStatus} to event: ${event.title}`);
                }
            }
        }

        logger.info('Events and RSVP data seeded successfully!');
        logger.info(`Created ${insertedEvents.length} events`);

        // Log some statistics
        const totalParticipants = await db.query('SELECT COUNT(*) as count FROM event_participants');
        logger.info(`Total RSVPs: ${totalParticipants.rows[0].count}`);

        const statusBreakdown = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM event_participants 
            GROUP BY status
        `);

        logger.info('RSVP Status Breakdown:');
        statusBreakdown.rows.forEach(row => {
            logger.info(`  ${row.status}: ${row.count}`);
        });

    } catch (error) {
        logger.error('Error seeding events with RSVP:', error);
        throw error;
    }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
    seedEventsWithRsvp()
        .then(() => {
            logger.info('Events with RSVP seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Events with RSVP seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedEventsWithRsvp };
