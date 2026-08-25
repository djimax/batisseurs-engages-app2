# Notes de recherche API

## HelloAsso
Source officielle : https://dev.helloasso.com/docs/api-overview

L’API HelloAsso v5 utilise OAuth 2.0. Les associations obtiennent leurs identifiants client dans leur espace d’administration et peuvent disposer des privilèges `AccessPublicData`, `AccessTransactions` et `Checkout`. L’intégration Checkout suit un flux de création d’intention (`POST /organizations/{organizationSlug}/checkout-intents`), redirection vers une URL temporaire, retour avec résultat, notifications d’événements Order/Payment et vérification de l’intention. La documentation mentionne aussi les notifications, la vérification d’authenticité, la pagination et les limites d’appels.

## Stripe
Source officielle : https://docs.stripe.com/api/payment-link/create

Stripe fournit une API REST avec ressources Payment Links, Checkout Sessions, Payment Intents, Customers, Refunds et Events. Pour l’application associative, les opérations utiles seraient la création de liens de paiement, l’association de métadonnées au membre/campagne, la réception d’événements et la réconciliation des paiements. Les événements webhook doivent être vérifiés côté serveur et les créations de paiement doivent être idempotentes.

## Google Calendar
Source officielle : https://developers.google.com/workspace/calendar/api/guides/overview

L’API Google Calendar est RESTful et expose notamment les ressources Event, Calendar, CalendarList, Setting et ACL. Elle peut synchroniser les réunions, échéances, récurrences, participants, fuseaux horaires et droits d’accès. Elle nécessite une autorisation OAuth Google avec des scopes limités au besoin réel.
