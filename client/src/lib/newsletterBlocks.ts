export type NewsletterBlock = {
  id: "welcome" | "announcement" | "event" | "call-to-action";
  label: string;
  description: string;
  subject: string;
  content: string;
};

export const NEWSLETTER_BLOCKS: NewsletterBlock[] = [
  {
    id: "welcome",
    label: "Message d’accueil",
    description: "Introduction personnalisée pour les membres.",
    subject: "Les nouvelles de {{associationName}}",
    content: "Bonjour {{firstName}},\n\nNous sommes heureux de vous retrouver dans la lettre d’information de {{associationName}}.\n\nMerci pour votre engagement à nos côtés.",
  },
  {
    id: "announcement",
    label: "Annonce associative",
    description: "Bloc court pour une actualité importante.",
    subject: "Une nouvelle importante pour {{associationName}}",
    content: "## Une actualité à partager\n\nPrésentez ici l’information essentielle, son contexte et la prochaine étape attendue des membres.",
  },
  {
    id: "event",
    label: "Événement",
    description: "Invitation avec date et lien d’action.",
    subject: "Prochain rendez-vous de l’association",
    content: "## Prochain rendez-vous\n\nDate : {{date}}\n\nNous vous invitons à participer à notre prochaine activité associative.\n\nLien d’information : {{actionUrl}}",
  },
  {
    id: "call-to-action",
    label: "Appel à contribution",
    description: "Mobilisation pour un projet ou une campagne.",
    subject: "Votre contribution peut faire la différence",
    content: "## Agissons ensemble\n\nVotre soutien permet à {{associationName}} de poursuivre ses actions sur le terrain.\n\nDécouvrez les projets en cours et choisissez la manière de contribuer.",
  },
];

export function getNewsletterBlock(id: NewsletterBlock["id"]) {
  return NEWSLETTER_BLOCKS.find((block) => block.id === id) ?? null;
}

export function appendNewsletterBlock(current: string, block: NewsletterBlock) {
  const separator = current.trim() ? "\n\n" : "";
  return `${current.trimEnd()}${separator}${block.content}`;
}
