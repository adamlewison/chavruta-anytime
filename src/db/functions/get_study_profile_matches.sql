-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION get_study_profile_matches(target_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
    id UUID,
    name TEXT,
    bio TEXT,
    image TEXT,
    gender "public"."gender",
    country TEXT,
    languages TEXT[],
    timezone TEXT,
    availability_utc TEXT[],
    matched_subject_names TEXT[],
    matched_subject_hebrew_names TEXT[],
    match_score NUMERIC,
    connection_status TEXT
) AS $$
DECLARE
    target_gender "public"."gender";
    target_languages TEXT[];
    target_country TEXT;
BEGIN
    -- 1. Cache target user attributes
    SELECT u.gender, u.languages, u.country
    INTO target_gender, target_languages, target_country
    FROM "public"."users" u
    WHERE u.id = target_user_id;

    -- 2. Execute matchmaking
    RETURN QUERY
    WITH target_profiles AS (
        SELECT
            sp.id AS profile_id,
            sp.subject_id,
            sp.availability_utc::bit(336) AS av_bit,
            GREATEST(bit_count(sp.availability_utc::bit(336)), 1) AS total_slots
        FROM "public"."study_profiles" sp
        WHERE sp.user_id = target_user_id AND sp.active = true
    ),
    overlapping_subjects AS (
        SELECT
            sp.user_id AS c_user_id,
            array_agg(sp.subject_id ORDER BY s.sort_order, s.name) AS shared_subject_ids,
            array_agg(s.name ORDER BY s.sort_order, s.name) AS shared_subject_names,
            array_agg(s.hebrew_name ORDER BY s.sort_order, s.name) AS shared_subject_hebrew_names
        FROM "public"."study_profiles" sp
        JOIN "public"."subjects" s ON sp.subject_id = s.id
        JOIN target_profiles tp ON sp.subject_id = tp.subject_id
        WHERE sp.active = true
          AND sp.user_id <> target_user_id
        GROUP BY sp.user_id
    ),
    profile_pair_scores AS (
        SELECT
            sp.user_id AS c_user_id,
            u.country AS c_country,
            (sp.subject_id = tp.subject_id) AS is_subject_match,
            LEAST(1.0, (
                (bit_count(tp.av_bit & sp.availability_utc::bit(336)) * 1.0) +
                (bit_count(tp.av_bit & (sp.availability_utc::bit(336) << 1)) * 0.4) +
                (bit_count(tp.av_bit & (sp.availability_utc::bit(336) >> 1)) * 0.4) +
                (bit_count(tp.av_bit & (sp.availability_utc::bit(336) << 2)) * 0.15) +
                (bit_count(tp.av_bit & (sp.availability_utc::bit(336) >> 2)) * 0.15)
            ) / tp.total_slots) AS availability_compatibility
        FROM "public"."study_profiles" sp
        JOIN "public"."users" u ON sp.user_id = u.id
        CROSS JOIN target_profiles tp
        WHERE u.id <> target_user_id
          AND sp.active = true
          AND u.profile_visible = true
          AND u.gender = target_gender
          AND u.languages && target_languages
    ),
    weighted_pairs AS (
        SELECT
            c_user_id,
            ROUND(
                (availability_compatibility * 0.70) +
                (CASE WHEN is_subject_match THEN 0.25 ELSE 0.0 END) +
                (CASE WHEN c_country = target_country THEN 0.05 ELSE 0.0 END)::numeric,
                4
            ) AS pair_score
        FROM profile_pair_scores
    ),
    top_matches AS (
        SELECT
            wp.c_user_id,
            MAX(wp.pair_score) AS final_score
        FROM weighted_pairs wp
        GROUP BY wp.c_user_id
        ORDER BY final_score DESC
        LIMIT p_limit
    )
    -- 3. Fetch full profile data exclusively for the final winners
    SELECT
        u.id,
        u.name,
        u.bio,
        u.image,
        u.gender,
        u.country,
        u.languages,
        u.timezone,
        ARRAY(
            SELECT sp2.availability_utc
            FROM "public"."study_profiles" sp2
            WHERE sp2.user_id = u.id
              AND sp2.active = true
              AND (os.shared_subject_ids IS NULL OR sp2.subject_id = ANY(os.shared_subject_ids))
        ) AS availability_utc,
        COALESCE(os.shared_subject_names, '{}'::text[]) AS matched_subject_names,
        COALESCE(os.shared_subject_hebrew_names, '{}'::text[]) AS matched_subject_hebrew_names,
        m.final_score AS match_score,
        CASE
            WHEN c.status = 'accepted' THEN 'connected'
            WHEN c.requester_id = target_user_id AND c.status = 'pending' THEN 'request_sent'
            WHEN c.addressee_id = target_user_id AND c.status = 'pending' THEN 'request_received'
            ELSE 'not_connected'
        END AS connection_status
    FROM top_matches m
    JOIN "public"."users" u ON m.c_user_id = u.id
    LEFT JOIN overlapping_subjects os ON m.c_user_id = os.c_user_id
    LEFT JOIN "public"."connections" c ON (
        (c.requester_id = target_user_id AND c.addressee_id = u.id)
        OR
        (c.requester_id = u.id AND c.addressee_id = target_user_id)
    ) AND c.status IN ('pending', 'accepted')
    ORDER BY m.final_score DESC;
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
