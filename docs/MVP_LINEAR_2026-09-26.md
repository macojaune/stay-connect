# Périmètre MVP et lecture Linear du 26 septembre 2026

Ce document consigne une lecture en direct du workspace **MarvinL.com**, via la CLI avec `--workspace marvinl`, du projet [StayConnect](https://linear.app/marvinl/project/stayconnect-81a5a28e8e68). Il décrit le périmètre demandé et l'état des tickets au moment de la lecture. Il ne constitue une preuve ni de validation utilisateur, ni de commit, de push ou de déploiement.

## Couverture de la lecture

Les 26 tickets du projet ont été lus, archivés inclus, avec leurs descriptions, parents, enfants, commentaires et relations. Aucun ticket n'était en `À refiner`. Aucune relation formelle de dépendance n'était enregistrée.

Un seul commentaire était présent : MAR-149 contient une liste de genres Spotify, datée du 25 septembre 2024. Les autres tickets ne contenaient pas de commentaire.

## Contrats fonctionnels de la tranche

| Sujet                           | Source                                  | Contrat                                                                                                                                                                                                                                         |
| ------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages artistes publiques        | MAR-177                                 | Profil, présentation, réseaux sociaux, catégories et sorties référencées. État vide sobre. Revendication et édition de bio reportées après définition de la vérification artiste de MAR-155.                                                    |
| Suggestion d'artiste            | MAR-340                                 | Formulaire public : nom, email de contact, lien source et précision facultative. Enregistrement en attente de vérification. Aucune création automatique de profil public.                                                                       |
| Comptes membres                 | MAR-338                                 | Inscription par email, connexion, déconnexion et session native. Accès au soutien et aux commentaires après connexion. Erreurs visibles. Aucune dépendance Clerk sans configuration validée.                                                    |
| Pull-ups et commentaires        | MAR-339                                 | Soutien binaire, un par membre et sortie. Compteur visible, commentaire facultatif, édition du commentaire et retrait du soutien. Le nom visible « Pull-up » vient du cadrage produit confirmé en session.                                      |
| Refus des visiteurs déconnectés | MAR-166                                 | Le titre demande de désactiver le vote sans connexion. Aucune description plus précise. À rapprocher de MAR-338 et MAR-339.                                                                                                                     |
| Dashboard et compte personnel   | Demande utilisateur actuelle            | Aucun ticket du projet ne définit ces pages. Leur réalisation locale vient de la demande actuelle d'avancer les pages artistes et connectées. Ne pas attribuer à Linear des exigences de notifications, favoris, modération ou édition artiste. |
| Pages d'erreur                  | Cohérence des parcours de cette tranche | Explication concrète, retour vers les sorties, lien secondaire vers les artistes, même direction visuelle que les pages publiques.                                                                                                              |

Le contrat de données des pages membres doit rester limité à l'utilisateur authentifié. Un éventuel rattachement des nouvelles suggestions à un membre ne doit pas attribuer l'historique à partir du seul email de contact. Ces règles de réalisation ne sont pas des critères déjà écrits dans MAR-340.

## Tickets et statuts au moment de la lecture

| Ticket                                                                                                              | Intitulé                                                                         | Statut   | Priorité Linear |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- | --------------- |
| [MAR-144](https://linear.app/marvinl/issue/MAR-144/page-sortie-ameliorer-design)                                    | Page Sortie - Améliorer design                                                   | À faire  | Haute           |
| [MAR-145](https://linear.app/marvinl/issue/MAR-145/ajouter-une-sortie)                                              | Ajouter une sortie                                                               | Backlog  | Non définie     |
| [MAR-146](https://linear.app/marvinl/issue/MAR-146/ajouter-une-cover)                                               | Ajouter une cover                                                                | Backlog  | Moyenne         |
| [MAR-147](https://linear.app/marvinl/issue/MAR-147/creer-une-artiste-depuis-la-recherche)                           | Créer un·e artiste depuis la recherche                                           | Backlog  | Non définie     |
| [MAR-148](https://linear.app/marvinl/issue/MAR-148/creer-une-categorie-depuis-la-recherche)                         | Créer un·e catégorie depuis la recherche (?)                                     | Backlog  | Non définie     |
| [MAR-149](https://linear.app/marvinl/issue/MAR-149/poc-automatisation-liste-dartistes)                              | POC Automatisation - Liste d'artistes                                            | Backlog  | Non définie     |
| [MAR-150](https://linear.app/marvinl/issue/MAR-150/poc-automatisation-pre-order-distrokid)                          | POC Automatisation - Pre-order Distrokid                                         | Backlog  | Non définie     |
| [MAR-151](https://linear.app/marvinl/issue/MAR-151/poc-automatisation-sorties)                                      | POC Automatisation - Sorties                                                     | Backlog  | Non définie     |
| [MAR-152](https://linear.app/marvinl/issue/MAR-152/homepage-reorder-list-on-vote-changes)                           | Homepage - Reorder list on vote changes                                          | Backlog  | Non définie     |
| [MAR-153](https://linear.app/marvinl/issue/MAR-153/inscription-a-la-newsletter)                                     | Inscription à la newsletter                                                      | Done     | Haute           |
| [MAR-154](https://linear.app/marvinl/issue/MAR-154/ajouter-analytics-and-tracking-des-actions-importantes)          | Ajouter Analytics & tracking des actions importantes                             | Backlog  | Moyenne         |
| [MAR-155](https://linear.app/marvinl/issue/MAR-155/poc-acces-artiste)                                               | POC - Accès artiste                                                              | Backlog  | Haute           |
| [MAR-165](https://linear.app/marvinl/issue/MAR-165/bot-twitter)                                                     | Bot Twitter                                                                      | Backlog  | Non définie     |
| [MAR-166](https://linear.app/marvinl/issue/MAR-166/upvote-inactive-if-not-logged-in)                                | Upvote - Inactive If not logged in                                               | À tester | Non définie     |
| [MAR-167](https://linear.app/marvinl/issue/MAR-167/vue-lartiste-na-pas-encore-ajoute-son-contenu)                   | Vue l'artiste n'a pas encore ajouté son contenu                                  | Backlog  | Haute           |
| [MAR-173](https://linear.app/marvinl/issue/MAR-173/formulaire-avis)                                                 | formulaire avis                                                                  | Done     | Haute           |
| [MAR-174](https://linear.app/marvinl/issue/MAR-174/liste-davis)                                                     | liste d'avis                                                                     | Done     | Haute           |
| [MAR-175](https://linear.app/marvinl/issue/MAR-175/afficher-les-votes)                                              | afficher les votes                                                               | Done     | Haute           |
| [MAR-176](https://linear.app/marvinl/issue/MAR-176/afficher-les-liens)                                              | afficher les liens                                                               | Done     | Haute           |
| [MAR-177](https://linear.app/marvinl/issue/MAR-177/page-les-artistes)                                               | Page Les Artistes                                                                | Backlog  | Non définie     |
| [MAR-327](https://linear.app/marvinl/issue/MAR-327/fix-stayconnect-redis-noauth-noise-on-coolify-workers)           | Fix stayconnect Redis NOAUTH noise on Coolify workers                            | Backlog  | Moyenne         |
| [MAR-328](https://linear.app/marvinl/issue/MAR-328/referencer-les-evenements-artistes-et-etendre-lautomatisation-a) | Référencer les événements artistes et étendre l’automatisation à YouTube / clips | Backlog  | Moyenne         |
| [MAR-338](https://linear.app/marvinl/issue/MAR-338/comptes-membres-inscription-connexion-et-session)                | Comptes membres - inscription, connexion et session                              | À tester | Urgente         |
| [MAR-339](https://linear.app/marvinl/issue/MAR-339/boost-communaute-soutenir-et-commenter-une-sortie)               | Boost communauté - soutenir et commenter une sortie                              | À tester | Urgente         |
| [MAR-340](https://linear.app/marvinl/issue/MAR-340/suggerer-un-artiste-a-referencer)                                | Suggérer un artiste à référencer                                                 | À tester | Haute           |
| [MAR-341](https://linear.app/marvinl/issue/MAR-341/auditer-pepsee-actus-comme-source-de-candidats-artistes)         | Auditer Pepsee Actus comme source de candidats artistes                          | Backlog  | Moyenne         |

## Parents, enfants et préalables

- MAR-144 est parent de MAR-173, MAR-174, MAR-175 et MAR-176, tous `Done`, ainsi que de MAR-167, en `Backlog`.
- MAR-145 est parent de MAR-146, MAR-147 et MAR-148. Ces quatre tickets sont en `Backlog`, sans description fonctionnelle.
- MAR-177, MAR-338, MAR-339, MAR-340, MAR-166 et MAR-155 n'ont ni parent ni enfant.
- MAR-177 cite MAR-155 dans sa description comme préalable métier à la revendication et à l'édition des profils, même si aucune relation de blocage formelle n'est enregistrée.

## Exclusions de cette réalisation

La vérification des artistes de MAR-155 reste à définir. La connexion via Spotify, Apple Music ou Instagram est une question dans ce POC, pas une décision. La revendication et l'édition de bio ne font pas partie du contrat des pages publiques.

MAR-328 concerne les événements, les chaînes YouTube et l'ingestion des clips. Il demande du cadrage et plusieurs étapes métier et techniques. `PRODUCT.md` place ces sujets après le lancement.

MAR-341 couvre un audit de Pepsee Actus avant toute collecte. Le ticket exclut la copie des biographies et des visuels et demande de conserver d'éventuels candidats à vérifier. Aucun import n'est autorisé par ce relevé.

Les POC d'ingestion MAR-149 à MAR-151, le bot Twitter MAR-165, le chantier Redis/Coolify MAR-327 et l'instrumentation MAR-154 ne sont pas des exigences supplémentaires des pages membres.

## Croisement initial avec le code local

Au moment de la lecture, `start/routes.ts` exposait les pages publiques `/artistes`, `/artistes/:id` et le formulaire `POST /artistes/suggestions`. La suggestion créait une ligne `pending` sans publier de profil. Le dashboard et le compte personnel n'avaient pas encore de route active.

Le validateur initial rendait `sourceUrl` facultative, alors que MAR-340 ne qualifie de facultative que la précision. Ce point est à aligner dans la réalisation. Cette observation décrit le code lu avant les changements de la tranche et ne préjuge pas de son état après réalisation.

## Limites et livraison

Le statut `À tester` de MAR-338, MAR-339, MAR-340 et MAR-166 est un état Linear lu en direct. Ce relevé n'établit ni le commit servi ni l'environnement actuellement déployé.

La demande actuelle autorise une réalisation locale et des contrôles regroupés en fin de chantier. Aucune mutation Linear n'a été effectuée pendant cette lecture. Toute annonce de validation ou de livraison doit citer les contrôles et l'environnement effectivement vérifiés.
