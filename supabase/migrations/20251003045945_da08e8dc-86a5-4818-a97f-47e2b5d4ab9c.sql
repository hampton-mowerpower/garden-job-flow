-- Create staff_job_notes table for internal staff notes on jobs
CREATE TABLE IF NOT EXISTS public.staff_job_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_job_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for staff_job_notes
CREATE POLICY "Authenticated users can view staff notes"
ON public.staff_job_notes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert staff notes"
ON public.staff_job_notes
FOR INSERT
WITH CHECK (
  has_any_role(auth.uid(), ARRAY['admin', 'counter', 'technician'])
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update own staff notes"
ON public.staff_job_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete staff notes"
ON public.staff_job_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add index for faster lookups
CREATE INDEX idx_staff_job_notes_job_id ON public.staff_job_notes(job_id);
CREATE INDEX idx_staff_job_notes_created_at ON public.staff_job_notes(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_staff_job_notes_updated_at
BEFORE UPDATE ON public.staff_job_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();