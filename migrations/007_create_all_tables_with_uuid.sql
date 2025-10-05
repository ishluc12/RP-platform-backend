-- DROP ALL EXISTING TABLES AND TYPES TO AVOID CONFLICTS
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS survey_comments CASCADE;
DROP TABLE IF EXISTS survey_ratings CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS forums CASCADE;
DROP TABLE IF EXISTS poll_votes CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS chat_groups CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS availability_exceptions CASCADE;
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS lecturer_availability CASCADE;
-- Old table name
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Drop ENUM types
DROP TYPE IF EXISTS rsvp_status CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
-- First, create the ENUM type with all four roles.
CREATE TYPE user_role AS ENUM (
    'student',
    'lecturer',
    'administrator',
    'sys_admin'
);
-- Create the 'users' table with UUID primary key for Supabase compatibility
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'student',
    profile_picture TEXT,
    bio TEXT,
    phone VARCHAR(20),
    department VARCHAR(100),
    student_id VARCHAR(20),
    -- for students
    staff_id VARCHAR(20),
    -- for lecturers/admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Enhanced appointment status to include more admin-related statuses
CREATE TYPE appointment_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'completed'
);
-- Enhanced appointments table to support all user roles
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id),
    -- The person requesting the appointment
    appointee_id UUID REFERENCES users(id),
    -- The person being requested (lecturer, admin, sys_admin)
    appointment_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'pending',
    reason TEXT,
    location VARCHAR(255),
    meeting_type VARCHAR(20) DEFAULT 'in_person',
    -- 'in_person', 'online'
    meeting_link TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    -- 'low', 'normal', 'high', 'urgent'
    appointment_type VARCHAR(50),
    -- 'academic_consultation', 'admin_meeting', 'technical_support', etc.
    notes TEXT,
    -- Additional notes from either party
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Enhanced availability table for all staff (lecturers, administrators, sys_admins)
CREATE TABLE staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES users(id) NOT NULL,
    day_of_week INTEGER CHECK (
        day_of_week >= 1
        AND day_of_week <= 7
    ),
    -- 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_regular_students INTEGER DEFAULT 5 CHECK (max_regular_students <= 5),
    -- Maximum of 5 students for regular appointments
    max_emergency_students INTEGER DEFAULT 2 CHECK (max_emergency_students <= 3),
    -- Maximum of 2-3 additional emergency slots
    allow_emergency BOOLEAN DEFAULT TRUE,
    -- Can staff accept emergency appointments?
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Disable Row Level Security
ALTER TABLE staff_availability DISABLE ROW LEVEL SECURITY;
-- Special availability exceptions (holidays, sick days, special hours)
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES users(id),
    exception_date DATE NOT NULL,
    exception_type VARCHAR(30) DEFAULT 'unavailable',
    -- 'unavailable', 'modified_hours', 'extra_hours'
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Update other tables to use UUID
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR,
    max_participants INTEGER,
    registration_required BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TYPE rsvp_status AS ENUM ('interested', 'going', 'not going');
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    status rsvp_status DEFAULT 'interested',
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_group BOOLEAN DEFAULT FALSE,
    group_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(20) DEFAULT 'text',
    -- 'text', 'image', 'file'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES chat_groups(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMP
);
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id),
    option_text TEXT NOT NULL
);
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_option_id UUID REFERENCES poll_options(id),
    user_id UUID REFERENCES users(id),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID REFERENCES forums(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR,
    entity_type VARCHAR,
    entity_id UUID,
    -- Changed to UUID to match other tables
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID REFERENCES users(id),
    file_url TEXT NOT NULL,
    entity_type VARCHAR,
    -- e.g., post, message, appointment
    entity_id UUID,
    -- Changed to UUID
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    ip_address TEXT,
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(10),
    department VARCHAR(100),
    program VARCHAR(100),
    class VARCHAR(50),
    module_leader_name VARCHAR(100),
    student_id UUID REFERENCES users(id),
    filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE survey_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    description TEXT NOT NULL,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE survey_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    well_done_comment TEXT,
    improvement_comment TEXT,
    additional_remarks TEXT
);
-- Add foreign key constraint for group_id in messages table
ALTER TABLE messages
ADD CONSTRAINT fk_messages_group_id FOREIGN KEY (group_id) REFERENCES chat_groups(id);
-- Indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_requester ON appointments(requester_id);
CREATE INDEX idx_appointments_appointee ON appointments(appointee_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_time ON appointments(appointment_time);
CREATE INDEX idx_staff_availability_staff ON staff_availability(staff_id);
CREATE INDEX idx_staff_availability_day ON staff_availability(day_of_week);
CREATE INDEX idx_availability_exceptions_staff_date ON availability_exceptions(staff_id, exception_date);
-- Keep Row Level Security enabled but allow all basic operations
-- This maintains RLS structure while permitting all CRUD operations
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_comments ENABLE ROW LEVEL SECURITY;