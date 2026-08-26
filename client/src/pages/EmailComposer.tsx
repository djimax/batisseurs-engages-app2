import { useState, useMemo } from "react";
import { buildEmailPreviewDocument, replaceEmailPreviewVariables, EMAIL_PREVIEW_VARIABLES } from "@/lib/emailPreview";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, CheckCircle2, AlertCircle, Users, Filter, Eye } from "lucide-react";

const MEMBER_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "president", label: "Président" },
  { value: "secretary_general", label: "Secrétaire Général" },
  { value: "secretary_general_adjoint", label: "Secrétaire Général Adjoint" },
  { value: "treasurer_general", label: "Trésorier Général" },
  { value: "treasurer_general_adjoint", label: "Trésorier Général Adjoint" },
  { value: "member", label: "Membre" },
];

const MEMBER_STATUS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "pending", label: "En attente" },
];

export default function EmailComposer() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateId, setTemplateId] = useState<string>("new");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Filtres
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [excludeNoEmail, setExcludeNoEmail] = useState(false);
  const [excludedMemberIds, setExcludedMemberIds] = useState<number[]>([]);

  const { data: templates, isLoading: templatesLoading } = trpc.email.templates.list.useQuery();
  const recipientFilter = useMemo(() => ({
    roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    excludeNoEmail,
    excludedMemberIds: excludedMemberIds.length > 0 ? excludedMemberIds : undefined,
  }), [selectedRoles, selectedStatuses, excludeNoEmail, excludedMemberIds]);
  const { data: filteredRecipients = [], isFetching: recipientsLoading } = trpc.email.getFilteredRecipients.useQuery(recipientFilter);
  const sendEmailMutation = trpc.email.sendMassEmail.useMutation();
  const previewDocument = useMemo(() => buildEmailPreviewDocument(subject, content), [subject, content]);
  const previewSubject = replaceEmailPreviewVariables(subject);

  const handleLoadTemplate = (id: string) => {
    if (id === "new") {
      setSubject("");
      setContent("");
      setTemplateId("new");
    } else {
      const template = templates?.find((t) => t.id === parseInt(id));
      if (template) {
        setSubject(template.subject);
        setContent(template.content);
        setTemplateId(id);
      }
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleExcludedMember = (memberId: number) => {
    setExcludedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      setErrorMessage("Veuillez remplir le sujet et le contenu de l'email");
      return;
    }

    if (filteredRecipients.length === 0) {
      setErrorMessage("Aucun destinataire sélectionné");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await sendEmailMutation.mutateAsync({
        subject,
        content,
        templateId: templateId && templateId !== "new" ? parseInt(templateId) : undefined,
        recipientFilter,
      });

      if (result.success) {
        setSuccessMessage(
          `Email envoyé avec succès à ${result.successCount}/${result.totalCount} membres`
        );
        setSubject("");
        setContent("");
        setTemplateId("new");
        setSelectedRoles([]);
        setSelectedStatuses([]);
        setExcludedMemberIds([]);
        setExcludeNoEmail(false);
      } else {
        setErrorMessage(result.error || "Erreur lors de l'envoi de l'email");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Composer un Email</h1>
        <p className="text-muted-foreground">
          Envoyez des emails à des groupes de membres sélectionnés
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtres - Colonne de gauche */}
        <div className="lg:col-span-1 space-y-4">
          {/* Sélection des rôles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rôles</CardTitle>
              <CardDescription>Sélectionner les rôles à inclure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {MEMBER_ROLES.map((role) => (
                <div key={role.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                  />
                  <label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                    {role.label}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sélection des statuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statuts</CardTitle>
              <CardDescription>Sélectionner les statuts à inclure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {MEMBER_STATUS.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={selectedStatuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer">
                    {status.label}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filtres additionnels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="exclude-no-email"
                  checked={excludeNoEmail}
                  onCheckedChange={(checked) => setExcludeNoEmail(checked as boolean)}
                />
                <label htmlFor="exclude-no-email" className="text-sm cursor-pointer">
                  Exclure sans email
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Résumé des destinataires */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinataires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{filteredRecipients.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredRecipients.length === 1 ? "destinataire" : "destinataires"} sélectionné(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal - Colonne de droite */}
        <div className="lg:col-span-2 space-y-6">
          {/* Templates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modèles d'Email</CardTitle>
              <CardDescription>
                Choisissez un modèle existant ou créez un nouvel email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={templateId} onValueChange={handleLoadTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Créer un nouvel email</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Email Composer Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contenu de l'Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <Input
                  placeholder="Entrez le sujet de l'email"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Contenu</label>
                <Textarea
                  placeholder="Entrez le contenu de l'email"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Vous pouvez utiliser du texte brut ou du HTML
                </p>
              </div>

              {subject || content ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div><h3 className="font-semibold">Aperçu avant envoi</h3><p className="mt-1 text-xs text-muted-foreground">Rendu local sécurisé · aucune requête réseau ni aucun e-mail n’est envoyé.</p></div>
                  <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4" />Prévisualiser</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-4xl overflow-hidden p-0">
              <DialogHeader className="border-b px-6 py-5">
                <DialogTitle>Prévisualisation du modèle</DialogTitle>
                <DialogDescription>Exemple rendu pour Marie Martin · {EMAIL_PREVIEW_VARIABLES.memberEmail}</DialogDescription>
              </DialogHeader>
              <div className="bg-muted/40 p-4 sm:p-6">
                <div className="mb-3 rounded-lg border bg-background px-4 py-3 text-sm"><span className="font-medium">Objet :</span> {previewSubject || "Sans objet"}</div>
                <iframe title="Prévisualisation de l’e-mail" sandbox="" srcDoc={previewDocument} className="h-[min(60vh,560px)] w-full rounded-xl border bg-white shadow-sm" />
              </div>
            </DialogContent>
          </Dialog>

          {/* Liste des destinataires */}
          {filteredRecipients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aperçu des Destinataires</CardTitle>
                <CardDescription>
                  {recipientsLoading ? "Mise à jour des destinataires…" : `${filteredRecipients.length} destinataire(s) recevront cet email`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {filteredRecipients.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {MEMBER_ROLES.find((r) => r.value === member.role)?.label || "Membre"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExcludedMember(member.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Exclure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Send Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={isLoading || recipientsLoading || !subject.trim() || !content.trim() || filteredRecipients.length === 0}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'Email ({filteredRecipients.length})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSubject("");
                setContent("");
                setTemplateId("new");
                setSuccessMessage("");
                setErrorMessage("");
              }}
              disabled={isLoading}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
