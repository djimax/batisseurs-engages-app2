# Intégration Google Drive

## Périmètre recommandé

Le premier flux doit permettre à un membre autorisé de sélectionner un fichier Google Drive, d’importer ses métadonnées dans le module Documents, puis de télécharger une copie vers le stockage sécurisé de l’association. Une synchronisation bidirectionnelle permanente est volontairement hors du premier lot, car elle nécessite une gestion plus large des conflits, suppressions et révocations.

## Prérequis officiels

Google utilise OAuth 2.0 pour l’autorisation des applications. Le flux général consiste à obtenir des identifiants OAuth dans Google API Console, obtenir un jeton d’accès, vérifier les scopes accordés, appeler l’API avec le jeton, puis renouveler le jeton lorsque nécessaire. Source : https://developers.google.com/identity/protocols/oauth2.

Google Picker est une boîte de dialogue distincte de l’API Drive permettant à une application web de sélectionner ou téléverser des fichiers Drive. Source : https://developers.google.com/workspace/drive/api/guides/picker.

L’API Drive permet de rechercher et télécharger des fichiers, et `files.list` accepte une requête `q`, la pagination par `nextPageToken`, ainsi que les paramètres relatifs aux Drive partagés. Source : https://developers.google.com/workspace/drive/api/guides/about-sdk et https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list.

## Scopes à privilégier

Le périmètre initial doit privilégier `https://www.googleapis.com/auth/drive.file` lorsque le flux porte sur les fichiers sélectionnés ou créés par l’application. Un scope plus large comme `drive.readonly` ou `drive` ne doit être utilisé que si le besoin métier est confirmé, car certains scopes sont restreints et peuvent déclencher des exigences supplémentaires de vérification de sécurité.

## Décision de sécurité

Aucun secret OAuth ne doit être placé dans le dépôt, l’URL ou une commande visible. La connexion devra utiliser un connecteur OAuth Google Drive autorisé par l’utilisateur. Tant qu’aucun connecteur Google Drive n’est disponible dans la session, l’implémentation peut préparer l’interface et les contrats, mais ne doit pas prétendre que l’accès Drive est actif.

## Références

1. Google, Using OAuth 2.0 to Access Google APIs : https://developers.google.com/identity/protocols/oauth2
2. Google, Display the Google Picker : https://developers.google.com/workspace/drive/api/guides/picker
3. Google, Google Drive API overview : https://developers.google.com/workspace/drive/api/guides/about-sdk
4. Google, Method `files.list` : https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list

## État de connexion au 27 août 2026

Le connecteur intégré **Google Workspace** est activé dans la session. Le compte `contact.lesbatisseursengages@gmail.com` est connecté dans Google Drive et la page « Mon Drive » est accessible. Le connecteur apparaît comme activé, mais il n’est pas exposé comme serveur MCP autonome dans l’outil CLI ; la suite de l’intégration doit donc utiliser le flux Google Workspace prévu par l’interface/connecteur, et non inventer un endpoint MCP ou un jeton local. Aucun fichier n’a été modifié, téléchargé ou supprimé pendant la vérification.
