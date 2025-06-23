/*
  # Create mark_payment_paid function
  
  1. New Functions
    - `mark_payment_paid(payment_id UUID)` - Updates a payment status to 'paid' and sets the completed_at timestamp
      This function is called from the frontend when a payment is marked as paid.
  
  2. Function Details
    - Takes a payment_id parameter
    - Updates the status to 'paid'
    - Sets the completed_at timestamp to the current time
    - Returns the updated payment record
*/

CREATE OR REPLACE FUNCTION public.mark_payment_paid(payment_id UUID)
RETURNS SETOF payments AS $$
BEGIN
  RETURN QUERY
  UPDATE public.payments
  SET 
    status = 'paid',
    completed_at = NOW()
  WHERE id = payment_id
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function for authenticated users
GRANT EXECUTE ON FUNCTION public.mark_payment_paid(UUID) TO authenticated;

-- Add comment to the function
COMMENT ON FUNCTION public.mark_payment_paid(UUID) IS 'Updates a payment status to paid and sets the completed_at timestamp';