/*
  # Fix payment date constraint for past dates

  1. Changes
    - Remove future_date constraint from payments table
    - Add a stored procedure to mark payments as paid

  2. Security
    - Maintain existing RLS policies
*/

-- Remove the future_date constraint from payments table
ALTER TABLE payments DROP CONSTRAINT IF EXISTS future_date;

-- Create a procedure to mark a payment as paid
CREATE OR REPLACE FUNCTION mark_payment_paid(payment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE payments
  SET 
    status = 'paid',
    completed_at = NOW()
  WHERE id = payment_id;
END;
$$ LANGUAGE plpgsql;