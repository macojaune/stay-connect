# Territoires sur les sorties — tranche MVP

## État avant cette tranche

- Le catalogue réel importe les artistes et les crédits depuis Spotify. `Artist` ne possède aucun territoire ; `Release` pointe vers un artiste principal et ses `Feature` peuvent pointer vers un artiste existant ou ne conserver qu'un nom et un identifiant Spotify.
- La home reçoit `TimelineRelease` depuis `app/controllers/home_controller.ts`. Ce contrat ne contient pas de territoire. Les badges actuels de `inertia/pages/home.tsx` viennent de `inertia/demo/territories.ts` et n'apparaissent qu'en mode démo ; leurs attributions sont fictives.
- `Artist.isVerified` ne prouve aucune affiliation territoriale. Ni un nom, ni un genre, ni une catégorie, ni une image, ni une fiche Spotify ne constituent une provenance suffisante.

## Contrat retenu

Un badge indique **une affiliation artistique avec un territoire, vérifiée par l'équipe**. Il ne prétend pas indiquer le lieu de naissance, l'adresse actuelle ou la nationalité. Le jeu initial de codes est `GP`, `MQ`, `GF`, avec leurs libellés Guadeloupe, Martinique et Guyane. Un artiste peut avoir plusieurs affiliations. L'absence d'affiliation connue reste une valeur inconnue : aucun badge ni badge « autre ».

Créer une relation `artist_territories` plutôt qu'un champ unique sur la sortie : `artist_id`, `territory_code`, `source_kind`, `source_reference` facultative, `verified_by_user_id`, `verified_at`, horodatages, et unicité `(artist_id, territory_code)`. Restreindre `territory_code` au référentiel contrôlé. `source_kind` distingue au minimum déclaration de l'artiste et source publique explicite ; une référence publique doit être conservée quand elle existe. La validation et la saisie restent réservées à l'équipe. Ne pas stocker de pièce d'identité ni d'information de contact privée comme preuve.

Pour chaque sortie de la home, composer les codes vérifiés de l'artiste principal puis des artistes invités **liés par `artist_id`**, dédupliquer et garder un ordre stable. Un crédit invité non lié demeure inconnu, même si son nom ressemble à celui d'un artiste du catalogue ; un lien ultérieur par identifiant Spotify pourra alors apporter ses affiliations déjà vérifiées. Plusieurs territoires peuvent apparaître sur une même sortie. Si aucun artiste crédité n'a d'affiliation vérifiée, ne rien afficher. Le badge décrit les artistes crédités, sans attribuer automatiquement le territoire à la sortie elle-même.

## Tranche d'implémentation

1. Ajouter la table et la relation `Artist`, puis une voie de saisie ou correction réservée à l'équipe avec provenance et revue explicites. Refuser les codes non reconnus et les doublons.
2. Précharger les affiliations avec l'artiste principal et les artistes invités dans `home_controller.ts`, exposer `territories: TerritoryCode[]` dans `app/contracts/discovery.ts`, puis afficher les badges réels dans `inertia/pages/home.tsx`. Garder les données de démo signalées comme fictives tant que le mode démo existe.
3. Réutiliser le même calcul sur la page sortie après la home, afin de ne pas produire deux interprétations des crédits.

La migration doit être **schéma seul** : aucune valeur par défaut et aucun remplissage depuis Spotify ou `inertia/demo/territories.ts`. Toute reprise éditoriale ultérieure part d'une liste sourcée, passe par une prévisualisation, dispose d'un point de retour, et écrit de façon idempotente grâce à la clé unique. Contrôler ensuite les comptes par territoire, les sorties à crédits multiples et un échantillon de fiches réelles ; conserver les affiliations non établies à l'état inconnu.

## Décision métier confirmée

Marvin a confirmé le 27 septembre 2026 que le badge signifie « affiliation musicale ou culturelle vérifiée par l'équipe, diaspora incluse » pour le périmètre initial `GP/MQ/GF`. Il ne représente ni le lieu de naissance ni le lieu de résidence. Cette définition fixe les critères que l'équipe appliquera à chaque source avant toute saisie.

## Réalisation locale

Le code du MVP stocke les affiliations dans `artist_territories` avec code, nature et note de source, URL publique éventuelle, compte vérificateur et date. La migration est limitée au schéma : elle ne crée aucune affiliation. Une sauvegarde du schéma local `stayconnect_relaunch_demo` a été prise avant sa migration dans `/tmp/stayconnect-relaunch-demo-before-territories-20260927.sql`.

Un compte équipe autorisé par `STAYCONNECT_EDITOR_USER_IDS` peut ouvrir `/equipe/artistes/:id/territoires` depuis la fiche artiste. Chaque affiliation retenue exige une source et une confirmation explicite ; enlever une sélection retire immédiatement le badge des sorties concernées. Les badges sur l'accueil et les fiches sortie sont calculés à partir des artistes crédités dont le profil est lié. Aucun badge n'apparaît pour une affiliation inconnue ou un invité sans profil lié. Les badges du mode démo restent signalés comme fictifs.

Le test local couvre le refus des visiteurs et membres ordinaires, le rejet d'un doublon, le rendu de deux affiliations liées et leur retrait. Cette vérification ne valide aucune affiliation d'artiste réel. L'éditeur reste fermé tant qu'aucun UUID équipe n'est configuré dans l'environnement visé.
