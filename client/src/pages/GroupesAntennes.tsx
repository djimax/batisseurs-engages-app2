import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, MapPin, Users, Mail, Phone } from "lucide-react";

// Mock data for demonstration
const mockAntennes = [
  {
    id: 1,
    name: "Antenne Paris",
    city: "Paris",
    address: "123 Rue de la Paix, 75000 Paris",
    phone: "+33 1 23 45 67 89",
    email: "paris@batisseurs.fr",
    responsible: "Jean Dupont",
    status: "active",
    groupCount: 3,
  },
  {
    id: 2,
    name: "Antenne Lyon",
    city: "Lyon",
    address: "456 Avenue de la République, 69000 Lyon",
    phone: "+33 4 12 34 56 78",
    email: "lyon@batisseurs.fr",
    responsible: "Marie Martin",
    status: "active",
    groupCount: 2,
  },
  {
    id: 3,
    name: "Antenne Marseille",
    city: "Marseille",
    address: "789 Boulevard de la Liberté, 13000 Marseille",
    phone: "+33 4 91 23 45 67",
    email: "marseille@batisseurs.fr",
    responsible: "Pierre Bernard",
    status: "inactive",
    groupCount: 1,
  },
];

const mockGroupes = [
  {
    id: 1,
    name: "Groupe Construction",
    antenneId: 1,
    antenneName: "Antenne Paris",
    responsible: "Jean Dupont",
    status: "active",
    memberCount: 12,
    description: "Groupe spécialisé dans les projets de construction",
  },
  {
    id: 2,
    name: "Groupe Rénovation",
    antenneId: 1,
    antenneName: "Antenne Paris",
    responsible: "Sophie Leclerc",
    status: "active",
    memberCount: 8,
    description: "Groupe dédié aux projets de rénovation",
  },
  {
    id: 3,
    name: "Groupe Développement Durable",
    antenneId: null,
    antenneName: "National",
    responsible: "Luc Moreau",
    status: "active",
    memberCount: 15,
    description: "Groupe national pour les projets durables",
  },
];

export default function GroupesAntennes() {
  const [activeTab, setActiveTab] = useState<"antennes" | "groupes">("antennes");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewAntenneDialog, setShowNewAntenneDialog] = useState(false);
  const [showNewGroupeDialog, setShowNewGroupeDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "archived":
        return "Archivée";
      default:
        return status;
    }
  };

  const filteredAntennes = mockAntennes.filter((antenne) =>
    antenne.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    antenne.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupes = mockGroupes.filter((groupe) =>
    groupe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    groupe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groupes & Antennes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les groupes locaux et antennes de votre association
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("antennes")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "antennes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="inline-block mr-2 h-4 w-4" />
          Antennes ({mockAntennes.length})
        </button>
        <button
          onClick={() => setActiveTab("groupes")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "groupes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="inline-block mr-2 h-4 w-4" />
          Groupes ({mockGroupes.length})
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4">
        <Input
          placeholder={
            activeTab === "antennes"
              ? "Rechercher une antenne..."
              : "Rechercher un groupe..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Dialog
          open={activeTab === "antennes" ? showNewAntenneDialog : showNewGroupeDialog}
          onOpenChange={
            activeTab === "antennes"
              ? setShowNewAntenneDialog
              : setShowNewGroupeDialog
          }
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {activeTab === "antennes" ? "Nouvelle Antenne" : "Nouveau Groupe"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeTab === "antennes"
                  ? "Créer une nouvelle antenne"
                  : "Créer un nouveau groupe"}
              </DialogTitle>
              <DialogDescription>
                {activeTab === "antennes"
                  ? "Remplissez les informations pour créer une nouvelle antenne"
                  : "Remplissez les informations pour créer un nouveau groupe"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom</label>
                <Input placeholder="Nom" />
              </div>
              {activeTab === "antennes" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Ville</label>
                    <Input placeholder="Ville" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Adresse</label>
                    <Input placeholder="Adresse" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <Input placeholder="Téléphone" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="Email" />
                  </div>
                </>
              )}
              {activeTab === "groupes" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="Description" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Antenne</label>
                    <Input placeholder="Sélectionner une antenne" />
                  </div>
                </>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline">Annuler</Button>
                <Button>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Antennes Tab */}
      {activeTab === "antennes" && (
        <div className="space-y-4">
          {filteredAntennes.map((antenne) => (
            <Card key={antenne.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{antenne.name}</CardTitle>
                      <Badge className={getStatusColor(antenne.status)}>
                        {getStatusLabel(antenne.status)}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {antenne.groupCount} groupe(s) associé(s)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Localisation</p>
                      <p className="text-sm font-medium">{antenne.city}</p>
                      <p className="text-xs text-muted-foreground">{antenne.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Responsable</p>
                      <p className="text-sm font-medium">{antenne.responsible}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${antenne.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {antenne.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${antenne.phone}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {antenne.phone}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Groupes Tab */}
      {activeTab === "groupes" && (
        <div className="space-y-4">
          {filteredGroupes.map((groupe) => (
            <Card key={groupe.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{groupe.name}</CardTitle>
                      <Badge className={getStatusColor(groupe.status)}>
                        {getStatusLabel(groupe.status)}
                      </Badge>
                      {groupe.antenneName && (
                        <Badge variant="outline">{groupe.antenneName}</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {groupe.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="text-sm font-medium">{groupe.responsible}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Membres</p>
                    <p className="text-sm font-medium">{groupe.memberCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Antenne</p>
                    <p className="text-sm font-medium">{groupe.antenneName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
