// Role-based access control middleware

const ADMIN_ROLES = ['administrator', 'sys_admin', 'admin'];
const LECTURER_ROLES = [...ADMIN_ROLES, 'lecturer'];
const STUDENT_ROLES = [...ADMIN_ROLES, 'student'];

// Generic role checker
const requireRole = (allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
            error: 'AUTH_REQUIRED'
        });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    console.log("Checking roles:", { userRole: req.user.role, allowedRoles: roles });
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
};

// Ownership checker
const requireOwnershipOrAdmin = (resourceIdParam = 'id') => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: 'AUTH_REQUIRED' });
    }

    const resourceId = Number(req.params[resourceIdParam]);
    if (ADMIN_ROLES.includes(req.user.role) || req.user.id === resourceId) return next();

    return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'ACCESS_DENIED'
    });
};

// Department access checker
const requireDepartmentAccess = (departmentParam = 'department') => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required', error: 'AUTH_REQUIRED' });
    }

    if (ADMIN_ROLES.includes(req.user.role)) return next();

    const targetDepartment = req.params[departmentParam];
    if (req.user.department === targetDepartment) return next();

    return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access resources from your department.',
        error: 'DEPARTMENT_ACCESS_DENIED'
    });
};

// Resource modification checker
const requireModifyPermission = (allowedRoles = ADMIN_ROLES, resourceIdParam = 'id') => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required', error: 'AUTH_REQUIRED' });

    const resourceId = Number(req.params[resourceIdParam]);
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (roles.includes(req.user.role) || req.user.id === resourceId) return next();

    return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to modify this resource',
        error: 'MODIFY_PERMISSION_DENIED'
    });
};

// Resource deletion checker
const requireDeletePermission = (resourceIdParam = 'id') => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required', error: 'AUTH_REQUIRED' });

    if (ADMIN_ROLES.includes(req.user.role)) return next();

    return res.status(403).json({
        success: false,
        message: 'Only administrators can delete resources',
        error: 'DELETE_PERMISSION_DENIED'
    });
};

// View permission checker
const requireViewPermission = (resourceIdParam = 'id') => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required', error: 'AUTH_REQUIRED' });

    const resourceId = Number(req.params[resourceIdParam]);
    if (ADMIN_ROLES.includes(req.user.role) || req.user.id === resourceId) return next();

    return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own information.',
        error: 'VIEW_PERMISSION_DENIED'
    });
};

// Convenience wrappers for common role checks
const requireAdmin = () => requireRole(ADMIN_ROLES);
const requireLecturerOrAdmin = () => requireRole(LECTURER_ROLES);
const requireStudentOrAdmin = () => requireRole(STUDENT_ROLES);

// Permissions for specific actions
const requireCreatePermission = () => requireRole([...ADMIN_ROLES, 'lecturer']);
const requireApprovalPermission = () => requireRole([...ADMIN_ROLES, 'lecturer']);
const requireAnalyticsPermission = () => requireRole(ADMIN_ROLES);
const requireUserManagementPermission = () => requireRole(ADMIN_ROLES);
const requireSystemAccessPermission = () => requireRole(ADMIN_ROLES);
const requireAuditPermission = () => requireRole(ADMIN_ROLES);
const requireBulkOperationPermission = () => requireRole(ADMIN_ROLES);
const requireExportPermission = () => requireRole(ADMIN_ROLES);
const requireImportPermission = () => requireRole(ADMIN_ROLES);
const requireApiDocPermission = () => requireRole([...ADMIN_ROLES, 'lecturer']);
const requireTestingPermission = () => requireRole(ADMIN_ROLES);

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
