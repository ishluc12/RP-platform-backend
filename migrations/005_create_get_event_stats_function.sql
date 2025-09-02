CREATE OR REPLACE FUNCTION get_event_stats(event_id_param INT) RETURNS TABLE (
        total_participants BIGINT,
        going_count BIGINT,
        interested_count BIGINT,
        not_going_count BIGINT
    ) AS $$ BEGIN RETURN QUERY
SELECT COUNT(ep.user_id) AS total_participants,
    COUNT(
        CASE
            WHEN ep.status = 'going' THEN 1
            ELSE NULL
        END
    ) AS going_count,
    COUNT(
        CASE
            WHEN ep.status = 'interested' THEN 1
            ELSE NULL
        END
    ) AS interested_count,
    COUNT(
        CASE
            WHEN ep.status = 'not going' THEN 1
            ELSE NULL
        END
    ) AS not_going_count
FROM event_participants ep
WHERE ep.event_id = event_id_param;
END;
$$ LANGUAGE plpgsql;