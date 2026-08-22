export const MEMBER_GRADE_LEVELS = [
  {
    value: "member",
    label: "Membre",
    minimumScore: 0,
    responsibilities: "Participer aux activités et respecter les engagements associatifs.",
  },
  {
    value: "active_member",
    label: "Membre actif",
    minimumScore: 60,
    responsibilities: "Contribuer régulièrement aux activités et accompagner les nouveaux membres.",
  },
  {
    value: "team_lead",
    label: "Responsable d’équipe",
    minimumScore: 75,
    responsibilities: "Coordonner une équipe sur une activité ou un projet identifié.",
  },
  {
    value: "antenna_coordinator",
    label: "Coordinateur d’antenne",
    minimumScore: 85,
    responsibilities: "Piloter les activités d’une antenne et assurer le suivi des équipes locales.",
  },
  {
    value: "regional_referent",
    label: "Référent régional",
    minimumScore: 92,
    responsibilities: "Accompagner plusieurs antennes et contribuer aux décisions opérationnelles régionales.",
  },
] as const;

export type MemberGradeValue = (typeof MEMBER_GRADE_LEVELS)[number]["value"];

export function getMemberGradeLevel(value: string) {
  return MEMBER_GRADE_LEVELS.find((grade) => grade.value === value) ?? MEMBER_GRADE_LEVELS[0];
}

export function canAssignMemberGrade(score: number, grade: string) {
  return score >= getMemberGradeLevel(grade).minimumScore;
}
