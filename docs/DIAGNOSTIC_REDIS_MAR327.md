# MAR-327 — diagnostic Redis Coolify

Lecture seule du 27 septembre 2026. Le ticket décrit des erreurs `NOAUTH` autour des workers StayConnect. Aucun réglage Coolify, code ou ticket Linear n'a été modifié pendant ce diagnostic.

## Constats vérifiés

- Dans la fenêtre de logs Coolify consultée, le **worker de production** répète `ReplyError: NOAUTH Authentication required.` environ toutes les vingt secondes. La même recherche dans les logs récents du web de production, du web DEV et du worker DEV n'a pas montré cette erreur. Cette absence ne porte que sur la fenêtre consultée.
- Au runtime, le worker de production utilise `QUEUE_REDIS_HOST=redis` et n'a pas de mot de passe Redis. Depuis ce conteneur, le nom `redis` résout vers **deux adresses** du réseau partagé : le Redis interne de Coolify et le Redis StayConnect de production.
- Sans mot de passe, `PING` reçoit `NOAUTH` du Redis interne de Coolify et `PONG` du Redis StayConnect de production. Le Redis StayConnect démarre sans option d'authentification dans la configuration observée. L'alias DEV est spécifique à StayConnect et ne présente pas cette collision lors de la vérification.

**Cause établie :** l'alias `redis` est ambigu en production. Le worker peut atteindre le Redis interne de Coolify, qui réclame une authentification. La pile `redis-parser` ne permet pas de nommer le sous-client BullMQ précis ; cette distinction n'est pas nécessaire pour résoudre la collision. L'hypothèse du ticket selon laquelle un client enverrait `AUTH` à un Redis sans mot de passe ne décrit pas l'erreur `NOAUTH` observée aujourd'hui.

## Correction ciblée à réaliser

1. Relever, dans un emplacement sûr, la configuration effective actuelle des applications web et worker de production pour pouvoir revenir en arrière. Ne pas enregistrer les secrets dans le dépôt ni dans Linear.
2. Configurer **les deux applications de production** avec l'alias réseau unique du Redis StayConnect de production à la place de `redis`. Aligner `QUEUE_REDIS_PASSWORD` sur le serveur cible : vide dans la configuration actuelle. Garder les rôles existants du web et du worker ; ne pas activer deux planificateurs récurrents.
3. Redémarrer ou déployer les deux applications concernées selon le mécanisme Coolify, puis vérifier depuis chacune que le nom choisi résout vers un seul conteneur StayConnect et que `PING` répond. Suivre les logs du worker au-delà de plusieurs cycles de vingt secondes : plus aucun `NOAUTH` ; contrôler ensuite la présence des trois tâches récurrentes et leur exécution aux prochaines échéances, sans déclencher un envoi de newsletter pour tester.

## Retour arrière

Si la connexion queue ou les tâches récurrentes échouent, restaurer les valeurs Coolify relevées à l'étape 1 et redémarrer les deux applications. Ce retour remettrait l'alias ambigu ; il ne constituerait pas une résolution de MAR-327. Conserver le ticket en cours jusqu'à une correction appliquée et vérifiée sur les services réels.
