---
name: StayConnect
description: Système visuel du prototype local de découverte musicale, en attente de validation visuelle.
colors:
  orange: '#FD4F00'
  paper: '#F8F3E9'
  ink: '#231F1B'
  muted: '#675F56'
  line: '#D4CBBD'
  ink-hover: '#44382C'
  paper-hover: '#EADFCE'
  field-dark: '#352F2A'
  field-border: '#8B8177'
  platform-paper: '#FFFDF8'
  platform-hover: '#EFE6D7'
typography:
  display:
    fontFamily: 'SC Anton, sans-serif'
    fontSize: 'clamp(54px, 6.4vw, 82px)'
    fontWeight: 400
    lineHeight: 1.03
  headline:
    fontFamily: 'SC Anton, sans-serif'
    fontSize: '36px'
    fontWeight: 400
    lineHeight: 1.15
  artist:
    fontFamily: 'Inter, Arial, sans-serif'
    fontSize: '27px'
    fontWeight: 750
    lineHeight: 1.2
  body:
    fontFamily: 'Inter, Arial, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.65
  control:
    fontFamily: 'Inter, Arial, sans-serif'
    fontSize: '14px'
    fontWeight: 650
    lineHeight: 1.35
rounded:
  square: '0'
  control: '4px'
  circle: '50%'
spacing:
  compact: '8px'
  field: '12px'
  group: '16px'
  mobile-gutter: '20px'
  section: '24px'
  desktop-gutter: '28px'
  wide: '32px'
  panel: '40px'
  section-gap: '56px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  button-primary-hover:
    backgroundColor: '{colors.ink-hover}'
  button-light:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  button-light-hover:
    backgroundColor: '{colors.paper-hover}'
  button-newsletter:
    backgroundColor: '{colors.orange}'
    textColor: '{colors.ink}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    padding: '12px 20px'
  field-newsletter:
    backgroundColor: '{colors.field-dark}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: '12px'
  field-comment:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
    padding: '14px'
  sort-selected:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: '10px 12px'
  platform-link:
    backgroundColor: '{colors.platform-paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
    padding: '14px 18px'
  platform-link-hover:
    backgroundColor: '{colors.platform-hover}'
---

# Design System: StayConnect

## Overview

**Creative North Star: "Le journal des sorties"**

Cette proposition reprend le caractère du mail hebdomadaire validé : orange franc, papier crème, encre brune, titres condensés et trame de points. Les pochettes apportent leurs propres couleurs. Les noms d'artistes et les actions restent lisibles dans une composition dense, avec des filets plutôt que des panneaux superposés.

Ce document décrit le prototype local de l'accueil et de la fiche sortie. Son statut est **proposition en attente de validation visuelle**. Les valeurs proviennent des feuilles `inertia/css/editorial.css` et `inertia/css/release-editorial.css`, du layout et des pages correspondantes. Elles décrivent cette proposition ; elles ne prouvent ni une approbation de Marvin, ni une livraison de l'ensemble du site. Le cadrage des pages reste dans `.impeccable/surfaces/discovery.md` et les preuves locales dans `.impeccable/review/QA.md`.

**Key Characteristics:**

- Orange, crème et encre issus de la direction du mail.
- Anton pour les titres d'affiche, Inter pour la lecture et les contrôles.
- Pochettes carrées, artistes visibles, métadonnées secondaires.
- Fil chronologique par jour et classement numéroté par pull-ups.
- Grain de papier, disque illustré et micro-interactions brèves.

## Colors

La palette associe un accent chaud aux neutres du papier et de l'encre. Les valeurs normatives du prototype figurent dans le frontmatter.

### Primary

- **Orange StayConnect** : bandeau de l'accueil, zone de soutien, action du récap et sélection de semaine.

### Neutral

- **Papier crème** : fond des pages, texte clair des zones encre et champs de commentaire.
- **Encre brune** : texte principal, boutons principaux, fond du récap et contour de focus sur fond clair ou orange.
- **Texte atténué** : dates, genres et informations secondaires.
- **Filet papier** : séparateurs des lignes, sections et commentaires.
- **Encre de survol** et **papier de survol** : états des deux variantes de bouton.
- **Champ sombre** et **bord de champ** : saisie dans le bloc du récap.
- **Papier de plateforme** et **survol de plateforme** : liens d'écoute de la fiche.

**The Orange Rule.** Conserver l'encre comme couleur de texte sur les aplats orange de cette proposition.

Les rampes tonales du fichier JSON servent à afficher les nuances dans le panneau de documentation. Elles sont calculées pour cet aperçu et ne constituent pas des variantes implémentées.

## Typography

**Display Font:** Anton, déclaré localement sous le nom `SC Anton`, avec un repli sans serif. Le fichier est `public/fonts/Anton-Regular.ttf`, chargé avec `font-display: swap`.

**Body Font:** Inter, puis Arial et sans serif. Inter reste la police du corps héritée de l'application et chargée par `inertia/css/app.css`.

Anton donne leur poids aux titres. Inter porte les artistes et les titres dans le catalogue, les artistes sur les fiches, les explications et les formulaires. Le titre de sortie domine la fiche en Anton. Les grands titres utilisent les capitales ; les contrôles conservent la casse naturelle du français.

### Hierarchy

- **Display** : titre principal de l'accueil selon le token `display`. Sur mobile, il passe à `clamp(43px, 12vw, 62px)` avec un interlignage de `1.04`.
- **Headline** : titres des sections artistes et commentaires selon le token `headline`, ramenés à `30px` sur la fiche mobile.
- **Artist** : nom d’artiste du catalogue selon le token `artist`, ramené à `24px` sous `1000px`, puis `19px` sur mobile (`18px`, puis `16px` dans le classement). Sur la fiche, l’artiste est secondaire en Inter, de `22px` à `28px`, avec un lien vers son profil.
- **Release title** : titre de fiche dominant en Anton, `clamp(3rem, 5.8vw, 5.5rem)`, puis `clamp(2.75rem, 12vw, 4rem)` sur mobile.
- **Body** : descriptions et commentaires selon le token `body`, avec une largeur maximale de `70ch`. Le titre de sortie du catalogue utilise un interlignage de `1.35`.
- **Control** : boutons selon le token `control`. Les dates et compteurs utilisent des chiffres tabulaires.

**The Type Roles Rule.** Réserver Anton aux titres courts, aux positions du classement et aux lettres de remplacement des images absentes. Garder Inter pour les contrôles, descriptions et commentaires.

## Layout

Le conteneur est centré avec une largeur maximale de `1256px`, marges intérieures comprises. Ses gouttières passent de `28px` à `20px` sous `650px`, puis à `16px` sous `350px`. Les espacements du frontmatter regroupent les valeurs réutilisées ; ils ne constituent pas une échelle uniforme imposée à tous les éléments.

Le catalogue utilise des lignes séparées par un filet : pochette, informations, compteur de pull-ups. Le fil par défaut regroupe les sorties par jour, du plus récent au plus ancien, avec une date dans une colonne latérale de `140px`. Le classement ajoute une position numérotée et trie par nombre de pull-ups décroissant, puis par date décroissante et nom d’artiste. La première position et son compteur sont orange.

Sur ordinateur, une ligne réserve `144px` à la pochette et `80px` au compteur, avec des intervalles de `26px`. Sous `1000px`, ces dimensions diminuent. Sous `650px`, les dates deviennent des titres au-dessus des lignes ; les pochettes font `88px` dans le fil et `66px` dans le classement. Les noms et les badges peuvent revenir à la ligne. Sous `350px`, les dimensions diminuent encore.

Sur ordinateur, la fiche place la pochette à gauche et les informations à droite. Sous `640px`, le code actuel suit l'ordre titre, écoute, pochette, description. Le soutien et les commentaires passent également à une colonne. Le seuil `900px` réduit les espacements intermédiaires. Ces seuils distincts décrivent les deux pages existantes ; aucune harmonisation n'est appliquée par cette documentation.

## Elevation & Depth

Les deux feuilles éditoriales ne définissent aucune ombre. Les aplats, les filets de `1px` et l'espace entre sections portent la hiérarchie. La trame `public/email/weekly/dots-orange-v3.png` appartient au bandeau orange, avec une opacité de `1` dans le code actuel. Elle reste un décor non interactif derrière le contenu.

**The Flat Surfaces Rule.** Pour prolonger ces deux pages, reprendre les aplats et filets existants sans ajouter d’ombre aux lignes du catalogue.

Le grain discret `public/illustrations/print-grain.svg` enrichit le papier, la navigation, le pied de page et le bandeau. Le composant `PullUpRecord` dessine un disque SVG décoratif dans le bandeau, sans contenu métier ni son.

Les animations portent uniquement sur les transformations et l’opacité : apparition de liste en `180ms`, pression et pictogrammes en `140–240ms`, bref retour du disque de `75°` en `500ms`. Le disque et les pictogrammes du catalogue réagissent au survol avec un pointeur fin. Les effets de survol de la fiche demandent un appareil capable de survol ; toutes ces animations sont désactivées avec `prefers-reduced-motion`. Aucun mouvement continu.

## Shapes

Les pochettes restent carrées. Dans le catalogue, leurs angles sont arrondis de `3px` et ceux des boutons selon `rounded.control`. La pochette de la fiche, les liens d'écoute, le panneau de soutien et le commentaire gardent des angles droits. Le cercle est réservé à l'action superposée à une pochette et aux pictogrammes de partage déjà présents.

## Components

### Buttons

Les boutons sont pleins ou bordés, avec un contour encre, le rayon `control` et une hauteur minimale de `46px`. La variante principale associe encre et papier. La variante claire garde un fond transparent. Le bouton du récap utilise l'orange sur le bloc sombre. L'état désactivé réduit l'opacité et affiche le curseur d'attente.

Le focus visible est un contour de `3px` avec un décalage de `4px`. Il utilise l'encre sur les zones claires et orange, puis le papier dans le récap. Les liens textuels soulignent leur libellé au survol.

### Filters

Les semaines sont des boutons texte. La sélection renforce le texte et ajoute un trait orange de `3px`. Le tri est un groupe de deux boutons, « Le fil des sorties » et « Le classement » ; le bouton sélectionné utilise le couple encre et papier. Les deux groupes exposent leur sélection avec `aria-pressed`.

### Release rows

Une ligne place la pochette à gauche, le type, le nom d’artiste, le titre et les invités au centre, puis le compteur de pull-ups à droite. Dans le classement, le rang précède la pochette et la date figure dans les métadonnées. Le compteur ouvre la zone de soutien de la fiche ; il ne donne pas directement un pull-up. Une image absente ou en erreur laisse apparaître les premières lettres de l’artiste.

Les badges portent les noms complets Guadeloupe, Martinique et Guyane, avec une couleur stable par territoire. Plusieurs badges peuvent figurer sur une sortie, après déduplication des territoires de l’artiste et des invités. Guadeloupe associe `#EADDF2` et `#573167`, Martinique `#D4E7F0` et `#1C4D62`, Guyane `#DFE8C6` et `#40541F`. Ces attributions sont entièrement fictives et affichées uniquement en mode démo, avec une mention explicite : aucune donnée structurée de territoire n’existe encore dans le modèle réel.

### Inputs / Fields

Les champs du récap ont un fond sombre, un bord visible, des libellés persistants et une hauteur minimale de `46px`. Le commentaire a un fond papier, des angles droits et une hauteur minimale de `106px`. Il peut être agrandi verticalement. Le code relie les erreurs à leur champ avec `aria-invalid` et `aria-describedby` ; les retours d'action utilisent `status` ou `alert` selon leur rôle.

### Navigation

La navigation associe le nom #StayConnect, trois liens et l'accès au compte. Sur mobile, les trois liens occupent une seconde ligne. Les liens de navigation se soulignent au survol. Un lien d'évitement devient visible au focus et mène au contenu. Le système ne définit pas encore de traitement visuel de route active.

### Platform links

Chaque lien d'écoute est une ligne bordée, de hauteur minimale `58px`, avec logo, nom de plateforme et flèche de sortie. Le libellé accessible annonce le nouvel onglet. Les liens supplémentaires se déplient avec un contrôle exposant `aria-expanded`. L'absence de plateforme donne un message explicite.

### Pull-up panel

Le panneau orange regroupe le compteur et l'action. Le visiteur déconnecté voit l'accès à la connexion ; le membre voit un commentaire facultatif et le bouton « Pull-up ». Une sortie déjà soutenue montre la confirmation, l'édition du commentaire et le retrait. Les libellés d'état restent visibles, sans faire porter le sens à la seule couleur.

## Do's and Don'ts

### Do:

- **Do** reprendre la palette orange, papier et encre du prototype.
- **Do** conserver les pochettes carrées et les noms d'artistes lisibles.
- **Do** distinguer la date de sortie du compteur de pull-ups dans la hiérarchie.
- **Do** préserver le focus visible, les libellés de champs et les retours d'action.
- **Do** utiliser la trame de points existante quand le bandeau éditorial est repris.

### Don't:

- **Don't** transformer une donnée de démonstration en preuve de popularité réelle.
- **Don't** ajouter une sélection éditoriale fictive ou une note moyenne au pull-up binaire.
- **Don't** remplacer les pictogrammes SVG par des caractères de texte dans les nouveaux composants.
- **Don't** présenter cette proposition locale comme un système approuvé ou déployé.
