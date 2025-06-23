/*
  # Fix payments date constraint and improve payment completion

  1. Changes
    - Drop any existing future_date constraint on payments table
    - Ensure the mark_payment_paid function exists and works properly
    - Add proper error handling for the function
*/

-- First verify if the constraint still exists and remove it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'future_date' 
    AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments DROP CONSTRAINT future_date;
  END IF;
END $$;

-- Create or replace the function to mark a payment as paid
CREATE OR REPLACE FUNCTION mark_payment_paid(payment_id uuid)
RETURNS boolean AS $$
DECLARE
  success boolean := false;
BEGIN
  UPDATE payments
  SET 
    status = 'paid',
    completed_at = NOW()
  WHERE id = payment_id;
  
  -- Check if the update was successful
  IF FOUND THEN
    success := true;
  END IF;
  
  RETURN success;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;