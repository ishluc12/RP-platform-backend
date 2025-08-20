const express = require('express');
const router = express.Router();

// Placeholder for shared messages routes
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Shared messages functionality coming soon'
    });
});

module.exports = router;
