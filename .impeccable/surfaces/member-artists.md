# Artistes et espace membre StayConnect

## Périmètre et mode

**Operate** : trouver un artiste, consulter ses sorties, proposer un artiste et retrouver ses propres pull-ups. Les pages reprennent le positionnement de [PRODUCT.md](../../PRODUCT.md) et la direction de [DESIGN.md](../../DESIGN.md).

Marvin a autorisé la réalisation locale de l'ensemble des pages artistes et connectées, avec contrôles regroupés à la fin de la tranche. Cette autorisation permet de poursuivre d'une page à l'autre ; elle ne vaut pas commit, push ou déploiement.

| Surface                    | Tâche du visiteur                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `/artistes`                | Rechercher un artiste, parcourir les résultats paginés, proposer un artiste absent. |
| `/artistes/:id`            | Lire le profil public, suivre ses liens et ouvrir ses sorties publiques.            |
| `/mon-espace`              | Retrouver ses pull-ups et commentaires, puis ouvrir une sortie.                     |
| `/mon-espace/propositions` | Envoyer une proposition et consulter celles rattachées à sa session membre.         |
| `/mon-compte`              | Modifier son pseudo public ou demander un lien de changement de mot de passe.       |
| Erreurs 404 et 500         | Comprendre le problème et revenir aux sorties.                                      |

## Composition et interactions

Conserver papier crème, encre, orange, filets fins, titres Anton et contrôles Inter. Les artistes publics utilisent `EditorialLayout`, les pages privées `MemberLayout`. La navigation nomme les tâches : « Mes pull-ups », « Mes propositions », « Mon compte ». L'orange indique les actions ou la sélection ; les données restent lisibles sans dépendre de la couleur.

Les listes font voir les pochettes, noms et titres réels. Recherche et pagination restent dans l'URL. Les états vides expliquent comment découvrir ou proposer un artiste. Les formulaires gardent labels, erreurs associées, focus visible et état d'envoi. Sur mobile, les listes et formulaires passent en colonne sans masquer les actions principales. Une illustration absente utilise le composant de remplacement existant.

Les pages d'erreur ont un message français concret, une action principale « Voir les sorties », un lien secondaire vers les artistes et des métadonnées `noindex`. La référence serveur reste secondaire. Les espaces privés sont également exclus de l'indexation et du cache.

## Données et accès

Les requêtes privées sélectionnent l'utilisateur de session côté serveur. Le pseudo est le seul champ de profil modifiable. Les nouvelles propositions d'un membre portent son `user_id` ; une proposition anonyme reste sans propriétaire. Un email commun ne rattache pas des propositions historiques à un nouveau compte. Les sorties secrètes sont exclues des pages publiques et des actions de pull-up.

La revendication et l'édition des profils artistes, les événements, les clips et le paiement restent hors de cette tranche. Les critères et statuts Linear sont documentés dans [MVP_LINEAR_2026-09-26.md](../../docs/MVP_LINEAR_2026-09-26.md).

## Vérification

Regrouper la revue des pages desktop et mobile, les parcours membre et les refus d'accès. Consigner les résultats acquis et les parcours encore ouverts dans [MVP_PLATEFORME_2026-09-26.md](../../docs/MVP_PLATEFORME_2026-09-26.md). La présence d'un composant ou d'une route ne prouve pas à elle seule un parcours validé.
