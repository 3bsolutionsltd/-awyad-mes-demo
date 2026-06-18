-- Migration: 035 - Deduplicate roles
-- Description: Removes duplicate role rows (same name) introduced by multiple migrations.
--              Keeps the row with the most user assignments (oldest created_at as tiebreaker),
--              re-points user_roles and role_permissions, then deletes duplicates.

DO $$
DECLARE
    dup        RECORD;
    keep_id    UUID;
    dupe_id    UUID;
BEGIN
    FOR dup IN
        SELECT name FROM roles GROUP BY name HAVING COUNT(*) > 1
    LOOP
        -- Pick winner: most user assignments, then oldest row
        SELECT r.id INTO keep_id
        FROM roles r
        LEFT JOIN user_roles ur ON ur.role_id = r.id
        WHERE r.name = dup.name
        GROUP BY r.id, r.created_at
        ORDER BY COUNT(ur.role_id) DESC, r.created_at ASC
        LIMIT 1;

        FOR dupe_id IN
            SELECT id FROM roles WHERE name = dup.name AND id <> keep_id
        LOOP
            -- Re-point user_roles (skip if the user already has the winner role)
            UPDATE user_roles ur
            SET role_id = keep_id
            WHERE ur.role_id = dupe_id
              AND NOT EXISTS (
                SELECT 1 FROM user_roles x
                WHERE x.role_id = keep_id AND x.user_id = ur.user_id
              );
            DELETE FROM user_roles WHERE role_id = dupe_id;

            -- Re-point role_permissions (skip duplicates)
            UPDATE role_permissions rp
            SET role_id = keep_id
            WHERE rp.role_id = dupe_id
              AND NOT EXISTS (
                SELECT 1 FROM role_permissions x
                WHERE x.role_id = keep_id AND x.permission_id = rp.permission_id
              );
            DELETE FROM role_permissions WHERE role_id = dupe_id;

            DELETE FROM roles WHERE id = dupe_id;

            RAISE NOTICE 'Removed duplicate role "%" (id: %)', dup.name, dupe_id;
        END LOOP;
    END LOOP;
END;
$$;
