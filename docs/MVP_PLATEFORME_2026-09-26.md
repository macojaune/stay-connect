# Pages artistes et espace membre : tranche locale du 26 septembre 2026

## État

Travail local dans `stayConnect-relaunch`, branche `feat/relaunch-discovery`. Changements non commités, non poussés et non déployés. Marvin a autorisé la réalisation de toutes les pages artistes et connectées dans la direction existante, avec contrôles regroupés en fin de tranche.

Ce compte rendu complète [la tranche comptes](COMPTES_MVP_2026-09-26.md). Les données du catalogue local de démonstration restent identifiées comme telles.

## Périmètre réalisé dans le code local

| Surface                | Fonctionnement prévu par l'implémentation                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Répertoire artistes    | Recherche, résultats paginés, accès aux profils et formulaire public de suggestion.                                                           |
| Fiche artiste publique | Présentation, liens, catégories, sorties publiques paginées et états vides.                                                                   |
| Mes pull-ups           | Soutiens et commentaires propres au membre, pagination, compteurs et accès aux sorties.                                                       |
| Mes propositions       | Création et historique privés, attribution par session, statut de vérification visible.                                                       |
| Mon compte             | Édition du pseudo public et demande d'un lien de changement de mot de passe à l'adresse du membre.                                            |
| Navigation             | Accès à l'espace membre après connexion et navigation entre pull-ups, propositions et compte.                                                 |
| Erreurs                | Pages 404/500 dans le layout éditorial, message concret et retour vers les sorties. Refus des identifiants invalides et des sorties secrètes. |

Les pages reprennent papier, encre, orange, Anton et Inter. L'affiche de connexion et d'inscription porte désormais « Les sorties / d’ici. / Chaque semaine. ». Les briefs sont dans [account.md](../.impeccable/surfaces/account.md) et [member-artists.md](../.impeccable/surfaces/member-artists.md).

Le serveur détermine l'utilisateur des données privées. Le champ de profil modifiable est le pseudo. Les suggestions anonymes restent publiques uniquement au sens de leur formulaire d'envoi : elles ne deviennent ni des profils publiés ni des propositions appartenant au prochain compte ayant le même email.

## Rapprochement Linear

Lecture en direct du projet StayConnect dans **MarvinL.com**, CLI `--workspace marvinl`. Aucun ticket ni commentaire distant modifié.

| Ticket                                                                                                | Contrat concerné                                                                     | Statut lu |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------- |
| [MAR-177](https://linear.app/marvinl/issue/MAR-177/page-les-artistes)                                 | Profil artiste public et état vide                                                   | Backlog   |
| [MAR-340](https://linear.app/marvinl/issue/MAR-340/suggerer-un-artiste-a-referencer)                  | Proposition publique en attente de vérification, sans création automatique de profil | À tester  |
| [MAR-338](https://linear.app/marvinl/issue/MAR-338/comptes-membres-inscription-connexion-et-session)  | Comptes natifs et session                                                            | À tester  |
| [MAR-339](https://linear.app/marvinl/issue/MAR-339/boost-communaute-soutenir-et-commenter-une-sortie) | Pull-up binaire et commentaire facultatif                                            | À tester  |
| [MAR-166](https://linear.app/marvinl/issue/MAR-166/upvote-inactive-if-not-logged-in)                  | Refus du soutien sans connexion                                                      | À tester  |

Le dashboard, le compte personnel et le suivi des propositions viennent de la demande actuelle ; aucun ticket ne les définissait. L'accès artiste vérifié de MAR-155, la revendication, l'édition de bio, les événements, les clips et le paiement restent exclus. Le relevé exhaustif des 26 tickets se trouve dans [MVP_LINEAR_2026-09-26.md](MVP_LINEAR_2026-09-26.md). Les statuts lus ne prouvent pas un déploiement démo.

## Contrôles techniques acquis

| Contrôle                        | Résultat et preuve                                                                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript serveur et client    | `pnpm run typecheck` réussi. Journal : `/tmp/stayconnect-mvp-types.txt`.                                                                                                                                       |
| Build                           | `pnpm run build` réussi. Journal : `/tmp/stayconnect-mvp-build.txt`. Le démarrage de ce build fait l'objet d'un contrôle distinct ci-dessous.                                                                  |
| Tests unitaires et fonctionnels | 33 unitaires et 20 fonctionnels, soit 53 scénarios distincts validés sur deux exécutions. Détail ci-dessous.                                                                                                   |
| React Doctor                    | 89/100. Deux avertissements de complexité sur `artists/index.tsx` et `releases/show.tsx`, aucun défaut de fonctionnement signalé par cet outil. Journal : `/tmp/stayconnect-mvp-react-doctor.txt`.             |
| Revue backend indépendante      | Isolation des données membres et attribution serveur des propositions relues ; aucun P1/P2 retenu. Les accès aux sorties secrètes et les UUID invalides des avis ont été corrigés puis couverts par les tests. |
| Diff                            | `git diff --check` réussi, résultat transmis par l'agent principal.                                                                                                                                            |

La première exécution a donné **45 réussites sur 53**. Cinq tests membres utilisaient des assertions incompatibles avec Japa ; trois tests de visibilité ont révélé une réponse 404 Inertia dont le corps n'était pas envoyé par le handler. Après correction, les **9 scénarios membres et visibilité ont réussi**, dont un scénario déjà réussi dans la première exécution. Il ne s'agit donc pas d'une exécution unique de 53 tests tous verts.

Journaux : `/tmp/stayconnect-member-backend-tests.txt` et `/tmp/stayconnect-member-targeted-tests.txt`. Les tests couvrent notamment les refus anonymes, l'isolation entre membres, le refus d'attribution par email, le profil limité au pseudo, l'adresse cible de récupération, les sorties secrètes et les identifiants mal formés. Leurs fixtures sont locales et nettoyées par les tests.

## Migration locale

Migration `20260926221000_add_user_id_to_artist_suggestions` appliquée uniquement à PostgreSQL **`127.0.0.1:55446/stayconnect_relaunch_demo`**, selon le compte rendu de l'agent principal. Elle ajoute `artist_suggestions.user_id` nullable, sa clé étrangère et un index. Les suggestions historiques restent sans propriétaire.

Point de retour : `/tmp/stayconnect-before-member-1790463270931.dump`. Simulation effectuée avant application ; la seconde exécution a répondu `Already up to date`. Aucune migration distante n'est déclarée par ce compte rendu.

## Parcours navigateur acquis

Parcours exécutés par l'agent principal dans le navigateur T3 sur le serveur local. Le compte de test utilise une adresse du domaine réservé `example.test` ; aucun mot de passe n'est consigné ici.

1. Rechercher Jooslyf dans le répertoire et ouvrir sa fiche.
2. Envoyer une proposition publique en visiteur anonyme.
3. Créer un nouveau compte membre, puis ouvrir son espace vide.
4. Vérifier que la proposition anonyme précédente n'apparaît pas dans cet espace, malgré le même email.
5. Ajouter un pull-up et un commentaire sur une sortie, puis les retrouver dans le dashboard.
6. Envoyer « Artiste démo membre » avec une URL `example.test` depuis l'espace membre. La proposition reste visible dans sa session avec le statut en attente ; la proposition anonyme de même email reste absente de l'historique.
7. Modifier le pseudo en « Auditeur StayConnect ». Le nom change dans les données d'authentification partagées et la navigation latérale ; le bouton d'enregistrement devient désactivé après réussite.
8. Demander un lien de changement de mot de passe depuis Mon compte. Un email destiné à `preview-mvp@example.test` a été reçu dans Mailpit à `2026-09-26T23:08:25Z`. L'envoi est resté sur le SMTP local ; aucun email réel n'a été envoyé.

## Runtime compilé local

Le build compilé a été démarré localement sur le port `3347`. L'agent principal a effectué les contrôles suivants après déconnexion :

- `/mon-espace` redirige vers la connexion avec sa destination conservée dans `returnTo`.
- La connexion ouvre le dashboard contenant le pull-up, le commentaire et la proposition du membre.
- `/mon-espace/propositions` affiche uniquement les propositions de ce membre.
- `/artistes/not-a-uuid` et `/route-demo-inexistante` renvoient HTTP 404 avec le contenu Inertia `errors/not_found`.

Assets observés sur ce runtime : `assets/app-91r4xlzD.js` et `LoginPage-D0tqj80a.js`. Il s'agit d'un serveur compilé local, sans déploiement distant.

En mode développement, une route inconnue conserve la page de debug du framework. Une ressource inexistante reconnue par les contrôleurs utilise la page 404 éditoriale. Cette distinction est attendue par la configuration du handler.

## Captures et revue visuelle finale

Captures transmises par l'agent principal, issues du navigateur T3 :

| Page         | Desktop                                                                                                     | Mobile                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Dashboard    | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj04b87-cfad6aa9.png) | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj04m46-c9126683.png) |
| Propositions | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj036oi-494a3347.png) | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj04nxl-1d7814d6.png) |
| Compte       | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj03y8h-17aa63bb.png) | [Capture](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muj03ygs-04882a46.png) |

La revue visuelle indépendante `member_finish_review` a rendu **`disposition: ship`** sur les 11 captures fournies (artistes, profil artiste, authentification, dashboard, propositions et compte). Aucun défaut matériel ni correctif visuel requis dans ce passage. Le reviewer a vérifié les captures et les sources concernées ; il n'a ni navigué ni exécuté les parcours fonctionnels. Aucun détecteur Impeccable n'a tourné, son lanceur ayant renvoyé une erreur de permission. Les animations et états hors capture ne sont pas couverts par ce verdict.

Les viewports inspectés sont de 1440 × 1000 et 390 × 844. L'outil réduit les captures desktop à 1280 × 889 ; les mobiles restent à 780 × 1688, DPR 2. Les mesures du navigateur sur les pages membres mobiles donnent `scrollWidth = 390`.

## Aperçu laissé disponible

Serveur local sur `http://localhost:3346`, navigateur positionné sur `/mon-espace`. Le compte de démonstration « Auditeur StayConnect » (`preview-mvp@example.test`), son pull-up commenté et sa proposition sont conservés dans la base locale pour l'aperçu. La proposition anonyme de test reste distincte. Les formulaires du récap restent neutralisés en `VITE_DEMO_MODE`, comme dans le prototype précédent. Cette tranche ne constitue pas une livraison du MVP en production.
