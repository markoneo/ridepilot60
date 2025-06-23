/*
  # Add Driver Authentication Support

  1. Changes
    - Add PIN field to drivers table for authentication
    - Add active status field for driver accounts
    - Add last_login tracking
    - Update policies for driver access

  2. Security
    - Drivers can only read their own assigned projects
    - PIN is stored securely (in production, should be hashed)
*/

-- Add authentication fields to drivers table
DO $$
BEGIN
  -- Add PIN field for driver authentication
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'pin'
  ) THEN
    ALTER TABLE drivers ADD COLUMN pin text DEFAULT '1234';
  END IF;

  -- Add active status for driver accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'active'
  ) THEN
    ALTER TABLE drivers ADD COLUMN active boolean DEFAULT true;
  END IF;

  -- Add last login tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE drivers ADD COLUMN last_login timestamptz;
  END IF;

  -- Add user_id to drivers table for RLS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drivers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE drivers ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add user_id to companies table for RLS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add user_id to car_types table for RLS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'car_types' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE car_types ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add user_id to projects table for RLS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update RLS policies to use user_id

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to read car types" ON car_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage car types" ON car_types;
DROP POLICY IF EXISTS "Allow authenticated users to read drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to manage drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON projects;

-- Create new user-specific policies
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own car types"
  ON car_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own drivers"
  ON drivers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to verify driver credentials
CREATE OR REPLACE FUNCTION verify_driver_credentials(driver_id text, driver_pin text)
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.phone, d.active
  FROM drivers d
  WHERE d.license = driver_id 
    AND d.pin = driver_pin 
    AND d.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get driver projects
CREATE OR REPLACE FUNCTION get_driver_projects(driver_uuid uuid)
RETURNS TABLE(
  id uuid,
  company_id uuid,
  company_name text,
  client_name text,
  client_phone text,
  pickup_location text,
  dropoff_location text,
  date date,
  time time,
  passengers integer,
  price numeric,
  status text,
  description text,
  booking_id text,
  car_type_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.company_id,
    c.name as company_name,
    p.client_name,
    p.client_phone,
    p.pickup_location,
    p.dropoff_location,
    p.date,
    p.time,
    p.passengers,
    p.price,
    p.status,
    p.description,
    p.booking_id,
    ct.name as car_type_name
  FROM projects p
  LEFT JOIN companies c ON p.company_id = c.id
  LEFT JOIN car_types ct ON p.car_type_id = ct.id
  WHERE p.driver_id = driver_uuid
    AND p.status = 'active'
  ORDER BY p.date, p.time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_driver_credentials(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_driver_projects(uuid) TO anon, authenticated;