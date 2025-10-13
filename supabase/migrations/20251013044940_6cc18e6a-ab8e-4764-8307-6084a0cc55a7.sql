-- A) Soft delete on jobs and related tables
alter table jobs_db add column if not exists deleted_at timestamptz;
alter table jobs_db add column if not exists deleted_by uuid references auth.users(id);

alter table job_notes add column if not exists deleted_at timestamptz;

-- Function to soft delete job children
create or replace function soft_delete_job_children()
returns trigger language plpgsql security definer as $$
begin
  if new.deleted_at is not null then
    update job_notes set deleted_at = new.deleted_at where job_id = new.id and deleted_at is null;
  end if;
  return new;
end$$;

drop trigger if exists trg_soft_delete_job on jobs_db;
create trigger trg_soft_delete_job
after update of deleted_at on jobs_db
for each row execute procedure soft_delete_job_children();

-- B) Ensure job_notes table structure is correct
-- Add tenant_id if missing for proper RLS
alter table job_notes add column if not exists tenant_id uuid;

-- Update existing notes with tenant_id from their jobs
update job_notes jn
set tenant_id = j.tenant_id
from jobs_db j
where jn.job_id = j.id
  and jn.tenant_id is null;

-- Create indexes for performance
create index if not exists idx_jobs_deleted_at on jobs_db(deleted_at) where deleted_at is null;
create index if not exists idx_job_notes_job_id on job_notes(job_id) where deleted_at is null;
create index if not exists idx_job_notes_tenant on job_notes(tenant_id) where deleted_at is null;