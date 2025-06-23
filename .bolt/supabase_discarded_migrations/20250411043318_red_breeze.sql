/*
  # Fix Payments and Add Driver Earnings

  1. Changes
    - Add total_earnings column to drivers table
    - Drop and recreate payments table with proper constraints
    - Add triggers for automatic user_id and earnings updates

  2. Security
    - Maintain RLS policies
    - Ensure data integrity with constraints
*/

-- Add total_earnings to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS total_earnings decimal(10,2) DEFAULT 0;

-- Drop and recreate payments table
DROP TABLE IF EXISTS payments CASCADE;

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

-- Create function to set user_id
CREATE OR REPLACE FUNCTION set_payment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set user_id
CREATE TRIGGER set_payments_user_id
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_user_id();

-- Create function to update driver earnings
CREATE OR REPLACE FUNCTION update_driver_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    UPDATE drivers
    SET total_earnings = COALESCE(total_earnings, 0) + NEW.amount
    WHERE id = NEW.driver_id;
  ELSIF OLD.status = 'paid' AND NEW.status = 'pending' THEN
    UPDATE drivers
    SET total_earnings = COALESCE(total_earnings, 0) - OLD.amount
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