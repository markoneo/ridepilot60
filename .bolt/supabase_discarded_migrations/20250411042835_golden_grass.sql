/*
  # Add Payments Table

  1. New Table
    - payments: Store driver payment information
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - driver_id (uuid, foreign key)
      - amount (decimal)
      - date (date)
      - status (text)
      - description (text)
      - completed_at (timestamptz)
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

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
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid'))
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
CREATE TRIGGER set_payments_user_id
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();