# Illustrations de la newsletter

Le bandeau et le motif de points sont exportés dans `public/email/weekly/`.
Le template les charge depuis `APP_URL`. Le build Adonis copie déjà `public/**`.
Les PNG doivent être déployés avec le template avant le prochain envoi.

Le titrage utilise Anton, sous licence SIL OFL incluse dans ce dossier.
La police est intégrée au PNG, elle n'est pas téléchargée par le lecteur du mail.
Les pochettes, noms, titres, dates et liens restent dynamiques.

Pour régénérer les deux PNG avec Python et Pillow :

```sh
python3 resources/email-assets/generate_weekly_art.py
```

Le motif de fond est décoratif. Un client qui ignore les images de fond affiche
le fond orange uni. Les liens et les textes des sorties restent en HTML.
