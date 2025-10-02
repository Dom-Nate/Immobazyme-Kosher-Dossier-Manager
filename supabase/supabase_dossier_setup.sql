-- SQL script to set up Supabase for the Kosher Dossier Manager

-- 1. Create dossiers table
create table if not exists dossiers (
  id uuid primary key,
  org_id uuid not null,
  owner uuid not null references auth.users(id),
  name text not null,
  cas_number text,
  tds_notes text,
  composition_notes text,
  composition_rows jsonb default '[]'::jsonb,
  manufacturing_flowchart text,
  shared_equipment_notes text,
  allergens_pesach_notes text,
  change_control_notes text,
  use_point_notes text,
  contact_conditions text,
  fate_removal_notes text,
  equipment_temperatures text,
  campaigning_segregation text,
  cleaning_validation text,
  sds_path text,
  sds_name text,
  coa_path text,
  coa_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists dossiers_org_id_idx on dossiers (org_id);
create index if not exists dossiers_owner_idx on dossiers (owner);

-- 2. Create memberships table
create table if not exists memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null,
  role text not null default 'member'
);

-- 3. Enable Row Level Security
alter table dossiers enable row level security;
alter table memberships enable row level security;

-- 4. RLS Policies for dossiers
create policy "members can read their org dossiers" on dossiers for select
  using (exists (select 1 from memberships m where m.user_id = auth.uid() and m.org_id = dossiers.org_id));

create policy "members can insert their org dossiers" on dossiers for insert
  with check (exists (select 1 from memberships m where m.user_id = auth.uid() and m.org_id = org_id));

create policy "members can update their org dossiers" on dossiers for update
  using (exists (select 1 from memberships m where m.user_id = auth.uid() and m.org_id = dossiers.org_id))
  with check (exists (select 1 from memberships m where m.user_id = auth.uid() and m.org_id = org_id));

create policy "members can delete their org dossiers" on dossiers for delete
  using (exists (select 1 from memberships m where m.user_id = auth.uid() and m.org_id = dossiers.org_id));

-- 5. RLS Policies for memberships
create policy "users can read self membership" on memberships for select
  using (user_id = auth.uid());

create policy "service role inserts memberships" on memberships for insert
  with check (true);
