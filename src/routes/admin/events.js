const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const Event = require('../../models/Event');

router.use(authenticateToken);
router.use(requireAdmin);

// List all events
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await Event.listAll({ page: parseInt(page), limit: parseInt(limit) });
  if (!result.success) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, data: result.data });
});

module.exports = router;
