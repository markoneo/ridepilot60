/*
  # Fix Payments Table Schema

  1. Changes
    - Drop existing payments table
    - Recreate with proper constraints and relations
    - Add RLS policies
    - Add triggers

  2. Security
    - Enable RLS
    - Add user-specific policies
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS payments CASCADE;

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE RESTRICT,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  description text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_amount CHECK (amount >= 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid')),
  CONSTRAINT future_date CHECK (date >= CURRENT_DATE)
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own payments"
ON payments
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to set user_id
CREATE OR REPLACE FUNCTION set_payment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payments_user_id
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_user_id();

-- Create function to update driver total earnings
CREATE OR REPLACE FUNCTION update_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    UPDATE drivers
    SET total_earnings = COALESCE(total_earnings, 0) + NEW.amount
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating driver earnings
CREATE TRIGGER update_driver_earnings_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_earnings();