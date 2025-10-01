// backend/middleware/roleAuth.js

/**
 * Check if user has admin privileges
 * Accepts both 'admin' and 'administrator' roles
 */
const requireAdmin = (req, res, next) => {
    console.log('User attempting to access lecturer/admin route:', req.user);

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const adminRoles = ['admin', 'administrator', 'sys_admin'];

    if (!adminRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
        });
    }

    next();
};

/**
 * Check if user has lecturer privileges
 */
const requireLecturer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const lecturerRoles = ['lecturer', 'admin', 'administrator', 'sys_admin'];

    if (!lecturerRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Lecturer privileges required'
        });
    }

    next();
};

/**
 * Check if user has student privileges
 */
const requireStudent = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Students can access, but also lecturers and admins can access student routes
    const studentRoles = ['student', 'lecturer', 'admin', 'administrator', 'sys_admin'];

    if (!studentRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Student privileges required'
        });
    }

    next();
};

/**
 * Check if user has student or admin privileges
 */
const requireStudentOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const allowedRoles = ['student', 'admin', 'administrator', 'sys_admin'];

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Student or admin privileges required'
        });
    }

    next();
};

/**
 * Check if user has lecturer or admin privileges
 */
const requireLecturerOrAdmin = (req, res, next) => {
    console.log('User attempting to access lecturer/admin route:', req.user);
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const allowedRoles = ['lecturer', 'admin', 'administrator', 'sys_admin'];

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Lecturer or admin privileges required'
        });
    }

    next();
};

/**
 * Generic role check - pass in allowed roles
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log(`Checking role for user: ${req.user.email} (ID: ${req.user.id}, Role: ${req.user.role})`);
        console.log(`Allowed roles for this route: ${allowedRoles.join(', ')}`);

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = {
    requireAdmin,
    requireLecturer,
    requireStudent,
    requireStudentOrAdmin,
    requireLecturerOrAdmin,
    requireRoles
};