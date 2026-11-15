# Migrations au démarrage de DEV — MAR-371

Le `CMD` de l’image appelle `scripts/start-container.sh`. Lorsque
`RUN_MIGRATIONS_ONCE=true`, le web **et** le worker attendent la fin de
`node ace.js migration:run --force` avant leur démarrage. Le nom historique du
drapeau est conservé : la commande est exécutée à chaque démarrage ; le journal
Lucid évite de réappliquer les fichiers déjà enregistrés. Aucun seed n’est lancé.
Avec le drapeau absent ou `false`, le comportement sans migration est conservé.

La commande affichée dans Coolify ne remplaçait pas le `CMD` observé dans les
conteneurs DEV au diagnostic du 29 octobre 2026. Changer cette commande seule ne
valide donc pas le mécanisme. Vérifier le processus et l’image réellement servis.

## Verrou, erreurs et arrêt

- Les verrous Lucid restent actifs. Deux démarrages concurrents ne migrent pas
  simultanément : celui qui ne prend pas le verrou échoue sans lancer son rôle.
  Après la fin du premier, une nouvelle tentative relit le journal et démarre.
  Le script ne contient pas de boucle de reprise ; vérifier la politique de
  redémarrage du conteneur ou relancer explicitement après diagnostic.
- Lucid 21.7 utilise un verrou PostgreSQL lié à la session. Pour le seul
  processus de migration, `DB_MIGRATION_SINGLE_CONNECTION=true` fixe le pool à
  une connexion et refuse toute connexion de remplacement après la première.
  La remplaçante rejetée est explicitement fermée. Une perte de session impose
  l’échec et une nouvelle commande ; elle ne permet pas de continuer sans verrou.
- `QUEUE_ENABLED=false` s’applique uniquement à la commande de migration. Le web
  et le worker retrouvent leur environnement initial. Ne pas ajouter le drapeau
  `DB_MIGRATION_SINGLE_CONNECTION` aux variables régulières de l’application.
- Tout échec de migration bloque le rôle. SIGTERM/SIGINT reçus par le shell sont
  transmis à l’enfant ; le shell attend sa fin puis sort en erreur, même si
  l’enfant annonce un succès. En mode migration uniquement, le bootstrap Ace
  termine effectivement le processus sur SIGTERM : la fermeture ordinaire du
  pool attendrait les transactions et pourrait laisser la migration continuer.
- L’arrêt ne prouve pas un rollback global : les migrations précédentes peuvent
  déjà être validées, une migration sans transaction peut être partielle et un
  COMMIT déjà envoyé peut avoir une issue inconnue. Relire le schéma et le journal
  avant toute reprise. Aucun rollback SQL automatique n’est ajouté.

La garantie concerne les migrations utilisant la connexion PostgreSQL Lucid de
ce dépôt. Un client SQL indépendant, une autre connexion ou un déverrouillage
manuel dans une future migration exige une nouvelle analyse.

## Contrôles locaux reproductibles

Utiliser Node 22, comme le Dockerfile, puis :

```sh
pnpm run typecheck
pnpm run build
node --test tests/startup/entrypoint.test.mjs
PG_BIN=/chemin/vers/postgresql/bin node --test tests/startup/postgres.test.mjs
```

Le second test crée un cluster PostgreSQL **jetable**, sur loopback et port libre,
avec des bases synthétiques. Il n’utilise aucun `.env` ni credential fournisseur.
Il exige `initdb` et `pg_ctl` accessibles dans `PG_BIN` et détruit ses processus et
données à la fin. La version exécutée pendant ce lot est PostgreSQL 14.23 ; DEV
utilise PostgreSQL 16. La validation sur la cible reste distincte.

Les tests lancent le vrai Ace compilé : concurrence, perte de connexion,
rollback d’une migration défaillante, 23 migrations du dépôt, second passage
inchangé et arrêt pendant une transaction. Les lancements de rôle sont observés
par une façade de processus, sauf un démarrage du vrai serveur web suivi d’un
GET `/artistes`. Le worker réel et le shell Alpine PID 1 restent à vérifier dans
la livraison serveur ; aucune image Docker locale n’est nécessaire.

## Livraison DEV après revue

1. Relire MAR-371, les checks, la base et le HEAD de la PR. Relever les deux apps
   DEV de `vps2`, leurs images, variables, politique de redémarrage, déploiements
   actifs et consommateurs de `stayconnect_develop`. Ne pas intervenir sur PROD.
2. Prendre un point de retour cohérent de la seule base DEV ; relever les données,
   le schéma, les migrations et les réglages nécessaires au retour applicatif.
   Vérifier les éventuelles migrations en attente avant de poursuivre. Ce lot
   n’ajoute aucun fichier de migration.
3. Coordonner les deux apps : empêcher les déclenchements concurrents, fusionner
   normalement le HEAD revu et cibler le merge exact. Activer
   `RUN_MIGRATIONS_ONCE=true` pour les deux nouveaux conteneurs seulement ; ne pas
   redémarrer l’ancienne image avec ce drapeau. Conserver les réglages de queue,
   les credentials et le volume d’uploads.
4. Livrer le web puis le worker avec l’image corrigée, un déploiement chacun.
   Contrôler le résultat terminal des builds, le SHA servi, les logs Ace avant
   ceux du rôle, le journal inchangé si tout était appliqué et l’absence de seed.
   Vérifier les pages et assets, le processus worker, PostgreSQL et Redis, sans
   lancer de synchronisation ni envoyer d’email.
5. Comparer les données et les réglages, restaurer les auto-déploiements et la
   référence habituelle de chacune des deux apps, puis relire l’état final.

En cas d’échec, aucun rôle ne doit être lancé par le script. Examiner le journal
et le schéma avant reprise. Un retour à l’ancienne image doit aussi restaurer les
anciens drapeaux (web `false`, worker absent au relevé initial), afin de ne pas
réactiver son ancien chemin sans verrou. Ne pas restaurer la base aveuglément.

La recette connectée de l’éditeur et ses refus membre/anonyme reste un autre
reliquat de MAR-371. Ce correctif de démarrage ne clôture pas le ticket et ne
modifie pas le chemin Swarm de `main` ou des tags.
