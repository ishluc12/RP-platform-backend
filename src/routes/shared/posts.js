const express = require('express');
const router = express.Router();

// Placeholder for shared posts routes
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Shared posts functionality coming soon'
    });
});

module.exports = router;
