const db = require('../src/config/database');

const sampleEvents = [
    {
        title: 'Computer Science Department Meeting',
        description: 'Monthly department meeting to discuss curriculum updates and upcoming events.',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Computer Science Building, Room 101',
        created_by: 1 // Assuming user ID 1 exists
    },
    {
        title: 'Student Programming Workshop',
        description: 'Hands-on workshop covering advanced programming concepts and best practices.',
        event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        location: 'Engineering Lab, Room 205',
        created_by: 2 // Assuming user ID 2 exists
    },
    {
        title: 'Faculty Research Presentation',
        description: 'Presentation of ongoing research projects by faculty members.',
        event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        location: 'Main Auditorium',
        created_by: 1
    },
    {
        title: 'Student Career Fair',
        description: 'Annual career fair connecting students with industry professionals.',
        event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        location: 'Student Center',
        created_by: 3 // Assuming user ID 3 exists
    },
    {
        title: 'Technical Seminar: AI in Education',
        description: 'Exploring the applications of artificial intelligence in modern education.',
        event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        location: 'Lecture Hall A',
        created_by: 2
    },
    {
        title: 'Department Sports Day',
        description: 'Annual sports competition between different departments.',
        event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        location: 'University Sports Complex',
        created_by: 1
    },
    {
        title: 'Student Project Exhibition',
        description: 'Showcase of final year projects by graduating students.',
        event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        location: 'Exhibition Hall',
        created_by: 2
    },
    {
        title: 'Guest Lecture: Future of Technology',
        description: 'Special guest lecture by industry expert on emerging technologies.',
        event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        location: 'Main Conference Room',
        created_by: 3
    },
    {
        title: 'Study Group Session',
        description: 'Collaborative study session for advanced algorithms course.',
        event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        location: 'Library Study Room 3',
        created_by: 1
    },
    {
        title: 'Hackathon Planning Meeting',
        description: 'Planning session for the upcoming university hackathon event.',
        event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        location: 'Innovation Center',
        created_by: 2
    }
];

async function seedEvents() {
    try {
        console.log('Starting to seed events...');

        // Check if events table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'events'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Events table does not exist. Please run the migration first.');
            return;
        }

        // Check if events already exist
        const existingEvents = await db.query('SELECT COUNT(*) FROM events');
        if (parseInt(existingEvents.rows[0].count) > 0) {
            console.log('Events already exist in the database. Skipping seeding.');
            return;
        }

        // Insert sample events
        for (const event of sampleEvents) {
            const query = `
                INSERT INTO events (title, description, event_date, location, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            `;

            const values = [
                event.title,
                event.description,
                event.event_date,
                event.location,
                event.created_by
            ];

            const result = await db.query(query, values);
            console.log(`Created event: ${event.title} (ID: ${result.rows[0].id})`);
        }

        console.log('Events seeding completed successfully!');

    } catch (error) {
        console.error('Error seeding events:', error);
    } finally {
        await db.end();
    }
}

// Run the seeding function
if (require.main === module) {
    seedEvents();
}

module.exports = { seedEvents };
