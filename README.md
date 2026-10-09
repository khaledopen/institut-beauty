# BELLEZA

Première tranche d’un SaaS multi-instituts destiné aux métiers de la beauté en Côte d’Ivoire. React + Vite + TypeScript, Tailwind, React Router, TanStack Query, React Hook Form / Zod, Lucide, Recharts ; Express, Prisma, PostgreSQL.

## Démarrage local

Prérequis : Node.js 22.12+ ou 24, npm et PostgreSQL (Docker facultatif).

```powershell
npm install
# Créer votre fichier .env local avec les variables décrites ci-dessous
docker compose up -d
npm run db:generate
npm run db:deploy
npm run dev
```

Créez un fichier `.env` sur votre ordinateur avec `DATABASE_URL` (votre connexion PostgreSQL), `PORT=3001`, `APP_ORIGIN=http://localhost:5173` et `NODE_ENV=development`. Les fichiers d’environnement ne sont pas publiés dans ce dépôt. Configurez vos exclusions Git locales avant tout commit pour exclure `.env`, `.env.*`, `node_modules/`, `dist/` et les journaux `*.log`.

Si Docker n’est pas disponible, créez une base PostgreSQL locale et renseignez `DATABASE_URL`. Le frontend fonctionne sur `http://localhost:5173`, l’API sur `http://127.0.0.1:3001`. Ouvrez bien `localhost:5173` pour correspondre à `APP_ORIGIN`. Aucun compte ni donnée métier n’est préchargé. Créez votre institut via `/inscription`, puis vos prestations via `/app/prestations`.

```powershell
npm run build
npm test
```

Le test d’intégration d’isolation est activé uniquement si `TEST_DATABASE_URL` référence une base PostgreSQL de test distincte avec les migrations appliquées. Il crée deux instituts, vérifie lecture / modification / suppression interdites entre A et B, vérifie les permissions et nettoie ses propres données. Sans cette variable, il est explicitement ignoré ; les tests unitaires seuls ne valident pas l’isolation en base.

## Ce qui fonctionne

- Vitrine responsive avec vos photographies locales.
- Maquette interactive `/apercu`, explicitement illustrative.
- Inscription transactionnelle utilisateur / institut / adhésion ; connexion et déconnexion ; session HttpOnly avec jeton aléatoire stocké sous forme hachée.
- Tableau de bord réel avec compteurs PostgreSQL et états vides.
- Catalogue réel : créer, modifier, supprimer, rechercher et filtrer ; validation client et serveur ; permission propriétaire / responsable.
- Filtrage serveur systématique des prestations par institut de la session.

## Ce qui reste à livrer

Agenda, équipe, clients, caisse, stock, dépenses, fidélité, exports, réservation publique, super administration, abonnements, e-mails, réinitialisation / vérification, images sécurisées, audit, tâches planifiées et intégrations prestataires. Les boutons des modules futurs affichent leur état de développement. Pas de faux paiement ni d’essai commercial promis sans infrastructure.

Voir [architecture](docs/ARCHITECTURE.md), [modèle cible](docs/DATA_MODEL.md) et [API](docs/API.md). Les tests unitaires actuels vérifient la portée tenant et les rôles du catalogue ; les tests d’intégration avec deux instituts et les tests de concurrence restent nécessaires avant production.

## Préparation du déploiement

Utiliser une base PostgreSQL gérée, sauvegardes et restaurations vérifiées, secrets distincts des exemples locaux, HTTPS, `NODE_ENV=production` et `APP_ORIGIN` exact. Servir `dist` et l’API sous le même domaine via proxy, avec repli SPA. L’API écoute en local pour une installation derrière ce proxy. Ne pas utiliser le serveur Vite en production. La migration de fondation est incluse et s’applique avec `npm run db:deploy`. Avant commercialisation : compléter les modules et contrôles documentés, tester l’isolation en PostgreSQL, les permissions, l’accessibilité et les parcours mobiles.
