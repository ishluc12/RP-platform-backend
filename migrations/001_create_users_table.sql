-- Migration: Create users table
-- Date: 2024-01-01
-- Description: Initial users table creation
-- Create user_role enum type
CREATE TYPE user_role AS ENUM (
    'student',
    'lecturer',
    'administrator',
    'sys_admin'
);
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    profile_picture TEXT,
    bio TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    phone VARCHAR(20),
    department VARCHAR(100),
    student_id VARCHAR(20) UNIQUE,
    staff_id VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'online',
    last_login TIMESTAMP WITHOUT TIME ZONE,
    suspension_reason TEXT,
    preferences JSONB DEFAULT '{}'::jsonb
);
-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_staff_id ON users(staff_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Insert default admin user (password: Admin123!)
INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        department,
        is_active,
        created_at,
        updated_at
    )
VALUES (
        'System Administrator',
        'admin@p-community.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq',
        -- Admin123!
        'admin',
        'System Administration',
        true,
        NOW(),
        NOW()
    );
-- Create comments for documentation
COMMENT ON TABLE users IS 'User accounts for P-Community platform';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.name IS 'Full name of the user';
COMMENT ON COLUMN users.email IS 'Unique email address for the user';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for security';
COMMENT ON COLUMN users.role IS 'User role: student, lecturer, or admin';
COMMENT ON COLUMN users.profile_picture IS 'URL to user profile picture';
COMMENT ON COLUMN users.bio IS 'User biography or description';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user was last updated';
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.department IS 'User department or faculty';
COMMENT ON COLUMN users.student_id IS 'Unique student identification number';
COMMENT ON COLUMN users.staff_id IS 'Unique staff identification number';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.status IS 'Current user status (online, offline, away, busy)';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last user login';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for account suspension if applicable';
COMMENT ON COLUMN users.preferences IS 'JSON object storing user preferences';