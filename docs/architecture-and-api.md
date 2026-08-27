# Les Bâtisseurs Engagés — Architecture, API et sécurité

## 1. Vue d’ensemble

L’application est une plateforme de gestion associative construite autour d’un frontend React 19 et d’un backend Express exposant des procédures tRPC 11. Le frontend appelle exclusivement les contrats tRPC via le client partagé, tandis que le serveur centralise l’authentification, l’autorisation, les transactions métier, l’audit et les intégrations externes.

Les données métier sont persistées dans MySQL/TiDB avec Drizzle ORM. Les fichiers binaires ne sont pas stockés dans la base : ils sont déposés dans le stockage objet S3 et la base conserve les métadonnées, les références et les événements d’accès. Les dates persistées suivent le format UTC attendu par la couche serveur et sont localisées uniquement à l’affichage.

## 2. Flux d’une requête

1. Le navigateur charge l’application React et obtient l’état de session via `auth.me`.
2. Une action métier appelle une procédure tRPC sous `/api/trpc`.
3. Le contexte serveur résout l’utilisateur authentifié.
4. La procédure vérifie le rôle, la permission ressource et, lorsque nécessaire, le périmètre d’accès.
5. La couche métier lit ou écrit via Drizzle, journalise les opérations sensibles et déclenche les notifications prévues.
6. Le résultat typé est renvoyé au client ; les caches tRPC sont invalidés après les mutations concernées.

## 3. Sécurité et conformité

L’autorisation repose sur des permissions nommées, des rôles associés à ces permissions et des périmètres `national`, `antenne`, `groupe` ou `project`. Les niveaux de périmètre sont `viewer`, `editor` et `manager`. Le rôle administrateur conserve un accès transversal, tandis que les autres utilisateurs doivent posséder explicitement la permission requise.

Les opérations sensibles doivent utiliser `assertPermission` ou `permissionProcedure`. Les actions documentaires, financières, achats, gouvernance, CRM et RGPD sont auditées. Le cycle documentaire conserve les versions, les empreintes de signature, les journaux d’accès, les actions de conservation et les décisions de revue. Les demandes RGPD sont traitées comme un workflow contrôlé et non comme une suppression automatique.

> Principe d’exploitation : une fonctionnalité d’écriture doit être protégée par une permission `*.manage` ou une permission d’action spécialisée ; une simple lecture doit utiliser `*.view` lorsque les données sont sensibles.

## 4. Intégrations

Stripe crée les sessions de paiement et son webhook confirme les paiements de manière idempotente via l’identifiant d’événement. Les confirmations peuvent produire une transaction, une notification in-app dédupliquée et un email Brevo. Les contributions affectées à une campagne mettent à jour le montant collecté et alertent le créateur au franchissement du seuil de 80 %.

Le stockage objet S3 est la source de vérité pour les fichiers. Google Drive/OneDrive reste optionnel et n’est pas requis pour le cycle documentaire local. La configuration des secrets est externalisée dans l’environnement du projet.

## 5. Tests et validation

La validation minimale avant un jalon comprend `pnpm exec tsc --noEmit`, les tests unitaires Vitest du module modifié, puis une régression ciblée des modules dépendants. Les tests contractuels vérifient notamment la présence des garde-fous d’autorisation, les clés de déduplication et les flux Stripe critiques.

## 6. Limites connues

Le temps réel WebSocket n’est pas encore activé ; le centre de notifications s’appuie sur les lectures tRPC et les invalidations de cache. L’import Drive/OneDrive est suspendu tant qu’une voie d’intégration compatible avec les contraintes de facturation n’est pas confirmée. Les rapports financiers avancés restent un lot distinct.
