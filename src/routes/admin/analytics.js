const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAnalyticsPermission } = require('../../middleware/roleAuth');
const User = require('../../models/User');

router.use(authenticateToken);
router.use(requireAnalyticsPermission);

router.get('/', async (req, res) => {
  const stats = await User.getStats();
  if (!stats.success) return res.status(500).json({ success: false, message: stats.error });
  res.json({ success: true, data: stats.data });
});

module.exports = router;
