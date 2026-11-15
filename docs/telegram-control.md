# Contrôle StayConnect par Macobot

Cette API expose une identité de service indépendante des comptes utilisateurs :

- `GET /api/control/artists?query=...` recherche quatre artistes Spotify et indique les artistes déjà au catalogue.
- `POST /api/control/operations` reçoit `add-artist` avec `spotifyId`, ou `refresh-releases` avec `days` entre 1 et 30 et éventuellement un `artistId` interne.
- `GET /api/control/operations/:id` retourne l'état réel du job et son résultat final.

Toutes les routes exigent `Authorization: Bearer <STAYCONNECT_CONTROL_TOKEN>`. Le secret est généré aléatoirement, comporte au moins 32 caractères et reste disponible au runtime du web. Ne pas réutiliser `API_KEY`, un token de session ou le secret PROD en DEV. Le worker utilise les services métier existants ; il n'a pas besoin du secret HTTP.

Les écritures exigent aussi `Idempotency-Key`, un UUID v4 conservé dans le job BullMQ pendant sept jours après son achèvement. Le même UUID avec les mêmes paramètres renvoie le même job. Avec d'autres paramètres, il est refusé. Le résultat est enregistré dans la progression du job car le gestionnaire de queue du projet ne transmet pas la valeur de retour de `handle`.

Une seule tentative automatique est configurée. Un worker interrompu peut néanmoins reprendre un job stalled selon les règles BullMQ. Les contraintes uniques Spotify et les vérifications du collecteur existant restent la protection métier contre les doublons. Les jobs expirés ne constituent pas un journal permanent.

Un refus ne crée pas de job. La nouvelle exception CSRF concerne uniquement le POST protégé par l'identité de service. Aucune route de connexion ou d'envoi de newsletter n'est exposée par ce raccord.

Le web et le worker doivent servir le commit qui contient `control_operation_job` avant d'activer le bot. Contrôler la recherche, le refus sans secret, le rejeu d'un job et la récupération du résultat sur DEV. Aucun changement de schéma n'est nécessaire. Désactiver en retirant le secret puis en redéployant le web ; les données catalogue existantes restent conservées.
