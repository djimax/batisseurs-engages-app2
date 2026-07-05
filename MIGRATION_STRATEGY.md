# Stratégie de Migration du Schéma

## Problème Identifié

La migration automatique de Drizzle détecte que le nouveau schéma est très différent de l'ancien et propose de renommer/supprimer les anciennes tables. Cela est risqué car :

1. Les données existantes pourraient être perdues
2. Les relations entre tables pourraient être cassées
3. Les migrations générées peuvent avoir des erreurs

## Solution : Migration Progressive et Sûre

### Phase 1 : Préparation (COMPLÉTÉE)
- ✅ Créer le nouveau schéma refactorisé (`schema-refactored.ts`)
- ✅ Créer un audit complet des changements
- ✅ Documenter la stratégie de migration

### Phase 2 : Migration Progressive (EN COURS)

#### Approche Recommandée : Coexistence Temporaire

1. **Garder les anciennes tables** pendant la transition
2. **Créer les nouvelles tables** en parallèle
3. **Migrer les données** progressivement
4. **Valider** les données migrées
5. **Supprimer** les anciennes tables

#### Étapes Détaillées

**Étape 1 : Ajouter les Nouvelles Tables**
```sql
-- Créer les tables de structure organisationnelle
CREATE TABLE antennes (...)
CREATE TABLE groupes (...)

-- Créer les tables de permissions
CREATE TABLE permissions (...)
CREATE TABLE role_permissions (...)
CREATE TABLE user_roles (...)

-- Créer les tables de projets
CREATE TABLE projects (...)
CREATE TABLE tasks (...)

-- Ajouter les colonnes manquantes aux tables existantes
ALTER TABLE members ADD COLUMN memberID VARCHAR(50);
ALTER TABLE members ADD COLUMN role VARCHAR(100);
ALTER TABLE members ADD COLUMN photo TEXT;
ALTER TABLE members ADD COLUMN antenneId INT;
ALTER TABLE members ADD COLUMN groupeId INT;

ALTER TABLE adhesions ADD COLUMN type ENUM('standard','premium','beneficiary');
```

**Étape 2 : Migrer les Données**
```sql
-- Copier les données des anciennes tables vers les nouvelles
-- Avec transformation des types si nécessaire
```

**Étape 3 : Valider les Données**
```sql
-- Vérifier l'intégrité des données
-- Vérifier les contraintes de clés étrangères
-- Vérifier les doublons
```

**Étape 4 : Nettoyer les Anciennes Tables**
```sql
-- Supprimer les anciennes tables
-- Renommer les nouvelles tables si nécessaire
```

## Implémentation Alternative : Nouvelle Base de Données

Si la migration progressive est trop complexe :

1. Créer une nouvelle base de données avec le nouveau schéma
2. Migrer les données en utilisant des scripts
3. Tester complètement
4. Basculer l'application vers la nouvelle base
5. Supprimer l'ancienne base

## Recommandation

**Pour ce projet, je recommande :**

1. Créer une migration manuelle étape par étape
2. Garder les anciennes tables comme "legacy"
3. Ajouter les nouvelles tables progressivement
4. Tester chaque étape
5. Documenter tous les changements

Cela minimise les risques et permet de revenir en arrière si nécessaire.

## Statut

- [x] Audit complet
- [x] Schéma refactorisé créé
- [ ] Migration progressive implémentée
- [ ] Données migrées
- [ ] Validation complète
- [ ] Nettoyage des anciennes tables
