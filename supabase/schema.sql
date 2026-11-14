-- À exécuter une fois dans Supabase > SQL Editor.
create table profiles (id uuid primary key references auth.users on delete cascade, name text not null);
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id, name) values (new.id, split_part(new.email, '@', 1)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table notes (id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references profiles, title text not null default '', body text not null default '', updated_at timestamptz not null default now());
create table projects (id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references profiles, name text not null, description text not null default '', status text not null default 'en cours' check (status in ('idée','en cours','en pause','terminé')), created_at timestamptz not null default now());
create table deals (id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references profiles, name text not null, client text not null default '', stage text not null default 'prospect' check (stage in ('prospect','devis','négociation','gagnée','perdue')), amount numeric, created_at timestamptz not null default now());
create table tasks (id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references profiles, title text not null, status text not null default 'todo' check (status in ('todo','doing','done')), assignee uuid references profiles, due date, project_id uuid references projects on delete set null, deal_id uuid references deals on delete set null, created_at timestamptz not null default now());
create table messages (id uuid primary key default gen_random_uuid(), author uuid not null default auth.uid() references profiles, kind text not null check (kind in ('chat','post')), body text not null, parent_id uuid references messages on delete cascade, created_at timestamptz not null default now());
create table likes (message_id uuid references messages on delete cascade, user_id uuid not null default auth.uid() references profiles, created_at timestamptz not null default now(), primary key (message_id, user_id));

-- Équipe de confiance : tout membre connecté lit et écrit tout (les inscriptions publiques sont désactivées).
do $$ declare t text; begin
  foreach t in array array['profiles','notes','projects','deals','tasks','messages','likes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy team_all on %I for all to authenticated using (true) with check (true)', t);
    execute format('alter publication supabase_realtime add table %I', t);
  end loop;
end $$;
