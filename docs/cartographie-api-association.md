# Cartographie des API nécessaires — Les Bâtisseurs Engagés

**Auteur : Manus AI**  
**Périmètre :** architecture actuelle de l’application, besoins associatifs identifiés et intégrations plausibles.  
**Conclusion courte :** l’application possède déjà le socle technique principal. Il ne faut pas brancher toutes les API possibles : il faut d’abord sécuriser et stabiliser les API internes, puis choisir un seul prestataire de paiement et un prestataire d’e-mail transactionnel.

## 1. Décision d’architecture

L’application doit conserver **tRPC comme API métier interne**. Les écrans React ne doivent pas appeler directement Stripe, HelloAsso, Google ou un fournisseur de fichiers. Le serveur doit être l’intermédiaire : il authentifie l’utilisateur, vérifie la permission, valide les données, appelle le service externe, enregistre l’identifiant externe et journalise le résultat.

| Niveau | API/service | État actuel | Rôle recommandé |
|---|---|---:|---|
| Identité | OAuth Manus | Déjà disponible | Connexion, session et profil de l’utilisateur |
| Métier | API tRPC interne | Déjà disponible | Membres, antennes, projets, documents, finances, gouvernance |
| Persistance | MySQL/TiDB via Drizzle | Déjà disponible | Source de vérité des données associatives |
| Fichiers | Stockage S3 via helpers intégrés | Déjà disponible | Documents, photos et pièces justificatives ; conserver uniquement les métadonnées en base |
| Notifications techniques | Notification API intégrée | Déjà disponible | Alertes au propriétaire ou à l’équipe technique |
| Planification | Heartbeat / tâches planifiées | Partiellement disponible | Rappels de cotisations, échéances documentaires et synthèses périodiques |
| Analytique | Endpoint d’analytique intégré | Disponible par variables d’environnement | Mesure d’usage technique, sans y envoyer de données personnelles inutiles |
| Paiements | HelloAsso **ou** Stripe | Non activé | Cotisations, dons, campagnes et rapprochement des paiements |
| E-mails utilisateurs | Fournisseur transactionnel dédié | Non identifié dans le code | Reçus, rappels, convocations, invitations et notifications aux membres |
| Calendrier | Google Calendar ou CalDAV | Non activé | Réunions, échéances et événements d’antennes |
| Stockage collaboratif | Google Drive ou OneDrive | Non activé | Échange documentaire externe, uniquement si nécessaire |
| Signature | Yousign ou DocuSign | Non activé | Signatures de conventions et procès-verbaux |
| SMS/WhatsApp | Brevo SMS, Twilio ou WhatsApp Cloud | Non activé | Alertes urgentes, avec consentement et limitation stricte |
| Observabilité | Sentry ou équivalent | Non identifié | Erreurs runtime, performance et alertes de production |

## 2. API déjà nécessaires et à conserver

### 2.1 API métier interne tRPC

Cette API est **indispensable**. Elle doit rester la façade unique des fonctionnalités de l’application. Chaque procédure doit être classée selon quatre niveaux : lecture publique exceptionnelle, utilisateur authentifié, permission métier (`members.view`, `members.manage`, `documents.view`, `documents.manage`, etc.) et administrateur technique. Les mutations doivent appliquer une validation Zod, une journalisation d’audit et une règle d’idempotence lorsque l’opération peut être rejouée.

Les domaines actuellement couverts sont les membres et leur progression, les adhésions, les cotisations, les dons, les dépenses, les reçus, les documents, les notes, les antennes, les groupes, les projets, les bénévoles, les e-mails, les paramètres et le tableau de bord. Il n’est pas nécessaire d’ajouter une API REST parallèle pour ces domaines.

### 2.2 Authentification et autorisation

OAuth Manus est déjà le mécanisme d’identité de l’application. Il doit rester séparé de l’autorisation métier. Le rôle `admin` ne doit pas remplacer les permissions fines : une procédure sensible doit vérifier explicitement la permission attendue et l’appartenance de l’objet lorsque cette règle s’applique.

### 2.3 Base de données

La base MySQL/TiDB via Drizzle est la **source de vérité**. Les services externes ne doivent pas devenir la base principale des membres ou des finances. Chaque intégration doit stocker ses identifiants externes, son statut de synchronisation, la date de dernière synchronisation et l’identifiant d’événement traité.

### 2.4 Stockage de fichiers

Le stockage S3 intégré est suffisant pour les documents et photos. L’API applicative doit contrôler le type MIME réel lorsque cela est possible, la taille, le nom, les extensions autorisées, le contenu décodé et la permission de l’utilisateur. Il faut éviter d’ajouter Google Drive ou OneDrive tant qu’un besoin de coédition ou de partage externe n’est pas établi.

### 2.5 Notifications et planification

Le service de notification intégré convient aux alertes techniques. Pour les rappels utilisateurs, il faut distinguer les notifications internes, les e-mails et les SMS. Les tâches planifiées doivent rester idempotentes et passer par des endpoints dédiés ; elles ne doivent pas utiliser de minuteur en mémoire dans le serveur.

## 3. API externes prioritaires

### Priorité P0 — un seul prestataire de paiement

**Choix recommandé pour une association française : HelloAsso.** Sa documentation officielle décrit une API v5 en OAuth 2.0, des privilèges d’accès aux transactions et au Checkout, ainsi qu’un parcours d’intention de paiement avec redirection, retour, notifications d’événements et vérification de l’intention [1]. Les opérations à prévoir sont la création d’un checkout de cotisation ou de don, la récupération de l’intention et de la commande, la réception et la vérification des notifications, le remboursement lorsque le flux le permet et la réconciliation périodique.

**Alternative : Stripe.** Stripe est préférable si l’association doit gérer des paiements internationaux, des produits plus complexes ou une intégration financière plus standardisée. Sa documentation expose notamment Payment Links, Checkout Sessions, Payment Intents, Customers, Refunds et Events [2]. Les opérations à prévoir sont la création d’un Payment Link ou d’une Checkout Session, l’utilisation de métadonnées pour relier membre/campagne, le traitement des événements, les remboursements et la réconciliation. Il ne faut pas activer HelloAsso et Stripe simultanément sans définir une source de vérité et une politique de rapprochement.

| Critère | HelloAsso | Stripe |
|---|---|---|
| Positionnement | Très adapté aux associations françaises | Très flexible et international |
| Paiements récurrents/dons | À confirmer selon le flux et les besoins exacts | Large couverture de Billing et Checkout |
| Authentification | OAuth 2.0 avec client ID/secret [1] | Clé secrète côté serveur et signature webhook [2] |
| Données à synchroniser | Intentions, commandes, paiements, remboursements | Payment Links, Sessions, Events, remboursements |
| Décision | Premier choix si périmètre France | Alternative si besoin international ou technique spécifique |

### Priorité P0 — e-mail transactionnel

L’application a besoin d’un service d’e-mail transactionnel dédié pour envoyer les reçus, rappels de cotisation, convocations, invitations, confirmations d’adhésion et alertes de sécurité. La notification technique au propriétaire ne doit pas être considérée comme un système complet d’envoi aux membres.

Le choix peut être **Resend, Postmark, Brevo ou Mailgun**. Le service retenu doit proposer une API serveur, des domaines vérifiés, des modèles versionnés, des statuts de livraison, des webhooks d’échec et une gestion claire des désabonnements. Cette API devient obligatoire dès que les rappels ou reçus doivent réellement parvenir aux membres ; elle n’est pas nécessaire pour une première version strictement interne.

### Priorité P1 — calendrier

L’API Google Calendar est RESTful et expose notamment les ressources Event, Calendar, CalendarList, Setting et ACL [3]. Elle est adaptée aux réunions, permanences, échéances et événements d’antennes. L’intégration doit utiliser OAuth avec les scopes minimaux, conserver un mapping `localEventId`/`googleEventId`, gérer les fuseaux horaires et appliquer une stratégie claire en cas de modification concurrente. Une intégration CalDAV peut être préférée si l’association veut éviter une dépendance à Google.

### Priorité P1 — observabilité

Une API d’observabilité comme Sentry est recommandée avant la mise en production à grande échelle. Elle doit recevoir les exceptions, les traces de requêtes et quelques métriques de performance, mais jamais les mots de passe, tokens, contenus de documents, données financières complètes ou informations personnelles non nécessaires. Cette intégration est utile pour détecter les boutons qui échouent uniquement en production et les erreurs de synchronisation.

## 4. API optionnelles, selon décision métier

| Besoin | API possible | Quand l’ajouter | Risque à maîtriser |
|---|---|---|---|
| Partage documentaire externe | Google Drive ou OneDrive | Plusieurs partenaires travaillent déjà dans ces espaces | Doublons, permissions divergentes et fuite documentaire |
| Signature de conventions | Yousign ou DocuSign | Les statuts signés doivent être juridiquement suivis | Conservation des preuves, identité du signataire, webhook sécurisé |
| Alertes urgentes | Brevo SMS, Twilio ou WhatsApp Cloud | Les équipes de terrain ne consultent pas régulièrement l’application | Consentement, coût par message, données de contact et désabonnement |
| OCR de justificatifs | Service OCR spécialisé | Saisie manuelle trop coûteuse et documents homogènes | Données sensibles, erreurs de lecture, validation humaine obligatoire |
| Comptabilité externe | API du logiciel comptable choisi | L’association dispose déjà d’un outil comptable à synchroniser | Plan comptable, périodes verrouillées, doublons et rapprochement |
| Cartographie avancée | Google Maps Platform via le proxy intégré | Besoin de géocodage, itinéraires ou visualisation des antennes | Minimisation des adresses et quotas |
| IA d’assistance | LLM intégré côté serveur | Classement, résumé ou aide rédactionnelle contrôlée | Ne pas envoyer de données sensibles sans minimisation et consentement |

## 5. API à ne pas ajouter maintenant

Il n’est pas recommandé d’ajouter une API de réseau social, une API de chat temps réel, une API e-commerce Shopify ou plusieurs fournisseurs de paiement avant d’avoir clarifié le besoin métier. Ces services augmenteraient la surface d’attaque, la charge de support et les problèmes de rapprochement sans améliorer directement la gestion des membres, la transparence financière ou la gouvernance.

Il faut également éviter de connecter directement les clients React aux services de paiement, de stockage ou d’e-mail. Toutes ces opérations doivent passer par le serveur, avec validation, contrôle d’accès, journal d’audit, protection contre les rejouements et vérification cryptographique des webhooks.

## 6. Ordre d’intégration recommandé

| Étape | Intégration | Résultat attendu |
|---:|---|---|
| 1 | API tRPC + permissions fines + audit | Contrats internes stables et traçables |
| 2 | HelloAsso **ou** Stripe | Cotisations et dons réconciliés sans double source de vérité |
| 3 | E-mail transactionnel | Reçus et rappels réellement délivrés |
| 4 | Heartbeat pour rappels | Échéances et notifications idempotentes |
| 5 | Calendrier | Réunions et échéances synchronisées |
| 6 | Observabilité | Détection des erreurs et suivi de production |
| 7 | Drive, signature, SMS, OCR, comptabilité | Ajouts déclenchés par un besoin métier confirmé |

## 7. Prérequis de sécurité pour toute nouvelle API

Chaque intégration doit disposer d’un secret conservé côté serveur, d’un endpoint de santé non destructif, d’un timeout, d’une stratégie de reprise, d’une journalisation sans secrets et de tests de refus d’accès. Les webhooks doivent vérifier leur signature, refuser les événements trop anciens si le fournisseur le permet, dédupliquer les identifiants d’événements et répondre rapidement. Les données personnelles et financières doivent être minimisées, chiffrées en transit, supprimées selon une durée documentée et exclues des logs applicatifs.

## Références

[1]: https://dev.helloasso.com/docs/api-overview "HelloAsso — API Overview"

[2]: https://docs.stripe.com/api/payment-link/create "Stripe — Create a payment link / API Reference"

[3]: https://developers.google.com/workspace/calendar/api/guides/overview "Google Calendar API — Overview"
