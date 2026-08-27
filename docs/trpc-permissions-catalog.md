# Catalogue tRPC et permissions

Ce document décrit les domaines fonctionnels principaux. Les noms correspondent aux permissions du catalogue serveur ; l’administrateur est autorisé par le garde-fou global.

| Domaine | Lectures principales | Écritures principales | Permission de lecture | Permission d’écriture |
|---|---|---|---|---|
| Documents | liste, détail, versions, accès, recherches | création, modification, archivage, restauration, revue | `documents.view` | `documents.manage` |
| Signatures | demandes et preuves | création, annulation, administration, signature assignée | `signatures.view` | `signatures.manage` / `signatures.sign` |
| Membres | annuaire et fiches | création, modification et gestion | `members.view` | `members.manage` |
| CRM | contacts, activités, pipeline, rapports, historique email | création, modification, suppression | `crm.view` | `crm.manage` |
| Finances | cotisations, dons, dépenses, transactions, campagnes | opérations financières et paiements | `finances.view` | `finances.manage` |
| Fournisseurs | fournisseurs, demandes et devis | création, modification | `suppliers.view`, `purchases.view` | `suppliers.manage`, `purchases.manage` |
| Achats | demandes, devis et statuts | création, modification, approbation/rejet | `purchases.view` | `purchases.manage`, `purchases.approve` |
| Projets | projets, membres, tâches, commentaires, rapports, jalons, mises à jour, budgets | création, modification, suppression des ressources | `projects.view` | `projects.manage` |
| Structures | antennes et groupes | création et modification | `structures.view` | `structures.manage` |
| Gouvernance | assemblées, résolutions, procès-verbaux | administration et votes | `governance.view` | `governance.manage`, `governance.vote` |
| Communication | annonces et actualités | publication et gestion | `communication.view` | `communication.manage` |
| Administration | rôles, utilisateurs, périmètres, audit | configuration et attribution | `admin.roles.view`, `admin.scopes.view`, `admin.audit.view` | `admin.roles.manage`, `admin.users.manage`, `admin.scopes.manage` |

## Règles d’implémentation

Les procédures protégées doivent recevoir `ctx` et appeler `assertPermission(ctx.user, permission)` avant l’accès aux données. Les mutations ne doivent pas se contenter d’un contrôle visuel côté React. Lorsqu’un périmètre est pertinent, `assertScope` complète la permission avec le type et le niveau d’accès.

Les notifications sont créées côté serveur par `createUserNotification`. Toute notification issue d’un webhook ou d’un événement rejouable doit définir une `dedupeKey` stable. Les événements de paiement Stripe doivent rester idempotents grâce à la table des événements Stripe et ne doivent jamais dépendre d’un état local du navigateur.

## Contrôles de revue

Avant d’ajouter une procédure, vérifier qu’elle est montée dans le routeur racine, qu’elle utilise un schéma Zod stable, qu’elle possède une permission explicite, qu’elle journalise les opérations sensibles et qu’un test contractuel ou métier couvre au moins le chemin autorisé et le chemin refusé.
