# Revue de cohérence locale — 1 octobre 2026

## Résultat

Revue des surfaces publiques, authentification, membre, équipe et erreurs, sur le build réel. Direction orange/crème/encre, Anton/Inter et signature « Développé entre deux écoutes par MarvinL.com » conservées ; signature toujours première dans le footer.

**69 tests réussis (39 unitaires, 30 fonctionnels), typage serveur/client et build client/SSR réussis. 210 mesures : 21 pages × 5 largeurs × Chromium/WebKit.** Aucun débordement horizontal, erreur JavaScript, champ sans label, doublon de h1/footer ou réapparition du vocabulaire rejeté dans les mesures.

État à la clôture de la revue, le 1 octobre 2026 : modifications locales non commitées, aucun push, déploiement, envoi de mail ni écriture dans les données DEV/PROD. HEAD inchangé à cette date : e9e5e84.

Le 2 octobre 2026, le propriétaire a autorisé le commit et le push de ces corrections sur develop, sans déploiement manuel ni modification de main.

## Couverture

- Largeurs 320, 390, 651, 768 et 1440 px, scrollbar réelle forcée.
- Public : accueil, annuaire, profil artiste, fiche sortie peuplée et fiche sans image/liens/artiste.
- Auth : connexion, inscription, oubli de mot de passe, lien expiré et récupération valide.
- Membre : compte, pull-ups et propositions vides puis remplies, trois statuts de proposition.
- Équipe : création/correction de sortie, affiliations, refus d’accès, identifiants invalides.
- Vrais statuts 403/404 et 500 provoquée seulement dans le build local ; message privé synthétique absent du HTML.
- Interactions dans les deux navigateurs : commentaire, images 404, focus clavier du picker, erreur URL après ligne vide, refus natif d’une source HTTP.

Fixtures fictives, PostgreSQL/Redis jetables et boucle locale exclusivement. Cookies applicatifs sécurisés inchangés ; le pilote a adapté uniquement le transport HTTP local et le suivi du 303 WebKit. Services et serveur de revue arrêtés ; route 500 et visuel fictif retirés du build.

## Corrections

1. Menu membre réellement repliable à 320 px, sans cacher l’overflow.
2. [Page 403 cohérente](</Users/marvinl/Documents/DEV/stayConnect-relaunch/inertia/pages/errors/forbidden.tsx>) avec récupération, statut 403, no-store/noindex ; 404 commune pour les identifiants équipe invalides. Droits inchangés.
3. Messages équipe en français et contraintes natives alignées : noms de deux caractères minimum, aide HTTPS reliée au champ.
4. [Lignes URL normalisées aussi à l’écran](</Users/marvinl/Documents/DEV/stayConnect-relaunch/inertia/pages/team/releases/form.tsx>) : erreur et focus sur le vrai champ envoyé, vérifiés Chromium/WebKit.
5. Maximum 12 catégories sur l’union dédupliquée, UI et service cohérents ; test du rollback et du doublon autorisé.
6. Focus du picker à l’intérieur du conteneur scrollable ; petit libellé orange redondant et insuffisamment contrasté retiré.
7. [Commentaires filtrés avant la limite de 12](</Users/marvinl/Documents/DEV/stayConnect-relaunch/app/controllers/release_pages_controller.ts>), total indépendant et fenêtre affichée explicitement. Test avec 13 commentaires et 12 pull-ups sans texte.
8. [Compteurs publics partagés](</Users/marvinl/Documents/DEV/stayConnect-relaunch/app/services/public_artist_catalog.ts>) : participations incluses, privé exclu, chaque sortie comptée une fois. Régression principal/invité/privé.
9. [Repli des pochettes et portraits](</Users/marvinl/Documents/DEV/stayConnect-relaunch/inertia/components/editorial/ImageWithFallback.tsx>), y compris une image échouant avant hydratation SSR ; vrais 404 vérifiés dans les deux navigateurs.
10. Session expirée pendant un pull-up : retour sécurisé à la fiche et à son ancre, sans rejouer la mutation ni accepter une destination externe.

## Vérifications et limites

- **pnpm typecheck**, **pnpm build**, **pnpm test** et **git diff --check** : OK ; diff relu.
- ESLint ciblé serveur/tests : aucune erreur. La configuration existante exclut les TSX ; ce résultat ne représente pas un lint client exhaustif.
- React Doctor : 17 fichiers, **0 erreur, 3 avertissements, 83/100**. Complexité des pages sortie/éditeur et recherche par tableau dans la boucle des catégories ; refactor large volontairement hors de cette passe.
- Détecteur de design indisponible (permission d’exécution) : revue manuelle des rendus et du code, sans modifier les permissions.
- Pas de certification WCAG, lecteur d’écran, appareil physique, profilage Core Web Vitals, montée en charge, envoi SMTP/newsletter ou worker/import Spotify réel.
- La sonde locale **/health a retourné 503** malgré des pages et données disponibles. [Ses contrôles](</Users/marvinl/Documents/DEV/stayConnect-relaunch/start/health.ts>) portent uniquement sur disque et heap mémoire ; la réponse ne précise pas lequel échoue. Cause système exacte non déterminée, seuils non modifiés. **Cette revue UI ne constitue pas une validation de santé pour un déploiement.**

### Appréciation indicative du périmètre revu

| Dimension | Note / 4 | Réserve |
| --- | --- | --- |
| Accessibilité | 3 | Labels/focus/erreurs vérifiés, pas de lecteur d’écran |
| Performance et maintenabilité | 2 | Trois avertissements, pas de profilage |
| Cohérence de thème | 4 | Charte et signature communes préservées |
| Responsive | 4 | Zéro overflow dans les 210 mesures |
| Antipatterns | 3 | Corrections ciblées, identité validée non redessinée |

## Preuves

- [Mesures et interactions](</tmp/stayconnect-review-after/results.json>).
- [Menu à 320 px](</tmp/stayconnect-review-after/dashboard-320.png>).
- [403 mobile](</tmp/stayconnect-review-after/forbidden-390.png>) et [desktop](</tmp/stayconnect-review-after/forbidden-1440.png>).
- [Fiche sortie](</tmp/stayconnect-review-after/release-1440.png>), [affiliations](</tmp/stayconnect-review-after/territories-390.png>), [500](</tmp/stayconnect-review-after/server-error-390.png>) et [récupération valide](</tmp/stayconnect-review-after/reset-valid-390.png>).

Captures et journaux temporaires, non livrés comme assets du site. Le bilan et les tests du dépôt constituent la trace durable.
