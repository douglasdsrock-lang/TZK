-- Add character_id to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS character_id TEXT;
