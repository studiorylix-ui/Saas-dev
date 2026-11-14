-- Migration 2 : canaux de chat, posts riches, tâches personnalisables, projets/affaires détaillés, journal d'activité.

-- Chat : canaux
create table channels (id uuid primary key default gen_random_uuid(), name text not null unique, description text not null default '', project_id uuid references projects on delete cascade, created_at timestamptz not null default now());
insert into channels (name, description) values ('général', 'Discussion de toute l''équipe'), ('dev', 'Technique et code');
delete from messages where kind = 'post';
alter table messages add column channel_id uuid references channels on delete cascade;
update messages set channel_id = (select id from channels where name = 'général');
alter table messages alter column channel_id set not null;
alter table messages drop column kind;
drop table likes;

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null default auth.uid() references profiles,
  body text not null default '',
  images text[] not null default '{}',
  parent_id uuid references posts on delete cascade,
  quote_id uuid references posts on delete set null,
  link_type text check (link_type in ('task', 'project', 'deal')),
  link_id uuid,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create table post_likes (post_id uuid references posts on delete cascade, user_id uuid not null default auth.uid() references profiles, created_at timestamptz not null default now(), primary key (post_id, user_id));
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict do nothing;
create policy "upload post images" on storage.objects for insert to authenticated with check (bucket_id = 'post-images');

-- Tâches : statuts, étiquettes, champs personnalisés
create table statuses (id uuid primary key default gen_random_uuid(), name text not null, color text not null default '#6b7280', kind text not null check (kind in ('todo', 'active', 'done')), position int not null default 0);
insert into statuses (name, color, kind, position) values ('Backlog', '#9ca3af', 'todo', 0), ('À faire', '#6366f1', 'todo', 1), ('En cours', '#f59e0b', 'active', 2), ('En revue', '#8b5cf6', 'active', 3), ('Terminé', '#10b981', 'done', 4);
create table labels (id uuid primary key default gen_random_uuid(), name text not null unique, color text not null default '#6366f1');
insert into labels (name, color) values ('bug', '#ef4444'), ('feature', '#3b82f6'), ('design', '#ec4899'), ('infra', '#14b8a6');
create table field_defs (id uuid primary key default gen_random_uuid(), name text not null, type text not null check (type in ('text', 'number', 'date', 'select', 'checkbox')), options jsonb not null default '[]', position int not null default 0);
insert into field_defs (name, type, position) values ('Estimation (h)', 'number', 0);

alter table tasks
  add column num bigint generated always as identity,
  add column description text not null default '',
  add column status_id uuid references statuses,
  add column priority smallint not null default 0,
  add column parent_id uuid references tasks on delete cascade,
  add column labels uuid[] not null default '{}',
  add column fields jsonb not null default '{}',
  add column updated_at timestamptz not null default now();
update tasks set status_id = (select id from statuses where name = case tasks.status when 'todo' then 'À faire' when 'doing' then 'En cours' else 'Terminé' end);
alter table tasks drop column status;
alter table tasks alter column status_id set not null;

create table task_comments (id uuid primary key default gen_random_uuid(), task_id uuid not null references tasks on delete cascade, author uuid not null default auth.uid() references profiles, body text not null, created_at timestamptz not null default now());

-- Projets et affaires
alter table projects add column lead uuid references profiles, add column start_date date, add column due_date date;
create table milestones (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects on delete cascade, title text not null, due date, done boolean not null default false, created_at timestamptz not null default now());
alter table deals add column description text not null default '', add column next_action text not null default '', add column next_action_date date, add column owner uuid references profiles;

-- Journal d'activité
create table activity (id uuid primary key default gen_random_uuid(), actor uuid, entity text not null, entity_id uuid not null, action text not null, changes jsonb not null default '{}', created_at timestamptz not null default now());
create index on activity (entity_id);

create function touch() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger touch_tasks before update on tasks for each row execute function touch();

create function log_activity() returns trigger language plpgsql security definer set search_path = public as $$
declare ch jsonb := '{}'; k text; o jsonb; n jsonb;
begin
  if tg_op = 'INSERT' then
    insert into activity (actor, entity, entity_id, action, changes) values (auth.uid(), tg_table_name, new.id, 'created', jsonb_build_object('title', coalesce(to_jsonb(new)->>'title', to_jsonb(new)->>'name')));
  else
    o := to_jsonb(old); n := to_jsonb(new);
    for k in select jsonb_object_keys(n) loop
      if k <> 'updated_at' and o->k is distinct from n->k then
        ch := ch || jsonb_build_object(k, case when k = 'description' then jsonb_build_array('', '') else jsonb_build_array(o->k, n->k) end);
      end if;
    end loop;
    if ch <> '{}' then insert into activity (actor, entity, entity_id, action, changes) values (auth.uid(), tg_table_name, new.id, 'updated', ch); end if;
  end if;
  return new;
end $$;
create trigger log_tasks after insert or update on tasks for each row execute function log_activity();
create trigger log_projects after insert or update on projects for each row execute function log_activity();
create trigger log_deals after insert or update on deals for each row execute function log_activity();

-- Droits et temps réel
do $$ declare t text; begin
  foreach t in array array['channels', 'posts', 'post_likes', 'statuses', 'labels', 'field_defs', 'task_comments', 'milestones', 'activity'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy team_all on %I for all to authenticated using (true) with check (true)', t);
    execute format('alter publication supabase_realtime add table %I', t);
  end loop;
end $$;

-- Notifications push (remplace la fonction de la migration 1)
create or replace function notify_push() returns trigger language plpgsql security definer as $$
begin
  perform net.http_post(
    url := 'https://rylix-hub.vercel.app/api/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secret', '__SECRET__'),
    body := jsonb_build_object('table', tg_table_name, 'op', tg_op, 'actor', auth.uid(), 'record', to_jsonb(new)));
  return new;
end $$;
create trigger push_posts after insert on posts for each row execute function notify_push();
create trigger push_comments after insert on task_comments for each row execute function notify_push();
create trigger push_assign after update of assignee on tasks for each row when (old.assignee is distinct from new.assignee) execute function notify_push();
