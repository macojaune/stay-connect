# Comptes StayConnect

## Périmètre et mode

**Operate** : créer un compte, se connecter, récupérer l'accès et revenir à la sortie que l'on voulait soutenir. La découverte et les liens d'écoute restent accessibles sans compte, conformément à `PRODUCT.md`.

Cette extension concerne les pages `/login`, `/register`, `/forgot-password` et `/reset-password`. Elle reprend le monde visuel de la découverte validé par Marvin en session. Le prototype est construit directement dans le code ; aucune composition graphique distincte n'a été approuvée pour ces pages.

## Direction et composition

Réutiliser la palette, les polices et les composants de `DESIGN.md` : orange #FD4F00, papier #F8F3E9, encre #231F1B, Anton pour les titres et Inter pour les champs et les explications. Le statut historique « en attente de validation » de ce document ne remplace pas les décisions prises ensuite en session.

Sur ordinateur, une affiche orange « Les sorties / d’ici. / Chaque semaine. » et le disque existant accompagnent le formulaire dans une seconde colonne. Les barres indiquent les retours à la ligne, pas des caractères affichés. Le texte secondaire rappelle les Antilles, la Guyane et les diasporas. Sur mobile, l'affiche devient un bandeau compact avant le titre et les champs. Les formulaires utilisent des libellés persistants, un bouton principal encre et des liens secondaires soulignés. Les angles, filets et espacements prolongent le système existant.

La trame du mail est une tuile de 48 × 48 px : la répéter à sa taille native. L'agrandir pour couvrir le panneau produisait des taches floues ; ce défaut a été corrigé. Le papier garde son grain existant. Le disque reprend le mouvement bref et les règles de réduction du mouvement du composant partagé.

## Contrat d'interaction

- `returnTo` conserve la destination entre les pages de compte et détermine le libellé du retour. La conformité du contrôle serveur relève des tests fonctionnels.
- La connexion utilise l'email et le mot de passe. L'inscription ajoute un pseudo public et la confirmation du mot de passe. Les aides expliquent l'usage du pseudo et la longueur minimale.
- Les champs de mot de passe disposent d'un contrôle nommé pour afficher ou masquer la saisie.
- Les erreurs sont associées aux champs ; les retours généraux utilisent `alert` ou `status`. Pendant l'envoi, le formulaire expose son état et le bouton change de libellé.
- La récupération prévoit une confirmation d'envoi ; la réinitialisation distingue un lien valide d'un lien expiré ou inutilisable et propose une action de récupération.
- La mention sous l'inscription précise que l'email reste privé et que le récap hebdomadaire demande une inscription séparée.

Sources : `inertia/layouts/AuthLayout.tsx`, `inertia/components/auth/AuthField.tsx`, `inertia/css/auth-editorial.css` et `inertia/pages/auth/`. Les props et états attendus sont définis dans `app/contracts/auth.ts`, notamment `status: 'password-reset'`, `status: 'sent'` et `valid: boolean`. Leur présence dans le code ne prouve pas leur fonctionnement de bout en bout.

## Revue visuelle locale du 26 septembre 2026

Cette première revue portait sur l'affiche « Un pull-up pour tes coups de cœur », remplacée ensuite par le message de découverte décrit ci-dessus. Les captures ci-dessous restent des preuves de cette version antérieure. La validation de la tranche suivante est consignée dans [MVP_PLATEFORME_2026-09-26.md](../../docs/MVP_PLATEFORME_2026-09-26.md).

Revue indépendante de l'implémentation UI, à partir du code et des captures fournies. Le lanceur Impeccable était indisponible avec une erreur de permission déjà signalée ; aucun détecteur ni outil spécialisé de finition n'a tourné. Cette revue manuelle remplace ce passage, sans revendiquer une validation automatisée équivalente.

Première passe : connexion et inscription à 1440 × 1000 et 390 × 844. Deux constats : texture orange agrandie, puis capture d'inscription mobile incohérente avec le composant partagé. La confirmation ciblée ci-dessous clôt ces constats. Les captures ont un DPR de 2.

| Capture locale                                                                                                                  | Observation                                                                                                                | Verdict                       |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [Inscription, 390 × 844](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwia51-c10bc054.png)      | Affiche et disque visibles ; titre, explication et champs alignés ; aucun texte coupé sur la gauche dans la zone capturée. | Résolu                        |
| [Inscription, 1440 × 1000](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwiabi-e4c68af4.png)    | Trame répétée à petite échelle, sans les grandes taches de la première version ; composition du formulaire conservée.      | Résolu                        |
| [Réinitialisation, 390 × 844](/Users/marvinl/.t3/userdata/browser-artifacts/browser-screenshot-localhost-muiwglzh-6f51b17e.png) | Titre, deux champs, consigne et action principale lisibles ; bouton visible dans la capture.                               | Conforme sur la zone capturée |

La recapture d'inscription a été stabilisée par l'agent principal après chargement des polices et remise en haut de page. Ses mesures transmises étaient `scrollWidth = 390`, `scrollX = 0`, titre à `x = 20` sur `350 px`. Le reviewer a inspecté les images ; il n'a pas exécuté ces mesures lui-même.

**Verdict de finition : ship pour le rendu local examiné.** La palette et la hiérarchie prolongent la direction existante. Aucun autre correctif visuel n'est requis dans ce passage borné.

## Limites de la preuve

Le bas de l'inscription mobile, les erreurs rendues, la récupération par email, le lien expiré, le clavier virtuel, le zoom et les largeurs intermédiaires ne sont pas tous couverts par ces captures. Les comportements serveur et les parcours de compte demandent leurs preuves fonctionnelles distinctes. Cette note ne prouve ni commit, ni push, ni déploiement, ni livraison en production.

Les pages privées après connexion et les pages artistes sont décrites dans [member-artists.md](member-artists.md). Marvin a autorisé leur réalisation locale continue, avec contrôles regroupés en fin de tranche, sans arrêt de validation entre chaque page.
