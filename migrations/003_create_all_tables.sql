CREATE TYPE user_role AS ENUM (
    'student',
    'lecturer',
    'administrator',
    'sys_admin'
);
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role DEFAULT 'student',
    profile_picture TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TYPE appointment_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    lecturer_id INTEGER REFERENCES users(id),
    appointment_time TIMESTAMP NOT NULL,
    status appointment_status DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE lecturer_availability (
    id SERIAL PRIMARY KEY,
    lecturer_id INTEGER REFERENCES users(id),
    available_from TIMESTAMP NOT NULL,
    available_to TIMESTAMP NOT NULL,
    recurring BOOLEAN DEFAULT FALSE
);
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TYPE rsvp_status AS ENUM ('interested', 'going', 'not going');
CREATE TABLE event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    user_id INTEGER REFERENCES users(id),
    status rsvp_status DEFAULT 'interested',
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    is_group BOOLEAN DEFAULT FALSE,
    group_id INTEGER,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE chat_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES chat_groups(id),
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP
);
CREATE TABLE poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id),
    option_text TEXT NOT NULL
);
CREATE TABLE poll_votes (
    id SERIAL PRIMARY KEY,
    poll_option_id INTEGER REFERENCES poll_options(id),
    user_id INTEGER REFERENCES users(id),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE forum_posts (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR,
    entity_type VARCHAR,
    entity_id INTEGER,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    uploaded_by INTEGER REFERENCES users(id),
    file_url TEXT NOT NULL,
    entity_type VARCHAR,
    entity_id INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ip_address TEXT,
    user_agent TEXT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users
ADD COLUMN phone VARCHAR(20);
ALTER TABLE users
ADD COLUMN department VARCHAR(100);
ALTER TABLE users
ADD COLUMN student_id VARCHAR(20);
ALTER TABLE users
ADD COLUMN staff_id VARCHAR(20);
ALTER TABLE appointments
ADD COLUMN location VARCHAR(255);
ALTER TABLE appointments
ADD COLUMN meeting_type VARCHAR(20) DEFAULT 'in_person';
ALTER TABLE appointments
ADD COLUMN meeting_link TEXT;
ALTER TABLE events
ADD COLUMN max_participants INTEGER;
ALTER TABLE events
ADD COLUMN registration_required BOOLEAN DEFAULT FALSE;
ALTER TABLE messages
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages
ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(20),
    semester VARCHAR(10),
    department VARCHAR(100),
    program VARCHAR(100),
    class VARCHAR(50),
    module_leader_name VARCHAR(100),
    student_id INTEGER REFERENCES users(id),
    filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE survey_ratings (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id),
    description TEXT NOT NULL,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE survey_comments (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER REFERENCES surveys(id),
    well_done_comment TEXT,
    improvement_comment TEXT,
    additional_remarks TEXT
);