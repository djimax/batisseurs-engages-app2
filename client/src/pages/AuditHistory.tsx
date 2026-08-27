import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Download, Filter, RefreshCw, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";

interface AuditEntry {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  status: "success" | "failed";
}

export default function AuditHistory() {
  const auditQuery = trpc.admin.getAuditLogs.useQuery({ limit: 500, offset: 0 });
  const auditLogs = (auditQuery.data ?? []) as AuditEntry[];
  const isLoading = auditQuery.isLoading;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filteredLogs, setFilteredLogs] = useState<AuditEntry[]>([]);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }

    if (filterEntity !== "all") {
      filtered = filtered.filter((log) => log.entityType === filterEntity);
    }

    setFilteredLogs(filtered);
  }, [auditLogs, searchTerm, filterAction, filterEntity]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "LOGIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "EXPORT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "IMPORT":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      documents: "📄",
      members: "👤",
      finances: "💰",
      users: "🔐",
      events: "📅",
      campaigns: "📢",
      auth: "🔑",
    };
    return icons[entityType] || "📋";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExport = () => {
    const csv = [
      ["Date", "Utilisateur", "Action", "Type", "Entité", "Description"],
      ...filteredLogs.map((log) => [
        formatDate(log.createdAt),
        log.userEmail || "N/A",
        log.action,
        log.entityType,
        log.entityName || "N/A",
        log.description || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 dark:from-blue-950 dark:via-slate-950 dark:to-blue-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
            Historique d'Audit
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Suivi complet de toutes les modifications apportées par les administrateurs
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 animate-fade-in-up delay-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Chercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Action</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="CREATE">Créer</SelectItem>
                    <SelectItem value="UPDATE">Modifier</SelectItem>
                    <SelectItem value="DELETE">Supprimer</SelectItem>
                    <SelectItem value="LOGIN">Connexion</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="IMPORT">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Type</label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="members">Membres</SelectItem>
                    <SelectItem value="finances">Finances</SelectItem>
                    <SelectItem value="users">Utilisateurs</SelectItem>
                    <SelectItem value="events">Événements</SelectItem>
                    <SelectItem value="campaigns">Campagnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => void auditQuery.refetch()}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <div className="space-y-3 animate-fade-in-up delay-2">
          {isLoading ? (
            <Card className="shadow-lg border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
              <CardContent className="p-8 text-center">
                <div className="animate-spin inline-block">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Chargement...</p>
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Aucun enregistrement d'audit trouvé.</AlertDescription>
            </Alert>
          ) : (
            filteredLogs.map((log, index) => (
              <Card
                key={log.id}
                className="shadow-lg border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-2xl">{getEntityIcon(log.entityType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                          <Badge variant="outline">{log.entityType}</Badge>
                          {log.status === "failed" && (
                            <Badge variant="destructive">Échec</Badge>
                          )}
                        </div>
                        <p className="font-semibold text-foreground">{log.entityName || log.description}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Par: <span className="font-medium">{log.userEmail}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDate(log.createdAt)}
                        </p>

                        {log.oldValue && log.newValue && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400">
                                Voir les modifications
                              </summary>
                              <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                                <div>
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Avant:</p>
                                  <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto">
                                    {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Après:</p>
                                  <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto">
                                    {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredLogs.length > 0 && (
          <Card className="shadow-lg border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 animate-fade-in-up delay-3">
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredLogs.length}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Créations</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredLogs.filter((l) => l.action === "CREATE").length}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Modifications</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredLogs.filter((l) => l.action === "UPDATE").length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Suppressions</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredLogs.filter((l) => l.action === "DELETE").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
