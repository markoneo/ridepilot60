/*
  # Consolidated Schema Setup for RidePilot

  1. New Tables
    - users: Store user authentication data
    - companies: Store company information
    - car_types: Store vehicle types and capacities
    - drivers: Store driver information
    - projects: Store transportation projects

  2. Security
    - Enable RLS on all tables
    - Add user-specific policies
    - Set up triggers for user_id
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create car_types table
CREATE TABLE IF NOT EXISTS car_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  luggage_capacity integer NOT NULL DEFAULT 2,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  phone text,
  license text,
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  driver_id uuid REFERENCES drivers(id),
  car_type_id uuid REFERENCES car_types(id),
  client_name text NOT NULL,
  client_phone text,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  passengers integer NOT NULL DEFAULT 1,
  price decimal(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'active',
  payment_status text DEFAULT 'charge',
  description text,
  booking_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create user-specific policies
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

-- Function to set user_id automatically
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to set user_id
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

-- Function to create default car types for new users
CREATE OR REPLACE FUNCTION create_default_car_types()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
  VALUES 
    ('VAN', 8, 6, 'Vivaro, Vito, V class', NEW.id),
    ('STANDARD', 4, 3, 'Passat, Octavia', NEW.id),
    ('EXECUTIVE', 3, 2, 'Audi, Mercedes', NEW.id),
    ('Minibus', 16, 12, 'Sprinter', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default car types
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_car_types();