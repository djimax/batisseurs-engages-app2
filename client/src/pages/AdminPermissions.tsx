import { useMemo, useState } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const scopeLabels = {
  national: "National",
  antenne: "Antenne",
  groupe: "Groupe",
  project: "Projet",
} as const;

export default function AdminPermissions() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: roles = [], isLoading: rolesLoading } = trpc.admin.getRoles.useQuery();
  const { data: permissions = [], isLoading: permissionsLoading } = trpc.admin.getPermissions.useQuery();
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();
  const [scopeUserId, setScopeUserId] = useState("");
  const [scopeType, setScopeType] = useState<keyof typeof scopeLabels>("national");
  const [scopeId, setScopeId] = useState("");
  const [accessLevel, setAccessLevel] = useState<"viewer" | "editor" | "manager">("viewer");

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? roles[0],
    [roles, selectedRoleId],
  );
  const effectiveRoleId = selectedRole?.id;
  const { data: rolePermissions = [], refetch: refetchRolePermissions } = trpc.admin.getRolePermissions.useQuery(
    { roleId: effectiveRoleId ?? 0 },
    { enabled: Boolean(effectiveRoleId) },
  );
  const { data: scopes = [], refetch: refetchScopes } = trpc.admin.listUserScopes.useQuery({});

  const assignPermission = trpc.admin.assignPermissionToRole.useMutation({
    onSuccess: () => refetchRolePermissions(),
  });
  const removePermission = trpc.admin.removePermissionFromRole.useMutation({
    onSuccess: () => refetchRolePermissions(),
  });
  const assignScope = trpc.admin.assignUserScope.useMutation({
    onSuccess: () => {
      setScopeUserId("");
      setScopeId("");
      refetchScopes();
    },
  });
  const removeScope = trpc.admin.removeUserScope.useMutation({
    onSuccess: () => refetchScopes(),
  });

  if (!user || user.role !== "admin") {
    return (
      <Card className="mx-auto mt-8 max-w-xl">
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>Cette page est réservée aux administrateurs.</CardContent>
      </Card>
    );
  }

  const assignedPermissionIds = new Set(rolePermissions.map((permission) => permission.id));
  const handleTogglePermission = (permissionId: number) => {
    if (!effectiveRoleId) return;
    if (assignedPermissionIds.has(permissionId)) {
      removePermission.mutate({ roleId: effectiveRoleId, permissionId });
    } else {
      assignPermission.mutate({ roleId: effectiveRoleId, permissionId });
    }
  };

  const handleAssignScope = (event: React.FormEvent) => {
    event.preventDefault();
    const userId = Number(scopeUserId);
    if (!Number.isInteger(userId) || userId <= 0) return;
    let parsedScopeId: number | null = null;
    if (scopeType !== "national") {
      parsedScopeId = Number(scopeId);
      if (!Number.isInteger(parsedScopeId) || parsedScopeId <= 0) return;
    }
    assignScope.mutate({
      userId,
      scopeType,
      scopeId: parsedScopeId,
      accessLevel,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Permissions granulaires</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Configurez les droits par rôle et les périmètres d’accès des utilisateurs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rôles</CardTitle>
            <CardDescription>Sélectionnez un rôle à configurer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rolesLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
            {roles.map((role) => (
              <Button
                key={role.id}
                type="button"
                variant={role.id === effectiveRoleId ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedRoleId(role.id)}
              >
                {role.name}
              </Button>
            ))}
            {!rolesLoading && roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun rôle configuré.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matrice des permissions{selectedRole ? ` — ${selectedRole.name}` : ""}</CardTitle>
            <CardDescription>Cliquez sur une permission pour l’attribuer ou la retirer.</CardDescription>
          </CardHeader>
          <CardContent>
            {permissionsLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {permissions.map((permission) => {
                const assigned = assignedPermissionIds.has(permission.id);
                return (
                  <button
                    key={permission.id}
                    type="button"
                    disabled={!effectiveRoleId || assignPermission.isPending || removePermission.isPending}
                    onClick={() => handleTogglePermission(permission.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${assigned ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{permission.name}</span>
                      <span className="text-xs text-muted-foreground">{assigned ? "Activée" : "Inactive"}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{permission.description || permission.category}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Périmètres utilisateurs</CardTitle>
          <CardDescription>
            Associez un utilisateur à un périmètre national, une antenne, un groupe ou un projet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleAssignScope} className="grid gap-3 md:grid-cols-5 md:items-end">
            <div className="space-y-2">
              <Label htmlFor="scope-user">ID utilisateur</Label>
              <Input id="scope-user" type="number" min="1" value={scopeUserId} onChange={(event) => setScopeUserId(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope-type">Type</Label>
              <select id="scope-type" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={scopeType} onChange={(event) => setScopeType(event.target.value as keyof typeof scopeLabels)}>
                {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope-id">ID du périmètre</Label>
              <Input id="scope-id" type="number" min="1" value={scopeId} onChange={(event) => setScopeId(event.target.value)} disabled={scopeType === "national"} placeholder={scopeType === "national" ? "Non requis" : "Ex. 12"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope-level">Niveau</Label>
              <select id="scope-level" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as typeof accessLevel)}>
                <option value="viewer">Lecture</option>
                <option value="editor">Modification</option>
                <option value="manager">Gestion</option>
              </select>
            </div>
            <Button type="submit" disabled={assignScope.isPending} className="gap-2"><Plus className="h-4 w-4" />Attribuer</Button>
          </form>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="p-3 text-left">Utilisateur</th><th className="p-3 text-left">Périmètre</th><th className="p-3 text-left">Niveau</th><th className="p-3 text-right">Action</th></tr></thead>
              <tbody>
                {scopes.map((scope) => (
                  <tr key={scope.id} className="border-t">
                    <td className="p-3">{scope.userId}</td>
                    <td className="p-3">{scopeLabels[scope.scopeType]}{scope.scopeId ? ` #${scope.scopeId}` : ""}</td>
                    <td className="p-3 capitalize">{scope.accessLevel}</td>
                    <td className="p-3 text-right"><Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeScope.mutate({ id: scope.id })}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scopes.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Aucun périmètre attribué.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
