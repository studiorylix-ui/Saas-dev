# Rylix Hub

Espace d'équipe pour iPhone : discussion (fil + réponses), posts, tâches & affaires, projets (avancement auto), notes. Next.js + Supabase, déployé sur Vercel.

## Mise en route
1. Créer un projet sur supabase.com, exécuter dans l'ordre `supabase/schema.sql` puis `supabase/migration-2.sql` (remplacer `__SECRET__` par le secret du webhook) dans le SQL Editor.
2. Auth > Providers > Email : désactiver « Allow new users to sign up ».
3. Auth > Users > Add user > Create new user (email + mot de passe, « Auto Confirm User » coché), un par membre.
4. Vercel : importer ce dépôt, variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (voir `.env.example`).
5. iPhone : ouvrir l'URL dans Safari > Partager > Sur l'écran d'accueil.


## Notifications push
1. Exécuter `supabase/push.sql` après avoir remplacé l'URL Vercel et le secret.
2. Variables Vercel : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (clés VAPID, voir `.env.local` en local), `SUPABASE_SERVICE_ROLE_KEY`, `PUSH_WEBHOOK_SECRET` (même valeur que dans le SQL).
3. Sur iPhone, installer l'app sur l'écran d'accueil, l'ouvrir, toucher « Activer » dans la bannière.
