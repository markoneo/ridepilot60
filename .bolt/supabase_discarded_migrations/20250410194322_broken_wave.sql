/*
  # Fix car types and add defaults for existing users

  1. Changes
    - Add default car types for existing users
    - Ensure car_types table has correct constraints
    - Fix any potential issues with car types policies

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user access
*/

-- Insert default car types for existing users
INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'VAN', 8, 6, 'Vivaro, Vito, V class', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types WHERE car_types.user_id = users.id
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'STANDARD', 4, 3, 'Passat, Octavia', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types WHERE car_types.user_id = users.id
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'EXECUTIVE', 3, 2, 'Audi, Mercedes', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types WHERE car_types.user_id = users.id
);

INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  'Minibus', 16, 12, 'Sprinter', users.id
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM car_types WHERE car_types.user_id = users.id
);

-- Ensure RLS policy is correctly set
DROP POLICY IF EXISTS "Users can manage their own car types" ON car_types;
CREATE POLICY "Users can manage their own car types"
ON car_types
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);