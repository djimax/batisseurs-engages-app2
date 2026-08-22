# Système de Notation, d’Évaluation et de Progression des Membres

Ce document formalise le module d’évaluation et de promotion des adhérents au sein de l’application **Les Bâtisseurs Engagés**. Ce système permet d’identifier les membres méritants, de suivre leur évolution par des notes objectivées et de leur conférer des responsabilités et des échelons supérieurs de manière traçable.

## Grille des Grades et Seuils de Compétence

L'attribution des grades repose sur une échelle de notation sur 100 points, garantissant l’objectivité et l’adéquation entre le niveau d’implication et les responsabilités confiées :

| Grade | Libellé | Seuil Minimal | Responsabilités Associées |
| :--- | :--- | :--- | :--- |
| `member` | Membre | 0 / 100 | Participer aux activités et respecter les engagements associatifs. |
| `active_member` | Membre actif | 60 / 100 | Contribuer régulièrement aux activités et accompagner les nouveaux membres. |
| `team_lead` | Responsable d’équipe | 75 / 100 | Coordonner une équipe sur une activité ou un projet identifié. |
| `antenna_coordinator` | Coordinateur d’antenne | 85 / 100 | Piloter les activités d’une antenne et assurer le suivi des équipes locales. |
| `regional_referent` | Référent régional | 92 / 100 | Accompagner plusieurs antennes et contribuer aux décisions opérationnelles régionales. |

## Traçabilité et Sécurité

1. **Rôle requis** : L'évaluation et la promotion d'un membre exigent la permission `members.manage` (réservée aux administrateurs et aux membres habilités).
2. **Statut obligatoire** : Seuls les membres disposant du statut `active` (actif) peuvent être évalués ou promus.
3. **Justification textuelle** : Chaque évaluation exige un commentaire qualitatif d’au moins 10 caractères pour consigner les motifs du score et de l’échelon proposé.
4. **Audit et Historique** : Chaque promotion met à jour la table persistante `member_grades`, consigne une entrée dans l'historique personnel du membre et génère une trace d'audit infalsifiable (`PROMOTE`).
