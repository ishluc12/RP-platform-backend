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
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { setupSocketHandlers } = require('./src/sockets/socketService');

// Import routes
const authRoutes = require('./src/routes/auth');
const sharedRoutes = require('./src/routes/shared');
const studentRoutes = require('./src/routes/student');
const lecturerRoutes = require('./src/routes/lecturer');
const adminRoutes = require('./src/routes/admin');
const pollsRoutes = require('./src/routes/shared/polls');
const commentsRoutes = require('./src/routes/shared/comments');
const forumsRoutes = require('./src/routes/shared/forums');

// Security middleware
app.use(helmet());
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174"
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'P-Community Backend is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shared/polls', pollsRoutes); // Polls Route
app.use('/api/shared/comments', commentsRoutes); // Comments Route
app.use('/api/shared/forums', forumsRoutes); // Forums Route

// 404 handler (fixed, proper catch-all for unmatched routes)
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Setup Socket.io handlers
setupSocketHandlers(io);

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

findAvailablePort(parseInt(PORT)).then(availablePort => {
    server.listen(availablePort, () => {
        console.log(`🚀 P-Community Backend server running on port ${availablePort}`);
        console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
    });
}).catch(err => {
    console.error('Failed to find an available port:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;

