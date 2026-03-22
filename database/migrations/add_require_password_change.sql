-- Add require_password_change column to users table

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'require_password_change'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN require_password_change BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Column require_password_change added successfully';
    ELSE
        RAISE NOTICE 'Column require_password_change already exists';
    END IF;
END $$;
