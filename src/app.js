const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Lecturer routes
const lecturerAppointmentRoutes = require('./routes/lecturer/appointments');
app.use('/api/lecturer/appointments', lecturerAppointmentRoutes);

const lecturerAvailabilityRoutes = require('./routes/lecturer/availability');
app.use('/api/lecturer/availability', lecturerAvailabilityRoutes);

const lecturerDashboardRoutes = require('./routes/lecturer/dashboard');
app.use('/api/lecturer/dashboard', lecturerDashboardRoutes);

// Student routes
const studentAppointmentRoutes = require('./routes/student/appointments');
app.use('/api/student/appointments', studentAppointmentRoutes);
// Shared routes
const sharedRoutes = require('./routes/shared/index');
app.use('/api/shared', sharedRoutes);

// Chatbot routes (available to all authenticated users)
const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Administrator routes (independent from admin routes)
const administratorRoutes = require('./routes/administrator');
app.use('/api/administrator', administratorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;