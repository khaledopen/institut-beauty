# BELLEZA — conception et feuille de route

## Architecture globale

Application React / Vite / TypeScript, React Router, TanStack Query pour les appels et leur invalidation, React Hook Form et Zod pour les formulaires. Tailwind v4 et styles de marque, Lucide pour les icônes, Recharts pour les visualisations. API REST Express / TypeScript, Prisma et PostgreSQL. En production : frontend et API derrière un même domaine HTTPS ; proxy `/api`, cookie de session HttpOnly, Secure et SameSite. Les opérations mutantes exigent une origine autorisée. Pas de jeton d’authentification dans localStorage.

L’identité authentifiée possède des adhésions à des instituts. Une session référence une adhésion précise. L’API déduit l’institut depuis cette adhésion et impose `instituteId` à chaque lecture / écriture métier. Les endpoints ne prennent pas cet identifiant depuis le frontend. Une future sélection d’institut vérifiera l’adhésion avant de changer la session.

## Rôles et permissions cibles

| Rôle                   | Accès prévu                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| Propriétaire           | Toutes les données de son institut, paramètres, abonnements, collaborateurs |
| Responsable            | Gestion quotidienne, catalogue, équipe, clients et rapports                 |
| Réceptionniste         | Clients, agenda, réservations ; aucun accès aux notes restreintes           |
| Praticien              | Son agenda et informations clients nécessaires à la prestation              |
| Gestionnaire de caisse | Encaissements, clôtures et ventes ; pas de notes clients                    |
| Super administrateur   | Exploitation plateforme ; accès métier exceptionnel et journalisé           |

Permissions livrées : propriétaire / responsable gèrent le catalogue et l’équipe ; propriétaire / responsable / réception gèrent les clients et rendez-vous. Le praticien ne voit que son planning et sa fiche liée et peut démarrer / terminer ses soins. Le caissier ne reçoit aucune liste clients ou rendez-vous. Les invitations et l’administration des comptes restent à développer.

## Parcours

1. Propriétaire : accueil → inscription → transaction créant utilisateur, institut et adhésion → session → tableau de bord vide → création du catalogue.
2. Équipe : invitation → validation de l’adresse → choix de mot de passe → espace limité au rôle (phase ultérieure).
3. Cliente sans compte : `/i/:slug` → prestation → collaborateur / sans préférence → créneau disponible → coordonnées / consentement → demande → confirmation (phase ultérieure).
4. Exploitant : connexion renforcée → indicateurs globaux → gestion instituts / formules → audit (phase ultérieure).

## Structure

```
src/
  main.tsx          Routes, écrans et composants de la première tranche
  api.ts            Client HTTP typé
  styles.css        Identité et responsive
server/
  index.ts          REST, authentification, catalogue
  policy.ts         Permissions et portée tenant
  policy.test.ts    Tests unitaires
prisma/
  schema.prisma     Modèle réellement implémenté
docs/
  ARCHITECTURE.md   Conception, parcours et phases
  DATA_MODEL.md     Modèle cible et contraintes
  API.md           Contrats API
```

Avec la croissance, extraire les modules `auth`, `catalog`, `appointments`, `billing`, `inventory`, `platform` en routeurs, services et repositories. Utiliser des transactions et une file de tâches persistante pour les effets externes. Les maquettes ne servent jamais de source aux routes authentifiées.

## Maquettes exécutables

- `/` : vitrine ivoire, rose poudré et brun ; hero photographique, fonctionnalités, formules sans faux prix, FAQ.
- `/apercu` : tableau de bord illustratif, sidebar, quatre KPI, courbe, prestations favorites et rendez-vous. Bannière explicite de maquette.
- `/inscription`, `/connexion` : formulaire et panneau photographique.
- `/app` : compteurs PostgreSQL et prochains rendez-vous selon le rôle.
- `/app/prestations` : recherche, filtres, cartes, création / modification / suppression persistées.
- `/app/clients` : fiches, recherche, archivage et historique des visites.
- `/app/equipe` : qualifications, horaires hebdomadaires et absences.
- `/app/agenda`, `/app/rendezvous` : planning, disponibilités, réservations et statuts.
- `/apercu/clients`, `/apercu/equipe`, `/apercu/agenda` : exemples illustratifs.

Les titres utilisent actuellement Georgia comme repli local. Playfair Display et Inter pourront être auto-hébergées avant finalisation. Aucun témoignage inventé.

## Livraison progressive

Phase 1 : architecture et parcours proposés, modèle cible documenté, premières maquettes exécutables.
Phase 2 : première fondation fonctionnelle : inscription, connexion, session, isolation du catalogue, rôles. Restent vérification e-mail, récupération de mot de passe, invitations, audit et tests d’isolation en base.
Phase 3 : clientèle, équipe, qualifications, horaires, absences et agenda livrés. Conflits contrôlés par transactions sérialisables et exclusion PostgreSQL, relations composites entre données d’un même institut, tests réels d’isolation et concurrence. Restent catégories relationnelles, photos, invitations et administration des comptes.
Phase 4 : caisse, stock, dépenses, promotions, rapports et exports. Pas d’encaissement simulé.
Phase 5 : réservation publique, super administration, abonnements, notifications, intégrations e-mail / paiement.
Phase 6 : tests d’intégration, accessibilité complète, mesures de performance, supervision et sauvegardes ; audit avant commercialisation.

Ce dépôt est une première tranche, pas une plateforme commercialisable complète. Le modèle cible décrit les extensions sans prétendre les avoir déjà exécutées.
