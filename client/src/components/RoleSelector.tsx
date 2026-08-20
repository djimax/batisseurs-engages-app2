import { useRole } from "@/hooks/useRole";
import { ROLE_DESCRIPTIONS, UserRole } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

/**
 * Composant pour sélectionner le rôle (pour développement/test)
 * À utiliser uniquement en mode développement
 */
export function RoleSelector() {
  const { currentRole, switchRole, isAdmin } = useRole();

  const roles: UserRole[] = ["admin", "membre"];

  return (
      <Card className="border-primary/15 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Sélecteur de Rôle (Dev)</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Changez votre rôle pour tester les permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs font-medium">Rôle actuel</label>
          <Select value={currentRole} onValueChange={(value) => switchRole(value as UserRole)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{role}</span>
                    {role === "admin" && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                    {role === "membre" && <Badge variant="secondary" className="text-xs">Membre</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Description:</p>
          <p>{ROLE_DESCRIPTIONS[currentRole]}</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/75 p-3 text-xs">
          <p className="font-medium mb-1">Permissions:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>✓ Lecture : {isAdmin ? "Tous les documents" : "Documents publics"}</li>
            <li>✓ Création : {isAdmin ? "Autorisée" : "Non autorisée"}</li>
            <li>✓ Modification : {isAdmin ? "Autorisée" : "Non autorisée"}</li>
            <li>✓ Suppression : {isAdmin ? "Autorisée" : "Non autorisée"}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
