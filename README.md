# Café des Amis

Application full-stack :

- **`apps/mobile`** — app mobile React Native (Expo, expo-router, TypeScript)
- **`apps/api`** — API backend (Next.js App Router, route handlers REST)
- **PostgreSQL** — base de données
- **Prisma** — ORM (schéma dans `apps/api/prisma/schema.prisma`)

Monorepo géré avec les npm workspaces.

## Prérequis

- Node.js 18+
- Docker (pour PostgreSQL local) ou une instance PostgreSQL existante
- L'app Expo Go sur ton téléphone, ou un simulateur iOS/Android

## Installation

```bash
npm install
```

## Base de données

Démarrer PostgreSQL en local avec Docker :

```bash
docker compose up -d
```

Configurer les variables d'environnement de l'API :

```bash
cp apps/api/.env.example apps/api/.env
```

Créer les tables et générer le client Prisma :

```bash
npm run prisma:migrate
```

(Optionnel) Peupler la base avec des données d'exemple :

```bash
npm run prisma:generate --workspace apps/api
npx --workspace apps/api prisma db seed
```

Explorer les données avec Prisma Studio :

```bash
npm run prisma:studio
```

## Lancer l'API

```bash
npm run dev:api
```

L'API démarre sur `http://localhost:3000`. Endpoints :

- `GET /api/health`
- `GET /api/menu`, `POST /api/menu`
- `GET /api/menu/:id`, `PATCH /api/menu/:id`, `DELETE /api/menu/:id`

## Lancer l'app mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

Important : `EXPO_PUBLIC_API_URL` doit pointer vers une adresse joignable
depuis ton téléphone/simulateur (pas `localhost` si tu testes sur un appareil
physique — utilise l'adresse IP locale de ta machine, ex.
`http://192.168.1.10:3000`).

Scanne le QR code avec Expo Go, ou appuie sur `i` / `a` dans le terminal pour
lancer un simulateur iOS/Android.

## Structure du projet

```
apps/
  api/
    prisma/schema.prisma   # modèles de données
    src/lib/prisma.ts      # client Prisma singleton
    src/app/api/           # routes REST (route handlers)
  mobile/
    app/                   # écrans (expo-router)
    src/api/client.ts      # client HTTP vers l'API
    src/types/             # types partagés côté mobile
```

## Prochaines étapes suggérées

- Authentification (ex. NextAuth côté API + stockage token sécurisé côté mobile)
- Gestion des commandes (modèle `Order`, `OrderItem`)
- Upload d'images pour le menu (S3/Cloudinary)
- Déploiement de l'API (Vercel) et build mobile (EAS Build)
