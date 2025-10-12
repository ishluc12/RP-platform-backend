const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const net = require('net');

const app = express();
const server = http.createServer(app);
const { createSocketServer } = require('./src/config/socket');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const io = createSocketServer(server);

// Import routes
const authRoutes = require('./src/routes/auth');
const sharedRoutes = require('./src/routes/shared');
const studentRoutes = require('./src/routes/student');
const lecturerRoutes = require('./src/routes/lecturer');
const adminRoutes = require('./src/routes/admin');
const chatbotRoutes = require('./src/routes/chatbot');
const administratorRoutes = require('./src/routes/administrator');
const pollsRoutes = require('./src/routes/shared/polls');
const commentsRoutes = require('./src/routes/shared/comments');
const forumsRoutes = require('./src/routes/shared/forums');

// Security middleware
app.use(helmet());
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000" // Added for consistency with Socket.IO default
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        const dynamicOrigins = [...allowedOrigins];
        // Add the dynamically assigned server port to allowed origins for Socket.IO
        const serverPort = 4000; // Fixed to 4000
        dynamicOrigins.push(`http://localhost:${serverPort}`);

        if (dynamicOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Increased limit for debugging purposes
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with proper headers for downloads
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    // Only force download for non-previewable files
    const ext = path.toLowerCase().split('.').pop();
    const previewableExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt'];
    
    if (!previewableExtensions.includes(ext)) {
      res.setHeader('Content-Disposition', 'attachment');
    } else {
      // For previewable files, allow inline viewing
      res.setHeader('Content-Disposition', 'inline');
    }
    
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Add CORS headers for file access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'P-Community Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Force download endpoint for files
app.get('/download/:filename', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    
    const filename = req.params.filename;
    
    // Try different possible paths
    const possiblePaths = [
        path.join(__dirname, 'uploads', filename),
        path.join(__dirname, 'uploads', 'messages', filename),
        path.join(__dirname, 'uploads', 'profiles', filename)
    ];
    
    let filePath = null;
    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            filePath = possiblePath;
            break;
        }
    }
    
    if (!filePath) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Force download with proper headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(filePath);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/administrator', administratorRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/shared/polls', pollsRoutes); // Polls Route
app.use('/api/shared/comments', commentsRoutes); // Comments Route
app.use('/api/shared/forums', forumsRoutes); // Forums Route

// Staff routes
const staffAppointmentRoutes = require('./src/routes/staff/appointments');
app.use('/api/staff/appointments', staffAppointmentRoutes);

// 404 handler (fixed, proper catch-all for unmatched routes)
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Setup Socket.io handlers


const PORT = process.env.PORT || 5000;

function findAvailablePort(currentPort) {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', err => {
                if (err.code === 'EADDRINUSE') {
                    findAvailablePort(currentPort + 1).then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                tester.once('close', () => resolve(currentPort)).close();
            })
            .listen(currentPort);
    });
}

const fixedPort = 5000; // Define a fixed port

server.listen(fixedPort, () => {
    console.log(`🚀 P-Community Backend server running on fixed port ${fixedPort}`);
    io.opts.cors.origin = [...allowedOrigins, `http://localhost:${fixedPort}`];
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${fixedPort}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;