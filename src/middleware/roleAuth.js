// Role-based access control middleware

// Check if user has required role
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Convert single role to array for consistency
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    error: 'ACCESS_DENIED',
                    requiredRoles: roles,
                    userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            console.error('Role authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    return requireRole(['administrator', 'sys_admin', 'admin'])(req, res, next);
};

// Check if user is lecturer or admin
const requireLecturerOrAdmin = (req, res, next) => {
    return requireRole(['lecturer', 'administrator', 'sys_admin', 'admin'])(req, res, next);
};

// Check if user is student or admin
const requireStudentOrAdmin = (req, res, next) => {
    return requireRole(['student', 'administrator', 'sys_admin', 'admin'])(req, res, next);
};

// Check if user can access their own resource or is admin
const requireOwnershipOrAdmin = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdParam];

            // Admin can access any resource
            if (['administrator', 'sys_admin', 'admin'].includes(req.user.role)) {
                return next();
            }

            // User can access their own resource
            if (req.user.id === parseInt(resourceId)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.',
                error: 'ACCESS_DENIED'
            });
        } catch (error) {
            console.error('Ownership authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user can access department resources
const requireDepartmentAccess = (departmentParam = 'department') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin can access any department
            if (['administrator', 'sys_admin', 'admin'].includes(req.user.role)) {
                return next();
            }

            const targetDepartment = req.params[departmentParam];
            const userDepartment = req.user.department;

            // User can access their own department
            if (userDepartment === targetDepartment) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access resources from your department.',
                error: 'DEPARTMENT_ACCESS_DENIED'
            });
        } catch (error) {
            console.error('Department authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user can modify resource (owner, admin, or specific roles)
const requireModifyPermission = (allowedRoles = ['admin'], resourceIdParam = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdParam];

            // Check if user has required role
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
            if (roles.includes(req.user.role)) {
                return next();
            }

            // Check if user owns the resource
            if (req.user.id === parseInt(resourceId)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to modify this resource',
                error: 'MODIFY_PERMISSION_DENIED'
            });
        } catch (error) {
            console.error('Modify permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user can delete resource
const requireDeletePermission = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdParam];

            // Only admin can delete resources
            if (['administrator', 'sys_admin', 'admin'].includes(req.user.role)) {
                return next();
            }

            // Users cannot delete resources (even their own)
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete resources',
                error: 'DELETE_PERMISSION_DENIED'
            });
        } catch (error) {
            console.error('Delete permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user can view sensitive information
const requireViewPermission = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const resourceId = req.params[resourceIdParam];

            // Admin can view everything
            if (['administrator', 'sys_admin', 'admin'].includes(req.user.role)) {
                return next();
            }

            // User can view their own information
            if (req.user.id === parseInt(resourceId)) {
                return next();
            }

            // For other users, check if they have permission to view
            // This could be expanded based on business logic
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own information.',
                error: 'VIEW_PERMISSION_DENIED'
            });
        } catch (error) {
            console.error('View permission error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error',
                error: error.message
            });
        }
    };
};

// Check if user can create resources
const requireCreatePermission = (allowedRoles = ['administrator', 'sys_admin', 'admin', 'lecturer']) => {
    return requireRole(allowedRoles);
};

// Check if user can approve/reject resources
const requireApprovalPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin', 'lecturer']) => {
    return requireRole(allowedRoles);
};

// Check if user can access analytics
const requireAnalyticsPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can manage other users
const requireUserManagementPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can access system settings
const requireSystemAccessPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can access audit logs
const requireAuditPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can perform bulk operations
const requireBulkOperationPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can export data
const requireExportPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can import data
const requireImportPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

// Check if user can access API documentation
const requireApiDocPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin', 'lecturer']) => {
    return requireRole(allowedRoles);
};

// Check if user can access testing endpoints
const requireTestingPermission = (allowedRoles = ['administrator', 'sys_admin', 'admin']) => {
    return requireRole(allowedRoles);
};

module.exports = {
    requireRole,
    requireAdmin,
    requireLecturerOrAdmin,
    requireStudentOrAdmin,
    requireOwnershipOrAdmin,
    requireDepartmentAccess,
    requireModifyPermission,
    requireDeletePermission,
    requireViewPermission,
    requireCreatePermission,
    requireApprovalPermission,
    requireAnalyticsPermission,
    requireUserManagementPermission,
    requireSystemAccessPermission,
    requireAuditPermission,
    requireBulkOperationPermission,
    requireExportPermission,
    requireImportPermission,
    requireApiDocPermission,
    requireTestingPermission
};
