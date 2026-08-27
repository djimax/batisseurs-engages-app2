import { useState, useRef, useMemo } from "react";
import { ExportPDF } from "@/components/ExportPDF";
import { HeroSection } from "@/components/HeroSection";
import { Pagination } from "@/components/Pagination";
import { trpc } from "@/lib/trpc";
import { exportSignedDocumentPdf } from "@/lib/signedPdf";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  FileText, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Printer, 
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  MessageSquare,
  X,
  Filter,
  FolderOpen,
  FileIcon,
  File,
  FileSpreadsheet,
  FileImage,
  Loader2,
  Archive,
  UserPen,
  ShieldCheck
} from "lucide-react";

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

function toIcsDate(value: string | Date) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

function buildDocumentsCalendar(items: Array<{ id: number; title: string; description?: string | null; dueDate?: string | Date | null }>) {
  const events = items.filter((item) => item.dueDate).map((item) => {
    const start = toIcsDate(item.dueDate!);
    const endDate = new Date(item.dueDate!);
    endDate.setUTCDate(endDate.getUTCDate() + 1);
    return [
      "BEGIN:VEVENT",
      `UID:document-${item.id}@lesbatisseursengages`,
      `DTSTAMP:${toIcsDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
      `SUMMARY:${escapeIcsText(`Échéance documentaire — ${item.title}`)}`,
      item.description ? `DESCRIPTION:${escapeIcsText(item.description)}` : undefined,
      "END:VEVENT",
    ].filter(Boolean).join("\\r\\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Les Bâtisseurs Engagés//Documents//FR", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\\r\\n") + "\\r\\n";
}

const SORT_OPTIONS = [
  { value: "title-asc", label: "Titre (A-Z)" },
  { value: "title-desc", label: "Titre (Z-A)" },
  { value: "date-newest", label: "Plus recents" },
  { value: "date-oldest", label: "Plus anciens" },
  { value: "priority-high", label: "Priorite (Elevee)" },
  { value: "priority-low", label: "Priorite (Basse)" },
];

export default function Documents() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [signatureMemberId, setSignatureMemberId] = useState("");
  const [signatureSubject, setSignatureSubject] = useState("");
  const [typedSignature, setTypedSignature] = useState("");
  const [signatureConsent, setSignatureConsent] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [shareMemberId, setShareMemberId] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [shareCanDelete, setShareCanDelete] = useState(false);
  const [exportingSignatureId, setExportingSignatureId] = useState<number | null>(null);
  const [savedViewName, setSavedViewName] = useState("");
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("none");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [retentionDate, setRetentionDate] = useState("");
  const [legalHold, setLegalHold] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: 0,
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "pending" as "pending" | "in-progress" | "completed",
    dueDate: "",
    fiscalYear: "",
    antenneId: "",
    projectId: "",
    funder: "",
    confidentiality: "internal" as "internal" | "restricted" | "confidential",
    businessOwnerId: "",
  });

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: savedViews = [] } = trpc.documents.savedViews.useQuery();
  const { data: exportData } = trpc.documents.exportReport.useQuery({});
  const { data: documents, isLoading } = trpc.documents.list.useQuery({
    categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined,
    status: statusFilter !== "all" && ["pending", "in-progress", "completed"].includes(statusFilter)
      ? (statusFilter as "pending" | "in-progress" | "completed")
      : undefined,
    priority: priorityFilter !== "all" && ["low", "medium", "high", "urgent"].includes(priorityFilter)
      ? (priorityFilter as "low" | "medium" | "high" | "urgent")
      : undefined,
    search: searchTerm || undefined,
    isArchived: showArchived,
  });
  const { data: members = [] } = trpc.members.list.useQuery();
  const { data: signatureRequests = [], refetch: refetchSignatures } = trpc.signature.listForDocument.useQuery(
    { documentId: selectedDocument?.id || 0 },
    { enabled: !!selectedDocument }
  );
  const { data: documentPermissions = [], refetch: refetchDocumentPermissions } = trpc.documents.permissions.useQuery(
    { documentId: selectedDocument?.id || 0 },
    { enabled: !!selectedDocument }
  );
  const { data: documentVersions = [] } = trpc.documents.versions.useQuery(
    { documentId: selectedDocument?.id || 0 },
    { enabled: !!selectedDocument }
  );
  const { data: notes, refetch: refetchNotes } = trpc.notes.listByDocument.useQuery(
    { documentId: selectedDocument?.id || 0 },
    { enabled: !!selectedDocument }
  );
  const { data: accessLog = [] } = trpc.documents.accessLog.useQuery(
    { id: selectedDocument?.id || 0 },
    { enabled: !!selectedDocument }
  );

  const createDocument = trpc.documents.create.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.stats.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Document créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  const saveDocumentView = trpc.documents.saveView.useMutation({
    onSuccess: () => { utils.documents.savedViews.invalidate(); setSavedViewName(""); toast.success("Vue enregistrée"); },
    onError: (error) => toast.error("Impossible d’enregistrer la vue : " + error.message),
  });
  const deleteDocumentView = trpc.documents.deleteSavedView.useMutation({
    onSuccess: () => { utils.documents.savedViews.invalidate(); setSelectedSavedViewId("none"); toast.success("Vue supprimée"); },
    onError: (error) => toast.error("Impossible de supprimer la vue : " + error.message),
  });

  const recordDocumentAccess = trpc.documents.recordAccess.useMutation();
  const setDocumentRetention = trpc.documents.setRetention.useMutation({
    onSuccess: (document) => { if (document) { setSelectedDocument(document); setRetentionDate(document.retentionUntil ? new Date(Number(document.retentionUntil)).toISOString().slice(0, 10) : ""); setLegalHold(Boolean(document.legalHold)); } utils.documents.list.invalidate(); toast.success("Politique de conservation enregistrée"); },
    onError: (error) => toast.error("Conservation impossible : " + error.message),
  });
  const assignReview = trpc.documents.assignReview.useMutation({
    onSuccess: (document) => { if (document) setSelectedDocument(document); utils.documents.list.invalidate(); toast.success("Revue assignée"); },
    onError: (error) => toast.error("Assignation impossible : " + error.message),
  });
  const submitReview = trpc.documents.submitReview.useMutation({
    onSuccess: (document) => { if (document) setSelectedDocument(document); utils.documents.list.invalidate(); toast.success("Décision de revue enregistrée"); },
    onError: (error) => toast.error("Décision impossible : " + error.message),
  });

  const updateDocument = trpc.documents.update.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.stats.invalidate();
      toast.success("Document mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const shareDocument = trpc.documents.share.useMutation({
    onSuccess: () => {
      refetchDocumentPermissions();
      setShareMemberId("");
      setShareCanEdit(false);
      setShareCanDelete(false);
      toast.success("Document partagé");
    },
    onError: (error) => toast.error("Partage impossible : " + error.message),
  });
  const revokeDocumentShare = trpc.documents.revokeShare.useMutation({
    onSuccess: () => { refetchDocumentPermissions(); toast.success("Accès révoqué"); },
    onError: (error) => toast.error("Révocation impossible : " + error.message),
  });

  const approveDocument = trpc.documents.approve.useMutation({
    onSuccess: (document) => {
      utils.documents.list.invalidate();
      if (document) setSelectedDocument(document);
      setApprovalComment("");
      toast.success("Décision d’approbation enregistrée");
    },
    onError: (error) => toast.error("Erreur d’approbation : " + error.message),
  });

  const bulkArchiveDocuments = trpc.documents.bulkArchive.useMutation({
    onSuccess: (result) => { utils.documents.list.invalidate(); setSelectedDocumentIds([]); toast.success(`${result.updated} document(s) traité(s)${result.refused.length ? `, ${result.refused.length} refusé(s)` : ""}`); },
    onError: (error) => toast.error("Action groupée impossible : " + error.message),
  });
  const deleteDocument = trpc.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.stats.invalidate();
      setIsDetailDialogOpen(false);
      setSelectedDocument(null);
      toast.success("Document supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const uploadFile = trpc.documents.uploadFile.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.versions.invalidate();
      setIsUploadingFile(false);
      toast.success("Fichier uploadé avec succès");
    },
    onError: (error) => {
      setIsUploadingFile(false);
      toast.error("Erreur lors de l'upload: " + error.message);
    },
  });

  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      refetchNotes();
      setNewNote("");
      toast.success("Note ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const createSignatureRequest = trpc.signature.createRequest.useMutation({
    onSuccess: () => {
      refetchSignatures();
      setSignatureMemberId("");
      setSignatureSubject("");
      toast.success("Demande de signature créée");
    },
    onError: (error) => toast.error("Erreur de signature: " + error.message),
  });

  const signRequest = trpc.signature.sign.useMutation({
    onSuccess: () => {
      refetchSignatures();
      setTypedSignature("");
      setSignatureConsent(false);
      toast.success("Signature enregistrée avec preuve d’intégrité");
    },
    onError: (error) => toast.error("Signature refusée: " + error.message),
  });

  const cancelSignatureRequest = trpc.signature.cancel.useMutation({
    onSuccess: () => {
      refetchSignatures();
      toast.success("Demande annulée");
    },
    onError: (error) => toast.error("Erreur: " + error.message),
  });

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      refetchNotes();
      toast.success("Note supprimée");
    },
  });

  const archiveDocument = trpc.documents.archive.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      utils.documents.stats.invalidate();
      utils.documents.archived.invalidate();
      setIsDetailDialogOpen(false);
      setSelectedDocument(null);
      toast.success("Document archivé");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: 0,
      priority: "medium",
      status: "pending",
      dueDate: "",
      fiscalYear: "",
      antenneId: "",
      projectId: "",
      funder: "",
      confidentiality: "internal",
      businessOwnerId: "",
    });
  };

  const applySavedView = (viewId: string) => {
    setSelectedSavedViewId(viewId);
    if (viewId === "none") return;
    const view = savedViews.find((item) => String(item.id) === viewId);
    if (!view) return;
    try {
      const filters = JSON.parse(view.filters) as { categoryId?: number | null; status?: string | null; priority?: string | null; search?: string | null; isArchived?: boolean };
      setCategoryFilter(filters.categoryId ? String(filters.categoryId) : "all");
      setStatusFilter(filters.status || "all");
      setPriorityFilter(filters.priority || "all");
      setSearchTerm(filters.search || "");
      setShowArchived(Boolean(filters.isArchived));
      setCurrentPage(1);
      toast.success(`Vue « ${view.name} » appliquée`);
    } catch { toast.error("Cette vue enregistrée est illisible"); }
  };

  const handleSaveCurrentView = () => {
    if (!savedViewName.trim()) { toast.error("Donnez un nom à cette vue"); return; }
    saveDocumentView.mutate({ name: savedViewName.trim(), filters: { categoryId: categoryFilter !== "all" ? Number(categoryFilter) : null, status: statusFilter !== "all" ? statusFilter as any : null, priority: priorityFilter !== "all" ? priorityFilter as any : null, search: searchTerm.trim() || null, isArchived: showArchived } });
  };

  const handleExportCalendar = () => {
    const calendar = buildDocumentsCalendar((documents || []) as Array<{ id: number; title: string; description?: string | null; dueDate?: string | Date | null }>);
    if (!calendar.includes("BEGIN:VEVENT")) {
      toast.info("Aucune échéance documentaire à exporter");
      return;
    }
    const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "echeances-documentaires.ics";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Calendrier des échéances exporté");
  };

  const handleCreateDocument = () => {
    if (!formData.title || !formData.categoryId) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    createDocument.mutate({
      ...formData,
      dueDate: formData.dueDate ? new Date(`${formData.dueDate}T23:59:59.000Z`) : undefined,
      fiscalYear: formData.fiscalYear ? Number(formData.fiscalYear) : null,
      antenneId: formData.antenneId ? Number(formData.antenneId) : null,
      projectId: formData.projectId ? Number(formData.projectId) : null,
      funder: formData.funder.trim() || null,
      confidentiality: formData.confidentiality,
      businessOwnerId: formData.businessOwnerId ? Number(formData.businessOwnerId) : null,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!selectedDocument || files.length === 0) return;
    const oversized = files.find((file) => file.size > 10 * 1024 * 1024);
    if (oversized) { toast.error(`Le fichier « ${oversized.name} » dépasse 10 Mo`); return; }
    setIsUploadingFile(true);
    let uploaded = 0;
    let failed = 0;
    try {
      for (const file of files) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
            reader.readAsDataURL(file);
          });
          await uploadFile.mutateAsync({ documentId: selectedDocument.id, fileName: file.name, fileType: file.type || "application/octet-stream", fileSize: file.size, fileBase64: base64 });
          uploaded += 1;
        } catch (error) {
          failed += 1;
          toast.error(`Échec de « ${file.name} » : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        }
      }
      if (uploaded > 0 && failed === 0) toast.success(`${uploaded} fichier(s) importé(s)`);
      else if (uploaded > 0) toast.info(`${uploaded} fichier(s) importé(s), ${failed} échec(s)`);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSignedPdfExport = async (requestId: number, title: string) => {
    setExportingSignatureId(requestId);
    try {
      const data = await utils.signature.exportData.fetch({ id: requestId });
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      await exportSignedDocumentPdf(data, `document-signe-${requestId}-${safeTitle || "document"}.pdf`);
      toast.success("PDF signé exporté avec son journal d’audit");
    } catch (error) {
      toast.error("Export PDF impossible: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    } finally {
      setExportingSignatureId(null);
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.fileUrl) {
      recordDocumentAccess.mutate({ id: doc.id, action: "DOWNLOAD" });
      window.open(doc.fileUrl, "_blank");
    } else {
      toast.error("Aucun fichier attaché à ce document");
    }
  };

  const handlePrint = (doc: any) => {
    if (doc.fileUrl) {
      recordDocumentAccess.mutate({ id: doc.id, action: "PRINT" });
      const printWindow = window.open(doc.fileUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      // Print document info
      const printContent = `
        <html>
          <head>
            <title>${doc.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #1a4d2e; }
              .info { margin: 20px 0; }
              .label { font-weight: bold; color: #666; }
            </style>
          </head>
          <body>
            <h1>${doc.title}</h1>
            <div class="info">
              <p class="label">Description:</p>
              <p>${doc.description || "Aucune description"}</p>
            </div>
            <div class="info">
              <p class="label">Statut: ${doc.status}</p>
              <p class="label">Priorité: ${doc.priority}</p>
            </div>
          </body>
        </html>
      `;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="status-completed">Complété</Badge>;
      case "in-progress":
        return <Badge className="status-in-progress">En cours</Badge>;
      default:
        return <Badge className="status-pending">En attente</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="priority-urgent">Urgent</Badge>;
      case "high":
        return <Badge className="priority-high">Haute</Badge>;
      case "medium":
        return <Badge className="priority-medium">Moyenne</Badge>;
      default:
        return <Badge className="priority-low">Basse</Badge>;
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5" />;
    if (fileType.includes("word") || fileType.includes("document")) return <File className="h-5 w-5 text-blue-600" />;
    if (fileType.includes("sheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (fileType.includes("image")) return <FileImage className="h-5 w-5 text-purple-600" />;
    if (fileType.includes("pdf")) return <FileIcon className="h-5 w-5 text-red-600" />;
    return <FileText className="h-5 w-5" />;
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || "Non catégorisé";
  };

  const getCategoryColor = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.color || "#1a4d2e";
  };

  const filteredDocuments = useMemo(() => {
    const sorted = (documents || []).sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "priority-high":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
        case "priority-low":
          const priorityOrderLow = { low: 0, medium: 1, high: 2, urgent: 3 };
          return (priorityOrderLow[a.priority as keyof typeof priorityOrderLow] || 4) - (priorityOrderLow[b.priority as keyof typeof priorityOrderLow] || 4);
        default:
          return 0;
      }
    });
    return sorted;
  }, [documents, sortBy]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        title="Gestion des Documents"
        subtitle="Organisez, partagez et gérez tous les documents importants de votre association en un seul endroit"
        icon="📄"
        action={{
          label: "Créer un nouveau document",
          onClick: () => setIsCreateDialogOpen(true),
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes Documents</h1>
          <p className="text-muted-foreground">
            {documents?.length || 0} document(s) total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCalendar} className="gap-2" disabled={!documents?.some((doc) => doc.dueDate)}>
            <Download className="h-4 w-4" />
            Calendrier
          </Button>
          {exportData && (
            <ExportPDF 
              title="Rapport des Documents" 
              data={exportData} 
              type="documents" 
            />
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un document..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in-progress">En cours</SelectItem>
                  <SelectItem value="completed">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priorite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorites</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                {showArchived ? "Documents archivés" : "Documents actifs"}
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
            <Select value={selectedSavedViewId} onValueChange={applySavedView}>
              <SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Vues enregistrées" /></SelectTrigger>
              <SelectContent><SelectItem value="none">Filtres actuels</SelectItem>{savedViews.map((view) => <SelectItem key={view.id} value={String(view.id)}>{view.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="sm:max-w-[220px]" placeholder="Nom de la vue" value={savedViewName} onChange={(e) => setSavedViewName(e.target.value)} maxLength={120} />
            <Button variant="outline" onClick={handleSaveCurrentView} disabled={saveDocumentView.isPending}>Enregistrer la vue</Button>
            {selectedSavedViewId !== "none" && <Button variant="ghost" className="text-destructive" onClick={() => deleteDocumentView.mutate({ id: Number(selectedSavedViewId) })} disabled={deleteDocumentView.isPending}>Supprimer</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <>
        {selectedDocumentIds.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3"><span className="text-sm font-medium">{selectedDocumentIds.length} sélectionné(s)</span><Button size="sm" variant="outline" disabled={bulkArchiveDocuments.isPending} onClick={() => bulkArchiveDocuments.mutate({ ids: selectedDocumentIds, archived: !showArchived })}>{showArchived ? "Restaurer" : "Archiver"}</Button><Button size="sm" variant="ghost" onClick={() => setSelectedDocumentIds([])}>Désélectionner</Button></div>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((doc) => (
            <Card 
              key={doc.id} 
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => {
                setSelectedDocument(doc);
                setIsDetailDialogOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                  <input aria-label={`Sélectionner ${doc.title}`} type="checkbox" checked={selectedDocumentIds.includes(doc.id)} onChange={(event) => { event.stopPropagation(); setSelectedDocumentIds((current) => event.target.checked ? [...current, doc.id] : current.filter((id) => id !== doc.id)); }} onClick={(event) => event.stopPropagation()} className="mt-2 h-4 w-4 rounded border-gray-300" />
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${getCategoryColor(doc.categoryId)}20` }}
                    >
                      {doc.fileUrl ? getFileIcon(doc.fileType) : (
                        <FileText 
                          className="h-5 w-5" 
                          style={{ color: getCategoryColor(doc.categoryId) }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                      <CardDescription className="truncate">
                        {getCategoryName(doc.categoryId)}
                      </CardDescription>
                      {(doc.legalHold || doc.retentionUntil) && <div className="mt-1 flex flex-wrap gap-1">{doc.legalHold && <Badge variant="destructive" className="text-[10px]">Conservation légale</Badge>}{doc.retentionUntil && <Badge variant="outline" className="text-[10px]">Jusqu’au {new Date(doc.retentionUntil).toLocaleDateString("fr-FR")}</Badge>}</div>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocument(doc);
                        setIsDetailDialogOpen(true);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handlePrint(doc);
                      }}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
                            deleteDocument.mutate({ id: doc.id });
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {doc.description || "Aucune description"}
                </p>
                {doc.dueDate ? <p className={`mb-3 text-xs font-medium ${new Date(doc.dueDate).getTime() < Date.now() ? "text-destructive" : "text-muted-foreground"}`}>{new Date(doc.dueDate).getTime() < Date.now() ? "Échéance dépassée" : `Échéance : ${new Date(doc.dueDate).toLocaleDateString("fr-FR")}`}</p> : null}
                {(doc.fiscalYear || doc.funder || doc.confidentiality !== "internal") && <div className="mb-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">{doc.fiscalYear && <Badge variant="outline">Ex. {doc.fiscalYear}</Badge>}{doc.funder && <Badge variant="outline" className="max-w-[180px] truncate">{doc.funder}</Badge>}{doc.confidentiality !== "internal" && <Badge variant="secondary">{doc.confidentiality === "restricted" ? "Restreint" : "Confidentiel"}</Badge>}</div>}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {getStatusBadge(doc.status)}
                    {getPriorityBadge(doc.priority)}
                  </div>
                  {doc.fileUrl && (
                    <Badge variant="outline" className="gap-1">
                      <FileIcon className="h-3 w-3" />
                      Fichier
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredDocuments.length / itemsPerPage)}
          itemsPerPage={itemsPerPage}
          totalItems={filteredDocuments.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all" || showArchived
                ? "Essayez de modifier vos filtres de recherche"
                : "Commencez par créer votre premier document"}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
            <DialogDescription>
              Créez un nouveau document pour votre association
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nom du document"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du document"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select 
                value={formData.categoryId.toString()} 
                onValueChange={(v) => setFormData({ ...formData, categoryId: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d’échéance</Label>
              <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="fiscalYear">Exercice</Label><Input id="fiscalYear" type="number" min="2000" max="2200" placeholder="2026" value={formData.fiscalYear} onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="funder">Financeur</Label><Input id="funder" maxLength={255} placeholder="Ex. Fondation partenaire" value={formData.funder} onChange={(e) => setFormData({ ...formData, funder: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Niveau de confidentialité</Label><Select value={formData.confidentiality} onValueChange={(v: any) => setFormData({ ...formData, confidentiality: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal">Interne</SelectItem><SelectItem value="restricted">Restreint</SelectItem><SelectItem value="confidential">Confidentiel</SelectItem></SelectContent></Select></div>
              <p className="text-xs text-muted-foreground">Optionnel, pour suivre les documents à finaliser ou renouveler.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in-progress">En cours</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDocument} disabled={createDocument.isPending}>
              {createDocument.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedDocument?.title}</DialogTitle>
                <DialogDescription>
                  {getCategoryName(selectedDocument?.categoryId || 0)}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(selectedDocument?.status || "pending")}
                {getPriorityBadge(selectedDocument?.priority || "medium")}
                <Badge variant="outline">{selectedDocument?.approvalStatus === "approved" ? "Approuvé" : selectedDocument?.approvalStatus === "rejected" ? "Rejeté" : "À approuver"}</Badge>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedDocument?.description || "Aucune description"}
                </p>
              </div>

              <Separator />

              {/* Business metadata */}
              <div className="space-y-3">
                <div><h4 className="text-sm font-medium">Métadonnées métier</h4><p className="text-xs text-muted-foreground">Ces informations facilitent le classement et les recherches futures.</p></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label htmlFor="detail-fiscal-year">Exercice</Label><Input id="detail-fiscal-year" type="number" min="2000" max="2200" value={selectedDocument?.fiscalYear ?? ""} onChange={(e) => setSelectedDocument({ ...selectedDocument, fiscalYear: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className="space-y-1"><Label htmlFor="detail-funder">Financeur</Label><Input id="detail-funder" maxLength={255} value={selectedDocument?.funder ?? ""} onChange={(e) => setSelectedDocument({ ...selectedDocument, funder: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><Label>Niveau de confidentialité</Label><Select value={selectedDocument?.confidentiality ?? "internal"} onValueChange={(value) => setSelectedDocument({ ...selectedDocument, confidentiality: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internal">Interne</SelectItem><SelectItem value="restricted">Restreint</SelectItem><SelectItem value="confidential">Confidentiel</SelectItem></SelectContent></Select></div>
                <Button size="sm" variant="outline" disabled={updateDocument.isPending || !selectedDocument} onClick={() => selectedDocument && updateDocument.mutate({ id: selectedDocument.id, fiscalYear: selectedDocument.fiscalYear ?? null, funder: selectedDocument.funder?.trim() || null, confidentiality: selectedDocument.confidentiality ?? "internal" })}>Enregistrer les métadonnées</Button>
              </div>

                            <Separator />
              {/* Retention policy */}
              <div className="space-y-3">
                <div><h4 className="text-sm font-medium">Conservation documentaire</h4><p className="text-xs text-muted-foreground">Une exemption légale bloque la suppression, même si une date est dépassée.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label htmlFor="retention-until">Conserver jusqu’au</Label><Input id="retention-until" type="date" value={retentionDate || (selectedDocument?.retentionUntil ? new Date(Number(selectedDocument.retentionUntil)).toISOString().slice(0, 10) : "")} onChange={(e) => setRetentionDate(e.target.value)} /></div>
                  <label className="flex items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={legalHold || Boolean(selectedDocument?.legalHold)} onChange={(e) => setLegalHold(e.target.checked)} />Exemption de conservation légale</label>
                </div>
                <Button size="sm" variant="outline" disabled={setDocumentRetention.isPending || !selectedDocument} onClick={() => selectedDocument && setDocumentRetention.mutate({ id: selectedDocument.id, retentionUntil: retentionDate ? new Date(`${retentionDate}T23:59:59.000Z`).getTime() : null, legalHold })}>{setDocumentRetention.isPending ? "Enregistrement…" : "Enregistrer la conservation"}</Button>
              </div>
              <Separator />
              {/* Review workflow */}
              <div className="space-y-3">
                <div><h4 className="text-sm font-medium">Circuit de revue</h4><p className="text-xs text-muted-foreground">Désignez un réviseur et suivez la date de retour attendue.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label>Réviseur</Label><Select value={selectedDocument?.reviewerId ? String(selectedDocument.reviewerId) : "none"} onValueChange={(value) => setSelectedDocument({ ...selectedDocument, reviewerId: value === "none" ? null : Number(value) })}><SelectTrigger><SelectValue placeholder="Choisir un réviseur" /></SelectTrigger><SelectContent><SelectItem value="none">Aucun réviseur</SelectItem>{members.filter((member) => member.status === "active").map((member) => <SelectItem key={member.id} value={String(member.userId ?? member.id)}>{member.firstName} {member.lastName}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label htmlFor="review-due-date">Échéance de revue</Label><Input id="review-due-date" type="date" value={selectedDocument?.reviewDueDate ? new Date(selectedDocument.reviewDueDate).toISOString().slice(0, 10) : ""} onChange={(e) => setSelectedDocument({ ...selectedDocument, reviewDueDate: e.target.value ? new Date(`${e.target.value}T23:59:59.000Z`) : null })} /></div>
                </div>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={assignReview.isPending} onClick={() => selectedDocument && assignReview.mutate({ id: selectedDocument.id, reviewerId: selectedDocument.reviewerId ?? null, reviewDueDate: selectedDocument.reviewDueDate ? new Date(selectedDocument.reviewDueDate) : null })}>Enregistrer la revue</Button><Button size="sm" variant="outline" disabled={submitReview.isPending} onClick={() => selectedDocument && submitReview.mutate({ id: selectedDocument.id, status: "approved" })}>Marquer approuvé</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={submitReview.isPending} onClick={() => selectedDocument && submitReview.mutate({ id: selectedDocument.id, status: "rejected" })}>Demander des corrections</Button></div>
              </div>

              <Separator />

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium mb-3">Changer le statut</h4>
                <div className="flex flex-wrap gap-2">
                  {["pending", "in-progress", "completed"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedDocument?.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        updateDocument.mutate({
                          id: selectedDocument.id,
                          status: status as any,
                        });
                        setSelectedDocument({ ...selectedDocument, status });
                      }}
                    >
                      {status === "pending" && "En attente"}
                      {status === "in-progress" && "En cours"}
                      {status === "completed" && "Complété"}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Approval */}
              <div>
                <h4 className="text-sm font-medium mb-3">Approbation documentaire</h4>
                <p className="text-xs text-muted-foreground mb-3">Décision réservée aux utilisateurs disposant de la permission de gestion documentaire.</p>
                <Textarea value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} placeholder="Commentaire facultatif" rows={2} className="mb-3" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => approveDocument.mutate({ id: selectedDocument.id, status: "approved", comment: approvalComment || undefined })} disabled={approveDocument.isPending || selectedDocument?.approvalStatus === "approved"}><ShieldCheck className="mr-1 h-4 w-4" />Approuver</Button>
                  <Button size="sm" variant="outline" onClick={() => approveDocument.mutate({ id: selectedDocument.id, status: "rejected", comment: approvalComment || undefined })} disabled={approveDocument.isPending || selectedDocument?.approvalStatus === "rejected"}>Rejeter</Button>
                  {selectedDocument?.approvalStatus !== "pending" ? <Button size="sm" variant="ghost" onClick={() => approveDocument.mutate({ id: selectedDocument.id, status: "pending", comment: approvalComment || undefined })} disabled={approveDocument.isPending}>Réinitialiser</Button> : null}
                </div>
                {selectedDocument?.approvalComment ? <p className="mt-2 text-xs text-muted-foreground">Dernier commentaire : {selectedDocument.approvalComment}</p> : null}
              </div>

              <Separator />

              {/* File Upload */}
              <div>
                <h4 className="text-sm font-medium mb-3">Fichier attaché</h4>
                {selectedDocument?.fileUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {getFileIcon(selectedDocument.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedDocument.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedDocument.fileSize / 1024).toFixed(1)} Ko
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(selectedDocument)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePrint(selectedDocument)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Upload en cours...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Cliquez pour uploader un fichier</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Word, Excel, PDF, Images (max 10 Mo)
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file" multiple
                  className="hidden"
                  accept=".doc,.docx,.xls,.xlsx,.pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                />
              </div>

              <Separator />

              {/* Version history */}
              <div>
                <h4 className="text-sm font-medium mb-3">Historique des versions</h4>
                {documentVersions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p> : <div className="space-y-2">{documentVersions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="font-medium">Version {version.versionNumber} · {version.fileName}</p><p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString("fr-FR")} · {(version.fileSize / 1024).toFixed(1)} Ko</p><p className="break-all text-[11px] text-muted-foreground">SHA-256 : {version.contentHash}</p></div><Button size="sm" variant="outline" onClick={() => { recordDocumentAccess.mutate({ id: selectedDocument.id, action: "VIEW" }); window.open(version.fileUrl, "_blank"); }}><Download className="mr-1 h-4 w-4" />Ouvrir</Button></div>)}</div>}
              </div>

              <Separator />

              {/* Access log */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Eye className="h-4 w-4" />Journal d’accès</h4>
                {accessLog.length === 0 ? <p className="text-sm text-muted-foreground">Aucun accès enregistré pour ce document.</p> : <div className="space-y-2">{accessLog.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div><p className="font-medium">{entry.action === "VIEW" ? "Consultation" : entry.action === "DOWNLOAD" ? "Téléchargement" : entry.action === "PRINT" ? "Impression" : entry.action === "EXPORT" ? "Export" : entry.action}</p><p className="text-xs text-muted-foreground">{entry.userEmail || `Utilisateur #${entry.userId ?? "inconnu"}`} · {new Date(entry.createdAt).toLocaleString("fr-FR")}</p></div><Badge variant={entry.status === "success" ? "secondary" : "destructive"}>{entry.status === "success" ? "Réussi" : "Échec"}</Badge></div>)}</div>}
              </div>

              <Separator />

              {/* Granular sharing */}
              <div>
                <h4 className="text-sm font-medium mb-3">Partage avec les membres</h4>
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <Select value={shareMemberId} onValueChange={setShareMemberId}><SelectTrigger><SelectValue placeholder="Choisir un membre actif" /></SelectTrigger><SelectContent>{members.filter((member) => member.status === "active").map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.firstName} {member.lastName}</SelectItem>)}</SelectContent></Select>
                  <div className="flex flex-wrap gap-4 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={true} readOnly />Consultation</label><label className="flex items-center gap-2"><input type="checkbox" checked={shareCanEdit} onChange={(e) => setShareCanEdit(e.target.checked)} />Modification</label><label className="flex items-center gap-2"><input type="checkbox" checked={shareCanDelete} onChange={(e) => setShareCanDelete(e.target.checked)} />Suppression</label></div>
                  <Button size="sm" disabled={!shareMemberId || shareDocument.isPending} onClick={() => shareDocument.mutate({ documentId: selectedDocument.id, memberId: Number(shareMemberId), canView: true, canEdit: shareCanEdit, canDelete: shareCanDelete })}>Partager</Button>
                </div>
                <div className="mt-3 space-y-2">{documentPermissions.length === 0 ? <p className="text-sm text-muted-foreground">Aucun partage spécifique.</p> : documentPermissions.map((permission) => { const member = members.find((item) => item.id === permission.memberId); return <div key={permission.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><div><p className="font-medium">{member ? `${member.firstName} ${member.lastName}` : `Membre #${permission.memberId}`}</p><p className="text-xs text-muted-foreground">Consultation{permission.canEdit ? " · Modification" : ""}{permission.canDelete ? " · Suppression" : ""}</p></div><Button size="sm" variant="ghost" className="text-destructive" disabled={revokeDocumentShare.isPending} onClick={() => revokeDocumentShare.mutate({ documentId: selectedDocument.id, memberId: permission.memberId })}>Révoquer</Button></div>; })}</div>
              </div>

              <Separator />

              {/* Electronic signatures */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium"><UserPen className="h-4 w-4" />Signature électronique</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Circuit interne avec consentement explicite, horodatage et empreinte du document.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <Label htmlFor="signature-subject">Objet de la demande</Label>
                  <Input id="signature-subject" value={signatureSubject} onChange={(event) => setSignatureSubject(event.target.value)} placeholder={`Signature requise : ${selectedDocument?.title ?? "document"}`} />
                  <Label htmlFor="signature-member">Signataire membre</Label>
                  <Select value={signatureMemberId} onValueChange={setSignatureMemberId}>
                    <SelectTrigger id="signature-member"><SelectValue placeholder="Choisir un membre actif" /></SelectTrigger>
                    <SelectContent>{members.filter((member) => member.status === "active").map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.firstName} {member.lastName}{member.email ? ` · ${member.email}` : ""}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button disabled={!signatureMemberId || !signatureSubject.trim() || createSignatureRequest.isPending} onClick={() => { const member = members.find((item) => String(item.id) === signatureMemberId); if (!member || !selectedDocument) return; createSignatureRequest.mutate({ documentId: selectedDocument.id, memberId: member.id, subject: signatureSubject.trim() }); }} className="gap-2"><UserPen className="h-4 w-4" />{createSignatureRequest.isPending ? "Création…" : "Demander une signature"}</Button>
                </div>
                <div className="space-y-3">{signatureRequests.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande de signature pour ce document.</p> : signatureRequests.map((request) => { const signer = request.signers[0]; return <div key={request.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{request.subject}</p><p className="text-xs text-muted-foreground">{signer?.signerName} · {signer?.signerEmail}</p></div><Badge variant={request.status === "completed" ? "default" : request.status === "cancelled" ? "destructive" : "secondary"}>{request.status === "completed" ? "Signé" : request.status === "cancelled" ? "Annulé" : request.status === "partially-signed" ? "Partiellement signé" : "En attente"}</Badge></div>{signer?.status === "pending" && request.status !== "cancelled" ? <div className="mt-3 space-y-2"><Input value={typedSignature} onChange={(event) => setTypedSignature(event.target.value)} placeholder="Votre nom complet comme signature" aria-label="Signature saisie" /><label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={signatureConsent} onChange={(event) => setSignatureConsent(event.target.checked)} className="mt-0.5" />Je confirme avoir lu le document et consentir à l’enregistrement de cette signature électronique.</label><Button size="sm" disabled={!signatureConsent || typedSignature.trim().length < 2 || signRequest.isPending} onClick={() => signRequest.mutate({ requestId: request.id, signerId: signer.id, typedSignature: typedSignature.trim(), consent: true })} className="gap-2"><ShieldCheck className="h-4 w-4" />Signer ce document</Button></div> : signer?.evidenceHash ? <div className="mt-3 space-y-2"><p className="break-all text-[11px] text-muted-foreground">Preuve : {signer.evidenceHash}</p>{request.status === "completed" ? <Button size="sm" variant="outline" className="gap-2" disabled={exportingSignatureId === request.id} onClick={() => void handleSignedPdfExport(request.id, selectedDocument?.title ?? "document")}>{exportingSignatureId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{exportingSignatureId === request.id ? "Génération…" : "Exporter le PDF signé"}</Button> : null}</div> : null}{request.status !== "completed" && request.status !== "cancelled" ? <Button variant="ghost" size="sm" className="mt-2 text-destructive" disabled={cancelSignatureRequest.isPending} onClick={() => cancelSignatureRequest.mutate({ id: request.id })}>Annuler la demande</Button> : null}</div>; })}</div>
              </div>

              <Separator />

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes ({notes?.length || 0})
                </h4>
                <div className="space-y-3">
                  {notes && notes.length > 0 ? (
                    notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg group">
                        <div className="flex items-start justify-between">
                          <p className="text-sm">{note.content}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteNote.mutate({ id: note.id })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.authorName} · {note.authorRole === "admin" ? "Administrateur" : "Membre"} · {new Date(note.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune note pour ce document</p>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ajouter une note..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newNote.trim() && selectedDocument) {
                          createNote.mutate({
                            documentId: selectedDocument.id,
                            content: newNote.trim(),
                          });
                        }
                      }}
                      disabled={!newNote.trim() || createNote.isPending}
                    >
                      {createNote.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Ajouter"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                archiveDocument.mutate({ id: selectedDocument.id });
              }}
              disabled={archiveDocument.isPending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archiver
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
                  deleteDocument.mutate({ id: selectedDocument.id });
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
