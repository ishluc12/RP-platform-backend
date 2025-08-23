const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Event = require('../../models/Event');

router.use(authenticateToken);

// List events
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const result = await Event.listAll({ page, limit });

        if (!result.success)
            return res.status(400).json({ success: false, message: result.error });

        res.json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// RSVP to event
router.post('/:event_id/rsvp', async (req, res) => {
    try {
        const event_id = parseInt(req.params.event_id);
        const user_id = req.user.id;
        const status = req.body.status || 'interested';

        if (!['interested', 'going', 'not going'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid RSVP status' });
        }

        const result = await Event.rsvp({ event_id, user_id, status });
        if (!result.success)
            return res.status(400).json({ success: false, message: result.error });

        res.json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
