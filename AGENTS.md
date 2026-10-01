# Instructions pour les agents

## Linear — workspace MarvinL

Pour StayConnect, utiliser exclusivement le **workspace Linear `marvinl`** (MarvinL.com). Toujours passer `--workspace marvinl` explicitement à la CLI, sans dépendre du workspace par défaut ni modifier sa configuration globale.

- Projet : `StayConnect`.
- URL : `https://linear.app/marvinl/project/stayconnect-81a5a28e8e68`.
- Exemple de commande : `linear --workspace marvinl project list`.

Vérifier que les tickets consultés ou modifiés appartiennent au projet StayConnect dans ce workspace. Ne pas confondre le workspace Linear `marvinl` avec le contexte CLI Coolify `vps2`.

## Coolify — workspace MarvinL

Pour StayConnect, le workspace appelé « MarvinL » utilise le **contexte CLI Coolify `vps2`**. Le nom réel de l’équipe retourné par l’API est `Root Team` ; `marvinl` n’est pas un nom de contexte CLI configuré.

Toujours passer `--context vps2` explicitement : le contexte CLI par défaut `maggma` concerne une autre instance. Ne pas modifier le contexte par défaut global.

### Projet et applications

- Projet : `stayconnect` — UUID `b78f6ovnu1uw34trkjdbtn70`.
- Web PROD : `stayconnect-web-prod` — UUID `e4t14e9ui10pkxs221z6za1j`, branche `main`, URL `https://stayconnect.marvinl.com`.
- Worker PROD : `stayconnect-worker-prod` — UUID `g14n5gsw16c0pw89n4dq6raa`, branche `main`.
- Web DEV : `stayconnect-web-dev` — UUID `tjgmwzdqzma20mk6pxx1hezq`, branche `develop`, URL `https://dev-stayconnect.marvinl.com`.
- Worker DEV : `stayconnect-worker-dev` — UUID `ai34g6brwwqtaaj0fp2v0wcn`, branche `develop`.

### Vérification en lecture seule

```sh
coolify --context vps2 teams current
coolify --context vps2 project list
coolify --context vps2 app list
coolify --context vps2 app deployments list e4t14e9ui10pkxs221z6za1j
coolify --context vps2 app deployments list g14n5gsw16c0pw89n4dq6raa
```

Pour confirmer une livraison newsletter, vérifier les déploiements du **web et du worker**, leur statut et leur commit, puis l’accessibilité des assets publics. Un commit présent sur `main` ne prouve pas à lui seul un déploiement réussi. `running:unknown` indique un conteneur démarré sans validation de santé concluante.

Une demande de vérification n’autorise pas un déploiement, redémarrage ou envoi de mail. Ne pas afficher ni enregistrer de tokens ou de secrets dans le dépôt.
