# Les Amis de la Montagne

Application de gestion des opérations (inventaires, fournisseurs, incidents,
tâches, procédures) pour les trois lieux : Chalet, Pavillon, Cuisine.

- **`apps/mobile`** — app mobile React Native (Expo, expo-router, TypeScript)
- **`apps/api`** — API backend (Next.js App Router, route handlers REST)
- **PostgreSQL** — base de données
- **Prisma** — ORM (schéma dans `apps/api/prisma/schema.prisma`)
- **Supabase Auth** — authentification (login/mot de passe, sessions)

Monorepo géré avec les npm workspaces.

## Prérequis

- Node.js 18+
- Docker (pour PostgreSQL local) ou une instance PostgreSQL existante
- Un projet [Supabase](https://supabase.com) (gratuit) pour l'authentification
- L'app Expo Go sur ton téléphone, ou un simulateur iOS/Android

## Installation

```bash
npm install
```

## 1. Créer le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **Project Settings → API**, récupère :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secrète, jamais côté mobile) → `SUPABASE_SERVICE_ROLE_KEY`
3. Dans **Project Settings → Database**, récupère les chaînes de connexion :
   - *Connection pooling* (port 6543) → `DATABASE_URL`
   - *Direct connection* (port 5432) → `DIRECT_URL`
4. Dans **Authentication → Providers**, l'authentification par email/mot de
   passe est activée par défaut — c'est celle utilisée par l'app.

## 2. Base de données

Pour développer en local sans dépendre de Supabase pour la base de données,
tu peux utiliser un PostgreSQL local le temps du développement du schéma :

```bash
docker compose up -d
```

Sinon, utilise directement les chaînes de connexion Supabase de l'étape 1.

Configurer les variables d'environnement de l'API :

```bash
cp apps/api/.env.example apps/api/.env
# renseigner DATABASE_URL, DIRECT_URL et les clés Supabase
```

Créer les tables et générer le client Prisma :

```bash
npm run prisma:migrate
```

(Optionnel) Peupler la base avec des lieux/catégories/produits de démo :

```bash
npx --workspace apps/api prisma db seed
```

Explorer les données avec Prisma Studio :

```bash
npm run prisma:studio
```

### Créer un utilisateur

Les mots de passe sont gérés par Supabase Auth, pas par Prisma. Pour créer un
compte employé complet :

1. Crée le compte dans **Authentication → Users → Add user** sur le dashboard
   Supabase (ou via `supabaseAdmin.auth.admin.createUser(...)` côté serveur).
2. Copie son `id` (UUID Supabase).
3. Crée la ligne correspondante dans la table `User` (Prisma Studio ou SQL),
   avec `authUserId` = cet UUID, et le `role` approprié
   (`EMPLOYEE`, `TEAM_LEADER`, `MANAGEMENT`, `ADMIN`).
4. Si ce n'est pas un `ADMIN`/`MANAGEMENT`, ajoute une ligne `UserLocation`
   pour lui donner accès à un ou plusieurs lieux.

## 3. Lancer l'API

```bash
npm run dev:api
```

L'API démarre sur `http://localhost:3000`. Toutes les routes sauf
`/api/health` exigent un header `Authorization: Bearer <token Supabase>`.

Endpoints disponibles (fondations) :

- `GET /api/health`
- `GET /api/users/me`
- `GET /api/locations`, `POST /api/locations` (ADMIN)
- `GET/PATCH /api/locations/:id`
- `GET/POST /api/suppliers`, `GET/PATCH/DELETE /api/suppliers/:id`
- `GET/POST /api/categories`, `PATCH/DELETE /api/categories/:id`
- `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/:id`

`DELETE` archive la ressource (`isActive=false`, `archivedAt`) plutôt que de
la supprimer, pour préserver l'historique référencé ailleurs (commandes,
inventaires...).

## 4. Lancer l'app mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env
# renseigner EXPO_PUBLIC_API_URL et les clés Supabase
npm run dev:mobile
```

Important : `EXPO_PUBLIC_API_URL` doit pointer vers une adresse joignable
depuis ton téléphone/simulateur (pas `localhost` si tu testes sur un appareil
physique — utilise l'adresse IP locale de ta machine, ex.
`http://192.168.1.10:3000`).

Scanne le QR code avec Expo Go, ou appuie sur `i` / `a` dans le terminal pour
lancer un simulateur iOS/Android. L'écran de connexion demande le
courriel/mot de passe du compte Supabase créé plus haut ; une fois connecté,
l'app affiche les lieux accessibles selon le rôle.

## Structure du projet

```
apps/
  api/
    prisma/schema.prisma   # schéma complet (26 modèles)
    src/lib/prisma.ts      # client Prisma singleton
    src/lib/supabase.ts    # clients Supabase (anon + service role)
    src/lib/auth.ts        # vérification du token, contrôle des rôles/lieux
    src/app/api/           # routes REST (route handlers)
  mobile/
    app/                   # écrans (expo-router) : login, accueil
    src/lib/supabase.ts    # client Supabase (session persistée)
    src/context/           # AuthContext (session, signIn/signOut)
    src/api/client.ts      # client HTTP vers l'API (attache le token)
    src/types/             # types partagés côté mobile
```

## Modèle de rôles et d'accès

- `EMPLOYEE` / `TEAM_LEADER` : accès limité au(x) lieu(x) qui leur sont
  assignés (table `UserLocation`).
- `MANAGEMENT` / `ADMIN` : accès à tous les lieux ; `ADMIN` seul peut créer/
  modifier des lieux et gérer les comptes.

## Prochaines fonctionnalités à construire

Le schéma Prisma couvre déjà tous les modèles nécessaires. Reste à construire
API + écrans pour, dans un ordre suggéré :

1. **Inventaire quotidien** — par lieu, par fournisseur ou par catégorie
   (Gordon), avec calendrier des commandes fournisseurs
2. **Inventaire mensuel** — validation par l'admin, photos des articles
3. **Rapport d'incident** — séparé par lieu, visible uniquement par les
   employés du lieu concerné
4. **Suivi quotidien** — questionnaire à remplir par le chef d'équipe
5. **Contrôle des pertes**
6. **Tâches hebdomadaires** — pré-écrites, cochées avec date + initiales
7. **Procédures d'ouverture/fermeture** — checklists par lieu
8. **Carte des lieux** — positionnement des articles
9. **Commentaires par lieu** — fil de discussion avec réponses
10. **Notifications** — in-app + push (rappels de commande, tâches en retard,
    incidents, etc.)

## Déploiement

- API : Vercel (ou tout hébergeur Next.js), avec les variables d'environnement
  Supabase/Prisma configurées.
- Mobile : EAS Build pour les builds iOS/Android.
