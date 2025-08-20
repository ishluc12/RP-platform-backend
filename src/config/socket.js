const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
}

// Socket authentication middleware
const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
};

// Create Socket.io server with authentication
const createSocketServer = (httpServer) => {
    const io = socketIo(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Apply authentication middleware
    io.use(authenticateSocket);

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`🔌 User ${socket.userId} (${socket.userRole}) connected`);

        // Join user to role-specific room
        socket.join(socket.userRole);

        // Join user to personal room
        socket.join(`user_${socket.userId}`);

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`🔌 User ${socket.userId} disconnected`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};

// Emit to specific user
const emitToUser = (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};

// Emit to role-specific users
const emitToRole = (io, role, event, data) => {
    io.to(role).emit(event, data);
};

// Emit to all connected users
const emitToAll = (io, event, data) => {
    io.emit(event, data);
};

module.exports = {
    createSocketServer,
    authenticateSocket,
    emitToUser,
    emitToRole,
    emitToAll
};
