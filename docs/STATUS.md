# État de la première livraison — 9 octobre 2026

## Vérifications exécutées

- Installation npm réussie ; verrouillage des dépendances dans `package-lock.json`.
- Client Prisma généré avec succès.
- Migration SQL de fondation générée depuis le schéma et incluse au dépôt.
- Vérification TypeScript et compilation Vite de production réussies.
- Deux tests unitaires réussis ; test PostgreSQL explicitement ignoré sans `TEST_DATABASE_URL`.
- Accueil et maquette de tableau de bord inspectés dans le navigateur ; aperçu mobile inspecté à 390 × 844.

## Limites constatées

PostgreSQL et Docker ne sont pas disponibles sur cette machine. La migration n’a pas été appliquée et les parcours d’inscription, de connexion et de sauvegarde n’ont donc pas été testés de bout en bout. Le catalogue et l’authentification sont implémentés côté frontend et API ; leur validation réelle dépend du démarrage de PostgreSQL.

La compilation signale un bundle JavaScript principal supérieur à 500 ko : découpage par routes et optimisation des photographies à réaliser pendant la phase d’optimisation. Des avertissements non bloquants concernent des annotations de la dépendance Zod.

## Aperçu local

Le serveur frontend lancé pendant la réalisation utilise `http://127.0.0.1:5174`. La route `/apercu` contient exclusivement une maquette illustrative. Les instructions de démarrage standard du README utilisent `http://localhost:5173` et l’origine correspondante dans `.env.example`. Pour utiliser les formulaires réels sur un autre port / nom d’hôte, adapter `APP_ORIGIN` puis démarrer l’API.

Cette livraison couvre la proposition d’architecture, les maquettes principales et une première tranche de fondation. La feuille de route complète reste dans `ARCHITECTURE.md` ; les autres modules ne sont pas déclarés terminés.
