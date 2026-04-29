import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminPasswordResets() {
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "expired">("pending");
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

  // Fetch password reset requests
  const { data: requests, isLoading, refetch } = trpc.email.passwordResets.list.useQuery({
    limit,
    offset,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Generate password mutation
  const generatePasswordMutation = trpc.email.passwordResets.generatePassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe temporaire généré et envoyé");
      setTemporaryPassword("");
      setSelectedRequest(null);
      setIsGeneratingPassword(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la génération du mot de passe");
      setIsGeneratingPassword(false);
    },
  });

  // Approve mutation
  const approveMutation = trpc.email.passwordResets.approve.useMutation({
    onSuccess: () => {
      toast.success("Demande approuvée");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'approbation");
    },
  });

  // Reject mutation
  const rejectMutation = trpc.email.passwordResets.reject.useMutation({
    onSuccess: () => {
      toast.success("Demande rejetée");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du rejet");
    },
  });

  const handleGeneratePassword = async () => {
    if (!selectedRequest || !temporaryPassword) {
      toast.error("Veuillez entrer un mot de passe temporaire");
      return;
    }

    if (temporaryPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsGeneratingPassword(true);
    generatePasswordMutation.mutate({
      id: selectedRequest,
      temporaryPassword,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Complétée</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Expirée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("fr-FR");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Réinitialisations</h1>
        <p className="text-muted-foreground">Gérez les demandes de réinitialisation de mot de passe des utilisateurs</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Statut</Label>
          <Select value={statusFilter} onValueChange={(value: any) => {
            setStatusFilter(value);
            setOffset(0);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="completed">Complétées</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit">Éléments par page</Label>
          <Select value={String(limit)} onValueChange={(value) => {
            setLimit(Number(value));
            setOffset(0);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date de création</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date d'expiration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : requests && requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{request.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(request.expiresAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {request.status === "pending" && (
                          <>
                            <Dialog open={selectedRequest === request.id} onOpenChange={(open) => {
                              if (!open) {
                                setSelectedRequest(null);
                                setTemporaryPassword("");
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setSelectedRequest(request.id)}
                                  className="gap-2"
                                >
                                  <Key className="w-4 h-4" />
                                  Générer mot de passe
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Générer un mot de passe temporaire</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="p-2 bg-muted rounded text-sm">{request.email}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="temp-password">Mot de passe temporaire</Label>
                                    <Input
                                      id="temp-password"
                                      type="password"
                                      placeholder="Minimum 8 caractères"
                                      value={temporaryPassword}
                                      onChange={(e) => setTemporaryPassword(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleGeneratePassword}
                                    disabled={isGeneratingPassword}
                                    className="w-full"
                                  >
                                    {isGeneratingPassword ? "Génération..." : "Générer et envoyer"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate({ id: request.id })}
                              disabled={rejectMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {request.status === "completed" && (
                          <div className="text-sm text-muted-foreground">
                            Complétée le {formatDate(request.completedAt || new Date())}
                          </div>
                        )}
                        {request.status === "expired" && (
                          <div className="text-sm text-red-600">Expirée</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucune demande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex gap-2 justify-center items-center">
        <Button
          variant="outline"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
        >
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {Math.floor(offset / limit) + 1}
        </span>
        <Button
          variant="outline"
          onClick={() => setOffset(offset + limit)}
          disabled={!requests || requests.length < limit}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
