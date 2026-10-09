# BELLEZA

SaaS de gestion d’instituts de beauté en Côte d’Ivoire, livré progressivement. React, Vite, TypeScript, React Router, TanStack Query, React Hook Form / Zod, Lucide et Recharts ; API Express, Prisma et PostgreSQL.

## Démarrage local

Prérequis : Node.js 22.12+ ou 24 et npm. Une base PostgreSQL locale peut être démarrée sans Docker :

```powershell
npm install
npm run db:generate
npm run db:local
```

Gardez ce terminal ouvert. La commande crée un PostgreSQL persistant sur `127.0.0.1:55432`, une base d’application et une base de test distincte. Elle génère les identifiants aléatoires dans `.local/`, crée `.env` s’il n’existe pas et ajoute les exclusions au fichier local `.git/info/exclude`. Aucun identifiant n’est publié dans le dépôt.

Dans un second terminal :

```powershell
npm run db:deploy
npm run dev
```

Ouvrez `http://127.0.0.1:5173`. Si Vite utilise un autre port, adaptez `APP_ORIGIN` dans votre `.env` local puis redémarrez l’API. L’API écoute sur `127.0.0.1:3001`. Pour utiliser votre propre PostgreSQL, renseignez `DATABASE_URL`, `PORT=3001`, `APP_ORIGIN` et `NODE_ENV=development` dans `.env`. Le compte de migration doit pouvoir activer l’extension `btree_gist` utilisée contre les réservations simultanées.

Aucun compte ni donnée métier n’est préchargé. Créez votre institut via `/inscription`, ajoutez vos prestations, vos collaborateurs et leurs horaires, puis vos clients et rendez-vous. Les pages `/apercu/*` présentent des exemples explicitement illustratifs.

## Modules disponibles

- Vitrine responsive : dix photographies locales, diaporama et animations respectant la préférence de réduction des mouvements.
- Inscription, connexion, déconnexion, sessions HttpOnly avec jetons stockés sous forme hachée ; données séparées par institut.
- Catalogue : création, modification, recherche, filtres et archivage des prestations déjà utilisées.
- Clients : fiches, recherche par nom ou téléphone, pagination, consentement marketing, archivage et historique des visites.
- Équipe : collaborateurs, qualifications par prestation, horaires hebdomadaires et absences. Une absence ou modification d’horaire incompatible avec les réservations est refusée.
- Agenda : jour, semaine, mois, liste, filtres, disponibilité, création et déplacement des rendez-vous, statuts contrôlés. Le tarif et la durée sont figés lors de la réservation.
- Tableau de bord : compteurs réels et prochains rendez-vous, avec permissions selon le rôle.

Les horaires utilisent le fuseau de Côte d’Ivoire (UTC). Une fiche collaborateur ne crée pas encore un compte : invitations et association au compte praticien seront livrées avec l’administration des utilisateurs.

## Vérification

```powershell
npm run build
npm test
npm run test:integration
```

`npm test` exécute les tests unitaires et active les intégrations lorsque `TEST_DATABASE_URL` est défini. `test:integration` utilise la base de test créée par `db:local`, ou votre variable `TEST_DATABASE_URL`, applique les migrations puis exécute tous les tests. Il refuse de cibler la même base que l’application. Les intégrations vérifient l’isolation entre deux instituts, les permissions, les relations croisées interdites, les horaires et absences, les changements de statut et deux réservations concurrentes sur le même créneau. Elles nettoient leurs propres données.

## Prochaines étapes

Caisse et paiements, produits et stocks, dépenses, fidélité, rapports et exports, réservation publique, invitations, récupération de mot de passe, notifications, abonnements et administration de plateforme restent à développer. Les boutons correspondants indiquent leur état. Aucun encaissement ni paiement externe n’est simulé.

Voir [architecture](docs/ARCHITECTURE.md), [modèle](docs/DATA_MODEL.md) et [API](docs/API.md).

## Déploiement

Utiliser PostgreSQL géré, sauvegardes vérifiées, HTTPS, `NODE_ENV=production` et `APP_ORIGIN` exact. Servir `dist` et l’API sous le même domaine avec proxy `/api` et repli SPA. Ne pas utiliser Vite ou le PostgreSQL embarqué en production. Appliquer les migrations avec `npm run db:deploy`. Les fichiers d’environnement, données locales, dépendances et compilations restent exclus de Git ; le dépôt ne publie pas de `.gitignore` à la demande du propriétaire. Les modules restants, audit, supervision, performances et accessibilité doivent être finalisés avant commercialisation.
