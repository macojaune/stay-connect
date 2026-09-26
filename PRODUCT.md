# StayConnect

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Auditeurs qui veulent découvrir les nouveautés d'artistes des Antilles-Guyane et de leurs diasporas, notamment depuis le récap hebdomadaire sur mobile. Les artistes et leurs équipes constituent un public secondaire pour le référencement et la promotion des sorties.

## Product Purpose

Découvrir les sorties chaque semaine, puis les soutenir. Le parcours principal est découvrir une sortie, ouvrir une plateforme d'écoute et, si souhaité, lui donner un pull-up.

## Positioning

Un rendez-vous de découverte musicale centré sur les artistes des Antilles-Guyane et de leurs diasporas. Le catalogue est automatisé et classé par date ou par pull-ups. Il ne dépend pas d'une sélection humaine hebdomadaire.

## Operating Context

Marvin consacre quelques heures par semaine au produit. Une petite tranche doit pouvoir être présentée et validée sans ouvrir plusieurs chantiers. La branche develop accueille le développement ; main correspond à la production. Un changement de branche ne vaut pas autorisation de déploiement.

## Capabilities and Constraints

- Catalogue et sorties synchronisés depuis Spotify ; liens vers les plateformes d'écoute.
- Récap hebdomadaire produit en HTML dans l'application et envoyé via le compte Brevo MarvinL.com.
- Comptes natifs, profils artistes et suggestions présents sur develop ; leur présence ne prouve pas leur validation utilisateur.
- Un pull-up binaire par membre et par sortie, commentaire facultatif ; aucune note ou moyenne.
- La découverte et l'écoute externe restent accessibles sans compte.
- Le nom visible est « Pull-up » ; les identifiants et routes techniques de boost restent inchangés.
- Le modèle actuel ne stocke aucun territoire structuré. Les badges du prototype sont des exemples fictifs en mode démo, invités compris ; ils ne décrivent pas l’origine réelle des artistes.
- Accès artiste vérifié, clips et événements restent des sujets ultérieurs.

## Brand Commitments

Nom #StayConnect. Orange #FD4F00. Le mail hebdomadaire validé est la référence visuelle : titre « Les sorties de la semaine », caractère affirmé, texture de points, noms d'artistes très lisibles. Ton français direct, musical et accueillant.

## Evidence on Hand

Code AdonisJS/Inertia/React existant, tickets du projet StayConnect dans Linear MarvinL.com, mail livré dans main, pochettes de sorties publiques utilisées dans l'aperçu précédent. Tout prototype utilisant des dates, territoires ou pull-ups simulés doit être identifié comme démonstration.

## Product Principles

- Donner accès aux sorties et à l'écoute dès l'arrivée.
- Distinguer fraîcheur chronologique et soutien communautaire.
- Montrer les artistes et leurs pochettes avec une hiérarchie constante.
- Faire fonctionner la découverte avec peu d'intervention éditoriale.

## Confirmations

Positionnement, périmètre géographique, catalogue automatisé, prototype navigable et nom « Pull-up » confirmés par Marvin le 26 septembre 2026.

## Open decisions

Critères précis d'éligibilité d'un artiste, traitement des suggestions et accès aux profils revendiqués à préciser lors des tâches correspondantes.

## Sources historiques consultées

Le dossier Drive fourni par Marvin (1NTwmIW9J0hZoT3OnJKEie_qzyf_jVg42), lu le 26 septembre 2026, contient une note projet et des brouillons de newsletter. Ils confirment le rendez-vous hebdomadaire, la visibilité des artistes grâce aux auditeurs et une inspiration Product Hunt pour la participation. Les playlists, événements, premium et placements sponsorisés y figurent comme idées ; ils ne décrivent pas les capacités validées du lancement. Le cadrage confirmé par Marvin en session prime sur ces anciennes pistes.

## Hypothèse Money pull-up

Marvin propose un soutien payant inspiré du money pull-up en soirée, avec l’analogie d’un superlike YouTube. Cette piste reste une hypothèse de modèle économique : aucun paiement ni classement payant n’est implémenté. Les montants, bénéficiaires, partage des revenus et effets sur la visibilité restent à définir. La note dédiée figure dans [StayConnect — Notes produit : Pull-up & Money pull-up](https://docs.google.com/document/d/1PKudQmXQ_0SbSRJ16ondYWaEQF9Unos8Ll0S-NVVcqo/edit).
