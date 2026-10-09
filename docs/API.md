# API REST — première tranche

Base `/api`. JSON. Cookie `belleza_session`. Mutations : `Origin` doit correspondre à `APP_ORIGIN`. Erreurs `{ "error": "message" }`. Codes : 400 validation, 401 session absente / expirée, 403 permission / origine, 404 ressource hors portée ou absente, 409 e-mail existant, 503 indisponibilité.

| Méthode      | Route                              | Contrat                                                                                                                                                     |
| ------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET          | /health                            | Vérifie PostgreSQL                                                                                                                                          |
| POST         | /auth/register                     | name, instituteName, email, password (12–128 caractères) ; crée un institut et une session                                                                  |
| POST         | /auth/login                        | email, password ; ouvre une session sur la première adhésion                                                                                                |
| POST         | /auth/logout                       | Révoque la session et efface le cookie                                                                                                                      |
| GET          | /me                                | user (nom / e-mail), institut, rôle de la session                                                                                                           |
| GET          | /dashboard                         | Nombre de prestations actives, clients, 8 prochains rendez-vous                                                                                             |
| GET          | /services                          | Catalogue tenant, 200 entrées maximum                                                                                                                       |
| GET          | /services/:id                      | Prestation de l’institut de la session, sinon 404                                                                                                           |
| POST         | /services                          | name, category, description, price (XOF entier), duration (5–480 minutes), active ; propriétaire / responsable                                              |
| PATCH        | /services/:id                      | Sous-ensemble des mêmes champs ; portée tenant imposée                                                                                                      |
| DELETE       | /services/:id                      | Supprime une prestation non utilisée, archive une prestation référencée ; propriétaire / responsable                                                        |
| GET          | /clients                           | page, limit (1–100), search (nom / téléphone), archived ; propriétaire / responsable / réception                                                            |
| GET          | /clients/:id                       | Fiche et 100 derniers rendez-vous de l’institut                                                                                                             |
| POST / PATCH | /clients, /clients/:id             | Fiche complète : name, phone, email, birthDate (AAAA-MM-JJ), marketingConsent, active                                                                       |
| GET          | /employees                         | Liste paginée, horaires, qualifications et absences ; praticien limité à sa fiche liée                                                                      |
| POST / PATCH | /employees, /employees/:id         | name, phone, job, active, serviceIds, schedules [{weekday: 0–6, startMinute, endMinute}], memberId optionnel ; propriétaire / responsable                   |
| POST         | /employees/:id/absences            | startsAt, endsAt, reason facultatif ; refuse les conflits avec les réservations                                                                             |
| DELETE       | /employees/:id/absences/:absenceId | Suppression d’une absence ; propriétaire / responsable                                                                                                      |
| GET          | /appointments                      | from / to ISO, période de 93 jours maximum, employeeId / status facultatifs ; limite 1000 ; praticien limité à son planning                                 |
| POST / PATCH | /appointments, /appointments/:id   | clientId, employeeId, serviceId, startsAt ISO ; création / déplacement futur, calcul serveur de durée, fin et prix ; propriétaire / responsable / réception |
| PATCH        | /appointments/:id/status           | status : PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW ; transitions contrôlées ; praticien autorisé à démarrer / terminer ses rendez-vous |
| GET          | /availability                      | date AAAA-MM-JJ, employeeId, serviceId ; débuts disponibles ISO, pas de 15 minutes, horaires UTC                                                            |

Les références croisées entre instituts sont refusées par l’API et les clés étrangères composites. Les conflits de créneau retournent 409, y compris lorsque deux requêtes arrivent simultanément. Le tableau de bord masque la clientèle au praticien / caissier ; le praticien n’y voit que son planning et le caissier aucune réservation. Aucun endpoint de paiement, abonnement ou réservation publique n’est encore livré. La pagination complète du catalogue, l’audit et les invitations restent à ajouter.
