# Vérification du prototype local StayConnect

## Révision Pull-up — 26 septembre 2026

Preuves de la seconde proposition, après le retour de Marvin. La version ci-dessous reste locale et non commitée.

- Accueil : fil groupé par date et classement numéroté, contrôlés dans le navigateur intégré à 1280 × 1000, 699 × 1035, 390 × 844 et 320 × 844. `scrollWidth` égale la largeur du viewport pour ces quatre tailles.
- Classement : ordre observé 48, 32, 21, 13, 9 ; changement de semaine avec 5 nouveautés actuelles, 2 précédentes et 2 à venir.
- Les badges du prototype sont explicitement fictifs ; la présentation couvre plusieurs territoires avec déduplication des exemples d’invités. Aucun territoire réel n’a été déduit ni écrit en base.
- Fiche desktop et mobile : titre dominant, artiste secondaire, accès Spotify avant la pochette sur mobile.
- Parcours connecté refait après renommage : ajout du pull-up 48 → 49, commentaire mis à jour sans incrément, retrait 49 → 48. Messages « Pull-up enregistré. » et « Pull-up retiré. » observés. Le commentaire de test a été supprimé et la session déconnectée.
- Build `pnpm run build --ignore-ts-errors` réussi. Typecheck client encore rouge sur la dette du dépôt, mais aucun diagnostic final dans les fichiers modifiés de ce prototype. Les trois incompatibilités `react-share` de la fiche ont été corrigées.
- React Doctor : 86/100, deux avertissements (formateur Intl dans la boucle et complexité de la fiche). Le formateur a ensuite été sorti de la boucle ; aucun second score revendiqué.
- La réduction du mouvement et les restrictions de survol sont présentes dans les CSS. La préférence système n’a pas été émulée dans le navigateur.
- Revue visuelle indépendante Impeccable : `disposition: ship`, aucun correctif matériel demandé sur les captures. Ce verdict couvre la finition locale visible, sans valider les interactions serveur ni les parties hors capture. Carte QUALITY BAR absente, limite déclarée par le reviewer ; refinement jugée sur la direction approuvée et le brief actuel.
- Prettier et `git diff --check` finaux réussis. Aucun commit, push ni déploiement de la refonte.

Captures actuelles du navigateur intégré :

- Fil desktop : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit3hka-d1b41076.png`.
- Fil mobile : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit3hym-233bd2a2.png`.
- Largeur utilisateur 699 : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit3ht6-af3b39bb.png`.
- Petit mobile 320 : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit3i52-aeaddf89.png`.
- Classement desktop : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit5wa9-25fbf7dc.png`.
- Fiche desktop : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit1hzh-9b80b6a7.png`.
- Fiche mobile : `/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muit1i6k-fe369645.png`.

## Historique — première proposition

Compte rendu du 26 septembre 2026. Cible : `http://localhost:3346`, branche locale `feat/relaunch-discovery` dans `stayConnect-relaunch`.

La proposition attend la validation visuelle de Marvin. Aucun commit de refonte, push ou déploiement. La fusion antérieure de la PR 19, `main` vers `develop` au commit `b21bd05`, ne constitue pas une livraison de ce prototype.

## Périmètre des preuves

Les résultats ci-dessous proviennent des parcours et contrôles exécutés en session par l'agent principal, puis de la revue des corrections. Le passage documentaire a relu les CSS et TSX actuels ; il n'a pas réexécuté les parcours. La base est dédiée au prototype local. Dates, boosts et genres sont des données de démonstration ; cinq pochettes et les liens Spotify correspondent aux sorties réelles. Le bandeau annonce la démonstration.

| Contrôle local | Résultat observé |
| --- | --- |
| Accueil à 1280, 390 et 320 px | Pas de débordement horizontal. |
| Changement des trois semaines | 5, 2 et 2 sorties selon la période. |
| Tri par boosts | Ordre décroissant 48, 32, 21, 13, 9. |
| Catalogue vers fiche | Navigation fonctionnelle. |
| Connexion avec le compte de test local | Session réelle et action de boost accessibles après correction du défaut préexistant de lecture du guard dans `config/inertia.ts`. |
| Création, édition et retrait du boost | 48 vers 49 ; édition du commentaire à 49 ; retrait à 48. |
| Copier le lien | Confirmation de copie obtenue. |
| Inscription au récap en mode démo | Soumission neutralisée, message explicite, aucun email envoyé. |
| Réponses HTTP finales | Accueil et fiche répondent en 200. |

## Corrections contrôlées par la revue

La dernière passe a résolu les trois points signalés : trame à pleine opacité, focus encre sur orange et papier sur le récap sombre, liens d'écoute placés avant la pochette sur mobile. Le bouton Spotify est visible à environ 478 px du haut à 390 × 844 et 475 px à 320 × 740. Le reviewer a confirmé ces trois corrections. Ce verdict porte sur leur contrôle local ; il ne remplace pas la validation de Marvin.

Les captures finales ont remplacé les versions précédentes aux mêmes chemins :

- Accueil : `desktop.png`, `mobile.png`, `small-mobile.png`, `home-desktop-full.png`, `home-mobile-full.png`.
- Fiche : `release-mobile.png`, `release-small-mobile.png`, `release-mobile-full.png`.
- Focus clavier : `focus-orange.png`, `focus-dark.png`.

`release-desktop.png`, `release-desktop-full.png` et `boost-connected-mobile.png` documentent aussi la session, sans constituer à eux seuls une recapture finale des trois corrections.

## Contrôles techniques et limites

- Build local final avec `--ignore-ts-errors` réussi, avec la même option que celle utilisée par le Dockerfile. Aucun build de conteneur effectué pour ce prototype.
- ESLint réussi sur les deux fichiers TypeScript backend modifiés. `git diff --check` réussi.
- Le typecheck global échoue encore sur la configuration JSX et les dettes préexistantes. Aucun nouveau diagnostic client sur l'accueil ou le layout ; trois erreurs `react-share` préexistantes subsistent sur la fiche.
- React Doctor conserve trois avertissements hérités de la fiche. Le détecteur Impeccable signale Inter dans le corps, police héritée que ce prototype conserve.

Les captures et parcours couvrent le prototype local, avec son jeu de démonstration. Ils ne valident pas un runtime DEV, DEMO ou production, ni l'envoi réel du récap. Les dimensions réduites de certaines métadonnées mobiles restent des observations du code, pas une norme à généraliser. Le point `●` du logo est un détail existant ; il n'est pas canonisé comme technique de pictogramme.
