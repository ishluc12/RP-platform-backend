CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id INT) RETURNS TABLE (
        other_user_id INT,
        last_message_content TEXT,
        last_message_sent_at TIMESTAMP
    ) AS $$ BEGIN RETURN QUERY
SELECT DISTINCT ON (u.id) u.id AS other_user_id,
    m.message AS last_message_content,
    m.sent_at AS last_message_sent_at
FROM users u
    JOIN messages m ON (
        u.id = m.sender_id
        AND m.receiver_id = p_user_id
        AND m.is_group = FALSE
    )
    OR (
        u.id = m.receiver_id
        AND m.sender_id = p_user_id
        AND m.is_group = FALSE
    )
WHERE u.id != p_user_id
ORDER BY u.id,
    m.sent_at DESC;
END;
$$ LANGUAGE plpgsql;