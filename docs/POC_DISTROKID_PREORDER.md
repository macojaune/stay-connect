# MAR-150 — Faisabilité des sorties à venir via DistroKid

**Lecture du 27 septembre 2026.** [MAR-150](https://linear.app/marvinl/issue/MAR-150/poc-automatisation-pre-order-distrokid) est en Backlog, sans commentaire ni critère d'acceptation complémentaire. Il demande de chercher une API DistroKid ou une autre source pour les précommandes ou les sorties par artiste.

## Verdict

**Pas de source DistroKid publique documentée permettant de lister automatiquement les précommandes de tous les artistes suivis.** Les pages officielles consultées décrivent un réglage dans le formulaire de dépôt et un tableau de bord de l'artiste, mais ne fournissent pas de contrat d'API de lecture pour StayConnect. Ce constat est limité à la documentation publique consultée ; il ne prouve pas qu'aucune intégration partenaire privée n'existe.

Une **précommande** DistroKid est un achat anticipé envoyé à iTunes, Amazon, Qobuz et Beatport selon les options du compte. Elle demande une date de sortie future d'au moins cinq jours et un forfait Musician Plus ou Ultimate. Le **préenregistrement Spotify** est un autre parcours : DistroKid crée une page HyperFollow pour chaque dépôt, accessible dès l'upload et enrichie de liens d'écoute après la sortie. [Précommandes — aide DistroKid](https://support.distrokid.com/hc/en-us/articles/360013534094-Setting-Up-Pre-Orders-For-Your-Music) · [HyperFollow — aide DistroKid](https://support.distrokid.com/hc/en-us/articles/360013647913-What-Is-HyperFollow)

## Source de vérité et limites

- Pour une sortie avant publication, la date, le statut et le lien HyperFollow appartiennent au dépôt contrôlé par l'artiste ou son équipe chez DistroKid. Une page HyperFollow publique peut servir de **lien fourni par l'artiste**, mais son existence ne constitue pas une API exhaustive de découverte par artiste.
- Le pipeline actuel de StayConnect lit les albums et singles des artistes connus via Spotify et les référence par identifiant Spotify. Il ne lit aucun compte DistroKid, ne distingue pas une précommande d'un préenregistrement et ne possède aucun champ de provenance ou de statut de précommande.
- Une autre piste officielle est l'API Apple Music, qui expose le catalogue, les artistes et la date de sortie prévue d'un album. Sa capacité à retourner **toutes** les futures sorties pertinentes pour StayConnect, avec les droits et identifiants disponibles, reste à vérifier sur des exemples réels. [Apple Music API](https://developer.apple.com/musickit/) · [Album MusicKit](https://developer.apple.com/documentation/musickit/album)

## Prochaine étape

Faire un essai en lecture seule sur quelques futures sorties fournies volontairement par des artistes suivis : comparer la date et le lien HyperFollow donnés par l'artiste avec une recherche Apple Music et l'apparition ultérieure dans Spotify. Décider ensuite du contrat produit pour les « sorties à venir » : identité de la source, consentement de l'artiste, date vérifiée, état avant/après publication et déduplication par identifiants. Aucun import ni affichage automatique ne découle de ce POC.
