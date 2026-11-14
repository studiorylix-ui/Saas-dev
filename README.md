# Rylix Hub

Espace d'équipe pour iPhone : discussion (fil + réponses), posts, tâches & affaires, projets (avancement auto), notes. Next.js + Supabase, déployé sur Vercel.

## Mise en route
1. Créer un projet sur supabase.com, exécuter `supabase/schema.sql` (SQL Editor).
2. Auth > Providers > Email : désactiver « Allow new users to sign up ». Dans Auth > Email Templates (Magic Link), ajouter `{{ .Token }}` au texte pour recevoir le code à 6 chiffres.
3. Auth > Users > Invite user : un email par membre.
4. Vercel : importer ce dépôt, variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (voir `.env.example`).
5. iPhone : ouvrir l'URL dans Safari > Partager > Sur l'écran d'accueil.

## Pas encore fait
- Notifications push (iOS exige l'app installée sur l'écran d'accueil ; serveur d'envoi à ajouter).
