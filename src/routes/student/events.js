const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Event = require('../../models/Event');

router.use(authenticateToken);

// List events
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await Event.listAll({ page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// RSVP to event
router.post('/:event_id/rsvp', async (req, res) => {
    const event_id = parseInt(req.params.event_id);
    const user_id = req.user.id;
    const { status = 'interested' } = req.body; // interested | going | not going
    if (!['interested', 'going', 'not going'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid RSVP status' });
    }
    const result = await Event.rsvp({ event_id, user_id, status });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

module.exports = router;
