# Audit du Schéma de Base de Données

## Problèmes Identifiés

### 1. Colonnes tinyint('1') Problématiques
Les colonnes suivantes utilisent `tinyint('1')` qui cause des erreurs SQL :
- ❌ `isActive` dans `appUsers` (ligne 75) - CORRIGÉ en `int()`
- ❌ `canView` dans `documentPermissions` (ligne 259) - CORRIGÉ en `int()`
- ❌ `canEdit` dans `documentPermissions` (ligne 260) - CORRIGÉ en `int()`
- ❌ `canDelete` dans `documentPermissions` (ligne 261) - CORRIGÉ en `int()`
- ❌ `isArchived` dans `documents` (ligne 282) - CORRIGÉ en `int()`
- ❌ `isRead` dans `notifications` (ligne 437) - CORRIGÉ en `int()`
- ❌ `isSystem` dans `emailTemplates` (ligne 330) - CORRIGÉ en `int()`
- ❌ `isSystem` dans `roles` (ligne 546) - CORRIGÉ en `int()`

### 2. Index Manquants
- ❌ Pas d'index sur `memberId` dans `adhesions`
- ❌ Pas d'index sur `userId` dans `activityLogs`
- ❌ Pas d'index sur `documentId` dans `documentPermissions`
- ❌ Pas d'index sur `memberId` dans `documentPermissions`
- ❌ Pas d'index sur `categoryId` dans `documents`
- ❌ Pas d'index sur `createdBy` dans `documents`
- ❌ Pas d'index sur `userId` dans `notifications`

### 3. Contraintes de Clés Étrangères Manquantes
- ❌ `adhesions.memberId` → `members.id`
- ❌ `documentPermissions.documentId` → `documents.id`
- ❌ `documentPermissions.memberId` → `members.id`
- ❌ `documents.categoryId` → `categories.id`
- ❌ `documents.createdBy` → `appUsers.id`
- ❌ `notifications.userId` → `appUsers.id`

### 4. Colonnes Manquantes ou Incohérentes
- ❌ Pas de colonne `type` dans `adhesions` (Standard, Premium, Bénéficiaire)
- ❌ Pas de colonne `role` dans `members`
- ❌ Pas de colonne `photo` dans `members` (existe mais non documentée)
- ❌ Pas de colonne `memberID` dans `members` (existe mais non documentée)
- ❌ Pas de table `antennes`
- ❌ Pas de table `groupes`

### 5. Incohérences de Nommage
- ❌ `appUsers` vs `users` (inconsistant)
- ❌ `appSettings` vs `settings`
- ❌ `associationInfo` vs `globalSettings`
- ❌ `activityLogs` vs `auditLogs`

## Plan de Correction

### Étape 1 : Créer une Migration de Schéma Sûre
1. Générer une migration Drizzle
2. Tester en environnement de développement
3. Valider les données existantes

### Étape 2 : Ajouter les Tables Manquantes
1. Table `antennes` (branches)
2. Table `groupes` (groupes au sein des antennes)
3. Table `permissions` (permissions granulaires)
4. Table `roles_permissions` (association rôles-permissions)

### Étape 3 : Ajouter les Index
1. Index sur les clés étrangères
2. Index sur les colonnes de recherche fréquente
3. Index composites pour les requêtes communes

### Étape 4 : Ajouter les Contraintes
1. Clés étrangères avec ON DELETE/UPDATE
2. Contraintes UNIQUE où nécessaire
3. Contraintes CHECK pour les énums

### Étape 5 : Documenter le Schéma
1. Ajouter les commentaires aux tables
2. Documenter les relations
3. Créer un diagramme ER

## Statut

- [x] Audit complet
- [ ] Créer la migration
- [ ] Tester la migration
- [ ] Appliquer la migration
- [ ] Valider les données
- [ ] Documenter le schéma final
