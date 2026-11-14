-- Migration 3 : messages privés (canaux de type « dm », visibles seulement par leurs membres) et suivi des lectures.
alter table channels add column kind text not null default 'channel' check (kind in ('channel', 'dm')), add column members uuid[] not null default '{}';
drop policy team_all on channels;
create policy ch_select on channels for select to authenticated using (kind = 'channel' or auth.uid() = any(members));
create policy ch_insert on channels for insert to authenticated with check (kind = 'channel' or auth.uid() = any(members));
create policy ch_update on channels for update to authenticated using (kind = 'channel' or auth.uid() = any(members));
create policy ch_delete on channels for delete to authenticated using (kind = 'channel');

create function can_see_channel(c uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from channels where id = c and (kind = 'channel' or auth.uid() = any(members)))
$$;
drop policy team_all on messages;
create policy msg_all on messages for all to authenticated using (can_see_channel(channel_id)) with check (can_see_channel(channel_id));

create table reads (user_id uuid not null default auth.uid() references profiles on delete cascade, channel_id uuid not null references channels on delete cascade, last_read_at timestamptz not null default now(), primary key (user_id, channel_id));
alter table reads enable row level security;
create policy own_reads on reads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter publication supabase_realtime add table reads;
