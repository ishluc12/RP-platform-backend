// generateSecret.js
const crypto = require('crypto');
const jwt_secret = crypto.randomBytes(64).toString('hex');
console.log(jwt_secret);
