-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create user profiles table
create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'technician', 'counter')) default 'counter',
  permissions text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create customers table
create table if not exists customers_db (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  address text not null,
  email text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create parts catalogue table
create table if not exists parts_catalogue (
  id uuid default uuid_generate_v4() primary key,
  sku text unique not null,
  upc text,
  name text not null,
  description text,
  category text not null,
  base_price decimal(10,2) not null,
  sell_price decimal(10,2) not null,
  markup decimal(5,2),
  competitor_price decimal(10,2),
  source text,
  in_stock boolean default true,
  stock_quantity integer default 0,
  supplier text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create jobs table
create table if not exists jobs_db (
  id uuid default uuid_generate_v4() primary key,
  job_number text unique not null,
  customer_id uuid references customers_db(id) on delete restrict not null,
  machine_category text not null,
  machine_brand text not null,
  machine_model text not null,
  machine_serial text,
  problem_description text not null,
  notes text,
  service_performed text,
  recommendations text,
  service_deposit decimal(10,2),
  quotation_amount decimal(10,2),
  parts_required text,
  labour_hours decimal(5,2) default 0,
  labour_rate decimal(10,2) default 0,
  parts_subtotal decimal(10,2) default 0,
  labour_total decimal(10,2) default 0,
  subtotal decimal(10,2) default 0,
  gst decimal(10,2) default 0,
  grand_total decimal(10,2) default 0,
  status text check (status in ('pending', 'in-progress', 'completed', 'delivered')) default 'pending',
  assigned_technician uuid references user_profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Create job parts junction table
create table if not exists job_parts (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references jobs_db(id) on delete cascade not null,
  part_id uuid references parts_catalogue(id) on delete restrict not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  total_price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_customers_name on customers_db(name);
create index if not exists idx_customers_phone on customers_db(phone);
create index if not exists idx_parts_sku on parts_catalogue(sku);
create index if not exists idx_parts_category on parts_catalogue(category);
create index if not exists idx_jobs_number on jobs_db(job_number);
create index if not exists idx_jobs_status on jobs_db(status);
create index if not exists idx_jobs_customer on jobs_db(customer_id);
create index if not exists idx_jobs_technician on jobs_db(assigned_technician);
create index if not exists idx_job_parts_job on job_parts(job_id);
create index if not exists idx_job_parts_part on job_parts(part_id);

-- Row Level Security (RLS) policies
alter table user_profiles enable row level security;
alter table customers_db enable row level security;
alter table parts_catalogue enable row level security;
alter table jobs_db enable row level security;
alter table job_parts enable row level security;

-- User profiles policies
create policy "Users can view their own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on user_profiles
  for update using (auth.uid() = id);

-- Customers policies
create policy "Authenticated users can view customers" on customers_db
  for select to authenticated using (true);

create policy "Authenticated users can insert customers" on customers_db
  for insert to authenticated with check (true);

create policy "Authenticated users can update customers" on customers_db
  for update to authenticated using (true);

-- Parts catalogue policies
create policy "Authenticated users can view parts" on parts_catalogue
  for select to authenticated using (true);

create policy "Admins can manage parts" on parts_catalogue
  for all to authenticated using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Jobs policies
create policy "Authenticated users can view jobs" on jobs_db
  for select to authenticated using (true);

create policy "Authenticated users can insert jobs" on jobs_db
  for insert to authenticated with check (true);

create policy "Authenticated users can update jobs" on jobs_db
  for update to authenticated using (true);

-- Job parts policies
create policy "Authenticated users can view job parts" on job_parts
  for select to authenticated using (true);

create policy "Authenticated users can manage job parts" on job_parts
  for all to authenticated using (true);

-- Functions for reporting
create or replace function get_daily_takings(start_date date, end_date date)
returns table (
  date date,
  total_jobs bigint,
  total_revenue numeric,
  completed_jobs bigint,
  pending_jobs bigint
) as $$
begin
  return query
  select 
    created_at::date as date,
    count(*) as total_jobs,
    coalesce(sum(grand_total), 0) as total_revenue,
    count(*) filter (where status = 'completed') as completed_jobs,
    count(*) filter (where status = 'pending') as pending_jobs
  from jobs_db
  where created_at::date between start_date and end_date
  group by created_at::date
  order by date;
end;
$$ language plpgsql security definer;

create or replace function get_technician_productivity(start_date date, end_date date, technician_id uuid default null)
returns table (
  technician_name text,
  total_jobs bigint,
  completed_jobs bigint,
  total_revenue numeric,
  avg_completion_time numeric,
  completion_rate numeric
) as $$
begin
  return query
  select 
    coalesce(up.full_name, 'Unassigned') as technician_name,
    count(*) as total_jobs,
    count(*) filter (where j.status = 'completed') as completed_jobs,
    coalesce(sum(j.grand_total), 0) as total_revenue,
    coalesce(avg(
      case when j.completed_at is not null 
      then extract(epoch from (j.completed_at - j.created_at)) / 86400 
      else null end
    ), 0) as avg_completion_time,
    coalesce(
      count(*) filter (where j.status = 'completed')::numeric / nullif(count(*)::numeric, 0),
      0
    ) as completion_rate
  from jobs_db j
  left join user_profiles up on j.assigned_technician = up.id
  where j.created_at::date between start_date and end_date
    and (technician_id is null or j.assigned_technician = technician_id)
  group by up.id, up.full_name;
end;
$$ language plpgsql security definer;

create or replace function get_parts_usage_report(start_date date, end_date date)
returns table (
  part_name text,
  sku text,
  category text,
  quantity_used bigint,
  total_value numeric,
  times_ordered bigint
) as $$
begin
  return query
  select 
    pc.name as part_name,
    pc.sku,
    pc.category,
    coalesce(sum(jp.quantity), 0) as quantity_used,
    coalesce(sum(jp.total_price), 0) as total_value,
    count(distinct jp.job_id) as times_ordered
  from parts_catalogue pc
  left join job_parts jp on pc.id = jp.part_id
  left join jobs_db j on jp.job_id = j.id
  where j.created_at::date between start_date and end_date or j.created_at is null
  group by pc.id, pc.name, pc.sku, pc.category
  having sum(jp.quantity) > 0
  order by quantity_used desc;
end;
$$ language plpgsql security definer;

-- Triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_customers_updated_at before update on customers_db
  for each row execute procedure update_updated_at_column();

create trigger update_parts_updated_at before update on parts_catalogue
  for each row execute procedure update_updated_at_column();

create trigger update_jobs_updated_at before update on jobs_db
  for each row execute procedure update_updated_at_column();

-- Function to automatically create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'counter');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();