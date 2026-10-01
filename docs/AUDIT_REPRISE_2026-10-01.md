# Reprise StayConnect — audit du 1er octobre 2026

À 03:12 America/Guadeloupe, Marvin a validé les ajustements et autorisé leur commit/push sur `develop`. Les mentions « local, non committé/poussé/déployé » ci-dessous décrivent les contrôles avant cette livraison Git ; la présence du commit distant ne vaut pas preuve de déploiement runtime.

## Conclusion

Le MVP web est implémenté et servi sur DEV, mais sa validation connectée n'est pas terminée. Le défaut d'authentification PostgreSQL du worker DEV détecté pendant cet audit a été corrigé sur autorisation de Marvin vers 01:50 America/Guadeloupe : connexion SQL et lecture applicative Adonis vérifiées, même commit. Les traitements métier de bout en bout ne sont pas encore validés. Le dépôt de relance et DEV correspondent au commit `b161dd952e228f879fab1d9e51e5c5320ecbce5f`. La base DEV est vide et aucun compte n'est autorisé à utiliser l'éditeur. Il ne faut donc pas confondre tests locaux réussis et validation du produit en DEV.

## Périmètre et sécurité de l’audit initial

- Travail dans le checkout de relance, branche `feat/relaunch-discovery` ; checkout propre au début. La référence distante `develop` a été relue avec `git ls-remote` et pointe sur le même SHA.
- Checkout initial conservé avec ses modifications ; aucun merge, commit, push, PR ou déploiement réalisé.
- DEV inspecté en lecture seule : pas de compte créé, pas d'allowlist modifiée, pas d'envoi de mail, pas de sortie ou fichier ajouté, pas de migration exécutée sur DEV. Aucun changement en production ou DEMO.
- Comptes et données de tests créés uniquement dans un PostgreSQL jetable local, avec Redis dédié, clés API fictives, SMTP local indisponible et aucun worker lancé.

## Validations locales

| Contrôle | Résultat |
| --- | --- |
| Typage serveur et client | Réussi avant et après le correctif |
| Build client, SSR et serveur | Réussi |
| Suite complète isolée | **60/60 réussis : 33 unitaires et 27 fonctionnels** |
| Migrations sur base neuve | 23 appliquées ; seconde exécution : Already up to date |
| ESLint sur le test modifié | Réussi |
| ESLint global | Échec : 49 erreurs de formatage Prettier présentes avant modification |
| React Doctor complet | 207 fichiers, 37 avertissements, aucune erreur ; score/télémétrie désactivés |
| Vérification du diff | Réussie |

### Correctif limité aux fixtures Spotify

Deux tests unitaires échouaient avant reprise : la fixture d'album omettait `release_date_precision` et la fixture de pagination omettait `next`. Ajout de `day` et `next: null` ; la fixture album est désormais vérifiée par TypeScript avec `satisfies SpotifyAlbumSummary`. Le contrat applicatif n'a pas été assoupli et aucun comportement produit n'a changé.

### Attention aux répétitions de suite

La configuration locale existante pointe sur PostgreSQL/Redis aux ports 55446/55447, absents lors de la reprise. La première suite standard n'était donc pas exploitable pour valider les tests fonctionnels.

L'audit a utilisé PostgreSQL 16 au port 55546, base `stayconnect_relaunch_test_20261001`, et Redis 7 au port 55547, réservés à cet audit. Les fixtures SQL sont nettoyées : zéro compte, sortie ou affiliation à la fin. Les deux conteneurs jetables ont été arrêtés et supprimés automatiquement après les contrôles.

Redis conserve les compteurs du limiteur entre deux exécutions. Une troisième suite rapide a échoué sur les connexions : compteur IP login **45**, supérieur au seuil **30/15 minutes**, TTL restant 802 secondes. Ce n'était pas une régression du correctif Spotify. Après redémarrage du Redis jetable sans persistance, la suite complète et le typage ont à nouveau réussi. Pour reproduire, utiliser un Redis neuf/dédié à chaque suite ; ne jamais vider un Redis partagé, DEV ou production et ne pas désactiver le limiteur applicatif.

### Portée des tests fonctionnels

Les 27 tests couvrent tokens de réinitialisation et concurrence, unicité des comptes, révocation de sessions, redirections Inertia, séparation des données membres, confidentialité des sorties secrètes, pull-ups liés au membre connecté, refus visiteur/membre ordinaire de l'éditeur, création/correction publique, catégories et rollback, affiliation des artistes liés, upload et signature de fichier, service public et nettoyage après échec.

Ils ne prouvent pas un envoi réel Brevo, une synchronisation réelle Spotify, une qualification d'artiste ou le parcours connecté DEV.

### Avertissements à traiter séparément

- Build : Browserslist ancien et avertissements de résolution des ressources publiques à la compilation. Le build se termine ; disponibilité servie à contrôler séparément.
- React Doctor : complexité, composants volumineux, séquentialité, clé d'index, ancien bouton mobile sans libellé, recommandations de durcissement du gestionnaire de paquets. Ces diagnostics sont des pistes, pas 37 régressions prouvées.
- Les deux alertes SQL relues sont heuristiques : l'une porte sur une expression constante ; l'autre utilise des paramètres liés. Aucune injection établie par cette lecture.
- Pas de reformatage massif ni de refactor frontend pendant cet audit.

## DEV vérifié aujourd'hui

À **01:06:09 America/Guadeloupe / 05:06:09 UTC**, inspection via SSH vps2 et contexte Coolify vps2 :

- Web et worker running, sans restart observé, image tag `b161dd952e228f879fab1d9e51e5c5320ecbce5f`.
- Base `stayconnect_develop` vérifiée à la fois par configuration et `current_database()` ; requêtes en transaction read-only : **0 comptes, 0 artistes, 0 sorties, 0 affiliations**.
- Schéma web : 23 fichiers de migration runtime correspondent aux 23 migrations enregistrées ; aucune migration en attente ni entrée orpheline. Les trois dernières ont été appliquées explicitement le 28 septembre.
- **Anomalie worker DEV :** une tentative de connexion PostgreSQL directe depuis son conteneur, avec la configuration en cours et la cible `stayconnect_develop` gardée, échoue avant tout SELECT avec `28P01` (`invalid_password`). Son état running ne prouve donc pas le fonctionnement des tâches nécessitant la base. Comparaison des environnements Docker sans afficher les valeurs : hôte, port, utilisateur et base identiques entre web et worker, mais **DB_PASSWORD différent**. Aucun job métier ni modification de configuration lancé ; aucune preuve récente de traitement métier dans les logs worker contrôlés. Correction de configuration DEV à autoriser et vérifier séparément.
- Allowlist éditeur vide dans les deux processus.
- Web : `APP_URL=https://dev-stayconnect.marvinl.com/`, `UPLOAD_PATH=/app/uploads`, `RUN_MIGRATIONS_ONCE=false`. Worker : même URL/chemin ; drapeau de migration absent.
- Volume web de couvertures monté RW sur `/app/uploads` ; dossiers uploads/covers appartenant à l'UID applicatif 1001, mode 755. Aucun test d'écriture ni de persistance au redéploiement refait aujourd'hui ; leur preuve antérieure reste historique. Aucun volume sur le worker.

### Navigateur DEV

Chromium/Playwright, largeurs 1440 et 390 px, fuseau America/Guadeloupe :

- Accueil, artistes, connexion, inscription, mot de passe oublié : HTTPS 200, rendu et champs présents.
- Éditeur équipe et espace membre : redirection vers la connexion pour un visiteur, puis formulaire 200. Cela ne valide pas le refus d'un membre connecté sur DEV.
- Slug inexistant : vraie réponse 404 avec page explicative.
- Aucun débordement horizontal ni erreur JavaScript `pageerror` sur ces 16 navigations.
- Filtres « Le classement », « Le fil des sorties », « À venir » et « Cette semaine » cliqués sur mobile : état `aria-pressed=true` ; navigation Inertia vers les artistes réussie.
- Accueil vide conforme aux comptes SQL. Les tris sont testés sur un catalogue vide, pas leur ordre sur des sorties réelles.
- Aucune soumission de formulaire DEV ni activation d'Umami. Un `ERR_ABORTED` a été enregistré pour la navigation de test 404 dans chaque largeur ; la page 404 était bien rendue.

## Livraison GitHub Actions

Le dernier workflow `develop`, [run 36369480833](https://github.com/macojaune/stay-connect/actions/runs/36369480833), lancé le 28 septembre à 02:21:03 UTC sur `b161dd9`, reste en échec. Le job build-and-publish a réussi ; l'étape Deploy to Docker Swarm du job deploy a échoué. C'est un chemin distinct de Coolify, qui sert effectivement le web DEV. Aucun workflow relancé ou modifié.

## Linear relu aujourd'hui

Descriptions, parents/enfants pertinents et commentaires (fils résolus inclus), workspace explicite `marvinl` ; aucune mutation.

| Ticket | Statut | Restant |
| --- | --- | --- |
| [MAR-145](https://linear.app/marvinl/issue/MAR-145) — ajout/correction | En cours | Compte équipe contrôlé, parcours connecté DEV, DEMO et QA humaine |
| [MAR-146](https://linear.app/marvinl/issue/MAR-146) — pochette | En cours | Upload/URL depuis formulaire connecté DEV, DEMO et QA |
| [MAR-370](https://linear.app/marvinl/issue/MAR-370) — affiliations | En cours | Qualification sourcée réelle et saisie connectée DEV |
| [MAR-154](https://linear.app/marvinl/issue/MAR-154) — analytics | En cours | Événements sur environnement explicitement activé ; Umami OFF DEV est volontaire |
| [MAR-371](https://linear.app/marvinl/issue/MAR-371) — livraison | À faire | Clarifier Swarm et garantir migrations avant démarrage sans concurrence |

MAR-147/148, enfants de MAR-145, restent En cours ; MAR-155 (accès artiste) Backlog et hors MVP ; MAR-327 Redis production En cours et distinct de la livraison DEV. Les descriptions de MAR-145/146/147/148 sont vides : les critères sont dans leurs commentaires.

## Suivi autorisé — correction du worker DEV

À 01:45 America/Guadeloupe, Marvin a explicitement demandé la correction sur Coolify DEV. Nouvelle vérification : les valeurs Coolify sauvegardées correspondaient exactement aux valeurs injectées dans chaque conteneur, mais les mots de passe web et worker différaient ; serveur, port, utilisateur et base étaient identiques. Web : connexion réussie ; worker : `28P01`. Aucune interpolation `$` ni espace périphérique dans les valeurs sauvegardées.

Il n’y a pas de preuve de changement du mot de passe PostgreSQL. Le constat est une divergence de configuration d’application, déjà injectée dans le worker démarré le 28 septembre ; les informations disponibles ne permettent pas d’attribuer qui ou quel mécanisme l’a introduite. Une configuration copiée ou une ancienne valeur non alignée sont des hypothèses, pas une cause historique prouvée.

- Sauvegarde privée de l’ancienne variable hors dépôt, droits 0600 ; aucun secret affiché.
- Modification ciblée via API Coolify, contexte vps2, application `stayconnect-worker-dev` : seulement `DB_PASSWORD`, aligné sur la valeur fonctionnelle du web. Les autres variables du worker et toutes celles du web sont inchangées.
- Premier PATCH refusé en validation (HTTP 422, aucune modification) ; champ API corrigé, second PATCH enregistré avec contrôle du diff limité à `DB_PASSWORD`.
- Redémarrage Coolify demandé une seule fois : déploiement `6swhwo147ephotsk3t16swyz`, commit `b161dd9`, terminé avec statut `finished` à 05:50:52 UTC / 01:50:52 America/Guadeloupe.
- Nouveau worker `d4a5942c5c9c` running, redémarrages 0, même commit. Configuration Coolify = configuration runtime ; mots de passe web/worker identiques.
- Connexion depuis le nouveau worker puis transaction SQL read-only : `current_database()=stayconnect_develop`, zéro compte et sortie. Web : même conteneur `13fb41a5c43c`, configuration inchangée, connexion toujours réussie et HTTP 200.
- Contrôle via Adonis `migration:status`, avec programmation de tâches désactivée uniquement pour ce processus de vérification et transaction par défaut read-only : exit 0, 23 migrations completed, aucune pending. Aucun job métier déclenché pour le test. Logs initiaux du nouveau worker : pas d’erreur d’authentification DB ; cela ne prouve pas les futurs jobs Spotify/Brevo de bout en bout.
- Aucun changement de mot de passe ou schéma PostgreSQL, aucune modification de production ou DEMO.

## Correctif local — scroll horizontal desktop

Le débordement signalé a été reproduit sur le web DEV avec une gouttière de scrollbar classique : à 1440 px, largeur disponible 1425 px, largeur du document 1440 px et déplacement horizontal réel de 15 px. La cause n’est pas l’illustration : le body du template partagé porte `w-screen` (100vw), qui inclut la scrollbar. Les tests initiaux avec scrollbars superposées ne révélaient pas ce défaut.

Correction d’une seule classe dans le template partagé : `w-screen` remplacé par `w-full` (100 % du parent). Aucun masquage global `overflow-x: hidden`, aucun changement du header, des couleurs, des illustrations ou des interactions. Test unitaire ajouté pour conserver ce contrat de largeur.

34 tests unitaires réussis, typage serveur/client et build réussis ; ESLint du nouveau test réussi. React Doctor scope changed : aucun diagnostic. Contrôles Chromium, WebKit et Firefox réussis : 270 cas (5 pages, 9 largeurs de 320 à 2560 px, scrollbars superposées et gouttière classique), aucune erreur JavaScript, `scrollWidth=clientWidth` et déplacement horizontal maximal 0. Captures desktop/mobile relues, identité visuelle préservée. Validation par substitution réseau du body provenant du template local compilé, sur les réponses HTML DEV sans modifier le serveur. Le harnais Firefox a nécessité une réponse HTML non compressée (zstd non décompressé par route.fetch) ; les 90 cas Firefox ont ensuite réussi. Le correctif est local, non committé/poussé/déployé ; le site DEV n’a pas encore reçu cette modification.

## Ajustements locaux — vocabulaire public et signature du footer

Sur demande explicite de Marvin, le terme géographique refusé et ses variantes ont été retirés des textes publics : accueil et récap, description SEO, page artistes, formulaires de proposition, espace membre, panneau de connexion et libellés accessibles, puis footer. La préférence est inscrite dans le cadrage produit ; elle ne change ni le périmètre culturel ni les affiliations vérifiées. Les documents historiques ne sont pas des pages du site et ne sont pas réécrits.

La phrase exacte « Développé entre deux écoutes par MarvinL.com » est centralisée dans un composant commun aux deux footers. Placée en premier, centrée, taille 18–22 px, disque décoratif orange, auteur en gras et souligné orange, lien natif externe avec protection noopener/noreferrer et focus visible. Elle n’apparaît plus en petit dans la barre inférieure.

Typage, build et suite locale sur base neuve dédiées réussis : 63 tests (36 unitaires, 27 fonctionnels). Deux tests supplémentaires protègent le vocabulaire et la position de la signature. Lint ciblé des composants/test actifs réussi ; le footer historique est ignoré par la configuration ESLint existante. React Doctor signale seulement la complexité préexistante des pages accueil/artistes, pas d’erreur sur la nouvelle signature. Revue visuelle du vrai build local réussie : 50 cas Chromium/WebKit, cinq pages publiques/auth, largeurs 320/390/768/1440/1920 px avec gouttière classique. Une seule signature, en premier dans le footer, centrage géométrique <1 px, texte 18–22 px, lien auteur focusable, aucune occurrence du terme refusé dans le DOM/SEO/ARIA, aucun débordement horizontal ni erreur JavaScript. Captures desktop et mobile relues. Aucun push, commit, déploiement ou écriture sur DEV/PROD pour ces ajustements.

## Prochaine tranche recommandée

1. Authentification PostgreSQL du worker DEV : **corrigée et vérifiée** ; conserver la distinction entre connexion validée et traitements métier non testés.
2. Marvin crée/se connecte à un compte DEV dont il contrôle réellement l'accès. Vérifier cette propriété, relever l'UUID côté serveur, puis configurer l'allowlist seulement après confirmation. Ne pas autoriser sur simple correspondance email.
3. Valider en DEV création/correction, URL et fichier de pochette, visibilité publique, maintien du slug et des pull-ups, affiliation réellement sourcée et refus membre ordinaire.
4. Traiter MAR-371 : choisir le chemin réel de déploiement, migrations contrôlées avec sauvegarde/retour arrière, idempotence et absence de concurrence web-worker. Le passage des migrations sur une base jetable ne répare pas le mécanisme Coolify.
5. DEMO puis QA humaine seulement sur autorisation distincte ; conserver les tickets En cours tant que les critères ne sont pas satisfaits. Ne pas activer Umami DEV ni toucher production pour terminer ces contrôles.
