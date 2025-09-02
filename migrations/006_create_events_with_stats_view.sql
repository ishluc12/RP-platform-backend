CREATE OR REPLACE VIEW events_with_stats_view AS
SELECT e.id,
    e.title,
    e.description,
    e.event_date,
    e.location,
    e.created_by,
    e.created_at,
    e.max_participants,
    e.registration_required,
    u.name AS creator_name,
    u.email AS creator_email,
    COALESCE(ep_counts.total_participants, 0) AS total_participants,
    COALESCE(ep_counts.going_count, 0) AS going_count,
    COALESCE(ep_counts.interested_count, 0) AS interested_count,
    COALESCE(ep_counts.not_going_count, 0) AS not_going_count
FROM events e
    JOIN users u ON e.created_by = u.id
    LEFT JOIN (
        SELECT event_id,
            COUNT(user_id) AS total_participants,
            COUNT(
                CASE
                    WHEN status = 'going' THEN 1
                    ELSE NULL
                END
            ) AS going_count,
            COUNT(
                CASE
                    WHEN status = 'interested' THEN 1
                    ELSE NULL
                END
            ) AS interested_count,
            COUNT(
                CASE
                    WHEN status = 'not going' THEN 1
                    ELSE NULL
                END
            ) AS not_going_count
        FROM event_participants
        GROUP BY event_id
    ) AS ep_counts ON e.id = ep_counts.event_id;