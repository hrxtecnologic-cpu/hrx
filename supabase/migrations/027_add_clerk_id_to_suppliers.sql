-- Add clerk_id to equipment_suppliers table to link with authenticated users
-- Migration: 027_add_clerk_id_to_suppliers.sql
-- Replicating the exact same pattern used in professionals table

-- Add clerk_id column to equipment_suppliers (exactly like professionals)
ALTER TABLE equipment_suppliers
ADD COLUMN IF NOT EXISTS clerk_id character varying;

-- Add comment to column
COMMENT ON COLUMN equipment_suppliers.clerk_id IS 'Clerk user ID for authenticated supplier access';

-- Create index for faster lookups by clerk_id
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_clerk_id
ON equipment_suppliers(clerk_id)
WHERE clerk_id IS NOT NULL;
