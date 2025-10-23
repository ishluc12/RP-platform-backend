const express = require('express');
const router = express.Router();

// Public endpoint to provide Cloudinary configuration needed by the frontend
// Do NOT expose any API secret here. Only cloud name and an unsigned upload preset.
router.get('/cloudinary', (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';

  return res.json({
    cloudName,
    uploadPreset,
    configured: Boolean(cloudName && uploadPreset),
  });
});

module.exports = router;
