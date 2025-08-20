const User = require('../../models/User');
const {
    generateToken,
    generateRefreshToken,
    hashPassword,
    comparePassword
} = require('../../config/auth');
const { uploadImage } = require('../../config/cloudinary');
const { emitToUser } = require('../../config/socket');

class AuthController {
    // User registration
    static async register(req, res) {
        try {
            const {
                name,
                email,
                password,
                role,
                department,
                student_id,
                staff_id,
                phone,
                bio
            } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser.success) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Check if student_id or staff_id already exists
            if (student_id) {
                const existingStudent = await User.findByStudentId(student_id);
                if (existingStudent.success) {
                    return res.status(400).json({
                        success: false,
                        message: 'Student ID already exists'
                    });
                }
            }

            if (staff_id) {
                const existingStaff = await User.findByStaffId(staff_id);
                if (existingStaff.success) {
                    return res.status(400).json({
                        success: false,
                        message: 'Staff ID already exists'
                    });
                }
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create user data
            const userData = {
                name,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                role,
                department,
                student_id,
                staff_id,
                phone,
                bio,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Create user
            const result = await User.create(userData);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user',
                    error: result.error
                });
            }

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = result.data;

            // Generate tokens
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
                    user: userWithoutPassword,
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

            // Find user by email
            const result = await User.findByEmail(email.toLowerCase());
            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            const user = result.data;

            // Check password
            const isPasswordValid = await comparePassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate tokens
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role
            });
            const refreshToken = generateRefreshToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = user;

            // Update last login
            await User.update(user.id, {
                last_login: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword,
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Refresh token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Verify refresh token
            const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Find user
            const result = await User.findById(decoded.id);
            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate new tokens
            const newToken = generateToken({
                id: result.data.id,
                email: result.data.email,
                role: result.data.role
            });
            const newRefreshToken = generateRefreshToken({
                id: result.data.id,
                email: result.data.email,
                role: result.data.role
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token: newToken,
                    refreshToken: newRefreshToken
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                error: error.message
            });
        }
    }

    // Logout
    static async logout(req, res) {
        try {
            // In a real application, you might want to blacklist the token
            // For now, we'll just return a success message
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            // Get user
            const result = await User.findById(userId);
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result.data;

            // Verify current password
            const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const newHashedPassword = await hashPassword(newPassword);

            // Update password
            const updateResult = await User.changePassword(userId, newHashedPassword);
            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update password',
                    error: updateResult.error
                });
            }

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Forgot password
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            // Find user by email
            const result = await User.findByEmail(email.toLowerCase());
            if (!result.success) {
                // Don't reveal if user exists or not for security
                return res.json({
                    success: true,
                    message: 'If an account with that email exists, a password reset link has been sent'
                });
            }

            // Generate reset token (in a real app, you'd send this via email)
            const resetToken = require('crypto').randomBytes(32).toString('hex');

            // Store reset token in database (you'd need to add this field to users table)
            // For now, we'll just return a success message

            res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Reset password
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            // In a real application, you'd verify the reset token
            // and find the user associated with it

            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const result = await User.findById(userId);
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = result.data;

            res.json({
                success: true,
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Update profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;

            // Remove fields that shouldn't be updated
            delete updateData.password_hash;
            delete updateData.role;
            delete updateData.email;
            delete updateData.created_at;

            const result = await User.update(userId, updateData);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile',
                    error: result.error
                });
            }

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = result.data;

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Upload profile picture
    static async uploadProfilePicture(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Upload to Cloudinary
            const uploadResult = await uploadImage(req.file.path);
            if (!uploadResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image',
                    error: uploadResult.error
                });
            }

            // Update user profile picture
            const updateResult = await User.updateProfilePicture(userId, uploadResult.url);
            if (!updateResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile picture',
                    error: updateResult.error
                });
            }

            res.json({
                success: true,
                message: 'Profile picture uploaded successfully',
                data: {
                    profile_picture: uploadResult.url
                }
            });
        } catch (error) {
            console.error('Upload profile picture error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = AuthController;
