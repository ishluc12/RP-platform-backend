-- Seed file: Populate users table with sample data
-- Date: 2024-01-01
-- Description: Insert sample users for development and testing

-- Insert sample students
INSERT INTO users (name, email, password_hash, role, department, student_id, phone, bio, created_at, updated_at) VALUES
('Alice Johnson', 'alice.johnson@student.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'student', 'Computer Science', 'CS001', '+1234567890', 'Computer Science student passionate about AI and machine learning', NOW(), NOW()),
('Bob Smith', 'bob.smith@student.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'student', 'Computer Science', 'CS002', '+1234567891', 'Software engineering enthusiast with interest in web development', NOW(), NOW()),
('Carol Davis', 'carol.davis@student.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'student', 'Mathematics', 'MATH001', '+1234567892', 'Mathematics major focusing on applied mathematics and statistics', NOW(), NOW()),
('David Wilson', 'david.wilson@student.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'student', 'Physics', 'PHY001', '+1234567893', 'Physics student interested in quantum mechanics and theoretical physics', NOW(), NOW()),
('Eva Brown', 'eva.brown@student.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'student', 'Computer Science', 'CS003', '+1234567894', 'Cybersecurity enthusiast and ethical hacker', NOW(), NOW());

-- Insert sample lecturers
INSERT INTO users (name, email, password_hash, role, department, staff_id, phone, bio, created_at, updated_at) VALUES
('Dr. Sarah Chen', 'sarah.chen@faculty.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'lecturer', 'Computer Science', 'L001', '+1234567895', 'Associate Professor specializing in Artificial Intelligence and Machine Learning', NOW(), NOW()),
('Prof. Michael Rodriguez', 'michael.rodriguez@faculty.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'lecturer', 'Computer Science', 'L002', '+1234567896', 'Professor of Software Engineering with 15+ years of industry experience', NOW(), NOW()),
('Dr. Lisa Thompson', 'lisa.thompson@faculty.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'lecturer', 'Mathematics', 'L003', '+1234567897', 'Assistant Professor in Applied Mathematics and Statistics', NOW(), NOW()),
('Prof. James Anderson', 'james.anderson@faculty.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'lecturer', 'Physics', 'L004', '+1234567898', 'Professor of Theoretical Physics specializing in Quantum Mechanics', NOW(), NOW()),
('Dr. Maria Garcia', 'maria.garcia@faculty.edu', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'lecturer', 'Computer Science', 'L005', '+1234567899', 'Assistant Professor in Cybersecurity and Network Security', NOW(), NOW());

-- Insert additional admin users
INSERT INTO users (name, email, password_hash, role, department, staff_id, phone, bio, created_at, updated_at) VALUES
('Admin User', 'admin.user@p-community.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'admin', 'System Administration', 'A001', '+1234567800', 'System administrator with full platform access', NOW(), NOW()),
('Moderator User', 'moderator@p-community.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqjqKq', 'admin', 'Content Moderation', 'A002', '+1234567801', 'Content moderator responsible for community guidelines enforcement', NOW(), NOW());

-- Update sequence to account for inserted records
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
