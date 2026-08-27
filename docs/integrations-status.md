# Statut des intégrations externes

| Intégration | Statut | Usage dans l’application | Décision opérationnelle |
|---|---|---|---|
| Stripe | Actif en environnement de test | Sessions de paiement pour cotisations, dons et campagnes ; webhook idempotent ; transactions et notifications | Conserver. Avant la production, réclamer l’environnement sandbox Stripe et vérifier les secrets de production dans la console de gestion. |
| Brevo | Configuré | Emails transactionnels, confirmations de paiement et messages liés aux documents signés | Conserver. Surveiller les erreurs d’envoi dans l’audit et vérifier les domaines d’expédition avant les campagnes massives. |
| Stockage S3 | Actif via les helpers serveur | Fichiers documentaires et métadonnées de stockage | Conserver comme source de vérité des fichiers. Ne pas stocker de contenus binaires dans MySQL/TiDB. |
| Google Drive | Connecteur Google Workspace authentifié ; import applicatif suspendu | Import automatique de fichiers envisagé pour Documents | Le connecteur est disponible, mais le flux d’import n’est pas activé : la configuration de facturation Google Cloud a bloqué la poursuite OAuth/API. Le cycle documentaire local reste autonome ; ne pas activer de synchronisation partielle sans projet facturé et compte de service maîtrisé. |
| OneDrive | Non intégré | Alternative potentielle à Google Drive | À réévaluer uniquement avec un besoin métier confirmé et une stratégie OAuth, partage, quotas et révocation documentée. |
| WebSocket | Non activé | Temps réel du centre de notifications | Le centre actuel fonctionne avec des notifications persistées, déduplication et lectures tRPC. Une activation future nécessite une stratégie de reconnexion, autorisation par canal et repli polling. |

## Recommandation

La plateforme peut fonctionner sans import Drive ni OneDrive. Le connecteur Google Workspace est authentifié dans la configuration, mais les procédures d’import et de synchronisation ne sont pas activées. Les documents locaux, la signature, la conservation, l’audit et les exports restent couverts par le stockage S3 et la base relationnelle. Cette décision évite de rendre le cycle métier dépendant d’une facturation Google Cloud non disponible.

Pour une future reprise de Google Drive, prévoir un projet Google Cloud distinct, la facturation activée, des scopes OAuth minimaux, une table de correspondance fichier/document, la gestion des suppressions et un journal d’import idempotent. Aucun secret ne doit être ajouté dans le dépôt ; les valeurs doivent passer par la gestion des secrets du projet.

Pour Stripe, distinguer explicitement les clés de test et de production, vérifier la signature du webhook, conserver l’idempotence par événement et valider le passage en production avec un paiement de faible montant. Pour Brevo, conserver les emails d’échec dans l’audit sans bloquer la transaction financière déjà confirmée.
