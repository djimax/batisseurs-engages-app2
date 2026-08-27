import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronLeft, ChevronRight, Download, Filter, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminAuditLogs() {
  const { data: user } = trpc.auth.me.useQuery();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    entityType: "",
    userId: "",
    action: "",
  });

  const limit = 20;
  const offset = page * limit;
  const utils = trpc.useUtils();
  const { data: deletionRequests = [] } = trpc.admin.listDataDeletionRequests.useQuery({ status: "pending" });
  const reviewDeletionRequest = trpc.admin.reviewDataDeletionRequest.useMutation({ onSuccess: async () => { await utils.admin.listDataDeletionRequests.invalidate(); await utils.admin.getAuditLogs.invalidate(); toast.success("Demande RGPD mise à jour"); } });

  // Fetch audit logs
  const { data: logs = [], isLoading } = trpc.admin.getAuditLogs.useQuery({
    limit,
    offset,
    entityType: filters.entityType && filters.entityType !== "all" ? filters.entityType : undefined,
    userId: filters.userId ? parseInt(filters.userId) : undefined,
    action: filters.action && filters.action !== "all" ? filters.action : undefined,
  });

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas les permissions pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "EXPORT":
        return "bg-orange-100 text-orange-800";
      case "IMPORT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "success"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };
  const exportCsv = () => {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Date", "Action", "Type", "Entité", "Utilisateur", "Statut"],
      ...logs.map((log) => [new Date(log.createdAt).toISOString(), log.action, log.entityType, log.entityName || `#${log.entityId ?? ""}`, log.userEmail || (log.userId ? `Utilisateur #${log.userId}` : ""), log.status]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\\r\\n");
    const url = URL.createObjectURL(new Blob([`\\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `journal-audit-page-${page + 1}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV préparé");
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold tracking-tight">Journaux d’audit</h1>
        <p className="text-muted-foreground mt-2">
          Consultez l'historique de toutes les activités de votre association
        </p>
      </div>

      {deletionRequests.length > 0 && <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader><CardTitle>Demandes RGPD à examiner</CardTitle><CardDescription>Examinez chaque demande et consignez une décision. L’approbation ne supprime aucune donnée automatiquement.</CardDescription></CardHeader>
        <CardContent className="space-y-3">{deletionRequests.map((request) => <div key={request.id} className="flex flex-col gap-3 rounded-xl border bg-background p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="font-medium">{request.userName || request.userEmail || `Utilisateur #${request.userId}`}</p><p className="text-sm text-muted-foreground">{request.userEmail || "Email non renseigné"} · {new Date(request.createdAt).toLocaleString("fr-FR")}</p>{request.reason && <p className="mt-2 text-sm">{request.reason}</p>}</div><div className="flex shrink-0 gap-2"><Button size="sm" variant="outline" className="gap-1 text-destructive" disabled={reviewDeletionRequest.isPending} onClick={() => { if (window.confirm("Refuser cette demande RGPD ?")) reviewDeletionRequest.mutate({ id: request.id, status: "rejected" }); }}><X className="h-4 w-4" />Refuser</Button><Button size="sm" className="gap-1" disabled={reviewDeletionRequest.isPending} onClick={() => { if (window.confirm("Approuver cette demande RGPD ? La suppression effective devra être traitée selon votre procédure interne.")) reviewDeletionRequest.mutate({ id: request.id, status: "approved" }); }}><Check className="h-4 w-4" />Approuver</Button></div></div>)}</CardContent>
      </Card>}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="entityType">Type d'Entité</Label>
              <Select value={filters.entityType || "all"} onValueChange={(value) => {
                setFilters({ ...filters, entityType: value === "all" ? "" : value });
                setPage(0);
              }}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="members">Membres</SelectItem>
                  <SelectItem value="finances">Finances</SelectItem>
                  <SelectItem value="users">Utilisateurs</SelectItem>
                  <SelectItem value="roles">Rôles</SelectItem>
                  <SelectItem value="campaigns">Campagnes</SelectItem>
                  <SelectItem value="adhesions">Adhésions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={filters.action || "all"} onValueChange={(value) => {
                setFilters({ ...filters, action: value === "all" ? "" : value });
                setPage(0);
              }}>
                <SelectTrigger id="action"><SelectValue placeholder="Toutes les actions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                  <SelectItem value="ASSIGN">Attribution</SelectItem>
                  <SelectItem value="REMOVE">Retrait</SelectItem>
                  <SelectItem value="LOGIN">Connexion</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">ID Utilisateur</Label>
              <Input
                id="userId"
                type="number"
                placeholder="Laisser vide pour tous"
                value={filters.userId}
                onChange={(e) => {
                  setFilters({ ...filters, userId: e.target.value });
                  setPage(0);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Activités Récentes</CardTitle>
          <CardDescription>
            {logs.length} activité{logs.length !== 1 ? "s" : ""} affichée{logs.length !== 1 ? "s" : ""}
          </CardDescription></div><Button variant="outline" size="sm" className="gap-2" onClick={exportCsv} disabled={logs.length === 0}><Download className="h-4 w-4" />Exporter cette page</Button></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Chargement des logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Aucune activité trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entityType}</TableCell>
                        <TableCell className="text-sm">
                          {log.entityName || `#${log.entityId}`}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.userEmail || (log.userId ? `Utilisateur #${log.userId}` : "-")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(log.status)}>
                            {log.status === "success" ? "Succès" : "Erreur"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={logs.length < limit}
                    className="gap-2"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
