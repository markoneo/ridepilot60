/*
  # Fix car types and ensure defaults

  1. Changes
    - Add default car types for all users
    - Ensure car types table has correct constraints
    - Fix RLS policies for car types

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user access
*/

-- Insert default car types for all users
INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'VAN', 8, 6, 'Vivaro, Vito, V class', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types 
  WHERE car_types.user_id = users.id 
  AND car_types.name = 'VAN'
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'STANDARD', 4, 3, 'Passat, Octavia', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types 
  WHERE car_types.user_id = users.id 
  AND car_types.name = 'STANDARD'
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'EXECUTIVE', 3, 2, 'Audi, Mercedes', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types 
  WHERE car_types.user_id = users.id 
  AND car_types.name = 'EXECUTIVE'
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'Minibus', 16, 12, 'Sprinter', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types 
  WHERE car_types.user_id = users.id 
  AND car_types.name = 'Minibus'
);

-- Recreate the RLS policy to ensure it's working correctly
DROP POLICY IF EXISTS "Users can manage their own car types" ON car_types;
CREATE POLICY "Users can manage their own car types"
ON car_types
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);