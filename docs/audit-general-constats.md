# Audit général — constats intermédiaires

## Périmètre inspecté

L’application utilise React 19, Tailwind 4, tRPC 11, Drizzle/MySQL et un routeur en ligne protégé par authentification. Le point d’entrée expose notamment les modules membres, annuaire, bénévoles, documents, archives, finances, campagnes, adhésions, événements, communication, gouvernance, CRM, paramètres, administration et projets.

## Constats confirmés

| Niveau | Constat | Preuve / zone | Décision |
|---|---|---|---|
| Élevé | Les procédures `documents.list`, `documents.getById`, `documents.stats`, `documents.exportReport`, `documents.archived` et `notes.listByDocument` étaient publiques. | `server/routers.ts`, routeur documents/notes | Correction engagée : authentification + `documents.view`, validation Zod renforcée et test de refus non authentifié. |
| Moyen | Les tests documentaires représentaient les lectures comme publiques et ne couvraient pas le refus non authentifié. | `server/documents.test.ts` | Tests convertis en contexte autorisé et test de non-régression ajouté. |
| Moyen | `pnpm audit --prod` signale 87 vulnérabilités transitives : 12 faibles, 51 modérées, 23 élevées et 1 critique. | Audit des dépendances du 25 août 2026 | Analyse détaillée des paquets à poursuivre avant toute mise à niveau automatique. |
| Faible | Trois écrans présents ne sont pas routés dans `App.tsx` : `ComponentShowcase`, `OfflineApp`, `UserManagement`. | Comparaison `client/src/pages` / `client/src/App.tsx` | À classer : démonstration, ancien écran ou fonctionnalité à retirer/réintégrer. |
| Faible | Des liens `href="#"` existent dans `ComponentShowcase.tsx`, écran non routé. | `client/src/pages/ComponentShowcase.tsx` | Pas un parcours utilisateur courant, mais à supprimer ou remplacer si l’écran est réactivé. |
| Faible | Le script de projet ne contient pas de commande lint dédiée. | `package.json` | Recommandation : ajouter ESLint/format-check ou documenter le choix. |

## État de validation au moment de la collecte

Avant le durcissement documentaire, `pnpm check`, `pnpm test -- --run` et `pnpm build` étaient passés. Après le durcissement, le contrôle TypeScript est repassé ; les tests ciblés ont nécessité l’adaptation des fixtures aux permissions désormais obligatoires et doivent être rejoués avec la suite complète.

## Points à poursuivre

L’audit doit encore couvrir les contrôles d’accès objet et périmètre, les mutations et validations serveur, les uploads et types MIME, les exports, les parcours de navigation principaux, les incohérences de devise et de statut, ainsi que les vulnérabilités transitives de dépendances. Aucun secret réel ne doit être copié dans le rapport.

## Mise à jour sécurité — dépendances

La mise à niveau de `streamdown` de 1.4.0 vers 2.6.0 a supprimé la chaîne directe `streamdown → mermaid` signalée auparavant. Les paquets AWS S3 ont également été mis à niveau de 3.907.0 vers 3.1117.0 ; l’alerte critique `fast-xml-parser` n’apparaît plus dans le rapport final. `pnpm audit --prod` signale encore 48 vulnérabilités transitives, dont 5 faibles, 24 modérées et 19 élevées. Elles doivent être traitées par paquet et chaîne d’origine, sans mise à niveau globale non testée.

La mise à niveau AWS affiche un avertissement de peer dependency non bloquant : `@builder.io/vite-plugin-jsx-loc@0.1.1` attend Vite 4 ou 5 alors que le projet utilise Vite 7.1.9. Ce point est à documenter ou à supprimer/remplacer si le plugin n’est pas indispensable en production.

## Contrôle visuel d’accueil

L’écran d’accueil a été observé en desktop 1280×720 et en mobile 375×812. Les deux choix de mode sont visibles, hiérarchisés et lisibles ; le mode en ligne est clairement recommandé. Le mobile conserve une hiérarchie correcte et la première carte est accessible sans débordement visible dans la zone capturée. L’audit des écrans authentifiés reste à effectuer avec une session de test dédiée ; aucun identifiant ne sera demandé ni inscrit dans le dépôt.

## Contrôles d’accès membres

L’audit a également confirmé que plusieurs procédures membres n’appliquaient que `protectedProcedure` sans permission fine : liste, fiche, carte d’adhésion, export, création, modification, suppression et photos. Ces surfaces ont été alignées sur `members.view` pour les lectures et `members.manage` pour les mutations. Une régression couvre désormais le refus d’un utilisateur authentifié dépourvu de permission.

Les mutations documentaires et les notes associées exigent maintenant `documents.manage`, tandis que les lectures exigent `documents.view`. Les identifiants sont positifs et entiers ; les filtres sont bornés par enums et longueurs ; les uploads contrôlent le nom, le type MIME, la taille, le Base64 et la cohérence entre taille annoncée et octets décodés. Le nom utilisé dans la clé de stockage est neutralisé afin d’éviter les séparateurs de chemin.

## Performance et maintenance

La build réussit, mais signale un chunk JavaScript principal d’environ 3,4 Mo minifié et un conflit entre import statique et dynamique de jsPDF. Il s’agit d’une optimisation recommandée, non d’un défaut fonctionnel immédiat. La commande `pnpm audit --prod` ne signale plus de vulnérabilité critique après les mises à niveau ; 48 alertes transitives restent ouvertes, dont 19 élevées. Elles nécessitent une revue ciblée des chaînes concernées.
