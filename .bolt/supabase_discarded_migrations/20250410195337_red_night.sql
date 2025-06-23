/*
  # Fix Car Types Schema and Default Values

  1. Changes
    - Drop and recreate car_types table with proper constraints
    - Add unique constraint on user_id and name
    - Add CHECK constraints for capacity values
    - Improve default car types function with better error handling
    - Use jsonb for cleaner default types management

  2. Security
    - Maintain RLS policies
    - Ensure user_id is properly set
    - Prevent duplicate entries
*/

-- Drop and recreate car_types table with all constraints
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
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set user_id
DROP TRIGGER IF EXISTS set_car_types_user_id ON car_types;
CREATE TRIGGER set_car_types_user_id
  BEFORE INSERT ON car_types
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

-- Create function for default car types with better error handling
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