const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Event = require('../../models/Event');

router.use(authenticateToken);

// Create event (lecturer)
router.post('/', async (req, res) => {
    try {
        const created_by = req.user.id;
        let { title, description, event_date, location, max_participants, registration_required } = req.body;

        // Basic validation
        if (!title || !event_date || !location) {
            return res.status(400).json({ success: false, message: 'Title, event_date, and location are required' });
        }

        // Type coercion
        max_participants = max_participants ? parseInt(max_participants) : null;
        registration_required = !!registration_required;

        // Validate date
        const eventDateObj = new Date(event_date);
        if (isNaN(eventDateObj.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid event_date format' });
        }

        const result = await Event.create({
            title,
            description,
            event_date: eventDateObj.toISOString(),
            location,
            created_by,
            max_participants,
            registration_required
        });

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        res.status(201).json({ success: true, data: result.data });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
    }
});

module.exports = router;
