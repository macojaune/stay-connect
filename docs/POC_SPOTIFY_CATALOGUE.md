# POC Spotify : candidats et sorties

## Candidats artistes (MAR-149)

`node ace spotify:artist-candidates "bouyon,rap antillais,dancehall guyanaise"`

Utiliser Node 22, comme les Dockerfiles du dépôt. Le chargeur Ace de ce checkout échoue avant l'exécution des commandes sous Node 26. La commande et son aide ont été chargées sous Node 22 le 27 septembre 2026. La requête Spotify réelle a renvoyé HTTP 400 lors de l'obtention du jeton avec les identifiants locaux disponibles ; aucun résultat de candidats n'a donc été vérifié en direct.

La commande interroge [Spotify Search](https://developer.spotify.com/documentation/web-api/reference/search) pour chaque genre fourni, déduplique les résultats par identifiant Spotify et signale ceux déjà référencés dans StayConnect. Sa sortie JSON porte le statut **« à vérifier »**. Elle ne crée ni artiste, ni catégorie, ni sortie. Un résultat de recherche ou un genre Spotify ne prouve ni l'origine géographique, ni l'appartenance à la diaspora ; ces points demandent une vérification éditoriale avant référencement. La commande est limitée à douze recherches et dix résultats par recherche pour contenir les appels à l'API. Elle requiert les identifiants Spotify habituels de l'application.

## Sorties automatiques (MAR-151)

Le job existant `spotify:check-releases` parcourt les artistes qui possèdent un identifiant Spotify. Il examine désormais toutes les pages de dix albums et singles de Spotify, conformément à la [limite de dix éléments de l'API](https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums), retient les dates connues au jour près dans la fenêtre de recherche, puis crée seulement les identifiants Spotify absents de la base. Les dates Spotify connues uniquement au mois ou à l'année sont ignorées : les placer un jour arbitraire fausserait le fil chronologique. La contrainte unique existante sur `releases.spotify_id` protège aussi contre une création concurrente. Un échec d'une page est signalé ; le prochain passage peut reprendre, car les sorties déjà enregistrées sont ignorées.

La fenêtre de recherche reste celle du job existant : quatre jours par défaut, avec un passage programmé toutes les six heures lorsque la file est activée. Ce POC ne garantit pas de rattraper une indisponibilité de Spotify ou du worker supérieure à cette fenêtre. Il ne découvre que les sorties des artistes déjà référencés et reliés à un identifiant Spotify. Il ne valide ni les territoires des artistes, ni les variantes d'une même sortie portant des identifiants Spotify distincts.

## Hors de ce POC

MAR-150 demande d'étudier la disponibilité d'une source pour les précommandes DistroKid ; aucune intégration ni publication de précommande n'est déduite de ce ticket. MAR-341 demande un audit préalable de Pepsee Actus ; aucune donnée de ce site n'est importée.
