# MAR-155 — cadrage de l'accès artiste

Lecture du 27 septembre 2026. [MAR-155](https://linear.app/marvinl/issue/MAR-155/poc-acces-artiste) est en Backlog, sans commentaire. Le ticket demande d'étudier la création et la vérification d'un accès artiste ; Spotify, Apple Music et Instagram y figurent comme questions, pas comme choix.

## Décision pour le MVP

Marvin a décidé que **seuls les membres de l'équipe StayConnect créent ou corrigent une sortie**, avec **publication immédiate**. Cela donne un responsable clair au formulaire de gestion de MAR-145. Un compte membre ordinaire reste limité à la découverte, aux pull-ups et aux suggestions. La publication ne dépend pas d'une revendication du profil artiste.

Cette décision exige une autorisation d'équipe vérifiée côté serveur avant chaque écriture de catalogue. Le modèle `User` ne contient aujourd'hui aucun rôle d'équipe explicite ; son champ `isLoxymore` ne décrit pas ce droit. Les contrôleurs CRUD de sorties et d'artistes existent, mais leurs routes publiques de gestion sont commentées dans `start/routes.ts`. `Artist.userId` et `Artist.isVerified` existent déjà sans parcours de revendication ni preuve associée : ils ne doivent pas accorder un accès par leur seule présence.

**Hors MVP :** connexion via un fournisseur musical ou social, revendication automatique d'une fiche, édition de biographie par l'artiste, accès d'une équipe d'artiste, publication directe d'une sortie par un artiste. L'état vide des fiches publiques ne doit pas inviter à « gérer sa fiche » tant que ce parcours n'existe pas.

## Proposition pour une tranche future

1. Une personne connectée avec son compte membre demande l'accès à **une fiche artiste précise**. Elle indique son rôle et un canal officiel vérifiable ; la demande reste privée, en attente.
2. StayConnect vérifie le contrôle de ce canal au moyen d'un code temporaire placé sur une page ou un compte officiel, ou d'une réponse depuis un domaine officiel connu. Un lien Spotify/Apple Music ou une connexion Instagram peut aider à identifier la fiche, mais ne prouve pas à lui seul le droit de la gérer. L'équipe examine aussi les homonymies et les demandes concurrentes.
3. Un membre habilité de StayConnect approuve ou refuse la demande, avec date, méthode et révocation possibles. La preuve temporaire et les échanges privés ne sont pas publiés. Une demande refusée ne crée aucun droit.
4. Après approbation, un droit serveur lie **utilisateur, artiste et permission précise**. Commencer, si ce produit est retenu, par la proposition de corrections de profil à valider ; ouvrir la publication de sorties demanderait une décision distincte. Un artiste peut avoir plusieurs représentants et une personne peut représenter plusieurs artistes : une table d'accès est donc préférable à `Artist.userId` comme unique source d'autorisation.

Pour réaliser cette tranche, définir d'abord qui examine les preuves, quels canaux sont acceptés, la durée des preuves, la gestion des conflits et le droit exact accordé après vérification. Ne pas déduire ces règles des anciens champs ni du seul succès d'une authentification externe.

**Verdict :** MAR-155 reste un POC ultérieur. La décision MVP débloque la gestion interne des sorties ; elle ne valide ni l'identité ni les droits d'un artiste.
