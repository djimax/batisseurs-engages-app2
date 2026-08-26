export const EMAIL_PREVIEW_VARIABLES: Record<string, string> = {
  memberName: "Marie Martin",
  firstName: "Marie",
  lastName: "Martin",
  memberEmail: "marie.martin@example.org",
  association: "Les Bâtisseurs Engagés",
  associationName: "Les Bâtisseurs Engagés",
  amount: "25,00 €",
  date: new Date().toLocaleDateString("fr-FR"),
};

export function escapeEmailPreviewHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;",
  })[character] ?? character);
}

export function replaceEmailPreviewVariables(value: string, variables = EMAIL_PREVIEW_VARIABLES) {
  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key: string) => variables[key] ?? match);
}

function sanitizeEmailMarkup(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|iframe|object|embed|form|meta|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|form|meta|base)[^>]*\/?>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:href|src)\s*=\s*(?:\"|')\s*javascript:[\s\S]*?(?:\"|')/gi, "")
    .replace(/\s+(?:href|src)\s*=\s*javascript:[^\s>]+/gi, "")
    .replace(/\s+style\s*=\s*(?:\"[^\"]*expression\([^\"]*\)[^\"]*\"|'[^']*expression\([^']*\)[^']*')/gi, "")
    .replace(/\s+(?:href|src)\s*=\s*(?:\"|')\s*(?:https?:|data:)[\s\S]*?(?:\"|')/gi, "")
    .replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\da-z]+;)/gi, "&amp;");
}

export function buildEmailPreviewDocument(subject: string, content: string) {
  const renderedSubject = escapeEmailPreviewHtml(replaceEmailPreviewVariables(subject));
  const renderedContent = replaceEmailPreviewVariables(content);
  const looksLikeMarkup = /<\/?[a-z][\s\S]*>/i.test(renderedContent);
  const body = looksLikeMarkup
    ? sanitizeEmailMarkup(renderedContent)
    : escapeEmailPreviewHtml(renderedContent).replace(/\r?\n/g, "<br>");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><style>body{margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#173b35}.shell{max-width:640px;margin:0 auto;padding:24px}.card{background:#fff;border:1px solid #dce8e2;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(23,59,53,.08)}.brand{padding:18px 24px;background:#e8f4ed;color:#075e50;font-weight:700}.content{padding:24px;line-height:1.6;overflow-wrap:anywhere}.subject{font-size:14px;color:#52716a;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #e5eeea}.footer{padding:0 24px 22px;color:#6b827d;font-size:12px}</style></head><body><main class="shell"><article class="card"><header class="brand">Les Bâtisseurs Engagés</header><section class="content"><div class="subject"><strong>Objet :</strong> ${renderedSubject || "Sans objet"}</div><div>${body || "Aucun contenu"}</div></section><footer class="footer">Aperçu local · les variables utilisent des valeurs d’exemple</footer></article></main></body></html>`;
}
