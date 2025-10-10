-- Create job_notes table for internal staff notes
CREATE TABLE IF NOT EXISTS public.job_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_db(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT job_notes_visibility_check CHECK (visibility IN ('internal', 'public'))
);

-- Create index for fast lookup by job_id and ordering by created_at
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id_created_at ON public.job_notes(job_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_notes
CREATE POLICY "Authenticated users can view job notes"
  ON public.job_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated staff can insert job notes"
  ON public.job_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    has_any_role(auth.uid(), ARRAY['admin'::text, 'technician'::text, 'counter'::text])
  );

CREATE POLICY "Users can update own notes within 10 minutes"
  ON public.job_notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    created_at > (now() - interval '10 minutes')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    created_at > (now() - interval '10 minutes')
  );

CREATE POLICY "Admins can delete job notes"
  ON public.job_notes
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

-- Enable realtime for job_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_notes;