-- Add professionals_needed and equipment_needed columns to event_projects
-- This allows storing the client's original request directly in the project

-- Add professionals_needed column
ALTER TABLE event_projects
ADD COLUMN IF NOT EXISTS professionals_needed JSONB DEFAULT '[]'::jsonb;

-- Add equipment_needed column
ALTER TABLE event_projects
ADD COLUMN IF NOT EXISTS equipment_needed JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN event_projects.professionals_needed IS 'Original professionals requested by the client (from their demand). Format: [{"category": "string", "subcategory": "string", "quantity": number, "notes": "string"}]';
COMMENT ON COLUMN event_projects.equipment_needed IS 'Original equipment requested by the client (from their demand). Format: [{"type": "string", "name": "string", "quantity": number, "notes": "string"}]';

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_event_projects_professionals_needed ON event_projects USING gin(professionals_needed);
CREATE INDEX IF NOT EXISTS idx_event_projects_equipment_needed ON event_projects USING gin(equipment_needed);
