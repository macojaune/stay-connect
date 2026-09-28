# MAR-341 — PepseeActus comme source de candidats artistes

Audit en lecture seule du 27 septembre 2026. Ticket [MAR-341](https://linear.app/marvinl/issue/MAR-341/auditer-pepsee-actus-comme-source-de-candidats-artistes) : Backlog, sans commentaire ni dépendance formelle. Aucun nom, profil ou média n'a été importé.

## Constat

- **Disponibilité.** L'[annuaire d'artistes](https://pepseeactus.com/artist/) répond en HTTP 200 et affichait **1 654 artistes** lors de la lecture. Le [robots.txt](https://pepseeactus.com/robots.txt) répond en HTTP 200, avec `User-agent: *` et un `Disallow` vide. Le site est donc consultable ; cette configuration ne donne pas de droit de réutilisation.
- **Provenance et couverture.** PepseeActus se présente comme un média consacré au reggae, au dancehall et aux scènes caribéennes, actif depuis 2010 ([À propos](https://pepseeactus.com/a-propos/)). L'annuaire est une sélection éditoriale large, avec fiches et discographies. Ce volume n'établit ni l'exhaustivité ni l'appartenance de chaque personne au périmètre Antilles-Guyane et diasporas de StayConnect. Une [fiche consultée](https://pepseeactus.com/artist/stacy/) mentionne deux origines ; les régions ne doivent pas être déduites d'un nom, d'un genre ou d'un seul badge.
- **Réutilisation.** Les [mentions légales](https://pepseeactus.com/mentions-legales/) interdisent la réutilisation ou l'exploitation des éléments du site pour son propre compte et demandent une autorisation écrite préalable pour reproduire ou adapter son contenu. Ne copier ni biographies, ni photos, ni discographies, ni liste entière. Le `robots.txt` ouvert ne lève pas cette restriction.

## Si une autorisation de réutiliser les noms candidats est obtenue

1. Définir avec PepseeActus par écrit le périmètre, le mode d'accès, la fréquence et l'attribution. Conserver cette autorisation et recontrôler les conditions avant toute collecte.
2. Enregistrer dans une **file privée de candidats** uniquement le nom, l'URL de la fiche source, la date de consultation et l'état `à vérifier`. Ne pas détourner `artist_suggestions` : ses lignes représentent des propositions de personnes avec une adresse email de contact.
3. Chercher ensuite une correspondance Spotify de manière indépendante. Dédupliquer sur un identifiant Spotify confirmé, puis examiner manuellement homonymies et éligibilité géographique. Aucun résultat de recherche, genre ou mention d'origine ne suffit seul à valider l'artiste.
4. Publier un artiste seulement après cette vérification. Utiliser les données et visuels obtenus de sources autorisées pour StayConnect, jamais ceux de PepseeActus par défaut.

**Verdict : source pertinente pour une veille ponctuelle, pas pour une ingestion automatique aujourd'hui.** La voie immédiatement disponible pour un POC de candidats reste la [recherche Spotify en lecture seule](POC_SPOTIFY_CATALOGUE.md), avec vérification humaine avant référencement. La collecte PepseeActus attend un accord écrit et un contrat de revue compatible avec les quelques heures hebdomadaires consacrées au produit.
