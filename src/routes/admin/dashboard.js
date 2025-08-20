const express = require('express');
const router = express.Router();

// Placeholder for admin dashboard routes
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard functionality coming soon'
  });
});

module.exports = router;
