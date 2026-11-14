-- Migration 4 : modification de messages/posts, réactions emoji, droits d'auteur (seul l'auteur modifie ou supprime).
alter table messages add column edited_at timestamptz;
alter table posts add column edited_at timestamptz;

create table reactions (
  message_id uuid not null references messages on delete cascade,
  user_id uuid not null default auth.uid() references profiles on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
alter table reactions enable row level security;
create policy re_select on reactions for select to authenticated using (exists (select 1 from messages m where m.id = message_id and can_see_channel(m.channel_id)));
create policy re_insert on reactions for insert to authenticated with check (user_id = auth.uid());
create policy re_delete on reactions for delete to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table reactions;

drop policy msg_all on messages;
create policy msg_select on messages for select to authenticated using (can_see_channel(channel_id));
create policy msg_insert on messages for insert to authenticated with check (can_see_channel(channel_id) and author = auth.uid());
create policy msg_update on messages for update to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy msg_delete on messages for delete to authenticated using (author = auth.uid());

drop policy team_all on posts;
create policy posts_select on posts for select to authenticated using (true);
create policy posts_insert on posts for insert to authenticated with check (author = auth.uid());
create policy posts_update on posts for update to authenticated using (author = auth.uid()) with check (author = auth.uid());
create policy posts_delete on posts for delete to authenticated using (author = auth.uid());
