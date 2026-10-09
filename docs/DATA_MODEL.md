# Modèle de données cible PostgreSQL

UUID pour les clés, dates stockées en UTC et affichées dans le fuseau de l’institut, montants XOF entiers, jamais de flottants pour les finances. Toutes les tables métier portent `institute_id` ; les clés étrangères métier doivent être composites `(institute_id, resource_id)` avec unicité correspondante, pour interdire également les liens croisés en base. Les tables plateforme et identité sont les seules exceptions.

| Table                | Champs et relations principales                                                 |
| -------------------- | ------------------------------------------------------------------------------- |
| users                | email unique normalisé, password_hash, email_verified_at, MFA super admin       |
| institutes           | slug unique, nom, état, enseigne éventuelle                                     |
| institute_members    | user, institute, rôle ; unique utilisateur / institut                           |
| institute_settings   | institute unique, timezone, logo, couleur, politique de réservation             |
| branches             | institute, adresse, horaires, actif                                             |
| subscription_plans   | nom, prix mensuel / annuel, limites et fonctionnalités configurables            |
| subscriptions        | institute, plan, état, trial_end, period_end, référence prestataire             |
| service_categories   | institute, nom ; unique institut / nom                                          |
| services             | institute, catégorie, nom, prix, durée, actif, photo                            |
| employees            | institute, membre optionnel, nom, spécialités, poste                            |
| employee_services    | institute, employee, service ; habilitations                                    |
| employee_schedules   | institute, employee, jour, heures et pauses                                     |
| employee_absences    | institute, employee, début, fin                                                 |
| clients              | institute, nom, téléphone, e-mail, anniversaire optionnel, consentements        |
| client_private_notes | institute, client, auteur, texte ; permission spécifique                        |
| appointments         | institute, branch, client, employee, intervalle, statut, origine                |
| appointment_services | institute, appointment, service, prix / durée figés                             |
| payments             | institute, appointment, montant, méthode, état, référence prestataire unique    |
| transactions         | institute, caisse, paiement / dépense, type, montant, auteur                    |
| cash_registers       | institute, branch, ouverture, fermeture, solde attendu / constaté               |
| expenses             | institute, catégorie, montant, date, justificatif                               |
| products             | institute, fournisseur, référence, prix achat / vente, stock, seuil             |
| inventory_movements  | institute, produit, quantité signée, motif, transaction, auteur                 |
| suppliers            | institute, nom, contact                                                         |
| promotions           | institute, code, type, valeur, période, limites                                 |
| loyalty_accounts     | institute, client, solde points ; unique institut / client                      |
| loyalty_movements    | institute, compte, points, référence unique, motif                              |
| notifications        | institute, destinataire, type, contenu, lu_at                                   |
| audit_logs           | institute optionnel pour opérations plateforme, acteur, action, ressource, date |
| sessions             | hash jeton, user, member, expiration                                            |
| auth_tokens          | user, hash jeton, type, expiration, utilisé_at                                  |
| webhook_events       | prestataire, identifiant unique, statut traitement, reçu_at                     |
| outbox_jobs          | institute, type, payload minimal, tentatives, prochaine_exécution               |

Contraintes : prix et quantités pertinentes positifs ; intervalle fin > début ; index tenant + date / statut sur les listes. Pas de suppression des pièces financières : correction par mouvement inverse. Archivage des services référencés. Réservation : transaction sérialisable et contrainte d’exclusion PostgreSQL sur les intervalles d’un employé, hors états annulés / absents ; gérer les conflits par une réponse 409. Vente : transaction atomique, décrément conditionnel de stock, reçu et mouvements ; idempotency key unique. Paiement externe : état pending jusqu’à webhook signé et réconcilié, montant / devise vérifiés. Aucun succès décidé côté navigateur.

Le schéma courant implémente User, Institute, Member, Session, Service, Client, Appointment, Employee, EmployeeService, EmployeeSchedule et EmployeeAbsence. Clients, collaborateurs et rendez-vous sont exposés en lecture / écriture avec permissions. Les relations client, prestation, collaborateur et compte praticien utilisent des clés étrangères composites avec instituteId. Les rendez-vous conservent des instantanés du nom, du prix et de la durée ; une prestation référencée est archivée. Les contraintes PostgreSQL vérifient les horaires, la fin après le début et excluent les réservations qui se chevauchent pour un collaborateur. Les transactions sérialisables et verrouillages traitent les modifications concurrentes.

Les intégrations PostgreSQL livrées vérifient deux instituts, les listes et mutations hors portée, les références croisées, les rôles, les horaires, les absences et la double réservation concurrente. Expiration de session, webhooks et ventes concurrentes seront complétés avec les modules correspondants avant production.
