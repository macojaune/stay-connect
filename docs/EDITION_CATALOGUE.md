# Édition du catalogue StayConnect

L'éditeur du MVP est réservé aux membres de l'équipe StayConnect. Une sortie enregistrée devient immédiatement publique. La création est accessible depuis « Ajouter une sortie » dans l'espace membre autorisé ; la correction utilise l'URL d'édition de la sortie.

## Activation d'un compte équipe

Dans l'environnement de l'application, définir `STAYCONNECT_EDITOR_USER_IDS` avec les UUID des comptes équipe, séparés par des virgules. La variable est facultative et vide par défaut : **aucun compte ne peut alors ouvrir ou soumettre l'éditeur**. Après qu'un membre de l'équipe a créé son compte, relever son UUID dans la table `users`, vérifier avec lui qu'il contrôle réellement ce compte, puis ajouter l'UUID dans la configuration de l'environnement visé. Redémarrer l'application pour charger cette configuration.

L'adresse email seule ne peut pas servir d'autorisation : l'inscription native ne vérifie pas encore que la personne possède cette adresse. Les UUID sont établis par le serveur et ne peuvent pas être choisis dans le formulaire d'inscription. Ne placer aucun UUID ni adresse personnelle dans le dépôt.

## Parcours

- `GET /equipe/sorties/nouvelle` : choisir un artiste existant ou créer son profil par nom, saisir le titre, la date précise, le type et au moins un lien d'écoute HTTPS. La cover et les catégories sont facultatives ; une catégorie peut être créée depuis le formulaire.
- `GET /equipe/sorties/:id/modifier` : corriger ces données sur une sortie existante. L'édition conserve son identifiant, son slug public, ses pull-ups et sa provenance automatique éventuelle. Le titre affiché peut donc différer du slug historique, afin que les liens déjà partagés restent valides.
- Une fiche ancienne qui n'a aucun lien peut être corrigée sans en ajouter. Une fiche déjà liée conserve au moins un lien ; tout nouveau lien doit être HTTPS. Une cover locale historique est conservée si la cover n'est pas modifiée.
- `POST /equipe/sorties` et `PATCH /equipe/sorties/:id` : les deux actions exigent une session web dont l'UUID figure dans l'allowlist. Un membre ordinaire reçoit 403. La sortie est publique à l'enregistrement ; aucun brouillon ni appel à Songlink n'est déclenché.

### Pochette

Le même formulaire accepte `cover` (URL HTTPS) **ou** `coverFile` (fichier multipart) ; les deux champs présents ensemble sont refusés. En correction, leur absence conserve la pochette existante ; `cover: null` la retire ; `coverFile` la remplace. Le fichier est limité à 5 Mio et seuls les formats JPEG, PNG et WebP sont acceptés après vérification de la signature binaire, indépendamment du nom ou du type MIME déclaré. Les SVG et autres formats actifs sont refusés.

Le fichier est créé sous `UPLOAD_PATH/covers` avec un nom aléatoire généré par le serveur. La sortie enregistre une URL absolue fondée sur `APP_URL`, de la forme `/covers/{nom}` ; cette route publique sert seulement les noms générés, avec un type MIME fixe et `nosniff`. Cette URL peut aussi figurer dans les emails. Un upload dont la transaction de sortie échoue est supprimé ; une ancienne pochette remplacée reste servie, car des emails déjà envoyés peuvent la référencer.

Avant de livrer, vérifier que `APP_URL` pointe vers le domaine public correct, que `UPLOAD_PATH` pointe vers un stockage persistant accessible en écriture par le processus web, et que ce volume reste attaché aux nouvelles révisions. Les anciens fichiers Compose montent `/home/ubuntu/stayConnect/uploads` sur `/app/uploads`, mais cette définition ne prouve pas le volume de l'application Coolify actuellement servie. Sans volume persistant, les couvertures téléversées seraient perdues au redéploiement.

L'ajout d'un profil artiste par nom ne prouve pas son territoire, son identité ni la propriété du profil. Il reste non vérifié et n'ouvre aucun droit d'édition à cet artiste. Une catégorie nouvellement créée n'est qu'une étiquette de classement.

Une création avec le même artiste, le même titre normalisé et la même date qu'une sortie existante est refusée avec une invitation à corriger la fiche existante. Ce contrôle ne rapproche pas deux éditions ou liens Spotify différents d'une même œuvre.

Une fiche ajoutée manuellement n'a pas de `spotifyId`. Le job Spotify ne déduplique actuellement les albums que par cet identifiant et peut donc ajouter plus tard une seconde fiche pour la même sortie. Une fusion automatique fondée sur le titre et la date risquerait de confondre des œuvres ou éditions distinctes ; ce rapprochement demande un contrat métier avant automatisation.
