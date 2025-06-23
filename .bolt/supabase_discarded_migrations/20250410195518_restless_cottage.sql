/*
  # Fix Schema and Add Default Car Types

  1. Changes
    - Drop and recreate tables with proper constraints
    - Add unique constraints and foreign keys
    - Add CHECK constraints for data validation
    - Improve default car types function with error handling

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS car_types CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create car_types table
CREATE TABLE car_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4 CHECK (capacity > 0),
  luggage_capacity integer NOT NULL DEFAULT 2 CHECK (luggage_capacity >= 0),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, name)
);

-- Create drivers table
CREATE TABLE drivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  phone text,
  license text,
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('available', 'busy', 'offline'))
);

-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE RESTRICT,
  driver_id uuid REFERENCES drivers(id) ON DELETE RESTRICT,
  car_type_id uuid REFERENCES car_types(id) ON DELETE RESTRICT,
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
  booking_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('paid', 'charge')),
  CONSTRAINT positive_passengers CHECK (passengers > 0),
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT future_date CHECK (date >= CURRENT_DATE OR (date = CURRENT_DATE AND time >= CURRENT_TIME))
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
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
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

-- Function to create default car types with better error handling
CREATE OR REPLACE FUNCTION create_default_car_types()
RETURNS TRIGGER AS $$
DECLARE
  default_types jsonb;
  car_type_record record;
BEGIN
  -- Define default types in a more maintainable format
  default_types := '[
    {
      "name": "VAN",
      "capacity": 8,
      "luggage": 6,
      "description": "Vivaro, Vito, V class"
    },
    {
      "name": "STANDARD",
      "capacity": 4,
      "luggage": 3,
      "description": "Passat, Octavia"
    },
    {
      "name": "EXECUTIVE",
      "capacity": 3,
      "luggage": 2,
      "description": "Audi, Mercedes"
    },
    {
      "name": "Minibus",
      "capacity": 16,
      "luggage": 12,
      "description": "Sprinter"
    }
  ]';

  -- Insert default types with error handling
  FOR car_type_record IN 
    SELECT 
      (value->>'name')::text as name,
      (value->>'capacity')::integer as capacity,
      (value->>'luggage')::integer as luggage_capacity,
      (value->>'description')::text as description
    FROM jsonb_array_elements(default_types)
  LOOP
    BEGIN
      INSERT INTO car_types (
        name,
        capacity,
        luggage_capacity,
        description,
        user_id
      )
      VALUES (
        car_type_record.name,
        car_type_record.capacity,
        car_type_record.luggage_capacity,
        car_type_record.description,
        NEW.id
      )
      ON CONFLICT (user_id, name) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other types
      RAISE NOTICE 'Error inserting car type %: %', car_type_record.name, SQLERRM;
    END;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_car_types();