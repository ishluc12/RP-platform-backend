const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Event = require('../../models/Event');

router.use(authenticateToken);

// Create event (lecturer)
router.post('/', async (req, res) => {
    const created_by = req.user.id;
    const { title, description, event_date, location, max_participants, registration_required } = req.body;
    const result = await Event.create({ title, description, event_date, location, created_by, max_participants, registration_required });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.status(201).json({ success: true, data: result.data });
});

module.exports = router;
