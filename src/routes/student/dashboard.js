const express = require('express');
const router = express.Router();

// Placeholder for student dashboard routes
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Student dashboard functionality coming soon'
    });
});

module.exports = router;
