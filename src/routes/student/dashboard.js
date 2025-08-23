const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Student dashboard functionality coming soon',
        user: {
            id: req.user.id,
            role: req.user.role
        }
    });
});

module.exports = router;
