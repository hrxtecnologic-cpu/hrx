-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contractors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name character varying NOT NULL,
  cnpj character varying NOT NULL UNIQUE,
  responsible_name character varying NOT NULL,
  responsible_role character varying,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  company_address text,
  website character varying,
  user_id uuid,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  clerk_id character varying,
  CONSTRAINT contractors_pkey PRIMARY KEY (id),
  CONSTRAINT contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.document_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['rg_front'::character varying, 'rg_back'::character varying, 'cpf'::character varying, 'proof_of_address'::character varying, 'cnh_photo'::character varying, 'nr10'::character varying, 'nr35'::character varying, 'drt'::character varying, 'cnv'::character varying, 'portfolio'::character varying]::text[])),
  document_url text NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  reviewed_by uuid,
  rejection_reason text,
  reviewed_at timestamp with time zone,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_validations_pkey PRIMARY KEY (id),
  CONSTRAINT document_validations_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT document_validations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_email character varying NOT NULL,
  recipient_type character varying CHECK (recipient_type::text = ANY (ARRAY['professional'::character varying, 'contractor'::character varying, 'hrx'::character varying, 'admin'::character varying]::text[])),
  subject character varying,
  template_used character varying,
  related_id uuid,
  related_type character varying,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying]::text[])),
  error_message text,
  external_id character varying,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_template_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_name text DEFAULT 'HRX Tecnologia'::text,
  company_logo_url text,
  primary_color text DEFAULT '#DC2626'::text,
  secondary_color text DEFAULT '#EF4444'::text,
  background_color text DEFAULT '#f9fafb'::text,
  text_color text DEFAULT '#1a1a1a'::text,
  contact_email text DEFAULT 'contato@hrxeventos.com.br'::text,
  contact_phone text DEFAULT '(11) 99999-9999'::text,
  contact_whatsapp text DEFAULT '5511999999999'::text,
  contact_website text DEFAULT 'https://hrxeventos.com.br'::text,
  contact_address text,
  social_instagram text,
  social_facebook text,
  social_linkedin text,
  template_texts jsonb DEFAULT '{}'::jsonb,
  footer_text text DEFAULT 'HRX Tecnologia - Conectando profissionais a eventos'::text,
  show_social_links boolean DEFAULT true,
  show_contact_info boolean DEFAULT true,
  is_active boolean DEFAULT false,
  CONSTRAINT email_template_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.equipment_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  allocations jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT equipment_allocations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.equipment_suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  equipment_types ARRAY NOT NULL DEFAULT '{}'::text[],
  notes text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  proposed_budget numeric,
  pricing jsonb DEFAULT '{}'::jsonb,
  latitude numeric,
  longitude numeric,
  address text,
  city text,
  state text,
  zip_code text,
  delivery_radius_km integer DEFAULT 50,
  shipping_fee_per_km numeric DEFAULT 0,
  clerk_id character varying,
  CONSTRAINT equipment_suppliers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  allocations jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_allocations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_number character varying NOT NULL UNIQUE,
  client_name character varying NOT NULL,
  client_email character varying,
  client_phone character varying,
  client_company character varying,
  client_cnpj character varying,
  event_name character varying NOT NULL,
  event_type character varying NOT NULL,
  event_description text,
  event_date date,
  start_time time without time zone,
  end_time time without time zone,
  expected_attendance integer,
  venue_name character varying,
  venue_address text NOT NULL,
  venue_city character varying NOT NULL,
  venue_state character varying NOT NULL,
  venue_zip character varying,
  is_urgent boolean DEFAULT false,
  profit_margin numeric NOT NULL DEFAULT 35.00 CHECK (profit_margin = ANY (ARRAY[35.00, 80.00])),
  budget_range character varying,
  status character varying NOT NULL DEFAULT 'new'::character varying CHECK (status::text = ANY (ARRAY['new'::character varying, 'analyzing'::character varying, 'quoting'::character varying, 'quoted'::character varying, 'proposed'::character varying, 'approved'::character varying, 'in_execution'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  total_team_cost numeric DEFAULT 0,
  total_equipment_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  total_client_price numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  additional_notes text,
  internal_notes text,
  created_by character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  quoted_at timestamp with time zone,
  proposed_at timestamp with time zone,
  approved_at timestamp with time zone,
  completed_at timestamp with time zone,
  migrated_from_contractor_request_id uuid,
  migrated_from_quote_request_id uuid,
  equipment_supplier_id uuid,
  professionals_needed jsonb DEFAULT '[]'::jsonb CHECK (professionals_needed IS NULL OR jsonb_typeof(professionals_needed) = 'array'::text),
  equipment_needed jsonb DEFAULT '[]'::jsonb CHECK (equipment_needed IS NULL OR jsonb_typeof(equipment_needed) = 'array'::text),
  latitude numeric,
  longitude numeric,
  CONSTRAINT event_projects_pkey PRIMARY KEY (id),
  CONSTRAINT event_projects_equipment_supplier_id_fkey FOREIGN KEY (equipment_supplier_id) REFERENCES public.equipment_suppliers(id)
);
CREATE TABLE public.event_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  notify_project_updates boolean DEFAULT true,
  notify_invitations boolean DEFAULT true,
  notify_quotations boolean DEFAULT true,
  notify_documents boolean DEFAULT true,
  notify_payments boolean DEFAULT true,
  notify_reminders boolean DEFAULT true,
  digest_frequency text DEFAULT 'instant'::text CHECK (digest_frequency = ANY (ARRAY['instant'::text, 'hourly'::text, 'daily'::text, 'weekly'::text, 'never'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['admin'::text, 'professional'::text, 'supplier'::text, 'client'::text])),
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['project_created'::text, 'project_status_changed'::text, 'invitation_received'::text, 'invitation_accepted'::text, 'invitation_rejected'::text, 'quotation_received'::text, 'quotation_accepted'::text, 'document_approved'::text, 'document_rejected'::text, 'document_expiring'::text, 'team_incomplete'::text, 'proposal_sent'::text, 'payment_received'::text, 'event_reminder'::text, 'system_alert'::text])),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  project_id uuid,
  professional_id uuid,
  supplier_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  priority text DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT notifications_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT notifications_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.equipment_suppliers(id)
);
CREATE TABLE public.notifications_old (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  request_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_old_pkey PRIMARY KEY (id)
);
CREATE TABLE public.professional_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  action_type character varying NOT NULL,
  action_by uuid,
  field_changed character varying,
  old_value text,
  new_value text,
  description text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professional_history_pkey PRIMARY KEY (id),
  CONSTRAINT professional_history_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT professional_history_action_by_fkey FOREIGN KEY (action_by) REFERENCES public.users(id)
);
CREATE TABLE public.professional_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  team_member_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  would_hire_again boolean DEFAULT true,
  reviewed_by uuid,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professional_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT professional_reviews_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT professional_reviews_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.project_team(id),
  CONSTRAINT professional_reviews_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT professional_reviews_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  full_name character varying NOT NULL,
  cpf character varying NOT NULL UNIQUE,
  birth_date date NOT NULL,
  email character varying NOT NULL,
  phone character varying NOT NULL,
  cep character varying,
  street character varying,
  number character varying,
  complement character varying,
  neighborhood character varying,
  city character varying,
  state character varying,
  categories jsonb NOT NULL,
  has_experience boolean DEFAULT false,
  experience_description text,
  years_of_experience character varying,
  availability jsonb NOT NULL,
  rg_photo_url character varying,
  cpf_photo_url character varying,
  profile_photo_url character varying,
  proof_of_residence_url character varying,
  certificates jsonb,
  bank_name character varying,
  account_type character varying,
  agency character varying,
  account_number character varying,
  pix_key character varying,
  status character varying DEFAULT 'pending'::character varying,
  accepts_notifications boolean DEFAULT true,
  internal_notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  approved_at timestamp without time zone,
  approved_by uuid,
  documents jsonb DEFAULT '{}'::jsonb,
  portfolio jsonb DEFAULT '[]'::jsonb,
  clerk_id character varying UNIQUE,
  rejection_reason text,
  cnh_number character varying,
  cnh_validity date,
  cnv_validity date,
  nr10_validity date,
  nr35_validity date,
  drt_validity date,
  latitude numeric,
  longitude numeric,
  subcategories jsonb DEFAULT '{}'::jsonb,
  certifications jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT professionals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id)
);
CREATE TABLE public.project_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  quotation_id uuid,
  recipient_email character varying NOT NULL,
  recipient_name character varying,
  recipient_type character varying NOT NULL CHECK (recipient_type::text = ANY (ARRAY['client'::character varying, 'supplier'::character varying, 'professional'::character varying, 'hrx_admin'::character varying, 'other'::character varying]::text[])),
  email_type character varying NOT NULL CHECK (email_type::text = ANY (ARRAY['project_created'::character varying, 'quote_request'::character varying, 'quote_urgent_admin'::character varying, 'quote_received'::character varying, 'quote_accepted'::character varying, 'quote_rejected'::character varying, 'proposal_sent'::character varying, 'project_approved'::character varying, 'project_reminder'::character varying, 'project_completed'::character varying, 'other'::character varying]::text[])),
  subject character varying,
  template_used character varying,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'sent'::character varying, 'delivered'::character varying, 'opened'::character varying, 'failed'::character varying]::text[])),
  resend_id character varying,
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_emails_pkey PRIMARY KEY (id),
  CONSTRAINT project_emails_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id)
);
CREATE TABLE public.project_equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  equipment_type character varying NOT NULL,
  category character varying NOT NULL,
  subcategory character varying,
  name character varying NOT NULL,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  duration_days integer NOT NULL DEFAULT 1 CHECK (duration_days > 0),
  specifications jsonb DEFAULT '{}'::jsonb,
  status character varying NOT NULL DEFAULT 'requested'::character varying CHECK (status::text = ANY (ARRAY['requested'::character varying, 'quoting'::character varying, 'quoted'::character varying, 'selected'::character varying, 'confirmed'::character varying, 'delivered'::character varying, 'returned'::character varying, 'cancelled'::character varying]::text[])),
  selected_supplier_id uuid,
  selected_quote_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  daily_rate numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  CONSTRAINT project_equipment_pkey PRIMARY KEY (id),
  CONSTRAINT project_equipment_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT project_equipment_selected_supplier_id_fkey FOREIGN KEY (selected_supplier_id) REFERENCES public.equipment_suppliers(id)
);
CREATE TABLE public.project_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  professional_id uuid,
  external_name character varying,
  role character varying NOT NULL,
  category character varying NOT NULL,
  subcategory character varying,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  duration_days integer NOT NULL DEFAULT 1 CHECK (duration_days > 0),
  daily_rate numeric,
  total_cost numeric,
  status character varying NOT NULL DEFAULT 'planned'::character varying CHECK (status::text = ANY (ARRAY['planned'::character varying, 'invited'::character varying, 'confirmed'::character varying, 'rejected'::character varying, 'allocated'::character varying, 'working'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invited_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  invitation_token character varying UNIQUE,
  token_expires_at timestamp with time zone,
  CONSTRAINT project_team_pkey PRIMARY KEY (id),
  CONSTRAINT project_team_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT project_team_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.rate_limits (
  identifier character varying NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:01:00'::interval),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rate_limits_pkey PRIMARY KEY (identifier)
);
CREATE TABLE public.requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_number character varying NOT NULL UNIQUE,
  contractor_id uuid,
  event_name character varying NOT NULL,
  event_type character varying NOT NULL,
  event_type_other character varying,
  event_description text,
  venue_name character varying,
  venue_address text NOT NULL,
  venue_city character varying NOT NULL,
  venue_state character varying NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  expected_attendance integer,
  professionals_needed jsonb NOT NULL,
  needs_equipment boolean DEFAULT false,
  equipment_list jsonb,
  equipment_other text,
  equipment_notes text,
  budget_range character varying,
  urgency character varying DEFAULT 'normal'::character varying CHECK (urgency::text = ANY (ARRAY['normal'::character varying, 'urgent'::character varying, 'very_urgent'::character varying]::text[])),
  additional_notes text,
  status character varying DEFAULT 'new'::character varying CHECK (status::text = ANY (ARRAY['new'::character varying, 'in_progress'::character varying, 'quoted'::character varying, 'hired'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT requests_pkey PRIMARY KEY (id),
  CONSTRAINT requests_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id)
);
CREATE TABLE public.supplier_quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  token character varying NOT NULL UNIQUE,
  requested_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'submitted'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'expired'::character varying]::text[])),
  total_price numeric,
  daily_rate numeric,
  delivery_fee numeric DEFAULT 0,
  setup_fee numeric DEFAULT 0,
  payment_terms text,
  delivery_details text,
  notes text,
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  responded_at timestamp with time zone,
  CONSTRAINT supplier_quotations_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_quotations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT supplier_quotations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.equipment_suppliers(id)
);
CREATE TABLE public.supplier_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  quotation_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  delivery_rating integer CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  equipment_quality_rating integer CHECK (equipment_quality_rating >= 1 AND equipment_quality_rating <= 5),
  service_rating integer CHECK (service_rating >= 1 AND service_rating <= 5),
  price_value_rating integer CHECK (price_value_rating >= 1 AND price_value_rating <= 5),
  would_hire_again boolean DEFAULT true,
  reviewed_by uuid,
  is_visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT supplier_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_reviews_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.event_projects(id),
  CONSTRAINT supplier_reviews_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.supplier_quotations(id),
  CONSTRAINT supplier_reviews_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.equipment_suppliers(id),
  CONSTRAINT supplier_reviews_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id character varying NOT NULL UNIQUE,
  email character varying NOT NULL,
  full_name character varying,
  avatar_url character varying,
  user_type character varying CHECK (user_type::text = ANY (ARRAY['professional'::character varying, 'contractor'::character varying, 'supplier'::character varying, 'admin'::character varying]::text[])),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying, 'deleted'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role character varying DEFAULT 'user'::character varying CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying]::text[])),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);






----------------------------------------------------------------

##TRIGGERS ABAIXO

email_template_config_updated_at	
email_template_config

update_email_template_config_updated_at

BEFORE UPDATE
ROW


ensure_single_active_config_trigger	
email_template_config

ensure_single_active_config

BEFORE UPDATE
BEFORE INSERT
ROW


trigger_calculate_project_profit_margin	
event_projects

calculate_project_profit_margin

BEFORE INSERT
BEFORE UPDATE
ROW


trigger_calculate_team_member_cost	
project_team

calculate_team_member_cost

BEFORE INSERT
BEFORE UPDATE
ROW


trigger_document_validations_updated_at	
document_validations

update_updated_at_column

BEFORE UPDATE
ROW


trigger_equipment_allocations_updated_at	
equipment_allocations

update_equipment_allocations_updated_at

BEFORE UPDATE
ROW


trigger_equipment_suppliers_updated_at	
equipment_suppliers

update_equipment_suppliers_updated_at

BEFORE UPDATE
ROW


trigger_event_projects_updated_at	
event_projects

update_updated_at_column

BEFORE UPDATE
ROW


trigger_generate_project_number	
event_projects

generate_project_number

BEFORE INSERT
ROW


trigger_log_professional_changes	
professionals

log_professional_changes

AFTER UPDATE
AFTER INSERT
ROW


trigger_notify_invitation_responded	
project_team

notify_invitation_responded

AFTER UPDATE
ROW


trigger_notify_invitation_sent	
project_team

notify_invitation_sent

AFTER UPDATE
ROW


trigger_professional_reviews_updated_at	
professional_reviews

update_professional_reviews_updated_at

BEFORE UPDATE
ROW


trigger_project_equipment_updated_at	
project_equipment

update_updated_at_column

BEFORE UPDATE
ROW


trigger_project_team_updated_at	
project_team

update_updated_at_column

BEFORE UPDATE
ROW


trigger_supplier_reviews_updated_at	
supplier_reviews

update_supplier_reviews_updated_at

BEFORE UPDATE
ROW


trigger_update_project_equipment_cost_equipment	
project_equipment

update_project_equipment_cost

AFTER UPDATE
ROW


trigger_update_project_team_cost	
project_team

update_project_team_cost

AFTER DELETE
AFTER UPDATE
AFTER INSERT
ROW


trigger_update_project_totals	
event_projects

update_project_totals

BEFORE UPDATE
ROW


update_categories_updated_at	
categories

update_updated_at_column

BEFORE UPDATE
ROW


update_contractors_updated_at	
contractors

update_updated_at_column

BEFORE UPDATE
ROW


update_event_allocations_updated_at	
event_allocations

update_updated_at_column

BEFORE UPDATE
ROW


update_event_types_updated_at	
event_types

update_updated_at_column

BEFORE UPDATE
ROW


update_professionals_updated_at	
professionals

update_updated_at_column

BEFORE UPDATE
ROW


update_requests_updated_at	
requests

update_updated_at_column

BEFORE UPDATE
ROW


update_users_updated_at	
users

update_updated_at_column

BEFORE UPDATE
ROW


validate_certifications_trigger	
professionals

validate_certifications

BEFORE INSERT
BEFORE UPDATE
ROW




Database Functions
Docs

schema

public

Search for a function

Return Type

Security

Create a new function

Name	Arguments	Return type	Security	

calculate_distance
lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric

numeric

Invoker



calculate_hrx_price
-

trigger	
Invoker



calculate_professional_score
professional_categories text[], required_categories text[], distance_km numeric, has_experience boolean, years_of_experience text, availability jsonb, event_date timestamp with time zone

jsonb

Invoker



calculate_profit_margin
-

trigger	
Invoker



calculate_project_profit_margin
-

trigger	
Invoker



calculate_quotation_hrx_values
-

trigger	
Invoker



calculate_supplier_score
supplier_equipment_types text[], required_equipment_types text[], distance_km numeric, delivery_radius_km integer, max_distance_km integer, shipping_fee_per_km numeric

jsonb

Invoker



calculate_supplier_score_v2
p_supplier_id uuid, p_event_lat double precision, p_event_lon double precision, p_required_equipment_types text[]

TABLE(supplier_id uuid, total_score numeric, distance_score numeric, equipment_score numeric, performance_score numeric, breakdown jsonb)

Invoker



calculate_team_member_cost
-

trigger	
Invoker



check_expiring_documents
-

integer

Invoker



check_incomplete_teams
-

integer

Invoker



check_pending_invitations
-

integer

Invoker



cleanup_expired_tokens
-

TABLE(cleaned_count integer, message text)

Invoker



cleanup_old_notifications
p_days_to_keep integer DEFAULT 30

integer

Invoker



confirm_invitation_token
token character varying

jsonb

Invoker



create_notification
p_user_id uuid, p_user_type text, p_notification_type text, p_title text, p_message text, p_action_url text DEFAULT NULL::text, p_project_id uuid DEFAULT NULL::uuid, p_professional_id uuid DEFAULT NULL::uuid, p_supplier_id uuid DEFAULT NULL::uuid, p_priority text DEFAULT 'normal'::text, p_metadata jsonb DEFAULT '{}'::jsonb

uuid

Invoker



ensure_single_active_config
-

trigger	
Invoker



generate_invitation_token
team_member_id uuid

character varying

Invoker



generate_period_report
p_start_date date, p_end_date date

TABLE(metric_name text, metric_value numeric, metric_unit text, metric_category text)

Invoker



generate_project_number
-

trigger	
Invoker



generate_request_number
-

trigger	
Invoker



get_current_month_kpis
-

TABLE(kpi_name text, kpi_value numeric, previous_month_value numeric, change_percentage numeric, trend text)

Invoker



get_geocoding_stats
-

TABLE(entity_type text, total_records bigint, with_coordinates bigint, pending_geocoding bigint, percentage_complete numeric)

Invoker



get_professional_history
prof_id uuid

TABLE(id uuid, action_type character varying, description text, action_by_email character varying, created_at timestamp with time zone)

Invoker



get_professional_recent_reviews
p_professional_id uuid, p_limit integer DEFAULT 5

TABLE(id uuid, project_number text, event_name text, rating integer, comment text, would_hire_again boolean, created_at timestamp with time zone)

Invoker



get_professionals_by_subcategory
category_name text, subcategory_name text

TABLE(id uuid, full_name character varying, email character varying, phone character varying, subcategories jsonb, certifications jsonb)

Invoker



get_suggested_professionals
p_event_lat numeric, p_event_lon numeric, p_event_date timestamp with time zone, p_required_categories text[] DEFAULT NULL::text[], p_max_distance_km integer DEFAULT 999999, p_min_score numeric DEFAULT 0, p_limit integer DEFAULT 100

TABLE(id uuid, full_name character varying, email character varying, phone character varying, categories text[], city character varying, state character varying, distance_km numeric, total_score numeric, category_score numeric, distance_score numeric, experience_score numeric, availability_score numeric, performance_score numeric, score_breakdown jsonb, has_experience boolean, years_of_experience character varying)

Invoker



get_suggested_suppliers
p_event_lat numeric, p_event_lon numeric, p_required_equipment_types text[] DEFAULT NULL::text[], p_max_distance_km integer DEFAULT 999999, p_min_score numeric DEFAULT 0, p_limit integer DEFAULT 100

TABLE(id uuid, company_name text, contact_name text, email text, phone text, equipment_types text[], city text, state text, distance_km numeric, total_score numeric, equipment_score numeric, distance_score numeric, performance_score numeric, score_breakdown jsonb, delivery_radius_km integer, shipping_fee_per_km numeric)

Invoker



get_suggested_suppliers_v2
p_event_lat double precision, p_event_lon double precision, p_required_equipment_types text[] DEFAULT NULL::text[], p_max_distance_km integer DEFAULT 100, p_min_score numeric DEFAULT 0, p_limit integer DEFAULT 100

TABLE(id uuid, company_name text, contact_name text, email text, phone text, equipment_types text[], city text, state text, distance_km numeric, total_score numeric, distance_score numeric, equipment_score numeric, performance_score numeric, score_breakdown jsonb, delivery_radius_km integer, shipping_fee_per_km numeric)

Invoker



get_supplier_recent_reviews
p_supplier_id uuid, p_limit integer DEFAULT 5

TABLE(id uuid, project_number text, event_name text, rating integer, comment text, would_hire_again boolean, created_at timestamp with time zone)

Invoker



gin_extract_query_trgm
text, internal, smallint, internal, internal, internal, internal

internal

Invoker



gin_extract_value_trgm
text, internal

internal

Invoker



gin_trgm_consistent
internal, smallint, text, integer, internal, internal, internal, internal

boolean

Invoker



gin_trgm_triconsistent
internal, smallint, text, integer, internal, internal, internal

"char"

Invoker



gtrgm_compress
internal

internal

Invoker



gtrgm_consistent
internal, text, smallint, oid, internal

boolean

Invoker



gtrgm_decompress
internal

internal

Invoker



gtrgm_distance
internal, text, smallint, oid, internal

double precision

Invoker



gtrgm_in
cstring

gtrgm

Invoker



gtrgm_options
internal

void

Invoker



gtrgm_out
gtrgm

cstring

Invoker



gtrgm_penalty
internal, internal, internal

internal

Invoker



gtrgm_picksplit
internal, internal

internal

Invoker



gtrgm_same
gtrgm, gtrgm, internal

internal

Invoker



gtrgm_union
internal, internal

gtrgm

Invoker



has_valid_certification
prof_certifications jsonb, cert_type text

boolean

Invoker



log_professional_changes
-

trigger	
Invoker



mark_all_notifications_as_read
p_user_id uuid

integer

Invoker



mark_notification_as_read
p_notification_id uuid

boolean

Invoker



notify_invitation_responded
-

trigger	
Invoker



notify_invitation_sent
-

trigger	
Invoker



set_limit
real

real

Invoker



show_limit
-

real

Invoker



show_trgm
text

text[]

Invoker



similarity
text, text

real

Invoker



similarity_dist
text, text

real

Invoker



similarity_op
text, text

boolean

Invoker



strict_word_similarity
text, text

real

Invoker



strict_word_similarity_commutator_op
text, text

boolean

Invoker



strict_word_similarity_dist_commutator_op
text, text

real

Invoker



strict_word_similarity_dist_op
text, text

real

Invoker



strict_word_similarity_op
text, text

boolean

Invoker



update_email_template_config_updated_at
-

trigger	
Invoker



update_equipment_allocations_updated_at
-

trigger	
Invoker



update_equipment_suppliers_updated_at
-

trigger	
Invoker



update_professional_reviews_updated_at
-

trigger	
Invoker



update_project_equipment_cost
-

trigger	
Invoker



update_project_team_cost
-

trigger	
Invoker



update_project_totals
-

trigger	
Invoker



update_quote_updated_at
-

trigger	
Invoker



update_supplier_reviews_updated_at
-

trigger	
Invoker



update_updated_at_column
-

trigger	
Invoker



validate_certifications
-

trigger	
Invoker



word_similarity
text, text

real

Invoker



word_similarity_commutator_op
text, text

boolean

Invoker



word_similarity_dist_commutator_op
text, text

real

Invoker



word_similarity_dist_op
text, text

real

Invoker



word_similarity_op
text, text

boolean

Invoker


