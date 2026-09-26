# Comptes membres — validation locale du 26 septembre 2026

## État de livraison

Travail local non commité sur `feat/relaunch-discovery`, après `25b2af8`, dans le worktree `stayConnect-relaunch`. Aucun push, PR ou déploiement. Le checkout `stayConnect` n'a pas été modifié.

Prototype : <http://localhost:3346/register>. Les quatre pages de compte reprennent la direction validée pour la découverte : papier, orange, trame, affiche et disque « pull-up ». Le catalogue local comporte toujours des données de démonstration, signalées dans son bandeau.

## Périmètre livré localement

- Inscription, connexion, déconnexion ; validation française et erreurs associées aux champs.
- Retour à la sortie et à son ancre `#soutenir`, conservé entre les pages de compte.
- Mot de passe oublié, email de récupération, changement du mot de passe et reconnexion.
- Jeton aléatoire de 256 bits, seul son SHA-256 est stocké ; expiration à 30 minutes, usage unique et consommation atomique.
- Révocation des anciennes sessions après réinitialisation ; limitation partagée des tentatives dans Redis.
- Conservation des erreurs et confirmations lors d'un rechargement Inertia dû à un changement des assets ; conservation du jeton et de la destination dans ce cas.
- Exclusion des pages de compte de la configuration Umami ; masquage du jeton dans les logs et interdiction du cache sur ces pages. La configuration Umami distante n'a pas été exercée.

Ni Clerk, ni inscription automatique à la newsletter, ni vérification d'email, ni paiement « money pull-up » n'ont été ajoutés. Les pages artistes restent la prochaine tranche.

## Rapprochement avec Linear

Le projet StayConnect a été relu via la CLI dans le workspace `marvinl` (**MarvinL.com**).

| Issue | Périmètre | Statut observé |
| --- | --- | --- |
| [MAR-338](https://linear.app/marvinl/issue/MAR-338) | Comptes membres : inscription, connexion, session | À tester |
| [MAR-166](https://linear.app/marvinl/issue/MAR-166) | Authentification pour soutenir une sortie | À tester |
| [MAR-339](https://linear.app/marvinl/issue/MAR-339) | Soutien binaire et commentaire | À tester |

Ces statuts préexistaient au travail et ne prouvent pas un déploiement démo. Aucun statut ni commentaire distant n'a été modifié. Aucun ticket dédié à la récupération du mot de passe n'a été trouvé dans ce projet ; elle appartient à la tranche comptes acceptée en session.

## Vérifications exécutées

### Parcours réel, navigateur T3, serveur local `3346`

1. Depuis une fiche anonyme, ouvrir l'inscription en conservant la destination.
2. Refuser une confirmation de mot de passe différente, puis créer un compte et ouvrir sa session.
3. Ajouter un pull-up et un commentaire, modifier le commentaire, retirer le soutien : compteur `48 → 49 → 48`.
4. Se déconnecter, puis se connecter avec l'email en majuscules ; retour effectif à `#soutenir`.
5. Demander un lien ; recevoir l'email dans Mailpit et ouvrir le formulaire de réinitialisation.
6. Refuser une confirmation différente sans perdre le jeton ; enregistrer le nouveau mot de passe.
7. Afficher la confirmation, refuser l'ancien mot de passe, accepter le nouveau et revenir au soutien.
8. Refuser la réutilisation du lien consommé.
9. Refuser une nouvelle inscription avec la même adresse en majuscules ; erreur email visible, `aria-invalid` et focus sur le champ.
10. Demander une récupération pour une adresse inconnue : même confirmation, aucun email supplémentaire. Après correction Inertia, « Regarde tes emails » reste visible.

Le compte temporaire créé pour ces parcours a été supprimé après validation. Ses soutiens avaient été retirés par l'interface ; le compteur de la sortie est revenu à `48`.

### Contrôles techniques

| Contrôle | Résultat |
| --- | --- |
| TypeScript serveur et client, `pnpm run typecheck` | Réussi après les derniers changements |
| Build, `pnpm run build` | Réussi après les derniers changements |
| Tests unitaires | 30 réussis |
| Tests fonctionnels PostgreSQL, Redis et HTTP | 11 réussis, dont concurrence, rollback, révocation, requêtes avec CSRF et rechargement Inertia |
| ESLint backend ciblé | Réussi |
| ESLint des pages TSX | Non couvert : la configuration du dépôt ignore ces fichiers ; tentative explicitement rejetée |
| React Doctor, changements depuis `25b2af8` | 89/100 ; aucun signal sur les nouveaux formulaires ; un avertissement de complexité préexistant sur `releases/show.tsx`, dont seules les deux URL de connexion/inscription ont changé |
| `git diff --check` | Réussi |
| Nouveau code auth | Aucun `any`, `@ts-ignore` ou `@ts-expect-error` ajouté |

Les 30 tests unitaires et 9 premiers tests fonctionnels ont passé ensemble ; les 11 tests fonctionnels ont ensuite passé après les deux correctifs Inertia. Les suites utilisent des utilisateurs temporaires nettoyés et refusent une base/Redis non locaux.

Le build compilé a été lancé séparément sur `3347` avec `NODE_ENV=production`, contre les mêmes services locaux. Les quatre routes de compte répondent en HTTP 200 avec `no-store` et `noindex`. Une connexion réelle dans le navigateur a ouvert la fiche et positionné la zone de soutien en haut de l'écran. Ce contrôle local ne constitue pas un déploiement.

### Revue visuelle et revue backend

La revue indépendante du rendu a clôturé deux constats : texture agrandie corrigée en répétition native et capture mobile stabilisée. Verdict visuel : `ship` pour les captures examinées. Voir [.impeccable/surfaces/account.md](../.impeccable/surfaces/account.md) pour ses limites et la dégradation de l'outillage Impeccable.

La revue backend a fait corriger une collision possible de usernames et les redirections d'erreurs sans `Referer`. Aucun P1/P2 restant dans le périmètre revu. Une dernière relecture indépendante du correctif Inertia et de ses deux tests a également conclu sans P1/P2 ; cette relecture n'a pas réexécuté les tests.

Captures :

- [Inscription desktop](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwse14-f943b06f.png)
- [Inscription mobile](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwia51-c10bc054.png)
- [Confirmation de récupération mobile](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwq7hv-e23790cc.png)

## Données et services locaux

- PostgreSQL `127.0.0.1:55446`, base `stayconnect_relaunch_demo`.
- Redis `127.0.0.1:55447`, worker BullMQ `default`.
- Mailpit : SMTP `127.0.0.1:1026`, interface <http://127.0.0.1:8026>. Un email de récupération destiné au compte de test y a été reçu. Aucun envoi Brevo.
- `QUEUE_ENABLED=false` : les tâches périodiques ne sont pas programmées. Le worker exécute les demandes de récupération explicites. Contrôle final : zéro tâche périodique, en attente, active, différée ou échouée.
- Sauvegarde avant migration : `/tmp/stayconnect-relaunch-demo-before-auth-20260926T211005Z.dump`, permissions `600`.
- Migration `1790424000000_create_password_reset_tokens_table` appliquée uniquement à cette base locale après simulation ; seconde exécution : `Already up to date`.

## Points à prendre en compte avant une livraison distante

La migration ajoute `users.auth_version` et `password_reset_tokens`. Son déploiement force une reconnexion des sessions antérieures. Les éventuels comptes historiques avec des emails identiques à la casse près sont refusés en connexion et récupération pour éviter une attribution ambiguë ; aucune adresse existante n'a été réécrite.

La récupération dépend de Redis, du worker `default`, de `APP_URL` et de la configuration mail de l'environnement cible. SMTP est une option locale ; le transport par défaut reste Brevo. Ces éléments et la réception d'un email réel devront être vérifiés sur la cible autorisée avant d'annoncer une livraison.

Preuves techniques temporaires : `/tmp/stayconnect-auth-types.txt`, `/tmp/stayconnect-auth-build.txt`, `/tmp/stayconnect-auth-tests-final.txt`, `/tmp/stayconnect-auth-functional.txt`, `/tmp/stayconnect-auth-lint-final.txt`, `/tmp/stayconnect-auth-ui-lint.txt`, `/tmp/stayconnect-auth-react-doctor.txt`, `/tmp/stayconnect-auth-built-runtime.txt`.
