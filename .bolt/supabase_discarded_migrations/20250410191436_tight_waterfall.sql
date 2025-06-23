/*
  # Add default car types for new users

  1. Changes
    - Create a trigger to add default car types when a user signs up
    - Ensure each user has basic car types to start with

  2. Security
    - Maintain existing RLS policies
    - Only add data for the specific user
*/

-- Function to create default car types for a new user
CREATE OR REPLACE FUNCTION create_default_car_types()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default car types for the new user
  INSERT INTO car_types (name, capacity, luggage_capacity, description, user_id)
  VALUES 
    ('VAN', 8, 6, 'Vivaro, Vito, V class', NEW.id),
    ('STANDARD', 4, 3, 'Passat, Octavia', NEW.id),
    ('EXECUTIVE', 3, 2, 'Audi, Mercedes', NEW.id),
    ('Minibus', 16, 12, 'Sprinter', NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default car types when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_car_types();