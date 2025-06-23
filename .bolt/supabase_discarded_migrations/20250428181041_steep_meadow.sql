/*
  # Add color field to companies table

  1. Changes
    - Add color column to companies table to store custom company colors
    - Provide a default color value

  2. Security
    - Maintains existing RLS policies
*/

-- Add color column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS color text;