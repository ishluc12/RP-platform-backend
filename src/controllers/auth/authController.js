const User = require('../../models/User');
const {
    generateToken,
    generateRefreshToken,
    hashPassword,
    comparePassword
} = require('../../config/auth');


const crypto = require('crypto');

class AuthController {
    // User registration (no student_id/staff_id checks, only DB fields)
    static async register(req, res) {
        try {
            const { name, email, password, role, profile_picture, bio } = req.body;

            // HASH the user-supplied password
            const hashedPassword = await hashPassword(password);

            const userData = {
                name,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                role: role || 'student',
                profile_picture,
                bio,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

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
            const userId = req.user.id;
            const result = await User.findById(userId);
            if (!result.success) {
                console.error('User.findById error (change password):', result.error);
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const user = result.data;
            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                console.error('comparePassword error (change password): Incorrect current password for user', userId);
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }

            const newHashedPassword = await hashPassword(newPassword);
            const updateResult = await User.changePassword(userId, newHashedPassword);
            if (!updateResult.success) {
                console.error('User.changePassword error:', updateResult.error);
                return res.status(500).json({ success: false, message: 'Failed to update password', error: updateResult.error });
            }

            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Forgot password
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await User.findByEmail(email.toLowerCase());
            if (!result.success) {
                console.error('User.findByEmail error (forgot password):', result.error);
                // Don't expose existence, just log
            }
            res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent' });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }

    // Reset password
    static async resetPassword(req, res) {
        res.json({ success: true, message: 'Password reset successfully' });
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
            delete updateData.password_hash;
            delete updateData.role;
            delete updateData.email;
            delete updateData.created_at;

            // Only update allowed fields: name, role, profile_picture, bio
            const allowedFields = ['name', 'role', 'profile_picture', 'bio'];
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

            // Update user profile picture in DB
            const updateResult = await User.updateProfilePicture(userId, localPath);
            if (!updateResult.success) {
                console.error('User.updateProfilePicture error:', updateResult.error);
                return res.status(500).json({ success: false, message: 'Failed to update profile picture', error: updateResult.error });
            }

            res.json({ success: true, message: 'Profile picture uploaded successfully', data: { profile_picture: localPath } });
        } catch (error) {
            console.error('Upload profile picture error:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
}

module.exports = AuthController;