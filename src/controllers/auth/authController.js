const User = require('../../models/User');
const emailService = require('../../services/emailService');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const {
    generateToken,
    generateRefreshToken,
    hashPassword,
    comparePassword
} = require('../../config/auth');
const { supabaseAdmin } = require('../../config/database'); // ADD THIS LINE

const crypto = require('crypto');

class AuthController {
    // User registration (no student_id/staff_id checks, only DB fields)
    static async register(req, res) {
        try {
            const {
                name,
                email,
                password,
                role,
                profile_picture,
                bio,
                phone,
                department,
                student_id,
                staff_id
            } = req.body;

            // HASH the user-supplied password
            const hashedPassword = await hashPassword(password);

            // Prevent public registration of elevated roles, except allow up to 2 sys_admins total
            const requestedRole = (role || 'student');
            const elevatedRoles = ['administrator', 'sys_admin'];

            if (elevatedRoles.includes(requestedRole)) {
                if (requestedRole === 'administrator') {
                    // Allowed: 'administrator' role can be registered
                } else if (requestedRole === 'sys_admin') {
                    // Count existing sys_admins
                    const listResult = await User.findAll(1, 1, { role: 'sys_admin' });
                    if (!listResult.success) {
                        return res.status(500).json({ success: false, message: 'Unable to verify sys_admin capacity' });
                    }
                    const existingCount = listResult.pagination?.total || 0;
                    if (existingCount >= 2) {
                        return res.status(403).json({ success: false, message: 'Maximum number of sys_admin accounts reached' });
                    }
                } else {
                    // This block should ideally not be reached if elevatedRoles only contains administrator and sys_admin
                    return res.status(403).json({ success: false, message: 'Registration for unknown elevated roles is not allowed' });
                }
            }


            const userData = {
                name,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                role: requestedRole,
                profile_picture,
                bio,
                phone: phone || null,
                department: department || null,
                student_id: student_id || null,
                staff_id: staff_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Create user in Supabase Auth first
            const { data: supabaseAuthData, error: supabaseAuthError } = await supabaseAdmin.auth.admin.createUser({
                email: email.toLowerCase(),
                password: password,
                email_confirm: true, // Auto-confirm email for backend-created users
                user_metadata: {
                    name: name,
                    role: requestedRole // Pass the role to Supabase user metadata if needed for Supabase's internal user management
                }
            });

            console.log('Supabase Auth User Creation Data:', supabaseAuthData); // Debug log
            console.log('Supabase Auth User ID:', supabaseAuthData?.user?.id); // Debug log

            if (supabaseAuthError) {
                console.error('Supabase Auth user creation error:', supabaseAuthError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register user with authentication service',
                    error: supabaseAuthError.message
                });
            }

            // Store the Supabase Auth UUID
            userData.supabase_auth_id = supabaseAuthData.user.id; // This line is crucial for RLS

            const result = await User.create(userData);

            if (!result.success) {
                console.error('User.create error:', result.error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user',
                    error: result.error.message || result.error
                });
            }

            const token = generateToken({
                id: result.data.id,
                email: result.data.email,
                role: result.data.role
            });

            const refreshToken = generateRefreshToken({
                id: result.data.id,
                email: result.data.email,
                role: result.data.role
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.data,
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // User login
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await User.findByEmail(email.toLowerCase());
            if (!result.success) {
                console.error('User.findByEmail error (login):', result.error || email);
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const user = result.data;
            console.log('User data from DB:', user); // Added log
            const isPasswordValid = await comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                console.error('comparePassword error (login): Invalid password for user', email);
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            const token = generateToken({ id: user.id, email: user.email, role: user.role });
            const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role });

            const { password_hash, ...userWithoutPassword } = user;

            const updateResult = await User.update(user.id, { last_login: new Date().toISOString() });
            if (!updateResult.success) {
                console.error('User.update error (login):', updateResult.error);
                // Don't block login, but log the error
            }

            res.json({ success: true, message: 'Login successful', data: { user: userWithoutPassword, token, refreshToken } });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                console.error('Refresh token error: Missing refreshToken in body');
                return res.status(400).json({ success: false, message: 'Refresh token is required' });
            }

            const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const result = await User.findById(decoded.id);
            if (!result.success) {
                console.error('User.findById error (refresh token):', result.error);
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            const newToken = generateToken({ id: result.data.id, email: result.data.email, role: result.data.role });
            const newRefreshToken = generateRefreshToken({ id: result.data.id, email: result.data.email, role: result.data.role });

            res.json({ success: true, message: 'Token refreshed successfully', data: { token: newToken, refreshToken: newRefreshToken } });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({ success: false, message: 'Invalid refresh token', error: error.message });
        }
    }

    // Logout
    static async logout(req, res) {
        res.json({ success: true, message: 'Logout successful' });
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id;
            console.log('Authenticated user:', req.user);

            // Validate input
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: user ID missing' });
            }

            // Fetch user
            const result = await User.findById(userId);
            console.log('findById result:', result); // 👈 helpful debug log

            if (!result.success || !result.data) {
                console.error('User.findById error (change password):', result.error || 'User not found');
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const user = result.data;

            // Validate current password
            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                console.error('Incorrect current password for user', userId);
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }

            // Hash new password
            const newHashedPassword = await hashPassword(newPassword);

            // Update password
            const updateResult = await User.changePassword(userId, newHashedPassword);
            if (!updateResult.success) {
                console.error('User.changePassword error:', updateResult.error);
                return res.status(500).json({ success: false, message: 'Failed to update password', error: updateResult.error });
            }

            return res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }


    // Forgot password
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            const result = await User.findByEmail(email.toLowerCase());
            if (!result.success || !result.data) {
                console.error('User.findByEmail error (forgot password):', result.error);
                return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent' });
            }

            const user = result.data;
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + 15 * 60 * 1000;

            await User.saveResetToken(user.id, token, expiresAt);

            await emailService.sendPasswordResetEmail(user, token);

            res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }


    // Reset password
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ success: false, message: 'Token and new password are required' });
            }

            const tokenResult = await User.findByResetToken(token);
            if (!tokenResult.success || !tokenResult.data) {
                return res.status(400).json({ success: false, message: 'Invalid or expired token' });
            }

            const { id, reset_token_expiry } = tokenResult.data;

            if (Date.now() > reset_token_expiry) {
                return res.status(400).json({ success: false, message: 'Token has expired' });
            }

            const hashedPassword = await hashPassword(newPassword);
            const updateResult = await User.changePassword(id, hashedPassword);

            if (!updateResult.success) {
                return res.status(500).json({ success: false, message: 'Failed to reset password' });
            }

            await User.clearResetToken(id); // Remove token after use

            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Get profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const result = await User.findById(userId);
            if (!result.success) {
                console.error('User.findById error (get profile):', result.error);
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const { password_hash, ...userWithoutPassword } = result.data;
            res.json({ success: true, data: userWithoutPassword });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Update profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            // Remove sensitive or restricted fields
            delete updateData.password_hash;
            delete updateData.role; // explicitly blocked
            delete updateData.email;
            delete updateData.created_at;

            // Only allow updates to these fields
            const allowedFields = [
                'name',
                'profile_picture',
                'bio',
                'phone',        // Added
                'department',   // Added
                'student_id',   // Added
                'staff_id'      // Added
            ];
            const filteredUpdate = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
            });

            filteredUpdate.updated_at = new Date().toISOString();

            const result = await User.update(userId, filteredUpdate);
            if (!result.success) {
                console.error('User.update error (update profile):', result.error);
                return res.status(500).json({ success: false, message: 'Failed to update profile', error: result.error });
            }

            const { password_hash, ...userWithoutPassword } = result.data;
            res.json({ success: true, message: 'Profile updated successfully', data: userWithoutPassword });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
    // Upload profile picture (local storage)
    static async uploadProfilePicture(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                console.error('Upload profile picture error: No file uploaded');
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const localPath = `/uploads/${req.file.filename}`;
            const fullUrl = `${req.protocol}://${req.get('host')}${localPath}`;

            // Optional: delete old profile picture from disk
            // const oldProfile = await User.findById(userId);
            // if (oldProfile?.data?.profile_picture) {
            //     const oldPath = path.join(__dirname, '..', '..', oldProfile.data.profile_picture);
            //     if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            // }

            // Update user profile picture in DB
            const updateResult = await User.updateProfilePicture(userId, localPath);
            if (!updateResult.success) {
                console.error('User.updateProfilePicture error:', updateResult.error);
                return res.status(500).json({ success: false, message: 'Failed to update profile picture', error: updateResult.error });
            }

            console.log(`✅ User ${userId} updated profile picture to ${localPath}`);

            res.json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: { profile_picture: fullUrl }
            });
        } catch (error) {
            console.error('Upload profile picture error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = AuthController;