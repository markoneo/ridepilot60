/*
  # Add default car types for all users

  1. Changes
    - Insert default car types for all existing users
    - Use a WITH clause for cleaner, more efficient insertion
    - Handle duplicate prevention

  2. Security
    - Maintains existing RLS policies
    - Respects user isolation
*/

-- Insert default car types for all users using a single CTE
WITH user_car_types AS (
  SELECT DISTINCT u.id as user_id, ct.name, ct.capacity, ct.luggage, ct.descr
  FROM auth.users u
  CROSS JOIN (
    VALUES 
      ('VAN', 8, 6, 'Vivaro, Vito, V class'),
      ('STANDARD', 4, 3, 'Passat, Octavia'),
      ('EXECUTIVE', 3, 2, 'Audi, Mercedes'),
      ('Minibus', 16, 12, 'Sprinter')
  ) ct(name, capacity, luggage, descr)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM car_types 
    WHERE car_types.user_id = u.id 
    AND car_types.name = ct.name
  )
)
INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
SELECT 
  name,
  capacity,
  luggage,
  descr,
  user_id
FROM user_car_types;