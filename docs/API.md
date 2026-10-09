# API REST — première tranche

Base `/api`. JSON. Cookie `belleza_session`. Mutations : `Origin` doit correspondre à `APP_ORIGIN`. Erreurs `{ "error": "message" }`. Codes : 400 validation, 401 session absente / expirée, 403 permission / origine, 404 ressource hors portée ou absente, 409 e-mail existant, 503 indisponibilité.

| Méthode | Route          | Contrat                                                                                                        |
| ------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| GET     | /health        | Vérifie PostgreSQL                                                                                             |
| POST    | /auth/register | name, instituteName, email, password (12–128 caractères) ; crée un institut et une session                     |
| POST    | /auth/login    | email, password ; ouvre une session sur la première adhésion                                                   |
| POST    | /auth/logout   | Révoque la session et efface le cookie                                                                         |
| GET     | /me            | user (nom / e-mail), institut, rôle de la session                                                              |
| GET     | /dashboard     | Nombre de prestations actives, clients, 8 prochains rendez-vous                                                |
| GET     | /services      | Catalogue tenant, 200 entrées maximum                                                                          |
| GET     | /services/:id  | Prestation de l’institut de la session, sinon 404                                                              |
| POST    | /services      | name, category, description, price (XOF entier), duration (5–480 minutes), active ; propriétaire / responsable |
| PATCH   | /services/:id  | Sous-ensemble des mêmes champs ; portée tenant imposée                                                         |
| DELETE  | /services/:id  | Supprime une prestation de la fondation ; propriétaire / responsable                                           |

Pagination complète et audit seront ajoutés avant extension du catalogue. Aucun endpoint de paiement, abonnement ou réservation publique n’est livré dans cette tranche.
