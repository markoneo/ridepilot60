/*
  # Add user-specific RLS policies

  1. Changes
    - Update RLS policies to restrict data access to the authenticated user
    - Add user_id column to tables for ownership
    - Add foreign key constraints to link data to users

  2. Security
    - Ensure users can only access their own data
    - Maintain existing functionality while adding user isolation
*/

-- Add user_id column to tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE car_types ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage companies" ON companies;
DROP POLICY IF EXISTS "Allow authenticated users to manage car_types" ON car_types;
DROP POLICY IF EXISTS "Allow authenticated users to manage drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to manage projects" ON projects;

-- Create new user-specific policies for companies
CREATE POLICY "Users can manage their own companies"
ON companies
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create new user-specific policies for car_types
CREATE POLICY "Users can manage their own car types"
ON car_types
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create new user-specific policies for drivers
CREATE POLICY "Users can manage their own drivers"
ON drivers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create new user-specific policies for projects
CREATE POLICY "Users can manage their own projects"
ON projects
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update triggers to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_user_id
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_car_types_user_id
  BEFORE INSERT ON car_types
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_drivers_user_id
  BEFORE INSERT ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_projects_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();