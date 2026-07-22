
-- Cleanup legacy bug-tracker tables
DROP TABLE IF EXISTS public.activity_log CASCADE;
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.bugs CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP SEQUENCE IF EXISTS public.bug_tracking_seq CASCADE;
DROP FUNCTION IF EXISTS public.generate_tracking_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_team_members() CASCADE;
DROP TYPE IF EXISTS public.bug_severity CASCADE;
DROP TYPE IF EXISTS public.bug_status CASCADE;

-- Extend app_role enum (must be committed before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'production';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
