const fs = require('fs');
const path = require('path');

const structure = [
  'src/config/database.js',
  'src/config/auth.js',
  'src/config/cloudinary.js',
  'src/config/socket.js',
  'src/controllers/auth/authController.js',
  'src/controllers/shared/userController.js',
  'src/controllers/shared/postController.js',
  'src/controllers/shared/messageController.js',
  'src/controllers/shared/notificationController.js',
  'src/controllers/shared/forumController.js',
  'src/controllers/student/studentAppointmentController.js',
  'src/controllers/student/studentEventController.js',
  'src/controllers/student/studentDashboardController.js',
  'src/controllers/lecturer/lecturerAppointmentController.js',
  'src/controllers/lecturer/lecturerAvailabilityController.js',
  'src/controllers/lecturer/lecturerEventController.js',
  'src/controllers/lecturer/lecturerDashboardController.js',
  'src/controllers/admin/adminUserController.js',
  'src/controllers/admin/adminEventController.js',
  'src/controllers/admin/adminAnalyticsController.js',
  'src/controllers/admin/adminForumController.js',
  'src/controllers/admin/adminDashboardController.js',
  'src/middleware/auth.js',
  'src/middleware/roleAuth.js',
  'src/middleware/validation.js',
  'src/middleware/upload.js',
  'src/middleware/rateLimiting.js',
  'src/middleware/errorHandler.js',
  'src/models/User.js',
  'src/models/Post.js',
  'src/models/Message.js',
  'src/models/Appointment.js',
  'src/models/Event.js',
  'src/models/Forum.js',
  'src/models/Poll.js',
  'src/models/Notification.js',
  'src/routes/auth.js',
  'src/routes/shared/posts.js',
  'src/routes/shared/messages.js',
  'src/routes/shared/notifications.js',
  'src/routes/shared/forums.js',
  'src/routes/student/appointments.js',
  'src/routes/student/events.js',
  'src/routes/student/dashboard.js',
  'src/routes/lecturer/appointments.js',
  'src/routes/lecturer/availability.js',
  'src/routes/lecturer/events.js',
  'src/routes/lecturer/dashboard.js',
  'src/routes/admin/users.js',
  'src/routes/admin/events.js',
  'src/routes/admin/analytics.js',
  'src/routes/admin/forums.js',
  'src/routes/admin/dashboard.js',
  'src/services/emailService.js',
  'src/services/notificationService.js',
  'src/services/uploadService.js',
  'src/services/analyticsService.js',
  'src/services/socketService.js',
  'src/utils/helpers.js',
  'src/utils/validators.js',
  'src/utils/constants.js',
  'src/utils/rolePermissions.js',
  'src/sockets/messageSocket.js',
  'src/sockets/notificationSocket.js',
  'src/sockets/activitySocket.js',
  'src/app.js',
  'migrations/.keep',
  'seeds/.keep',
  'tests/.keep',
  'uploads/.keep',
  '.env',
  '.gitignore',
  'package.json',
  'server.js'
];

// Create directories and files
structure.forEach(item => {
  const dir = path.dirname(item);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (path.extname(item)) {
    // Create empty file if not exists
    if (!fs.existsSync(item)) {
      fs.writeFileSync(item, '');
    }
  } else {
    // Create empty directory
    if (!fs.existsSync(item)) {
      fs.mkdirSync(item, { recursive: true });
    }
  }
});

console.log('Folder structure created!');