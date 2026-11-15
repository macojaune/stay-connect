# Contrats TypeScript et vérification locale

## Périmètre

Cette passe suit le commit visuel `da3c450` sur `feat/relaunch-discovery`.
Elle corrige les contrats du code existant. Elle ne constitue pas une validation
complète du MVP ou des intégrations externes.

## Changements

- Le serveur et React ont chacun une configuration TypeScript stricte et une
  commande de contrôle. `pnpm typecheck` exécute les deux.
- Le build Docker exige ces deux contrôles avant la compilation Adonis. L'option
  `--ignore-ts-errors` est supprimée. Le contexte conserve les tests TypeScript,
  car `bin/test.ts` importe `tests/bootstrap.ts`.
- Les données de découverte et de fiche sortie ont des contrats partagés entre
  contrôleurs et pages. Les données de session viennent du sérialiseur commun.
- Les réponses Spotify entrent comme `unknown`, puis passent par des schémas
  Vine. Albums simplifiés, albums complets et pistes ont leurs propres contrats.
  L'absence de données d'abonnés conserve les valeurs connues, sans inventer zéro.
- Les services valident leurs entrées et mappent explicitement les colonnes Lucid.
  Une mise à jour partielle conserve les champs absents de la requête.
- Les dates sont converties et validées avant leur utilisation. Les erreurs et
  en-têtes HTTP sont contrôlés avant lecture.
- Les journaux utilisent les valeurs réelles de la requête et masquent les
  secrets. Le garde API ne journalise plus les clés ni les en-têtes bruts.

Aucun `any`, `@ts-ignore`, `@ts-nocheck` ou `as never` dans les sources applicatives
contrôlées. Une double assertion reste isolée à l'appel Brevo dans
`home_controller.ts`. Le SDK installé déclare les attributs comme des objets,
alors que l'API attend notamment des chaînes. Le code valide d'abord une table
de chaînes, puis adapte uniquement cette propriété à la signature du SDK.
Voir [le contrat de création d'un contact Brevo](https://developers.brevo.com/reference/create-contact).

## Défauts constatés pendant le parcours navigateur

- La case « Rester connecté » provoquait une erreur 500 avec des identifiants
  valides, car les jetons persistants sont désactivés dans la configuration.
  Le formulaire et son validateur utilisent maintenant la connexion par session.
- Les identifiants invalides étaient refusés sans message visible. Le contrôleur
  utilise `session.flashErrors`, compris par le middleware Inertia installé.

## Contrôles exécutés

| Contrôle                                    | Résultat                                                |
| ------------------------------------------- | ------------------------------------------------------- |
| `pnpm typecheck`                            | Serveur et client sans erreur, mode strict              |
| `pnpm build`                                | Compilation Adonis et bundles client/SSR réussis        |
| `QUEUE_ENABLED=false pnpm test unit`        | 28 tests réussis                                        |
| ESLint sur les fichiers TypeScript modifiés | Sans erreur ; la configuration existante ignore les TSX |
| React Doctor sur les changements            | Aucune erreur, six avertissements, score 75/100         |
| `git diff --check`                          | Sans erreur                                             |

Les tests couvrent les contrats Spotify et Vine, les mises à jour partielles,
les périodes du récap, les réponses HTTP et l'expurgation des journaux.
Les avertissements React Doctor concernent quatre séquences de sauvegarde puis
chargement de relations, une suppression séquentielle, et la complexité de la
fiche sortie. Les chargements dépendent des écritures précédentes.

Le gate Docker a aussi été exécuté avec
`docker build --target builder --tag stayconnect-relaunch-builder:typescript-local .`.
L'image locale ARM64 a passé les deux contrôles TypeScript et la compilation.
Les 160 sources, configurations et tests contrôlés dans l'image correspondent
au worktree. Les fichiers `.env` sont absents de cette image. Aucune image n'a été poussée.

L'application compilée a démarré depuis `build/` en mode production sur
`http://localhost:3347`, avec PostgreSQL et Redis locaux et la queue désactivée.
Le navigateur intégré a vérifié l'accueil rendu côté serveur, la connexion,
l'ouverture d'une fiche, l'ajout puis le retrait d'un pull-up, la déconnexion,
le message d'identifiants invalides et une réponse 404 rendue correctement.
Le soutien de test a été retiré et le compteur est revenu à sa valeur initiale.

Les régions, dates et soutiens du catalogue de démonstration restent signalés
comme simulés. Aucune vérification de synchronisation Spotify réelle ni d'envoi
Brevo n'a été effectuée. Aucun déploiement n'a été réalisé.

## Suite du MVP

La prochaine tranche doit reprendre l'inscription, la connexion et la récupération
de compte dans la direction graphique validée, puis vérifier leur parcours complet.
Il reste à appliquer cette direction aux pages artistes et aux autres états du
produit, et à remplacer les données de démonstration par des données fiables.

Points observés à reprendre avec ces tranches : le titre HTML de la page 404 affiche
`undefined`, et l'analytics local demande `/undefined` lorsque sa configuration
est absente. Les services historiques utilisateur/sortie non raccordés aux routes
ne doivent pas être exposés tels quels sans revue de leurs autorisations et de leurs
champs réellement persistés.
