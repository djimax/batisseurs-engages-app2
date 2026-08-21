# Architecture des paramètres et des profils

## Décision d’organisation

L’application conserve quatre responsabilités distinctes, mais les rend accessibles depuis un même hub `/settings`. Cette organisation évite de mélanger les données personnelles avec la configuration officielle de l’association, tout en supprimant les écrans concurrents et les libellés ambigus.

| Surface | Route | Source de vérité | Accès | Contenu |
| --- | --- | --- | --- | --- |
| Hub des paramètres | `/settings` | Préférences locales et contextes existants | Utilisateur authentifié | Mode en ligne/hors ligne, apparence, langue, format de date, notifications, sauvegarde, synchronisation, devise et taux EUR/XOF |
| Profil adhérent | `/member-portal` | `members` et historique du profil | Utilisateur authentifié associé à un membre | Coordonnées modifiables, identifiant, statut, carte QR et historique |
| Identité de l’association | `/global-settings` | Table `global_settings` | Administrateur | Nom, logo, siège, folio, email, téléphone, site et présentation officielle |
| Réglages techniques | `/admin/settings` | Table clé-valeur `admin_settings` | Administrateur | Taille maximale des téléversements uniquement |

## Doublons traités

`GlobalSettings` et `AdminSettings` proposaient auparavant deux fois le titre, la description, le logo et les coordonnées de l’application. La page `/global-settings` devient la surface canonique pour l’identité associative. `/admin/settings` conserve seulement le réglage technique de téléversement, sans supprimer les anciennes clés persistées dans la base afin de préserver la compatibilité.

Le profil adhérent reste séparé des préférences locales. Les coordonnées, la carte et l’historique sont des données métier associées au membre ; la langue, le thème, la devise et le mode de travail sont des préférences d’utilisation. Le hub `/settings` fournit un accès direct au profil au lieu de recopier ses champs.

## Navigation

Le menu utilisateur pointe vers `/settings` sous le libellé **Paramètres & profil**. Le menu latéral utilise **Mon profil adhérent** et **Identité de l’association**, tandis que le libellé technique n’est pas exposé comme une entrée concurrente : il est accessible depuis le hub et depuis la page d’identité, avec un contrôle administrateur côté interface et côté serveur.

Les routes existantes sont conservées pour les liens enregistrés et les favoris. Aucune migration destructive n’est nécessaire.

## Règles pour les évolutions futures

Toute nouvelle préférence personnelle doit rejoindre `/settings` et `usePreferences`. Toute donnée officielle de l’association doit rejoindre `global_settings` et `/global-settings`. Toute donnée métier du membre doit rester dans le portail ou les écrans membres. Un paramètre de maintenance doit rester dans `/admin/settings` et être protégé par `adminProcedure` côté serveur.

Les composants doivent privilégier des titres courts, une description unique par section, des états de chargement visibles et un retour vers le hub. Il faut éviter de recopier des champs identiques dans plusieurs écrans sans raison métier explicite.
