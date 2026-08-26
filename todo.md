# Les Bâtisseurs Engagés - Gestion d'Association

## Fonctionnalités Principales

- [x] Schéma de base de données (documents, catégories, notes, membres, activités)
- [x] Routes tRPC backend (CRUD documents, upload, notes, membres)
- [x] Intégration stockage S3 pour fichiers
- [x] Système de gestion documentaire par catégories (Juridique, Gouvernance, Opérationnel, Financier, RH, Communication, Financement)
- [x] Chargement de fichiers locaux (Word, Excel, PDF, images)
- [x] Téléchargement et impression de documents avec aperçu
- [x] Tableau de bord avec statistiques en temps réel
- [x] Système de recherche et filtrage avancé
- [x] Gestion des notes et commentaires par document
- [x] Système de notifications pour alerter le propriétaire
- [x] Interface responsive avec design moderne
- [x] Export de rapports en PDF
- [x] Gestion des membres et permissions d'accès

## Interface Utilisateur

- [x] Layout Dashboard avec sidebar navigation
- [x] Page d'accueil avec statistiques
- [x] Page liste des documents avec filtres
- [x] Modal de détail document avec notes
- [x] Formulaire d'upload de fichiers
- [x] Page gestion des membres
- [x] Page catégories avec progression
- [x] Page historique d'activité

## Tests

- [x] Tests unitaires backend (16 tests passés)
- [x] Validation fonctionnelle


## Améliorations Phase 2

### Archivage et Restauration
- [x] Page Archives pour gérer les documents archivés
- [x] Route d'archivage des documents (documents.archive)
- [x] Route de restauration des documents archivés (documents.restore)
- [x] Route pour lister les documents archivés (documents.archived)
- [x] Lien Archives dans le menu de navigation
- [x] Filtrage des documents archivés par catégorie
- [x] Recherche dans les documents archivés
- [x] Bouton d'archivage dans le menu des documents
- [x] Bouton de restauration dans la page archives

### Système de Permissions par Rôle
- [x] Ajout du champ memberRole au schéma des membres
- [x] Trois niveaux de rôle : Admin, Secrétaire, Membre
- [x] Admin : Accès complet à tous les documents
- [x] Secrétaire : Peut créer et modifier les documents
- [x] Membre : Accès en lecture seule
- [x] Interface de gestion des rôles dans la page Membres
- [x] Affichage des rôles avec icônes et descriptions

### Tests
- [x] Tests unitaires pour archivage (5 tests)
- [x] Tests d'archivage de documents
- [x] Tests de restauration de documents
- [x] Tests de listage des documents archivés
- [x] Tests de filtrage par catégorie
- [x] Tests de recherche dans les archives
- [x] Tous les 21 tests passent avec succès

### Corrections et Améliorations
- [x] Correction des erreurs TypeScript
- [x] Ajout des imports manquants (Archive icon)
- [x] Intégration des nouvelles routes au frontend
- [x] Synchronisation des mutations avec les routes backend
- [x] Invalidation des caches après archivage/restauration

## Fonctionnalités Futures (Non Implémentées)
- [ ] Système de dates d'échéance avec rappels automatiques
- [ ] Notifications par email pour les documents urgents
- [ ] Intégration calendrier pour les échéances
- [ ] Système d'approbation de documents
- [ ] Historique des versions de documents
- [ ] Partage de documents avec permissions granulaires
- [ ] Commentaires collaboratifs sur les documents
- [ ] Intégration avec Google Drive ou OneDrive
- [ ] Signature électronique des documents
- [ ] Audit trail complet des modifications


## Phase 3 - Mode Hors Ligne (Sans Internet)

### Modifications pour Mode Hors Ligne
- [x] Retirer l'authentification Manus
- [x] Implémenter le stockage local IndexedDB pour les données
- [x] Implémenter le stockage local des fichiers
- [x] Créer une interface sans authentification
- [x] Créer une application complète hors ligne (OfflineApp)
- [x] Page de connexion simple sans Internet
- [x] Gestion des documents avec stockage localStorage
- [x] Gestion des membres avec stockage localStorage
- [x] Tableau de bord avec statistiques locales
- [x] Navigation entre les pages
- [x] Tester l'application hors ligne


## Phase 4 - Mode Hybride (En ligne + Hors Ligne)

### Fonctionnalités Mode Hybride
- [x] Créer une page de sélection de mode au démarrage
- [x] Modifier App.tsx pour supporter les deux modes
- [x] Tester le mode en ligne avec Manus
- [x] Tester le mode hors ligne avec localStorage
- [x] Permettre le changement de mode


## Corrections et Bugs

- [x] Créer la page Settings (correction erreur 404)
- [x] Ajouter la route /settings à App.tsx
- [x] Le bouton Settings est déjà dans le menu de navigation (dropdown profil)


## Phase 5 - Améliorations Avancées

### Backup et Export
- [x] Fonction d'export des donnees en JSON
- [x] Fonction d'import des donnees depuis JSON
- [x] Bouton de backup automatique dans Settings
- [x] Telechargement du fichier de backup
- [x] Hook useBackup avec exportData et importData
- [x] Affichage de la taille du backup

### Historique de Synchronisation
- [x] Tracker la derniere synchronisation
- [x] Afficher le statut de synchronisation dans Settings
- [x] Afficher le nombre de documents synchronises
- [x] Afficher l'historique des changements
- [x] Hook useSyncHistory avec statistiques
- [x] Affichage des evenements totaux, d'aujourd'hui, reussis et erreurs

### Preferences Utilisateur
- [x] Langue (FR/EN)
- [x] Format de date (DD/MM/YYYY, MM/DD/YYYY)
- [x] Notifications par email
- [x] Sauvegarde des preferences
- [x] Hook usePreferences avec traductions
- [x] Formatage des dates selon les preferences
- [x] Interface Settings complete avec toutes les options

### Tests Phase 5
- [x] Tests unitaires pour useBackup
- [x] Tests unitaires pour usePreferences
- [x] Tests unitaires pour useSyncHistory
- [x] Tous les tests passent (21/21)


## Phase 6 - Intégration du Logo Officiel

### Logo
- [x] Copier le logo dans le dossier public
- [x] Intégrer le logo dans ModeSelector
- [x] Intégrer le logo dans DashboardLayout (sidebar et login)
- [x] Intégrer le logo dans Offline
- [x] Logo affiche correctement sur tous les modes
- [x] Tester l'affichage du logo sur tous les appareils


## Phase 7 - Gestion Financière (Cotisations, Dons, Dépenses)

### Schéma de Base de Données
- [x] Table transactions (id, type, montant, description, date, memberId)
- [x] Table cotisations (id, memberId, montant, dateDebut, dateFin, statut)
- [x] Table dons (id, donateur, montant, description, date)
- [x] Table dépenses (id, description, montant, catégorie, date, approuvéPar)

### Routes tRPC Financières
- [x] Route pour créer une cotisation
- [x] Route pour mettre à jour une cotisation
- [x] Route pour lister les cotisations
- [x] Route pour créer un don
- [x] Route pour lister les dons
- [x] Route pour créer une dépense
- [x] Route pour lister les dépenses
- [x] Route pour obtenir les statistiques financières

### Interface Utilisateur
- [x] Page Finance avec gestion des cotisations
- [x] Formulaire d'ajout de cotisation
- [x] Tableau des cotisations avec statut (payée, en attente, en retard)
- [x] Formulaire d'ajout de don
- [x] Tableau des dons
- [x] Formulaire d'ajout de dépense
- [x] Tableau des dépenses
- [x] Tableau de bord financiér avec statistiques (4 cartes)
- [x] Lien Finance dans le menu de navigation
- [x] Onglets pour naviguer entre cotisations, dons et dépenses

### Fonctionnalités Implémentées
- [x] Suivi des cotisations par membre
- [x] Statut des cotisations (payée, en attente, en retard)
- [x] Historique des transactions
- [x] Bilan financiér (revenus - dépenses)
- [x] Catégories de dépenses (fournitures, loyer, utilities, transport, communication)


## Phase 8 - Améliorations Financières Avancées

### Graphiques Financiers
- [x] Graphique camembert pour répartition des dépenses par catégorie
- [x] Graphique histogramme pour revenus vs dépenses mensuels
- [x] Graphique courbe pour évolution du solde dans le temps
- [x] Intégration Recharts pour les visualisations
- [x] Composant FinanceCharts créé

### Rappels de Cotisations
- [x] Système de détection des cotisations en retard
- [x] Hook useCotisationReminders implémenté
- [x] Calcul des jours en retard et expiration imminente
- [x] Statistiques de rappels (en retard, expiré bientôt)
- [x] Prêt pour intégration dans la page Finance

### Export PDF de Rapports Financiers
- [x] Fonction d'export PDF du rapport financier complet
- [x] Composant FinanceReportPDF créé
- [x] Génération HTML pour impression/PDF
- [x] Détail des transactions par type
- [x] Résumé des cotisations, dons et dépenses
- [x] Bouton d'export prêt pour la page Finance


## Phase 9 - Intégration Graphiques et Ajustements

### Intégration Graphiques Financiers
- [x] Intégrer FinanceCharts dans la page Finance
- [x] Afficher les graphiques avec données réelles
- [x] Ajouter onglet "Graphiques" dans la page Finance
- [x] Composant FinanceCharts créé avec Recharts (camembert, histogramme, courbe)

### Remplacement Euro par Franc
- [x] Remplacer € par F dans Finance.tsx
- [x] Remplacer € par F dans FinanceCharts.tsx
- [x] Remplacer € par F dans FinanceReportPDF.tsx
- [x] Remplacer € par F dans tous les montants affichés
- [x] Tous les symboles monnétaires affichent maintenant en F (Franc)

### Nouveaux Rôles de Membres
- [x] Ajouter "Président" au schéma et interface
- [x] Ajouter "Secrétaire Général" au schéma et interface
- [x] Ajouter "Secrétaire Général Adjoint" au schéma et interface
- [x] Ajouter "Trésorier Général" au schéma et interface
- [x] Ajouter "Trésorier Général Adjoint" au schéma et interface
- [x] Mettre à jour la page Members avec tous les nouveaux rôles
- [x] Formulaires d'ajout et modification de membre mis à jour


## Phase 10 - Améliorations Inspirées de HelloAsso

### Dashboard d'Accueil Amélioré
- [ ] Créer un nouveau dashboard avec onboarding pour nouveaux utilisateurs
- [ ] Afficher les étapes de configuration (3 étapes comme HelloAsso)
- [ ] Barre de progression pour l'onboarding
- [ ] Afficher les informations de l'association (nom, RIB, etc.)
- [ ] Section "Ressources utiles" avec liens vers guides et formations
- [ ] Afficher le solde total collecté en évidence
- [ ] Afficher les paiements des 7 derniers jours
- [ ] Afficher les campagnes en cours

### Système de Campagnes de Collecte
- [ ] Créer une table "campaigns" pour les campagnes de collecte
- [ ] Page Campagnes avec liste et création
- [ ] Formulaire de création de campagne (titre, description, objectif, date fin)
- [ ] Afficher le montant collecté vs objectif
- [ ] Barre de progression pour chaque campagne
- [ ] Lien direct pour partager la campagne
- [ ] Historique des contributions par campagne

### Système de Paiements en Ligne
- [ ] Intégration HelloAsso API (si possible) ou Stripe
- [ ] Générer des liens de paiement pour les cotisations
- [ ] Générer des liens de paiement pour les dons
- [ ] Suivi des paiements en attente
- [ ] Notifications automatiques quand un paiement est reçu
- [ ] Historique des tentatives de paiement

### Rapports Financiers Avancés
- [ ] Rapport mensuel détaillé
- [ ] Rapport annuel avec comparaison année précédente
- [ ] Prévisions budgétaires
- [ ] Analyse des tendances de collecte
- [ ] Export en Excel avec mise en forme
- [ ] Graphiques comparatifs (cotisations vs dons vs dépenses)
- [ ] Rapport par source de revenus

### Système de Notifications et Alertes
- [ ] Notifications pour les cotisations en retard
- [ ] Alertes pour les paiements reçus
- [ ] Rappels automatiques pour les cotisations à venir
- [ ] Notifications pour les campagnes proches de l'objectif
- [ ] Notifications pour les dépenses approuvées
- [ ] Centre de notifications avec historique
- [ ] Configuration des préférences de notification par utilisateur

### Gestion des Adhésions
- [ ] Page Adhésions pour gérer les adhésions annuelles
- [ ] Formulaire d'adhésion en ligne
- [ ] Suivi des adhésions par année
- [ ] Renouvellement automatique des adhésions
- [ ] Rappels de renouvellement d'adhésion

### Amélioration de l'Interface
- [ ] Design inspiré de HelloAsso (couleurs, layout)
- [ ] Navigation améliorée avec icônes
- [ ] Cartes de statistiques plus visuelles
- [ ] Utilisation de graphiques dans le dashboard
- [ ] Responsive design optimisé
- [ ] Mode sombre/clair amélioré

### Sécurité et Conformité
- [ ] Chiffrement des données sensibles
- [ ] Audit trail complet des modifications
- [ ] Conformité RGPD (export de données, suppression)
- [ ] Sauvegarde automatique des données
- [ ] Historique des accès utilisateurs


## Phase 10 - Améliorations Inspirées de HelloAsso (EN COURS)

### Schéma de Base de Données
- [x] Table campaigns pour les campagnes de collecte
- [x] Table adhesions pour les adhésions annuelles
- [x] Table notifications pour les notifications système
- [x] Table associationInfo pour les informations de l'association
- [x] Migration de base de données appliquée

### Pages Créées
- [x] Page Campaigns.tsx avec gestion des campagnes
- [x] Page Adhesions.tsx avec gestion des adhésions
- [x] Routes /campaigns et /adhesions ajoutées à App.tsx
- [x] Menu de navigation mis à jour avec les nouvelles pages
- [x] Icônes Megaphone et UserCheck ajoutées au menu

### Fonctionnalités Campagnes
- [x] Affichage des campagnes actives
- [x] Formulaire de création de campagne
- [x] Barre de progression pour chaque campagne
- [x] Affichage du montant collecté vs objectif
- [x] Statuts de campagne (draft, active, completed, cancelled)
- [x] Édition et suppression de campagnes
- [x] Statistiques de collecte (campagnes actives, total collecté, objectif total)

### Fonctionnalités Adhésions
- [x] Affichage des adhésions par année
- [x] Formulaire de création d'adhésion
- [x] Suivi des adhésions actives et expirées
- [x] Affichage des jours restants avant expiration
- [x] Filtrage par année
- [x] Statistiques d'adhésions (total, actives, expirées, total collecté)
- [x] Statuts d'adhésion (active, expired, pending)


## Phase 11 - Optimisation SEO

### Page d'Accueil (/)
- [x] Ajouter une description meta (120 caractères)
- [x] Ajouter des mots-clés meta
- [x] Ajouter des titres H2 (3 sections)
- [x] Améliorer le H1 avec mots-clés
- [x] Améliorer la description du H1
- [x] Ajouter des mots-clés pertinents : "gestion association", "gestion documentaire", "gestion financière", "gestion membres", "plateforme association", "collecte de fonds"


## Phase 12 - Authentification par Mot de Passe

### Page de Connexion
- [ ] Créer une page Login.tsx avec formulaire de mot de passe
- [ ] Design moderne et responsive
- [ ] Validation du mot de passe
- [ ] Messages d'erreur clairs

### Gestion de Session
- [ ] Créer un hook usePasswordAuth pour gérer l'authentification
- [ ] Stocker le token dans sessionStorage
- [ ] Fonction de connexion et déconnexion
- [ ] Vérification de l'authentification au chargement

### Intégration au Routage
- [ ] Créer un ProtectedRoute pour vérifier l'authentification
- [ ] Redirection vers login si non authentifié
- [ ] Intégration dans App.tsx
- [ ] Bouton de déconnexion dans le menu

### Configuration
- [x] Définir le mot de passe par défaut (configurable)
- [x] Ajouter le mot de passe dans les variables d'environnement
- [x] Documentation sur comment changer le mot de passe

### Pages de Connexion
- [x] Créer une page Login.tsx avec formulaire de mot de passe
- [x] Design moderne et responsive
- [x] Validation du mot de passe
- [x] Messages d'erreur clairs

### Gestion de Session
- [x] Créer un hook usePasswordAuth pour gérer l'authentification
- [x] Stocker le token dans sessionStorage
- [x] Fonction de connexion et déconnexion
- [x] Vérification de l'authentification au chargement

### Intégration au Routage
- [x] Créer un ProtectedRoute pour vérifier l'authentification
- [x] Redirection vers login si non authentifié
- [x] Intégration dans App.tsx
- [x] Bouton de déconnexion dans le menu


## Phase 13 - Authentification Identifiant + Mot de Passe

- [x] Modifier usePasswordAuth pour accepter identifiant + mot de passe
- [x] Mettre à jour Login.tsx avec deux champs (identifiant et mot de passe)
- [x] Ajouter validation des deux champs
- [x] Tester la connexion avec les nouvelles identifiants


## Phase 14 - Mot de Passe Oublié

- [x] Créer une page ForgotPassword.tsx
- [x] Ajouter un lien "Mot de passe oublié" sur la page Login
- [x] Implémenter la récupération par email ou question de sécurité
- [x] Afficher un message de confirmation

## Phase 15 - Calendrier d'Événements

### Base de Données
- [x] Ajouter la table events dans le schéma Drizzle
- [x] Inclure : titre, description, date début, date fin, lieu, type

### Page Calendrier
- [x] Créer une page Events.tsx
- [x] Afficher les événements dans un calendrier
- [x] Filtrer par passé/présent/futur
- [x] Ajouter/modifier/supprimer des événements
- [x] Afficher les détails des événements

### Intégration
- [x] Ajouter le menu dans DashboardLayout
- [x] Intégrer les routes dans App.tsx


## Phase 16 - Système de Rôles et Permissions

### Architecture
- [x] Créer un fichier permissions.ts avec définition des rôles et permissions
- [x] Ajouter les rôles : Admin, Membre
- [x] Définir les permissions par fonctionnalité

### Hooks et Contexte
- [x] Créer un hook useRole pour vérifier le rôle de l'utilisateur
- [x] Créer un hook usePermission pour vérifier les permissions
- [x] Créer un contexte RoleContext pour partager les rôles

### Composants
- [x] Créer un composant ProtectedFeature pour afficher/masquer les fonctionnalités
- [x] Créer un composant RoleSelector pour changer de rôle (dev)
- [x] Ajouter des badges de rôle dans le profil utilisateur

### Implémentation par Page
- [x] Restreindre l'accès aux pages sensibles (Settings, Finance, etc)
- [x] Ajouter des boutons d'action conditionnels (Ajouter, Modifier, Supprimer)
- [x] Afficher des messages d'accès refusé appropriés

### UI/UX
- [x] Afficher le rôle actuel dans le menu utilisateur
- [x] Ajouter des indicateurs visuels pour les actions restreintes
- [x] Implémenter des toasts pour les accès refusés


## Phase 17 - Gestion des Utilisateurs (Identifiants et Mots de Passe)

### Base de Données
- [x] Créer une table app_users avec username, password (hashé), role, email
- [x] Ajouter des champs : createdAt, updatedAt, isActive
- [x] Créer des index sur username pour les recherches rapides

### Page de Gestion
- [x] Créer une page UserManagement.tsx
- [x] Afficher la liste des utilisateurs (Admin, Membre)
- [x] Ajouter un formulaire de création d'utilisateur
- [x] Ajouter un formulaire de modification du mot de passe
- [x] Ajouter la suppression d'utilisateurs
- [x] Afficher les détails de chaque utilisateur

### Fonctionnalités
- [x] Générer des mots de passe sécurisés
- [ ] Hasher les mots de passe (bcrypt)
- [x] Validation des identifiants (unicité)
- [x] Confirmation avant suppression
- [ ] Historique des modifications

### Authentification
- [ ] Modifier le hook usePasswordAuth pour utiliser la base de données
- [ ] Vérifier les identifiants contre la table app_users
- [ ] Implémenter le hashage/vérification des mots de passe
- [ ] Gérer les sessions utilisateur

### Permissions
- [x] Seul l'Admin peut accéder à la page de gestion
- [x] Seul l'Admin peut créer/modifier/supprimer des utilisateurs
- [x] Les utilisateurs ne peuvent modifier que leur propre mot de passe

## Phase 18 - Page d'Accès Sécurisé vers l'Application Manus

### Page Portail
- [x] Créer une page AdminPortal.tsx
- [x] Afficher un message de bienvenue personnalisé
- [x] Ajouter un bouton d'accès à l'application Manus (lesbatisseursengages.manus.space)
- [x] Afficher les informations de l'utilisateur connecté
- [x] Ajouter des instructions d'utilisation

### Sécurité
- [x] Restreindre l'accès aux administrateurs uniquement
- [x] Afficher un message pour les accès non autorisés
- [x] Ajouter un lien de retour au site public

### Intégration
- [x] Ajouter la route /admin-portal dans App.tsx
- [x] Créer un bouton caché sur le site public (optionnel)
- [x] Ajouter la page au menu de navigation

## Phase 19 - Corrections et Améliorations

### Sauvegarde des Utilisateurs
- [x] Implémenter la sauvegarde des utilisateurs en base de données (localStorage)
- [x] Créer des procédures tRPC pour créer/modifier/supprimer les utilisateurs
- [x] Ajouter la validation et les messages d'erreur
- [x] Tester la persistance des données

### Liens "Mot de Passe Oublié"
- [x] Ajouter un lien fonctionnel sur la page de connexion
- [x] Créer une route vers la page ForgotPassword
- [x] Tester la navigation

## Phase 20 - Authentification par Email et Réinitialisation

### Modification de l'Authentification
- [x] Changer l'identifiant de "username" à "email"
- [x] Mettre à jour la page Login pour utiliser l'email
- [x] Modifier usePasswordAuth pour vérifier l'email
- [x] Mettre à jour UserManagement pour utiliser l'email

### Envoi d'Email pour Réinitialisation
- [x] Créer une fonction d'envoi d'email
- [x] Modifier la page ForgotPassword pour envoyer un email
- [x] Ajouter un bouton "Réinitialiser" qui envoie un email à contact.lesbatisseursengages@gmail.com
- [x] Afficher un message de confirmation après envoi
- [x] Intégrer un service d'email (Nodemailer, SendGrid, etc.)

## Phase 21 - Amélioration du Design Moderne

### Styles CSS
- [x] Ajouter les gradients et animations dans index.css
- [x] Créer les classes pour le hero section
- [x] Ajouter les animations fade-in et slide-in
- [x] Créer les classes card-hover et glass-card

### Page Home
- [x] Mettre à jour avec le hero section bleu
- [x] Ajouter les statistiques en direct
- [x] Implémenter les cartes avec animations
- [x] Ajouter la section des documents urgents

### Page Login
- [x] Améliorer le design avec gradients
- [x] Ajouter des animations
- [x] Améliorer la typographie et l'espacement

## Phase 22 - Système d'Audit Complet

### Table et Fonctionnalités
- [x] Créer la table auditLogs dans la base de données
- [x] Ajouter les colonnes : userId, userEmail, action, entityType, entityId, entityName, changes, oldValue, newValue, description, ipAddress, userAgent, status, errorMessage
- [x] Créer un fichier audit.ts avec fonctions d'enregistrement
- [x] Intégrer l'audit dans les pages (documents, membres, finances, utilisateurs, connexions)

### Page Historique
- [x] Créer une page AuditHistory.tsx
- [x] Afficher l'historique complet des modifications
- [x] Ajouter des filtres par action, type d'entité
- [x] Ajouter une recherche par utilisateur ou entité
- [x] Afficher les modifications avant/après
- [x] Ajouter un export CSV de l'historique

### Intégration
- [x] Ajouter la route /audit-history dans App.tsx
- [x] Ajouter le menu dans DashboardLayout
- [x] Tester la persistance de l'historique

## Phase 23 - Système de Devises (CFA et Euro)

### Contexte et Hook
- [x] Créer un contexte CurrencyContext pour gérer la devise sélectionnée
- [x] Créer un hook useCurrency pour accéder à la devise et aux fonctions de conversion
- [x] Ajouter la persistance de la devise en localStorage

### Page Paramètres
- [x] Ajouter une option de devise dans les paramètres (Settings)
- [x] Permettre le choix entre CFA (F) et Euro (€)
- [x] Afficher la devise sélectionnée
- [x] Sauvegarder la devise dans localStorage

### Affichage des Montants
- [x] Mettre à jour la page Home pour afficher la devise correcte
- [x] Mettre à jour la page Finance pour afficher la devise correcte
- [x] Mettre à jour la page Campaigns pour afficher la devise correcte
- [x] Mettre à jour la page Adhesions pour afficher la devise correcte
- [x] Mettre à jour les graphiques financiers pour afficher la devise correcte
- [x] Mettre à jour les rapports PDF pour afficher la devise correcte

### Tests
- [x] Tester le changement de devise
- [x] Tester la persistance de la devise après rechargement
- [x] Vérifier tous les affichages de montants


## Phase 24 - Conversion Automatique de Devises

### Contexte et Conversion
- [x] Mettre à jour CurrencyContext avec taux de change modifiable
- [x] Ajouter fonction de conversion EUR vers CFA
- [x] Ajouter fonction de conversion CFA vers EUR
- [x] Persister le taux de change en localStorage
- [x] Taux de change par défaut : 1 EUR = 655.957 CFA

### Interface de Gestion
- [x] Ajouter une section dans Settings pour modifier le taux de change
- [x] Afficher le taux actuel
- [x] Permettre la modification du taux
- [x] Ajouter un bouton "Réinitialiser au taux par défaut"
- [x] Afficher un message de confirmation après modification

### Composant de Conversion
- [x] Créer un composant CurrencyConverter
- [x] Afficher deux champs : EUR et CFA
- [x] Conversion en temps réel lors de la saisie
- [x] Afficher le taux de change utilisé
- [x] Intégrer dans une page ou modal accessible

### Tests
- [x] Tester la conversion EUR vers CFA
- [x] Tester la conversion CFA vers EUR
- [x] Tester la modification du taux de change
- [x] Tester la persistance du taux après rechargement
- [x] Vérifier la réinitialisation au taux par défaut


## Phase 25 - Synchronisation des Montants par Devise

### Utilitaire de Formatage
- [x] Créer un hook useFormatAmount pour formater les montants avec conversion
- [x] Gérer l'affichage en EUR ou CFA selon la sélection
- [x] Afficher l'équivalence en devise alternative

### Composants Réutilisables
- [x] Créer un composant AmountDisplay pour afficher les montants formatés
- [x] Créer un composant AmountWithEquivalent pour afficher EUR + CFA
- [x] Créer un composant AmountTableCell pour les tableaux

### Page Finance
- [x] Afficher les cotisations dans la devise sélectionnée
- [x] Afficher les dons dans la devise sélectionnée
- [x] Afficher les dépenses dans la devise sélectionnée
- [x] Mettre à jour les totaux et statistiques financières

### Page Campaigns
- [x] Afficher les montants collectés dans la devise sélectionnée
- [x] Afficher les objectifs dans la devise sélectionnée
- [x] Mettre à jour les statistiques de campagne

### Page Adhesions
- [x] Afficher les montants de cotisation dans la devise sélectionnée
- [x] Afficher les montants totaux par membre

### Tests
- [x] Tester l'affichage des montants en EUR
- [x] Tester l'affichage des montants en CFA
- [x] Tester la conversion lors du changement de devise
- [x] Vérifier que tous les montants sont synchronisés


## Phase 26 - Gestion Administrative

### Schéma de Base de Données
- [x] Ajouter table memberStatuses pour tracker les changements de statut
- [x] Ajouter table memberHistory pour l'historique des modifications
- [x] Ajouter table roles pour définir les rôles
- [x] Ajouter table permissions pour définir les permissions
- [x] Ajouter table rolePermissions pour lier rôles et permissions
- [x] Ajouter table userRoles pour assigner les rôles aux utilisateurs
- [x] Ajouter table auditLogs pour tracker toutes les activités
- [x] Migrer la base de données avec pnpm db:push

### Procédures tRPC - Rôles et Permissions
- [x] Créer procedure admin.getRoles
- [x] Créer procedure admin.getPermissions
- [x] Créer procedure admin.createRole
- [x] Créer procedure admin.updateRole
- [x] Créer procedure admin.deleteRole
- [x] Créer procedure admin.assignRoleToUser
- [x] Créer procedure admin.removeRoleFromUser
- [x] Créer procedure admin.getRolePermissions

### Procédures tRPC - Audit
- [x] Créer procedure admin.getAuditLogs
- [x] Créer procedure admin.getAuditLogsByUser
- [x] Créer procedure admin.getAuditLogsByEntity
- [x] Créer procedure admin.getAuditLogsByAction

### Pages d'Interface
- [x] Créer page AdminRoles.tsx pour gérer les rôles
- [x] Créer page AdminPermissions.tsx pour gérer les permissions
- [x] Créer page AdminAuditLogs.tsx pour consulter les logs
- [x] Ajouter les routes dans App.tsx
- [x] Ajouter les liens de navigation

### Tests
- [x] Tester la création de rôles
- [x] Tester l'assignation de rôles aux utilisateurs
- [x] Tester l'enregistrement des logs d'audit
- [x] Vérifier que les logs contiennent les bonnes informations


## Phase 27 - Annonces et Actualités

### Schéma de Base de Données
- [x] Ajouter table announcements pour les annonces
- [x] Ajouter table news pour les actualités
- [x] Ajouter table newsComments pour les commentaires
- [x] Migrer la base de données

### Procédures tRPC
- [x] Créer procedure announcements.getAll
- [x] Créer procedure announcements.create
- [x] Créer procedure announcements.update
- [x] Créer procedure announcements.delete
- [x] Créer procedure news.getAll
- [x] Créer procedure news.create
- [x] Créer procedure news.update
- [x] Créer procedure news.delete
- [x] Créer procedure news.addComment
- [x] Créer procedure news.deleteComment

### Page d'Interface
- [x] Créer page Announcements.tsx
- [x] Créer page News.tsx
- [x] Ajouter les routes dans App.tsx
- [x] Ajouter les liens de navigation

### Tests
- [x] Tester la création d'annonces
- [x] Tester la création de news
- [x] Tester les commentaires
- [x] Vérifier l'affichage des annonces et news


## Phase 28 - Système d'Envoi d'Emails en Masse

### Schéma de Base de Données
- [x] Ajouter table emailTemplates pour les templates d'emails
- [x] Ajouter table emailHistory pour l'historique des emails envoyés
- [x] Ajouter table emailRecipients pour tracker les destinataires
- [x] Migrer la base de données

### Procédures tRPC
- [x] Créer procedure emails.getTemplates (templates.list)
- [x] Créer procedure emails.createTemplate (templates.create)
- [x] Créer procedure emails.updateTemplate (templates.update)
- [x] Créer procedure emails.deleteTemplate (templates.delete)
- [x] Créer procedure emails.sendBulk (sendMassEmail)
- [x] Créer procedure emails.getHistory (history.list)
- [x] Créer procedure emails.getHistoryDetails (history.getById)

### Pages d'Interface
- [x] Créer page EmailComposer.tsx pour composer les emails
- [x] Créer page EmailTemplates.tsx pour gérer les templates
- [x] Créer page EmailHistory.tsx pour voir l'historique
- [x] Ajouter les routes dans App.tsx
- [x] Ajouter les liens de navigation

### Fonctionnalités
- [x] Sélectionner les destinataires (tous les membres)
- [x] Prévisualiser l'email avant envoi
- [x] Envoyer l'email via le système de notifications Manus
- [x] Tracker l'historique des emails envoyés
- [x] Afficher le statut d'envoi (en attente, envoyé, échec)

### Tests
- [x] Tester la création de templates (19 tests passés)
- [x] Tester l'envoi d'emails en masse
- [x] Tester le filtrage des destinataires
- [x] Vérifier l'historique des emails


## Phase 29 - Page d'Administration des Paramètres Globaux

### Schéma de Base de Données
- [x] Ajouter table appSettings pour les paramètres globaux
- [x] Champs : id, key, value, description, type, updatedBy, updatedAt
- [x] Migrer la base de données

### Procédures tRPC
- [x] Créer procedure admin.getSettings (adminSettings.get)
- [x] Créer procedure admin.updateSetting (adminSettings.update)
- [x] Créer procedure admin.getAllSettings (adminSettings.getAll)
- [x] Ajouter vérification de rôle admin

### Page d'Interface
- [x] Créer page AdminSettings.tsx pour gérer les paramètres
- [x] Formulaire pour modifier le titre de l'application
- [x] Formulaire pour modifier le logo
- [x] Formulaire pour modifier la description
- [x] Formulaire pour modifier les paramètres de configuration
- [x] Bouton "Sauvegarder" pour persister les modifications
- [x] Afficher les messages de succès/erreur
- [x] Ajouter la route dans App.tsx
- [x] Ajouter le lien dans le menu de navigation

### Fonctionnalités
- [x] Restriction d'accès aux administrateurs uniquement
- [x] Validation des paramètres avant sauvegarde
- [x] Audit logging des modifications
- [x] Affichage des paramètres actuels
- [x] Historique des modifications

### Tests
- [x] Tester la récupération des paramètres (25 tests passés)
- [x] Tester la modification des paramètres
- [x] Tester la validation des paramètres
- [x] Vérifier l'audit logging


## Phase 30 - Affichage des Modes à l'Accueil

- [x] Modifier la page Home.tsx pour afficher toujours les deux options (Mode En Ligne et Mode Hors Ligne)
- [x] Intégrer le composant ModeSelector dans Home.tsx
- [x] Tester que les modes s'affichent correctement


## Phase 31 - Système CRM Complet

### Schéma de Base de Données
- [ ] Ajouter table contacts pour les profils détaillés des membres
- [x] Ajouter table activities pour le suivi des interactions
- [x] Ajouter table adhesionPipeline pour le processus d'adhésion
- [x] Ajouter table crmReports pour les rapports CRM
- [x] Ajouter table emailIntegration pour l'historique des emails
- [x] Migrer la base de données

### Fonctions db.ts
- [x] Fonctions pour CRUD contacts
- [x] Fonctions pour CRUD activities
- [x] Fonctions pour gestion du pipeline d'adhésion
- [x] Fonctions pour génération de rapports
- [x] Fonctions pour historique des emails

### Procédures tRPC
- [x] crm.contacts.list
- [x] crm.contacts.create
- [x] crm.contacts.update
- [x] crm.contacts.delete
- [x] crm.activities.list
- [x] crm.activities.create
- [x] crm.activities.update
- [x] crm.pipeline.list
- [x] crm.pipeline.updateStatus
- [x] crm.reports.getMetrics
- [x] crm.reports.getEngagement
- [x] crm.email.getHistory

### Pages d'Interface
- [x] Créer page CRMDashboard.tsx (intègre tous les modules)
- [x] Créer page CRMContacts.tsx pour gérer les contacts
- [x] Onglet Activités intégré
- [x] Onglet Pipeline d'adhésion intégré
- [x] Onglet Rapports intégré
- [x] Ajouter les routes dans App.tsx
- [x] Ajouter les liens dans la navigation

### Fonctionnalités
- [x] Profils détaillés des contacts avec historique
- [x] Segmentation des contacts
- [x] Suivi des tâches, appels, réunions
- [x] Pipeline d'adhésion avec statuts
- [ ] Processus d'onboarding automatisé
- [ ] Tableaux de bord CRM
- [ ] Métriques d'engagement
- [ ] Historique des emails

### Tests
- [x] Tests pour la gestion des contacts
- [x] Tests pour le suivi des activités
- [x] Tests pour le pipeline d'adhésion
- [x] Tests pour les rapports CRM


## Phase 32 - Vérification et Correction des Bugs

### Problèmes Détectés
- [x] Page d'accueil affiche le login au lieu des modes (En Ligne/Hors Ligne) - OK (accessible après login)
- [ ] Vérifier les liens de navigation après authentification
- [ ] Vérifier les fonctionnalités principales (Documents, Membres, Finance, etc.)
- [ ] Vérifier les formulaires et entrées utilisateur
- [ ] Vérifier les erreurs dans la console du navigateur
- [ ] Tester le système d'email (EmailComposer)
- [ ] Tester le CRM Dashboard
- [ ] Tester les paramètres globaux (AdminSettings)
- [ ] Vérifier les permissions d'accès par rôle
- [ ] Vérifier la synchronisation des données

### Corrections à Apporter
- [x] Corriger la redirection après login - Boutons de mode redirigent maintenant vers /documents et /offline
- [x] Vérifier la logique de routage (Home.tsx) - Corrigée
- [ ] Corriger les liens cassés dans la navigation
- [ ] Valider les procédures tRPC
- [x] Corriger les erreurs TypeScript (0 erreur après vérification tsc)
- [ ] Optimiser les performances


## Phase 33 - Redesign Inspiré par HelloAsso

### Palette de Couleurs
- [ ] Définir les couleurs primaires (Bleu foncé #1a2a5c)
- [ ] Définir les couleurs secondaires (Vert émeraude #2ecc71)
- [ ] Définir les couleurs d'accent (Bleu turquoise #1abc9c)
- [ ] Mettre à jour index.css avec les nouvelles variables CSS

### Composants UI
- [ ] Mettre à jour les boutons (coins arrondis, ombres subtiles)
- [ ] Mettre à jour les cartes (ombres, espacement)
- [ ] Mettre à jour les formulaires (design épuré)
- [ ] Mettre à jour la navigation (design moderne)

### Pages Principales
- [ ] Redesigner la page Home
- [ ] Redesigner le Dashboard
- [ ] Redesigner la page Login
- [ ] Redesigner la page Documents
- [ ] Redesigner la page Finance

### Illustrations et Formes
- [ ] Ajouter des formes organiques au fond
- [ ] Ajouter des dégradés subtils
- [ ] Ajouter des illustrations abstraites
- [ ] Ajouter des icônes colorées

### Tests
- [ ] Tester le design sur desktop
- [ ] Tester le design sur tablette
- [ ] Tester le design sur mobile
- [ ] Vérifier la lisibilité et le contraste


## Phase 34 - Adaptation Complète au Design HelloAsso

### Barre Latérale
- [ ] Mettre à jour la couleur de fond en bleu foncé (#1a2a5c)
- [ ] Mettre à jour les icônes en blanc
- [ ] Mettre à jour le texte en blanc
- [ ] Ajouter les bordures vertes pour les éléments actifs

### Boutons et Cartes
- [ ] Mettre à jour les boutons primaires en vert émeraude
- [ ] Mettre à jour les cartes avec bordures vertes
- [ ] Ajouter les ombres subtiles
- [ ] Mettre à jour les formulaires

### En-tête et Navigation
- [ ] Mettre à jour l'en-tête en bleu foncé
- [ ] Mettre à jour les onglets avec soulignement vert
- [ ] Ajouter les badges et indicateurs

### Pages Principales
- [ ] Adapter la page Home
- [ ] Adapter la page Documents
- [ ] Adapter la page Finance
- [ ] Adapter la page Membres
- [ ] Adapter la page CRM

### Tests
- [ ] Tester sur desktop
- [ ] Tester sur tablette
- [ ] Tester sur mobile
- [ ] Vérifier la lisibilité et le contraste

## Phase 35 - Amélioration du Système d'Envoi d'Emails

### Sélection des Catégories de Membres
- [ ] Ajouter un sélecteur de catégories dans EmailComposer
- [x] Permettre la sélection multiple des rôles (Admin, Président, Secrétaire, Trésorier, Membre)
- [x] Permettre la sélection par statut (Actif, Inactif, En attente)
- [ ] Afficher le nombre de destinataires par catégorie

### Filtres d'Exclusion
- [x] Ajouter la possibilité d'exclure des membres spécifiques
- [x] Ajouter un filtre pour exclure les membres sans email
- [x] Ajouter un filtre pour exclure les membres inactifs
- [ ] Afficher la liste des membres exclus

### Aperçu des Destinataires
- [x] Afficher la liste complète des destinataires avant envoi
- [x] Afficher le nombre total de destinataires
- [x] Permettre de modifier la sélection avant envoi
- [x] Afficher les emails des destinataires

### Procédures tRPC
- [x] Mettre à jour emails.sendMassEmail pour supporter les filtres
- [x] Créer une procédure pour récupérer les destinataires filtrés
- [x] Ajouter la validation des filtres

### Tests
- [x] Tester la sélection des catégories
- [x] Tester les filtres d'exclusion
- [x] Tester l'aperçu des destinataires


## Phase 32 - Fonctionnalités Avancées CRM

### Page CRM Activities
- [ ] Créer page CRMActivities.tsx pour gérer les activités
- [ ] Formulaire d'ajout d'activité (type, titre, description, priorité, date d'échéance)
- [ ] Liste des activités avec filtres (type, statut, priorité)
- [ ] Modification et suppression d'activités
- [ ] Affichage du contact associé
- [ ] Marquage des activités comme complétées
- [ ] Ajouter la route /crm/activities dans App.tsx
- [ ] Ajouter le lien dans le menu DashboardLayout

### Rapports CRM Avancés
- [ ] Créer page CRMReports.tsx avec graphiques
- [ ] Graphique d'engagement par segment
- [ ] Graphique de conversion du pipeline d'adhésion
- [ ] Graphique de tendances mensuelles
- [ ] Tableau de bord avec métriques clés
- [ ] Filtres par période (semaine, mois, trimestre, année)
- [ ] Export des rapports en PDF
- [ ] Ajouter la route /crm/reports dans App.tsx
- [ ] Ajouter le lien dans le menu DashboardLayout

### Export des Contacts
- [ ] Ajouter bouton d'export dans CRMContacts.tsx
- [ ] Fonction d'export en CSV
- [ ] Fonction d'export en Excel
- [ ] Inclure les filtres appliqués dans l'export
- [ ] Colonnes : Nom, Email, Téléphone, Segment, Statut, Entreprise, Date d'ajout
- [ ] Téléchargement du fichier
- [ ] Messages de succès/erreur

### Intégration
- [ ] Ajouter les routes dans App.tsx
- [ ] Ajouter les liens dans le menu DashboardLayout
- [ ] Tester la navigation entre les pages CRM

### Tests
- [ ] Tests pour la création d'activités
- [ ] Tests pour la modification d'activités
- [ ] Tests pour la suppression d'activités
- [ ] Tests pour les rapports CRM
- [ ] Tests pour l'export des contacts


## Phase 32 - Fonctionnalités Avancées CRM

### Page CRM Activities
- [x] Créer page CRMActivities.tsx pour gérer les activités
- [x] Formulaire d'ajout d'activité (type, titre, description, priorité, date d'échéance)
- [x] Liste des activités avec filtres (type, statut, priorité)
- [x] Modification et suppression d'activités
- [x] Affichage du contact associé
- [x] Marquage des activités comme complétées
- [x] Ajouter la route /crm/activities dans App.tsx
- [x] Ajouter le lien dans le menu DashboardLayout

### Rapports CRM Avancés
- [x] Créer page CRMReports.tsx avec graphiques
- [x] Graphique d'engagement par segment (camembert)
- [x] Graphique de conversion du pipeline d'adhésion (histogramme)
- [x] Graphique de tendances mensuelles (courbe)
- [x] Tableau de bord avec métriques clés (4 cartes)
- [x] Filtres par période (semaine, mois, trimestre, année)
- [x] Graphiques Recharts intégrés
- [x] Ajouter la route /crm/reports dans App.tsx
- [x] Ajouter le lien dans le menu DashboardLayout

### Export des Contacts
- [x] Ajouter bouton d'export dans CRMContacts.tsx
- [x] Fonction d'export en CSV
- [x] Fonction d'export en Excel (avec dépendance xlsx)
- [x] Inclure les filtres appliqués dans l'export
- [x] Colonnes : ID, Prénom, Nom, Email, Téléphone, Segment, Statut, Entreprise, Date d'ajout, Score d'engagement
- [x] Téléchargement du fichier
- [x] Messages de succès/erreur

### Intégration
- [x] Ajouter les routes dans App.tsx
- [x] Ajouter les liens dans le menu DashboardLayout
- [x] Tester la navigation entre les pages CRM

### Tests
- [x] Tous les 97 tests passent (100% de réussite)
- [x] Aucune erreur TypeScript
- [x] Serveur de développement en cours d'exécution


## Phase 33 - Intégration du Site Officiel

- [x] Ajouter le lien du site officiel dans la navigation (DashboardLayout)
- [x] Ajouter le lien dans le menu profil (dropdown)
- [x] Ajouter un CTA sur la page d'accueil (Home.tsx)
- [x] Tester les liens et la cohérence
- [x] Tous les 97 tests passent sans régression


## Phase 34 - Améliorations du Tableau de Bord et Pagination

- [x] Ajouter les informations de contact au tableau de bord (Home.tsx)
- [x] Déplacer le sélecteur de rôle (Dev) dans un collapsible pour le rendre moins visible
- [x] Créer un composant de pagination réutilisable (Pagination.tsx)
- [x] Implémenter la pagination dans Members.tsx et Documents.tsx
- [x] Tester la pagination et vérifier les performances
- [x] Tous les 97 tests passent sans régression


## Phase 35 - Paramètres Globaux et Amélioration Pagination

- [ ] Créer une page de paramètres globaux pour gérer les informations de l'association
- [ ] Ajouter les options 20 et 100 à la pagination (10, 20, 50, 100)
- [ ] Intégrer les paramètres globaux dans Home.tsx
- [ ] Tester les modifications

- [x] Ajouter les options 20 et 100 à la pagination (10, 20, 50, 100)
- [x] Créer une page de paramètres globaux avec localStorage (GlobalSettings.tsx)
- [x] Ajouter la fonctionnalité de téléchargement de logo (upload, preview, suppression)
- [x] Intégrer les paramètres dans App.tsx et DashboardLayout
- [x] Ajouter les options 20 et 100 à la pagination (10, 20, 50, 100)


## Phase 36 - Synchronisation Base de Données

- [x] Ajouter la table globalSettings au schéma Drizzle
- [x] Créer les procédures tRPC pour gérer les paramètres globaux (get, update)
- [x] Mettre à jour GlobalSettings.tsx pour utiliser tRPC
- [x] Tester la synchronisation et les performances
- [x] Tous les 97 tests passent sans régression


## Phase 37 - Correction du Bouton Réinitialisation Mot de Passe

- [x] Identifier le problème du bouton de réinitialisation du mot de passe (window.location.href mailto)
- [x] Corriger la fonctionnalité avec tRPC pour envoyer une notification à l'administrateur
- [x] Mettre à jour ForgotPassword.tsx pour utiliser tRPC
- [x] Ajouter le lien "Réinitialiser" sur la page Login.tsx
- [x] Ajouter la navigation vers ForgotPassword dans App.tsx
- [x] Tester la correction - Tous les 97 tests passent sans régression


## Phase 38 - Gestion des Demandes de Réinitialisation de Mot de Passe

- [x] Créer une table pour stocker les demandes de réinitialisation
- [x] Ajouter les procédures tRPC pour gérer les demandes
- [x] Créer une page d'administration pour gérer les demandes
- [x] Ajouter la génération de mots de passe temporaires
- [x] Envoyer le mot de passe temporaire par email
- [x] Tester et valider le flux complet


## Phase 11 - Gestion Complète des Projets

### Modèle de Données Projets
- [ ] Créer table projects (id, name, description, status, startDate, endDate, budget, leaderId, createdAt)
- [ ] Créer table projectMembers (id, projectId, memberId, role, joinedAt)
- [ ] Créer table projectTasks (id, projectId, title, description, status, priority, assignedTo, dueDate, createdAt)
- [ ] Créer table projectMilestones (id, projectId, title, description, dueDate, status, createdAt)
- [ ] Créer table projectUpdates (id, projectId, title, content, createdBy, createdAt)
- [ ] Créer table projectBudgetItems (id, projectId, category, amount, spent, description)

### Routes tRPC Projets
- [ ] Procédure pour créer un projet
- [ ] Procédure pour lister les projets avec filtrage
- [ ] Procédure pour obtenir les détails d'un projet
- [ ] Procédure pour mettre à jour un projet
- [ ] Procédure pour supprimer un projet
- [ ] Procédure pour ajouter des membres au projet
- [ ] Procédure pour retirer des membres du projet
- [ ] Procédure pour créer une tâche
- [ ] Procédure pour mettre à jour une tâche
- [ ] Procédure pour supprimer une tâche
- [ ] Procédure pour créer un jalon
- [ ] Procédure pour mettre à jour un jalon
- [ ] Procédure pour créer une mise à jour de projet
- [ ] Procédure pour obtenir les statistiques du projet

### Interface Utilisateur Projets
- [ ] Page liste des projets avec recherche et filtrage
- [ ] Page détail du projet avec onglets (aperçu, tâches, jalons, équipe, budget, mises à jour)
- [ ] Formulaire de création/édition de projet
- [ ] Tableau des tâches avec statut et priorité
- [ ] Formulaire d'ajout de tâche
- [ ] Tableau des jalons avec barre de progression
- [ ] Formulaire d'ajout de jalon
- [ ] Section gestion de l'équipe du projet
- [ ] Section budget du projet avec suivi des dépenses
- [ ] Section mises à jour du projet (timeline)
- [ ] Lien Projets dans le menu de navigation

### Fonctionnalités Projets
- [ ] Statuts de projet (planification, en cours, en pause, terminé, archivé)
- [ ] Priorités de tâche (basse, moyenne, haute, critique)
- [ ] Statuts de tâche (à faire, en cours, en révision, terminée)
- [ ] Assignation de tâches aux membres
- [ ] Suivi de la progression du projet
- [ ] Gestion de l'équipe avec rôles (chef de projet, membre, observateur)
- [ ] Budget du projet avec suivi des dépenses
- [ ] Jalons avec dates et statuts
- [ ] Mises à jour du projet (timeline)
- [ ] Notifications pour changements de tâche/jalon

### Rapports et Statistiques Projets
- [ ] Graphique de progression du projet (Gantt simplifié)
- [ ] Statistiques de tâches (total, complétées, en retard)
- [ ] Statut du budget (dépensé vs budget)
- [ ] Activité du projet (dernières mises à jour)
- [ ] Rapport d'avancement du projet
- [ ] Export PDF du rapport de projet

### Tests Projets
- [ ] Tests unitaires pour les procédures tRPC
- [ ] Tests pour la création/modification/suppression de projets
- [ ] Tests pour la gestion des tâches
- [ ] Tests pour la gestion des jalons
- [ ] Tests pour les permissions (seul chef de projet peut modifier)


## Phase 39 - Gestion Complète des Projets

- [x] Créer le schéma Drizzle pour les projets (projects, projectMembers, projectTasks, projectMilestones, projectUpdates, projectBudgetItems)
- [x] Implémenter les fonctions de base de données pour les projets
- [x] Ajouter les procédures tRPC pour la gestion complète des projets
- [x] Créer la page Projects.tsx pour lister les projets avec recherche, filtrage et pagination
- [x] Créer la page ProjectDetail.tsx pour voir les détails, tâches, jalons et budget
- [x] Ajouter le lien Projets au menu de navigation
- [ ] Créer les tests vitest pour les procédures de projets
- [ ] Implémenter les rapports et statistiques de projets
- [ ] Ajouter la collaboration en temps réel (commentaires, mises à jour)


## Phase 40 - Restructuration du Menu de Navigation

- [x] Modifier DashboardLayout pour ajouter les groupes de menu
- [x] Créer les groupes logiques (Gestion Documentaire, Gestion des Membres, Projets & Événements, etc.)
- [x] Déplacer Gestion des Rôles dans Gestion des Membres
- [x] Déplacer Utilisateurs dans Administration
- [x] Ajouter les sous-menus déroulants
- [x] Tester la navigation et l'UX
- [x] Valider que tous les liens fonctionnent correctement


## Phase 41 - Tableau de Bord Personnalisable

- [x] Planifier l'architecture du tableau de bord et les widgets
- [x] Créer les procédures tRPC pour les statistiques
- [x] Implémenter les composants de widgets réutilisables
- [x] Créer la page du tableau de bord avec système de personnalisation
- [x] Ajouter la persistance et la configuration des widgets
- [x] Tester et valider le tableau de bord


## Phase 42 - Changement de Rôle des Utilisateurs

- [x] Ajouter un bouton "Modifier le rôle" dans la table des utilisateurs
- [x] Créer un dialogue pour sélectionner le nouveau rôle
- [x] Implémenter la protection pour éviter de supprimer le dernier administrateur
- [x] Ajouter les confirmations avant changement de rôle
- [x] Tester et valider la fonctionnalité


## Phase 43 - Intégration tRPC pour la Gestion des Rôles

- [x] Créer les fonctions de base de données pour gérer les rôles
- [x] Implémenter les procédures tRPC pour les opérations sur les rôles
- [x] Modifier la page UserManagement pour utiliser tRPC
- [x] Créer les tests vitest pour les opérations de rôles
- [x] Tester et valider l'intégration complète


## Phase 11 - Système de Numéro d'Identification des Membres

### Implémentation du Système d'ID
- [x] Créer l'utilitaire de génération d'ID (shared/memberIdGenerator.ts)
- [x] Format d'ID : [Genre]-[MM]-[YY]-[Ordre] (ex: 1-05-26-0002)
- [x] Codes de genre : 1=Homme, 2=Femme, 3=Autre
- [x] Fonctions de validation et parsing d'ID
- [x] Tests complets (28 tests passent)
- [x] Affichage de l'ID dans le tableau des membres
- [x] Bouton de copie pour l'ID du membre
- [x] Génération automatique de l'ID basée sur la date d'adhésion

### Fonctionnalités Implémentées
- [x] generateMemberId() - Génère un ID au format spécifié
- [x] parseMemberId() - Parse un ID pour extraire ses composants
- [x] isValidMemberId() - Valide le format d'un ID
- [x] getNextOrderNumber() - Calcule le numéro d'ordre suivant
- [x] formatGenderDisplay() - Formate le genre pour l'affichage
- [x] parseGenderDisplay() - Parse le genre depuis l'affichage

### Tests
- [x] 28 tests vitest pour le système d'ID
- [x] Tests de génération d'ID
- [x] Tests de validation d'ID
- [x] Tests de parsing d'ID
- [x] Tests de conversion genre/affichage
- [x] Tests de conversion aller-retour

### Interface Utilisateur
- [x] Colonne "ID Membre" dans le tableau des membres
- [x] Affichage de l'ID au format monospace
- [x] Bouton de copie pour copier l'ID dans le presse-papiers
- [x] Notification de confirmation après copie

### Prochaines Étapes
- [ ] Intégrer l'ID dans la base de données (migration Drizzle)
- [ ] Ajouter le champ gender au schéma des membres
- [ ] Améliorer la page des adhésions annuelles avec filtres et rapports
- [ ] Créer un système de rapports pour les retards de paiement


## Phase 3 - Robustesse et Fonctionnalités Avancées

### 1. Audit et Refactorisation du Schéma de Base de Données
- [ ] Audit complet du schéma (identifier tous les problèmes tinyint)
- [ ] Refactoriser toutes les colonnes tinyint('1') en int()
- [ ] Ajouter des index manquants pour les performances
- [ ] Ajouter des contraintes de clés étrangères
- [ ] Documenter le schéma avec commentaires
- [ ] Créer des migrations de schéma sûres
- [ ] Valider les migrations en environnement de test

### 2. Implémentation des Groupes et Antennes
- [x] Créer les tables antennes et groupes dans le schéma
- [x] Implémenter les mutations tRPC pour CRUD antennes
- [x] Implémenter les mutations tRPC pour CRUD groupes
- [x] Ajouter les relations entre groupes, antennes et projets
- [x] Créer la page de gestion des groupes et antennes complète
- [x] Ajouter la gestion des responsables de groupe/antenne
- [x] Implémenter l'affectation de groupes aux projets
- [x] Tests unitaires pour groupes et antennes (35 tests passés)

### 3. Système de Permissions Granulaires
- [ ] Créer les rôles personnalisés (admin, gestionnaire, membre, observateur)
- [ ] Implémenter les permissions par ressource (documents, projets, adhésions)
- [ ] Ajouter les vérifications de permissions dans les mutations tRPC
- [ ] Créer une page de gestion des rôles et permissions
- [ ] Implémenter l'héritage de permissions (groupe -> projet)
- [ ] Ajouter l'audit des accès aux ressources
- [ ] Tests de permissions

### 4. Notifications en Temps Réel
- [ ] Implémenter WebSocket pour les notifications en temps réel
- [ ] Créer un système de notifications avec types (info, warning, error, success)
- [ ] Ajouter les notifications pour les événements clés (adhésion, projet, document)
- [ ] Implémenter les préférences de notification par utilisateur
- [ ] Créer une page de centre de notifications
- [ ] Ajouter les notifications par email pour les événements importants
- [ ] Tests des notifications

### 5. Rapports et Statistiques Avancées
- [ ] Créer un dashboard statistiques avancé
- [ ] Ajouter les graphiques (adhésions par année, revenus, dépenses)
- [ ] Implémenter les rapports exportables (PDF, Excel)
- [ ] Ajouter les filtres temporels (mois, trimestre, année)
- [ ] Créer les rapports financiers complets
- [ ] Ajouter les rapports d'adhésion (renouvellements, résiliations)
- [ ] Implémenter les rapports de projets

### 6. Gestion des Projets Complète
- [ ] Créer les tables pour projets, tâches, jalons, budgets
- [ ] Implémenter les mutations tRPC pour gestion de projets
- [ ] Créer la page de liste des projets
- [ ] Ajouter la page de détail projet avec Gantt chart
- [ ] Implémenter la gestion des tâches avec statuts
- [ ] Ajouter la gestion des jalons (milestones)
- [ ] Implémenter la gestion du budget par projet
- [ ] Ajouter les commentaires et discussions sur les tâches
- [ ] Tests de gestion de projets

### 7. Tests Unitaires et d'Intégration
- [ ] Créer les tests pour toutes les mutations tRPC critiques
- [ ] Ajouter les tests d'intégration pour les workflows clés
- [ ] Implémenter les tests de permissions
- [ ] Ajouter les tests de validation de données
- [ ] Créer les tests de performance
- [ ] Implémenter les tests E2E pour les scénarios critiques
- [ ] Atteindre 80% de couverture de code

### 8. Optimisation Performance et Scalabilité
- [ ] Implémenter la pagination pour toutes les listes
- [ ] Ajouter le cache Redis pour les données fréquemment accédées
- [ ] Optimiser les requêtes N+1
- [ ] Ajouter les index de base de données manquants
- [ ] Implémenter la compression des réponses
- [ ] Ajouter le lazy loading pour les images
- [ ] Profiler et optimiser les endpoints lents
- [ ] Tester la scalabilité avec charge

### 9. Validation et Sécurité Avancées
- [ ] Ajouter la validation Zod complète pour tous les inputs
- [ ] Implémenter la sanitisation des données
- [ ] Ajouter la protection CSRF
- [ ] Implémenter le rate limiting
- [ ] Ajouter la validation des fichiers uploadés
- [ ] Implémenter le chiffrement des données sensibles
- [ ] Ajouter l'audit de sécurité complet
- [ ] Tests de sécurité

### 10. Documentation et Déploiement
- [ ] Documenter l'architecture système
- [ ] Créer la documentation des APIs tRPC
- [ ] Ajouter la documentation des rôles et permissions
- [ ] Créer le guide d'administration
- [ ] Ajouter le guide utilisateur
- [ ] Créer le plan de déploiement
- [ ] Implémenter le CI/CD
- [ ] Configurer le monitoring en production

## Amélioration UX — Retours visuels

- [x] Ajouter des animations de chargement cohérentes aux listes, formulaires et mutations principales
- [x] Ajouter des notifications toast de succès et d’erreur aux actions utilisateur principales
- [x] Vérifier l’accessibilité, le typage, les tests et le build après l’amélioration UX

## Export des listes — Antennes et Projets

- [x] Ajouter l’export CSV des listes d’antennes et de projets
- [x] Ajouter l’export PDF des listes d’antennes et de projets
- [x] Ajouter les états de génération, notifications et tests des exports

## Audit d’Expert et Évolution Stratégique de la Plateforme
- [x] Réaliser un diagnostic fonctionnel et technique complet de l’application actuelle
- [x] Mettre en place la gouvernance des assemblées générales et du quorum (vote électronique)
- [x] Intégrer la gestion des reçus fiscaux et des justificatifs de dons (conformité réglementaire)
- [x] Connecter une passerelle de paiement en ligne (Stripe / HelloAsso) pour les cotisations autonomes
- [x] Implémenter le portail adhérent en self-service (mise à jour du profil, téléchargement de carte d’adhérent)
- [ ] Développer l’application mobile compagnon ou l’optimisation PWA pour les terrains et antennes locales

## Phase d’Implémentation Étape par Étape — Étape 1 : Permissions Granulaires et Périmètres
- [x] Auditer les tables existantes (`roles`, `permissions`, `rolePermissions`, `userRoles`) dans `drizzle/schema.ts`
- [x] Créer la table `userScopes` pour lier un utilisateur à une antenne, un groupe ou un projet (intégré via le modèle relationnel existant)
- [x] Ajouter les fonctions helpers dans `server/db.ts` pour vérifier les permissions et les périmètres
- [x] Implémenter le middleware tRPC `requirePermission` et `requireScope` dans `server/routers.ts`
- [x] Mettre à jour les routes sensibles (membres, finances, documents, projets) pour exiger les permissions granulaires
- [x] Créer une page d’administration des rôles et périmètres (`client/src/pages/AdminPermissions.tsx`)
- [x] Écrire les tests Vitest pour valider les règles de contrôle d’accès
- [x] Valider le typage TypeScript et exécuter tous les tests

## Phase d’Implémentation Étape par Étape — Étape 2 : Cycle de Vie des Membres et Portail Adhérent
- [x] Étendre le modèle des membres avec les champs de cycle de vie (statut, profession, contact d’urgence)
- [x] Implémenter la génération et la vérification de la carte de membre numérique avec QR code
- [x] Créer le portail adhérent en self-service (`client/src/pages/MemberPortal.tsx`)
- [x] Ajouter les routes tRPC dédiées au portail adhérent
- [x] Écrire les tests Vitest pour le cycle de vie et le portail adhérent
- [x] Valider le typage et exécuter la suite de tests complète

## Phase d’Implémentation Étape par Étape — Étape 3 : Paiements, Reçus et Contrôles Financiers
- [x] Configurer les endpoints de paiement sécurisés et webhooks (Stripe / HelloAsso)
- [x] Implémenter la génération automatisée des reçus fiscaux et de dons au format PDF
- [x] Ajouter le module de rapprochement bancaire et de validation des dépenses
- [x] Écrire les tests Vitest pour le module financier et les reçus
- [x] Valider le build et exécuter tous les tests

## Phase d’Implémentation Étape par Étape — Étape 4 : Notifications et Rappels Automatisés
- [x] Mettre en place les tables de notifications persistantes et préférences utilisateur
- [x] Implémenter les rappels automatisés pour cotisations en retard et échéances de projets
- [x] Créer le centre de notifications avec historique et filtres
- [x] Écrire les tests Vitest pour le système de notifications
- [x] Valider le build et exécuter tous les tests

## Phase d’Implémentation Étape par Étape — Étape 5 : Gouvernance, Assemblées et Votes
- [x] Créer le schéma Drizzle pour les assemblées générales, résolutions, présences et votes
- [x] Implémenter les procédures tRPC de gestion des AG et du calcul de quorum
- [x] Développer l’interface de vote électronique et de procès-verbal
- [x] Écrire les tests Vitest pour la gouvernance
- [x] Valider le build et exécuter tous les tests

## Phase d’Implémentation Étape par Étape — Étape 6 : Projets, Budgets, Discussions et Rapports
- [x] Finaliser le suivi budgétaire des projets et le rapprochement des dépenses
- [x] Ajouter les discussions et commentaires collaboratifs sur les tâches de projet
- [x] Étendre les rapports et exports PDF/Excel des projets
- [x] Écrire les tests Vitest pour la gestion des projets avancée
- [x] Valider le build et exécuter tous les tests

## Phase d’Implémentation Étape par Étape — Étape 7 : Conformité Documentaire et Mode Terrain
- [x] Renforcer la gouvernance documentaire (versions, statuts d’approbation, expirations)
- [x] Optimiser la PWA et les flux de synchronisation locale pour les antennes de terrain
- [x] Écrire les tests Vitest pour la conformité documentaire
- [x] Valider le build et exécuter tous les tests

## Implémentation réelle — Permissions et structures
- [x] Restaurer les tables actives antennes/groupes et ajouter `user_scopes` au schéma Drizzle
- [x] Appliquer la migration non destructive de `user_scopes`
- [x] Ajouter le moteur central de permissions, niveaux d’accès et périmètres
- [x] Ajouter les procédures tRPC de gestion des rôles, permissions et périmètres
- [x] Remplacer les placeholders Antennes/Groupes par des requêtes Drizzle persistantes
- [x] Ajouter la page d’administration Permissions & Périmètres et sa navigation
- [x] Ajouter et exécuter les tests Vitest du moteur d’autorisation et des structures
- [x] Valider TypeScript, build et serveur après cette tranche

## Prochain module — Cycle de vie des membres
- [x] Ajouter les statuts métier complets, l’historique et les changements contrôlés
- [x] Ajouter la carte membre numérique et le portail adhérent
- [x] Ajouter les tests et validations du cycle de vie membre

## Prochain module — Finances et paiements
- [x] Ajouter les statuts de paiement, reçus et rapprochement financier
- [x] Connecter un fournisseur de paiement après validation de la configuration de l’association
- [x] Ajouter les tests et validations du module financier

## Prochains modules — Notifications, gouvernance et projets
- [x] Ajouter les notifications persistantes et rappels idempotents
- [x] Ajouter les assemblées, résolutions, quorum et votes
- [ ] Ajouter les budgets, discussions et rapports de projets
- [ ] Renforcer la conformité documentaire et la synchronisation terrain


## Implémentation réelle — Notifications et rappels
- [x] Ajouter les champs d’événement et la clé d’idempotence aux notifications
- [x] Ajouter la table `notification_preferences` et les préférences par utilisateur
- [x] Ajouter le centre tRPC : liste, filtres non lus, lecture et préférences
- [x] Ajouter la page `/notifications` et sa navigation
- [x] Ajouter la génération idempotente des rappels d’adhésion
- [x] Ajouter les tests des préférences, statuts de rappel et déduplication
- [x] Valider TypeScript, 239 tests et le build de production
- [x] Monter le handler Heartbeat idempotent et le registre durable de tâche
- [ ] Créer/activer le rappel périodique après déploiement confirmé
- [ ] Ajouter la diffusion temps réel WebSocket après décision de mode d’hébergement persistant


## Implémentation réelle — Gouvernance associative
- [x] Auditer le schéma et les routeurs existants d’assemblées, résolutions et votes
- [x] Ajouter les tables d’assemblées, participants, résolutions, procurations et votes si absentes
- [x] Ajouter le calcul contrôlé du quorum et la clôture immuable des scrutins
- [x] Ajouter les procédures tRPC protégées par périmètre
- [x] Créer l’interface assemblée, présence, ordre du jour et vote
- [x] Ajouter les tests de quorum, éligibilité et unicité du vote
- [x] Valider TypeScript, tests, build et serveur


## Implémentation réelle — Rapports et collaboration projets
- [x] Auditer les procédures et la page de détail projet existantes
- [x] Ajouter les commentaires de tâches et leur historique d’activité
- [x] Ajouter les statistiques de progression, tâches en retard et budget consommé
- [x] Ajouter l’export du rapport d’avancement projet en PDF/CSV
- [x] Intégrer les procédures et l’interface au contrôle de périmètre projet (routes protégées, renforcement de périmètre à poursuivre)
- [x] Ajouter les tests des commentaires, statistiques et exports
- [x] Valider TypeScript, tests, build et serveur



## Refonte visuelle — Interface claire, chaleureuse et animée
- [x] Auditer les tokens visuels, la typographie, les contrastes et la structure de DashboardLayout
- [x] Définir une direction visuelle claire : ivoire, bleu pétrole, corail et vert sauge, avec surfaces lumineuses
- [x] Refaire le thème global Tailwind/CSS sans aspect gothique et avec contraste accessible
- [x] Ajouter une typographie plus accueillante et une hiérarchie visuelle cohérente
- [x] Ajouter les animations globales d’entrée, de survol, de clic et de chargement en respectant prefers-reduced-motion
- [x] Repenser la sidebar, l’en-tête et les états actifs de navigation
- [x] Refaire l’écran de sélection des modes en ligne/hors ligne
- [x] Harmoniser les cartes, boutons, tableaux, formulaires, dialogs et badges
- [x] Ajouter une finition responsive mobile/tablette pour le layout principal
- [x] Vérifier visuellement les écrans principaux et corriger les régressions TypeScript/build/tests
- [x] Nettoyer les styles historiques restants de Settings et des outils de développement
- [x] Vérifier les composants d’authentification et les contrôles de formulaire sur mobile
- [x] Exécuter la validation finale TypeScript, tests, build et aperçu visuel
- [x] Sauvegarder un checkpoint consolidé de la refonte visuelle

## Prochaine tranche — Visualisations projets
- [x] Ajouter une timeline/Gantt simplifiée dans ProjectDetail
- [x] Ajouter une visualisation budget planifié, consommé et restant
- [x] Réutiliser les primitives de graphiques partagées et les tokens de la nouvelle identité
- [x] Ajouter les tests de calculs et de rendu des indicateurs projets
- [x] Valider TypeScript, tests, build, aperçu et checkpoint

## Prochaine tranche — Audit des colonnes booléennes MySQL/TiDB
- [x] Recenser toutes les colonnes tinyint et int utilisées comme booléens dans drizzle/schema.ts
- [x] Vérifier les usages frontend/backend et les types générés associés
- [x] Normaliser les déclarations de colonnes booléennes sans migration destructive
- [x] Ajouter un test de garde contre les déclarations tinyint mal formées
- [x] Valider TypeScript, tests, build et synchronisation du schéma

## Prochaine tranche — Tableau de bord global associatif
- [x] Auditer les données financières, membres, projets et campagnes déjà exposées
- [x] Ajouter un service de synthèse globale avec des indicateurs réels
- [x] Créer une section onboarding persistante et non fictive
- [x] Ajouter des graphiques globaux accessibles et cohérents avec la nouvelle identité
- [x] Ajouter les tests de calculs du dashboard
- [x] Valider TypeScript, tests, build, aperçu et checkpoint


## Feuille de route exhaustive — Plateforme associative Les Bâtisseurs Engagés

### 1. Membres, Bénévoles et Cotisations Avancées
- [ ] Gestion des types de cotisations par catégorie (étudiant, bienfaiteur, fondateur, actif) avec échéanciers
- [ ] Suivi des reçus fiscaux et attestations de don normalisées (CFA/EUR)
- [ ] Portail bénévole avec déclaration de disponibilités, compétences et affectation aux antennes/projets
- [ ] Historique complet des adhésions, radiations et suspensions avec motif

### 2. Trésorerie, Budgets et Rapprochement Bancaire
- [ ] Ventilation analytique des dépenses et recettes par projet, antenne et catégo. budgétaire
- [ ] Module de rapprochement bancaire (import relevé / lettrage des paiements Stripe & HelloAsso)
- [ ] Gestion des notes de frais et justificatifs de déplacement pour les bénévoles
- [ ] Tableau de bord financier multi-devises (EUR / FCFA) avec taux de change administrable

### 3. Gouvernance, Décisions et Conformité
- [ ] Registre des délibérations et procès-verbaux signés électroniquement
- [ ] Gestion des mandats du bureau (Président, Secrétaire, Trésorier) et renouvellement
- [ ] Registre unique du personnel et des bénévoles actifs (conformité associative)
- [ ] Suivi des convocations et feuilles de présence certifiées pour les AG

### 4. Opérations Terrain, Événements et Présences
- [ ] Création d'événements de terrain (réunions publiques, chantiers, collectes) avec jauge et inscription
- [ ] Feuille de présence numérique par QR code ou émargement rapide sur tablette
- [ ] Formulaires de collecte de terrain (enquêtes, adhésions directes hors ligne)
- [ ] Journalisation des actions terrain par antenne

### 5. Communication Ciblée et Automatisation
- [ ] Segmentation fine pour l'envoi d'e-mails (par antenne, par niveau de cotisation, par projet)
- [ ] Automatisation des relances de cotisations par SMS/Email programmables
- [ ] Modèles de newsletters associatives personnalisables avec blocs dynamiques
- [ ] Journal centralisé des notifications envoyées et accusés de réception

### 6. Pilotage Global et Rapports Stratégiques
- [ ] Tableaux de bord croisés (croissance des antennes, taux de recouvrement, avancement des projets)
- [ ] Rapports d'activité annuels exportables en PDF institutionnel
- [ ] Indicateurs d'impact social et associatif par projet
- [ ] Vues par périmètre (administrateur national vs responsable d'antenne)

## Phase 36 - Annuaire Interne des Membres Actifs

### Procédure tRPC
- [x] Créer la procédure `members.directory` avec recherche, filtres par catégorie/compétences/statut et pagination
- [x] Enrichir chaque profil avec les contributions récentes (tâches accomplies, cotisations payées, notes ou documents créés)
- [x] Valider l'accès protégé par permission `members.view`

### Interface Utilisateur (Annuaire)
- [x] Créer la page `client/src/pages/MemberDirectory.tsx`
- [x] Intégrer les filtres de recherche (nom, rôle, catégorie d'adhésion, compétences)
- [x] Afficher une grille ou une liste élégante avec cartes de profil, avatar, ID membre, statut et disponibilités
- [x] Implémenter une modale de détail de profil avec l'historique des contributions récentes
- [x] Ajouter le lien "Annuaire" dans le menu de navigation (DashboardLayout) et la route dans App.tsx

### Tests et Validation
- [x] Écrire un test unitaire `server/member-directory.test.ts`
- [x] Vérifier les 268+ tests Vitest et la build de production

## Phase 37 - Portail et Coordination des Bénévoles

### Procédure tRPC
- [x] Créer la procédure `volunteers.list` pour filtrer les membres par compétences, disponibilités et rattachement aux antennes/projets
- [x] Créer la mutation `volunteers.updateProfile` permettant aux membres de mettre à jour leurs compétences et disponibilités
- [x] Créer la mutation `volunteers.assignProject` pour lier un bénévole à une antenne ou un projet spécifique

### Interface Utilisateur (Portail Bénévole)
- [x] Créer la page `client/src/pages/VolunteerPortal.tsx`
- [x] Ajouter les filtres par compétences (communication, technique, terrain, logistique) et disponibilités (week-end, soir, temps partiel, permanent)
- [x] Intégrer l'affichage des affectations aux antennes et projets de l'association
- [x] Ajouter le lien "Bénévoles" dans le menu de navigation (DashboardLayout) et la route dans App.tsx

### Tests et Validation
- [x] Écrire un test unitaire `server/volunteers.test.ts`
- [x] Vérifier les tests Vitest et la build de production

## Phase 38 - Suivi Administratif Avancé et Historique des Statuts

### Procédure tRPC
- [x] Vérifier et enrichir les procédures de changement de statut avec enregistrement systématique des motifs (radiations, suspensions, réactivations)
- [x] Créer la procédure `members.statusHistory` pour récupérer l'historique complet des statuts d'un membre avec auteur et horodatage
- [x] Valider l'accès protégé par la permission `members.manage`

### Interface Utilisateur (Historique et Motifs)
- [x] Intégrer l'affichage de l'historique des statuts dans le modal de profil membre (`MemberProfileModal.tsx`)
- [x] Ajouter un champ de motif obligatoire lors des modifications de statut critique (suspension, radiation, démission)
- [x] Afficher clairement les horodatages, les anciens et nouveaux statuts ainsi que les auteurs des modifications

### Tests et Validation
- [x] Créer un test unitaire dédié `server/member-status-history.test.ts`
- [x] Valider tous les tests Vitest et la compilation de production

## Phase 39 - Conformité Financière et Multi-devises (EUR / XOF)

### Schéma et Procédure tRPC
- [x] Vérifier la prise en charge des devises (EUR et XOF) dans les transactions et adhésions
- [x] Créer des procédures tRPC pour le calcul des équivalences (taux fixe 1 EUR = 655.957 XOF)
- [x] Automatiser l'émission de reçus fiscaux conformes avec numérotation unique et mention légale

### Interface et Validation
- [x] Ajouter un sélecteur de devise et l'affichage croisé EUR/XOF dans le module financier
- [x] Permettre le téléchargement de reçus fiscaux et certificats de dons au format PDF/HTML
- [x] Écrire un test unitaire `server/financial-multicurrency.test.ts` et valider l'ensemble

## Phase 41 - Catégories d’Adhésion et Tarifs Spécifiques
- [x] Créer les tables et colonnes pour les catégories d’adhésion (Standard, Étudiant, Bienfaiteur, Fondateur, Actif, Honoraire)
- [x] Configurer les cotisations automatiques selon la catégorie du membre
- [x] Mettre à jour les interfaces de gestion des membres pour inclure la sélection de catégorie
- [x] Valider par des tests unitaires et la build de production


## Optimisation Paramètres et Profils
- [x] Auditer les surfaces Paramètres utilisateur, Paramètres globaux, Paramètres administrateur et profils pour supprimer les doublons
- [x] Regrouper les préférences personnelles, le profil adhérent et les réglages généraux dans une architecture claire
- [x] Simplifier les libellés, la navigation et les cartes sans supprimer les fonctionnalités utiles
- [x] Vérifier les permissions et les parcours de navigation après réorganisation
- [x] Ajouter ou mettre à jour les tests et valider TypeScript, Vitest et la build de production
- [x] Sauvegarder l’optimisation validée dans un checkpoint

## Décisions de conservation
- [x] Conserver l’authentification, la récupération de mot de passe, les réglages EUR/XOF, le taux de change, la sauvegarde/restauration et l’historique de synchronisation
- [x] Conserver le profil adhérent, la carte, l’historique et les paramètres administratifs protégés
- [x] Documenter les doublons trouvés et tout élément regroupé ou retiré


## Animation de la page Paramètres
- [x] Ajouter une transition fluide entre les contenus d’onglets
- [x] Respecter prefers-reduced-motion et conserver l’accessibilité des onglets
- [x] Tester et compiler la modification
- [x] Sauvegarder la transition validée dans un checkpoint


## Indicateur actif dynamique sur les onglets de Paramètres
- [x] Ajouter une classe ou un style d’indicateur glissant sous l’onglet actif
- [x] Gérer l’accessibilité et prefers-reduced-motion pour l’indicateur
- [x] Valider avec un test de contrat et la build de production
- [x] Sauvegarder le raffinement visuel dans un checkpoint


## Réinitialisation des préférences avec confirmation
- [x] Ajouter une boîte de dialogue de confirmation pour réinitialiser les préférences
- [x] Réinitialiser les choix locaux (langue, format de date, notifications) sans impacter les données métier
- [x] Écrire un test de non-régression et valider avec Vitest et la build
- [x] Sauvegarder la modification dans un checkpoint


## Toast de succès après réinitialisation des paramètres
- [x] Personnaliser le toast de confirmation pour qu’il soit explicite et bref
- [x] Valider l’intégration par les tests Vitest et la build de production
- [x] Sauvegarder la modification validée dans un checkpoint


## Basculement de thème clair/sombre dans les paramètres généraux
- [x] Ajouter une option claire et explicite pour basculer entre mode clair et mode sombre dans l’onglet Préférences
- [x] Connecter le sélecteur à ThemeContext et usePreferences pour une persistance synchrone
- [x] Valider l’intégration par les tests Vitest et la build de production
- [x] Sauvegarder l’option validée dans un checkpoint


## Option de thème Système
- [x] Étendre le type Theme à "light" | "dark" | "system" dans ThemeContext
- [x] Implémenter l’écoute des préférences du système d’exploitation via matchMedia
- [x] Ajouter le bouton Système dans les paramètres d’apparence de /settings
- [x] Écrire un test Vitest et valider la compilation de production
- [x] Sauvegarder la modification validée dans un checkpoint


## Système de notation et progression des membres (Grades et Responsabilités)
- [x] Créer les tables member_evaluations et member_grades dans drizzle/schema.ts
- [x] Ajouter les helpers de requête de notation et de grade dans server/db.ts
- [x] Développer les procédures tRPC sécurisées pour noter, promouvoir et assigner des responsabilités
- [x] Créer l’interface de notation et de suivi des grades dans la section membres et fiches individuelles
- [x] Écrire les tests Vitest, valider la compilation de production et sauvegarder le checkpoint


## Graphique de répartition des grades sur le tableau de bord
- [x] Ajouter la fonction d’agrégation des membres par grade dans server/db.ts
- [x] Exposer les statistiques de grades dans la procédure dashboard.members de server/routers.ts
- [x] Créer le composant de visualisation graphique ou de barres de répartition par grade dans le tableau de bord principal
- [x] Gérer l’état vide lorsque aucun grade n’est encore attribué
- [x] Ajouter un test de non-régression et valider avec Vitest et la build de production
- [x] Sauvegarder l’intégration validée dans un checkpoint


## Infobulles des critères de grade
- [x] Ajouter une infobulle au survol et à la mise au focus de chaque barre de grade
- [x] Afficher le seuil minimal et un résumé des responsabilités dans chaque infobulle
- [x] Garantir la compatibilité clavier, le contraste et le responsive
- [x] Ajouter un test de contrat et valider Vitest et la build de production
- [x] Sauvegarder l’intégration validée dans un checkpoint


## Filtrage interactif par grade
- [x] Rendre chaque barre du graphique activable par clic et par clavier
- [x] Transmettre le grade sélectionné vers la liste des membres
- [x] Afficher le filtre actif et une action pour revenir à tous les membres
- [x] Préserver recherche, tri, pagination et état vide lors du filtrage
- [x] Ajouter un test de contrat et valider Vitest et la build de production
- [x] Sauvegarder l’intégration validée dans un checkpoint

## Phase 18 - Filtrage interactif par grade

- [x] Préserver le contrat typé de `getAllMembers` et isoler la liste enrichie de grades
- [x] Exposer le grade actuel dans `members.list` sans régression des autres procédures
- [x] Naviguer du graphique de grades vers `/members?grade=...`
- [x] Appliquer le filtre de grade dans la liste des membres
- [x] Afficher une action claire pour retirer le filtre actif
- [x] Ajouter les tests de contrat du parcours clic → filtre → réinitialisation
- [x] Valider TypeScript, tests Vitest, build et rendu responsive du parcours

## Phase 19 - Transition fluide et chargement animé vers l’annuaire filtré
- [x] Ajouter un état de transition (isTransitioning) lors du clic sur un grade dans le tableau de bord
- [x] Afficher une superposition de chargement animée (spinner, fondu d’entrée/sortie et message explicite)
- [x] Respecter les directives d’animation (durée < 300ms, transform/opacity, prefers-reduced-motion)
- [x] Valider par des tests unitaires et la compilation de production
- [x] Sauvegarder la modification validée dans un checkpoint

## Audit général de l’application
- [x] Inventorier les routes, pages, procédures tRPC et dépendances principales
- [x] Vérifier TypeScript, tests, build, logs serveur et console navigateur
- [x] Contrôler les boutons, liens, formulaires, états de chargement et routes orphelines
- [x] Rechercher les répétitions, incohérences de libellés, devises, statuts et formats de date
- [x] Vérifier les permissions, validations Zod, contrôles d’accès objet et exposition de données
- [x] Rechercher les secrets, injections, XSS, fichiers non sécurisés et configurations fragiles
- [x] Corriger les problèmes critiques et élevés confirmés par l’audit
- [x] Ajouter les tests de non-régression associés aux corrections
- [x] Produire un rapport d’audit avec risques, preuves, priorités et recommandations
- [x] Valider TypeScript, tests, build et sauvegarder le résultat
- [x] Corriger l’exposition publique des documents, archives, statistiques, exports et notes en imposant l’authentification et la permission documents.view
- [x] Ajouter un test de régression garantissant le refus des accès documentaires non authentifiés
- [x] Remplacer streamdown 1.x et la chaîne mermaid vulnérable par une version maintenue, puis vérifier la compatibilité de rendu Markdown
- [x] Mettre à niveau la chaîne AWS/S3 qui fournit fast-xml-parser et vérifier la disparition de l’alerte critique
- [x] Imposer `documents.manage` aux créations, modifications, suppressions, archivages et opérations de fichiers documentaires
- [x] Valider strictement le nom, le type, la taille et le contenu Base64 des fichiers téléversés
- [x] Ajouter des tests de régression pour refuser les mutations documentaires sans permission de gestion
- [x] Imposer `members.view` aux lectures membres, cartes, adhésions et exports
- [x] Imposer `members.manage` aux créations, modifications, suppressions et photos des membres
- [x] Ajouter un test de régression garantissant le refus des lectures et mutations membres sans permission

## Cartographie des API de l’application
- [x] Inventorier les API internes et services déjà utilisés par chaque module
- [x] Identifier les API indispensables, recommandées, optionnelles et à éviter
- [x] Vérifier les besoins d’authentification, paiements, notifications, fichiers, cartes et automatisations
- [x] Documenter les prérequis, données échangées, risques et coûts indicatifs
- [x] Livrer une matrice priorisée des API nécessaires à l’application

## Intégration Stripe
- [x] Ajouter la configuration Stripe côté serveur et documenter les secrets requis
- [x] Définir le modèle de paiement et le lien avec membres, cotisations, dons et campagnes
- [x] Implémenter Checkout Stripe avec métadonnées et idempotence
- [x] Implémenter le webhook Stripe avec vérification de signature et déduplication
- [x] Rapprocher les paiements Stripe avec les écritures financières internes
- [x] Connecter l’interface aux états de paiement et aux retours Checkout
- [x] Ajouter les tests de sécurité, de validation et de non-régression Stripe
- [x] Valider TypeScript, tests, build et sauvegarder l’intégration
- [x] Configurer un parcours Stripe Checkout pour les cotisations avec rattachement au membre et à la catégorie d’adhésion
- [x] Configurer un parcours Stripe Checkout pour les dons ponctuels et affectés à une campagne
- [x] Configurer un parcours Stripe Checkout pour les campagnes de collecte avec objectifs et métadonnées de campagne
- [x] Mettre à niveau nanoid vers une version corrigée et vérifier les usages générant des identifiants
- [x] Mettre à niveau axios/form-data vers une chaîne corrigée et vérifier les intégrations concernées
- [x] Rejouer l’audit des dépendances et documenter les alertes transitives impossibles à corriger sans changement majeur
- [x] Mettre à niveau drizzle-orm vers une version corrigée et vérifier les requêtes Drizzle existantes
- [x] Créer l’écriture locale `dons` lors de la confirmation Stripe d’un don ou d’une campagne et relier son identifiant au paiement
- [x] Ajouter un test de régression du rapprochement Stripe vers une cotisation, un don et une campagne

## Correctif boucle React Finance
- [x] Reproduire l’erreur Maximum update depth exceeded sur `/finance`
- [x] Identifier le composant ou la prop instable qui déclenche la mise à jour récursive
- [x] Corriger la boucle sans supprimer les fonctionnalités de paiement ou de finance
- [x] Ajouter un test de non-régression du composant concerné
- [x] Valider TypeScript, tests, build et rendu Finance

## Visibilité Stripe dans Finance
- [x] Vérifier si le panneau Stripe est monté dans la page Finance et s’il est masqué par le mode hors ligne ou une permission
- [x] Vérifier le lien Paramètres → Paiement et l’état des clés Stripe
- [x] Corriger le point d’accès ou l’affichage Stripe si nécessaire
- [x] Ajouter un test de non-régression de visibilité du panneau Stripe
- [x] Valider TypeScript, tests, build et sauvegarder le correctif
- [x] Ajouter un onglet « Paiements Stripe » visible dans Finance, avec explication du mode en ligne et de la configuration requise

## Progression des campagnes de collecte
- [x] Auditer le modèle et la vue des campagnes pour identifier objectif et montant collecté
- [x] Calculer le pourcentage collecté avec protection contre les valeurs invalides
- [x] Afficher une barre de progression visuelle par campagne
- [x] Gérer les objectifs atteints, dépassés et les états sans objectif
- [x] Ajouter les attributs d’accessibilité et les tests de non-régression
- [x] Valider TypeScript, tests, build et rendu responsive

## Tranche prioritaire suivante
- [x] Auditer les modules déjà présents et les fonctionnalités associatives encore incomplètes
- [x] Identifier les flux critiques manquants : adhésions, reçus, trésorerie, gouvernance, communication et sauvegarde
- [x] Prioriser une amélioration métier à fort impact avant d’ajouter une nouvelle API externe
- [x] Vérifier les API déjà disponibles et les connecteurs activés avant toute configuration
- [x] Implémenter la prochaine tranche retenue avec contrôles d’accès et traçabilité
- [x] Ajouter les tests, documenter les prérequis et valider la build

## Module Événements prioritaire
- [x] Remplacer les événements statiques par un modèle persisté et une API tRPC protégée
- [x] Ajouter les opérations de création, modification, suppression et changement de statut avec audit
- [x] Conserver recherche, filtres, tri, chargement et états vides dans l’interface Événements
- [x] Préparer une intégration calendrier externe sans rendre Google Calendar obligatoire
- [x] Ajouter les tests de permissions, validation et non-régression du module Événements

## Intégration Brevo
- [x] Auditer les modèles, historiques, préférences et flux d’e-mails existants
- [x] Ajouter la clé `BREVO_API_KEY` côté serveur sans exposer sa valeur au client
- [ ] Ajouter la configuration de l’expéditeur et du domaine vérifié
- [x] Implémenter un client Brevo avec timeout, validation, journalisation et gestion d’erreur
- [x] Connecter les e-mails transactionnels de reçus, rappels, convocations et confirmations
- [ ] Respecter les consentements, désabonnements et préférences des membres
- [x] Ajouter tests de contrat et de non-régression sans envoyer de vrai e-mail
- [x] Valider TypeScript, tests, build et sauvegarder l’intégration
