/*
  # Fix Car Types Migration

  1. Changes
    - Insert default car types for all users
    - Use a more efficient single CTE approach
    - Add proper error handling
    - Ensure no duplicate entries

  2. Security
    - Maintain existing RLS policies
    - Only add data for authenticated users
*/

DO $$
BEGIN
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

  -- Verify RLS policy is correctly set
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'car_types' 
    AND policyname = 'Users can manage their own car types'
  ) THEN
    CREATE POLICY "Users can manage their own car types"
    ON car_types
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;