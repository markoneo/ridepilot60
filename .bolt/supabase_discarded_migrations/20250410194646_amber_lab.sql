/*
  # Fix car types user_id constraint

  1. Changes
    - Temporarily disable user_id constraint
    - Clean up any invalid entries
    - Add default car types with proper user_id
    - Re-enable constraint
*/

-- Temporarily alter the user_id constraint
ALTER TABLE car_types ALTER COLUMN user_id DROP NOT NULL;

-- Clean up any entries with null user_id
DELETE FROM car_types WHERE user_id IS NULL;

-- Insert default car types for all users
WITH user_car_types AS (
  SELECT DISTINCT u.id as user_id, ct.name as car_type
  FROM auth.users u
  CROSS JOIN (
    VALUES 
      ('VAN'),
      ('STANDARD'),
      ('EXECUTIVE'),
      ('Minibus')
  ) ct(name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM car_types 
    WHERE car_types.user_id = u.id 
    AND car_types.name = ct.name
  )
)
INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  ct.car_type,
  CASE ct.car_type
    WHEN 'VAN' THEN 8
    WHEN 'STANDARD' THEN 4
    WHEN 'EXECUTIVE' THEN 3
    WHEN 'Minibus' THEN 16
  END as capacity,
  CASE ct.car_type
    WHEN 'VAN' THEN 6
    WHEN 'STANDARD' THEN 3
    WHEN 'EXECUTIVE' THEN 2
    WHEN 'Minibus' THEN 12
  END as luggage_capacity,
  CASE ct.car_type
    WHEN 'VAN' THEN 'Vivaro, Vito, V class'
    WHEN 'STANDARD' THEN 'Passat, Octavia'
    WHEN 'EXECUTIVE' THEN 'Audi, Mercedes'
    WHEN 'Minibus' THEN 'Sprinter'
  END as description,
  ct.user_id
FROM user_car_types ct;

-- Re-enable the NOT NULL constraint
ALTER TABLE car_types ALTER COLUMN user_id SET NOT NULL;

-- Recreate the RLS policy to ensure it's working correctly
DROP POLICY IF EXISTS "Users can manage their own car types" ON car_types;
CREATE POLICY "Users can manage their own car types"
ON car_types
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);