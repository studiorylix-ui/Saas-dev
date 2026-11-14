-- Notifications push. Remplacer l'URL et le secret (le même que PUSH_WEBHOOK_SECRET sur Vercel), puis exécuter.
create table push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references profiles on delete cascade,
  p256dh text not null, auth text not null
);
alter table push_subscriptions enable row level security;
create policy own_subs on push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create extension if not exists pg_net;
create function notify_push() returns trigger language plpgsql security definer as $$
begin
  perform net.http_post(
    url := 'https://VOTRE-APP.vercel.app/api/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-secret', 'VOTRE_SECRET'),
    body := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(new)));
  return new;
end $$;
create trigger push_messages after insert on messages for each row execute function notify_push();
create trigger push_tasks    after insert on tasks    for each row execute function notify_push();
create trigger push_deals    after insert on deals    for each row execute function notify_push();
create trigger push_projects after insert on projects for each row execute function notify_push();
