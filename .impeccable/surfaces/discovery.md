# Découverte StayConnect

## Scope

Prototype navigable local de l'accueil et de la fiche sortie, à montrer avant commit. Réutiliser les données, routes, formulaires et interactions existantes. Monde visuel fixé par le mail approuvé et composition issue du plan de relance accepté ; aucun changement de positionnement graphique supplémentaire à arbitrer.

## Mode

Operate : repérer les nouveautés, ouvrir une fiche et écouter. L'expression éditoriale sert cette lecture.

## Direction contract

Papier crème #F8F3E9, encre #231F1B, orange #FD4F00. Titres Anton, texte courant sans serif. Trame de points du mail. Lignes de pochettes et noms d’artistes dominants sur l’accueil, titre dominant sur la fiche, traits fins et mise en page de média musical. Pas de mise en avant éditoriale fictive.

FIRST VIEWPORT : navigation courte, bandeau orange « Les sorties de la semaine », période et nombre réel de sorties, puis premières pochettes visibles. Au moins une sortie identifiable au premier écran mobile. La date et le nombre de pull-ups sont des critères distincts.

Interaction principale : changer de semaine et basculer entre un fil groupé par jour et un classement numéroté par pull-ups ; ouvrir une ligne mène à la fiche réelle. La fiche donne immédiatement accès à la plateforme d'écoute, puis au pull-up. Réutiliser la connexion et les actions serveur existantes.

Newsletter au bas de l'accueil, avec inscription auditeur et accès au formulaire artiste existant. Formulaires de démonstration neutralisés explicitement quand VITE_DEMO_MODE=true.

## References

- Bandcamp, archive Inspo du 18 mai 2026 : place centrale des pochettes et densité utile du catalogue.
- Crack Magazine, archive Inspo du 4 mai 2026 : présence de la marque et hiérarchie éditoriale. Adapter la densité pour garder l'accès aux sorties dès le premier écran.
- Daptone Records, archive Inspo du 4 mai 2026 : papier chaud, orange, trame imprimée et visuels musicaux.
- UI Skills baseline-ui : composants existants, focus, contrôles nommés, états vides actionnables ; mouvement bref du disque en réponse au survol et retours de pression, avec réduction du mouvement.

## Responsive and states

1440/1280 px et 390/320 px. Noms longs, image absente, zéro sortie, périodes différentes, membre connecté/déconnecté. Focus visible, libellés accessibles, compteurs tabulaires. Les dates, soutiens et territoires du prototype local sont des démonstrations annoncées. Les territoires sont des fixtures de présentation, sans persistance dans le modèle réel.

## Révision du 26 septembre, retour de Marvin

Conserver l’identité orange et papier. Renforcer la chronologie par regroupement journalier et le classement avec positions et compteurs saillants. Nom visible confirmé : Pull-up. Le titre de sortie prime sur l’artiste sur la fiche, l’artiste reste dominant dans le catalogue. Badges de plusieurs territoires, incluant les invités, avec noms lisibles et couleurs stables. Le modèle actuel ne stocke aucun territoire : les exemples restent explicitement fictifs en mode démo.

Mouvement : réponse de rembobinage du disque au survol, pression des boutons et transition brève du changement de liste. Aucun mouvement continu ni son. Transformations et opacité, durées de 140–240 ms pour les contrôles, budget de 500 ms pour le disque illustratif. Respect de prefers-reduced-motion et des pointeurs tactiles.

La piste « Money pull-up » reste une hypothèse de modèle économique consignée dans la note produit Drive ; aucune interface ni mécanique de paiement n’appartient à ce prototype.
