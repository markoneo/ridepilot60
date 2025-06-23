/*
  # Fix Car Types Schema

  1. Changes
    - Drop and recreate car_types table with proper constraints
    - Add unique constraint for user_id and name combination
    - Set up RLS policies
    - Create function and trigger for default car types
    - Add ON CONFLICT handling for duplicates

  2. Security
    - Maintain RLS
    - Ensure user_id is properly set
*/

-- Drop and recreate car_types table
DROP TABLE IF EXISTS car_types CASCADE;

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

-- Enable RLS
ALTER TABLE car_types ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own car types"
ON car_types
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set user_id
CREATE TRIGGER set_car_types_user_id
  BEFORE INSERT ON car_types
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create function for default car types
CREATE OR REPLACE FUNCTION create_default_car_types()
RETURNS TRIGGER AS $$
DECLARE
  default_types jsonb;
BEGIN
  default_types := '[
    {"name": "VAN", "capacity": 8, "luggage": 6, "description": "Vivaro, Vito, V class"},
    {"name": "STANDARD", "capacity": 4, "luggage": 3, "description": "Passat, Octavia"},
    {"name": "EXECUTIVE", "capacity": 3, "luggage": 2, "description": "Audi, Mercedes"},
    {"name": "Minibus", "capacity": 16, "luggage": 12, "description": "Sprinter"}
  ]';
  
  INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
  SELECT 
    (value->>'name')::text,
    (value->>'capacity')::integer,
    (value->>'luggage')::integer,
    (value->>'description')::text,
    NEW.id
  FROM jsonb_array_elements(default_types)
  ON CONFLICT (user_id, name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_car_types();