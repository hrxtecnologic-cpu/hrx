-- Migration: Add equipment_supplier_id to event_projects
-- Description: Stores the selected supplier when a quotation is accepted

ALTER TABLE public.event_projects
ADD COLUMN equipment_supplier_id uuid REFERENCES public.equipment_suppliers(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_event_projects_equipment_supplier ON public.event_projects(equipment_supplier_id);

-- Add comment
COMMENT ON COLUMN public.event_projects.equipment_supplier_id IS 'ID do fornecedor cujo orçamento foi aceito para equipamentos';
