CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- First, create the 'rsvp_status' ENUM type with its possible values.
CREATE TYPE rsvp_status AS ENUM ('interested', 'going', 'not going');

-- Now you can create the 'event_participants' table using the new type.
CREATE TABLE event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    user_id INTEGER REFERENCES users(id),
    status rsvp_status DEFAULT 'interested',
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);