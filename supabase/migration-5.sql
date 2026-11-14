-- Migration 5 : changer son propre nom d'utilisateur (email interne + profil), avec contrôle de format et d'unicité.
create or replace function change_username(new_name text) returns text language plpgsql security definer set search_path = public, auth as $$
declare n text := lower(trim(new_name));
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if n !~ '^[a-z0-9][a-z0-9_-]{1,19}$' then raise exception 'Nom invalide : 2 à 20 caractères (lettres, chiffres, - ou _)'; end if;
  if exists (select 1 from auth.users where email = n || '@rylix.hub' and id <> auth.uid()) then raise exception 'Ce nom est déjà pris'; end if;
  update auth.users set email = n || '@rylix.hub', updated_at = now() where id = auth.uid();
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', n || '@rylix.hub'), updated_at = now() where user_id = auth.uid() and provider = 'email';
  update profiles set name = n where id = auth.uid();
  return n;
end $$;
revoke all on function change_username(text) from public, anon;
grant execute on function change_username(text) to authenticated;
