import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Gift, TrendingUp, AlertCircle, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { FinanceCharts } from "@/components/FinanceCharts";
import { HeroSection } from "@/components/HeroSection";
import { FinanceReportPDF } from "@/components/FinanceReportPDF";
import { useCotisationReminders } from "@/hooks/useCotisationReminders";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { AmountDisplay } from "@/components/AmountDisplay";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

interface Cotisation {
  id: number;
  memberId: number;
  montant: string;
  currency: "EUR" | "XOF";
  dateDebut: Date;
  dateFin: Date;
  statut: "payée" | "en attente" | "en retard";
  datePayment?: Date;
  notes?: string | null;
}

interface Don {
  id: number;
  donateur: string;
  montant: string;
  currency: "EUR" | "XOF";
  description?: string | null;
  email?: string | null;
  telephone?: string | null;
  date: Date;
}

interface Depense {
  id: number;
  description: string;
  montant: string;
  currency: "EUR" | "XOF";
  categorie: string;
  date: Date;
  notes?: string | null;
}

const SORT_OPTIONS = [
  { value: "date-newest", label: "Plus recents" },
  { value: "date-oldest", label: "Plus anciens" },
  { value: "amount-high", label: "Montant (Eleve)" },
  { value: "amount-low", label: "Montant (Bas)" },
];

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));

const openPrintableDocument = (html: string) => {
  const printableWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printableWindow) {
    toast.error("Autorisez les fenêtres contextuelles pour imprimer le document");
    return;
  }
  printableWindow.document.write(html);
  printableWindow.document.close();
};

export default function Finance() {
  const { currency, convertCurrency } = useCurrency();
  const { formatAmountWithConversion } = useFormatAmount();
  const { data: receipts = [], refetch: refetchReceipts } = trpc.finances.receipts.useQuery({ limit: 100 });
  const { data: storedCotisations = [] } = trpc.finances.cotisations.useQuery();
  const { data: storedDons = [] } = trpc.finances.dons.useQuery();
  const { data: storedDepenses = [] } = trpc.finances.depenses.useQuery();
  const createCotisationMutation = trpc.finances.createCotisation.useMutation({ onError: (error) => toast.error(error.message) });
  const createDonMutation = trpc.finances.createDon.useMutation({ onError: (error) => toast.error(error.message) });
  const createDepenseMutation = trpc.finances.createDepense.useMutation({ onError: (error) => toast.error(error.message) });
  const issueReceipt = trpc.finances.issueReceipt.useMutation({
    onSuccess: async (receipt) => {
      toast.success(`${receipt.documentType === "tax_receipt" ? "Reçu fiscal" : "Certificat de don"} généré`);
      await refetchReceipts();
      openPrintableDocument(receipt.documentHtml);
    },
    onError: (error) => toast.error(error.message),
  });
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [dons, setDons] = useState<Don[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [activeTab, setActiveTab] = useState("cotisations");
  const [sortBy, setSortBy] = useState<string>("date-newest");

  useEffect(() => {
    setCotisations(storedCotisations.map((item) => ({ ...item, currency: item.currency as "EUR" | "XOF", dateDebut: new Date(item.dateDebut), dateFin: new Date(item.dateFin), datePayment: item.datePayment ? new Date(item.datePayment) : undefined })));
  }, [storedCotisations]);

  useEffect(() => {
    setDons(storedDons.map((item) => ({ ...item, currency: item.currency as "EUR" | "XOF", date: new Date(item.date) })));
  }, [storedDons]);

  useEffect(() => {
    setDepenses(storedDepenses.map((item) => ({ ...item, currency: item.currency as "EUR" | "XOF", date: new Date(item.date) })));
  }, [storedDepenses]);

  // Form states
  const [newCotisation, setNewCotisation] = useState({
    memberId: "",
    montant: "",
    dateDebut: "",
    dateFin: "",
    notes: "",
    currency: "EUR" as "EUR" | "XOF",
  });

  const [newDon, setNewDon] = useState({
    donateur: "",
    montant: "",
    description: "",
    email: "",
    telephone: "",
    currency: "EUR" as "EUR" | "XOF",
  });

  const [newDepense, setNewDepense] = useState({
    description: "",
    montant: "",
    categorie: "autre",
    notes: "",
    currency: "EUR" as "EUR" | "XOF",
  });

  const [receiptDraft, setReceiptDraft] = useState({
    documentType: "tax_receipt" as "tax_receipt" | "donation_certificate",
    donorName: "",
    donorEmail: "",
    amount: "",
    currency: "EUR" as "EUR" | "XOF",
    donationDate: new Date().toISOString().slice(0, 10),
    legalMention: "",
  });

  const handleIssueReceipt = () => {
    if (!receiptDraft.donorName.trim() || !receiptDraft.amount || !receiptDraft.donationDate) {
      toast.error("Renseignez le donateur, le montant et la date du don");
      return;
    }
    issueReceipt.mutate({
      ...receiptDraft,
      donationDate: new Date(`${receiptDraft.donationDate}T12:00:00.000Z`).toISOString(),
      donorEmail: receiptDraft.donorEmail || undefined,
      legalMention: receiptDraft.legalMention || undefined,
    });
  };

  const handleAddCotisation = () => {
    if (!newCotisation.memberId || !newCotisation.montant || !newCotisation.dateDebut || !newCotisation.dateFin) {
      toast.error("Renseignez le membre, le montant et les deux dates");
      return;
    }

    const cotisation: Cotisation = {
      id: Date.now(),
      memberId: parseInt(newCotisation.memberId),
      montant: newCotisation.montant,
      currency: newCotisation.currency,
      dateDebut: new Date(newCotisation.dateDebut),
      dateFin: new Date(newCotisation.dateFin),
      statut: "en attente",
      notes: newCotisation.notes,
    };

    createCotisationMutation.mutate({
      memberId: cotisation.memberId,
      montant: cotisation.montant,
      currency: cotisation.currency,
      dateDebut: cotisation.dateDebut.toISOString(),
      dateFin: cotisation.dateFin.toISOString(),
      notes: cotisation.notes || undefined,
    }, {
      onSuccess: () => {
        setCotisations((current) => [cotisation, ...current]);
        setNewCotisation({ memberId: "", montant: "", dateDebut: "", dateFin: "", notes: "", currency: "EUR" });
        toast.success("Cotisation ajoutée avec succès");
      },
    });
  };

  const handleAddDon = () => {
    if (!newDon.donateur || !newDon.montant) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const don: Don = {
      id: Date.now(),
      donateur: newDon.donateur,
      montant: newDon.montant,
      currency: newDon.currency,
      description: newDon.description,
      email: newDon.email,
      telephone: newDon.telephone,
      date: new Date(),
    };

    createDonMutation.mutate({
      donateur: don.donateur,
      montant: don.montant,
      currency: don.currency,
      description: don.description || undefined,
      email: don.email || undefined,
      telephone: don.telephone || undefined,
      date: don.date.toISOString(),
    }, {
      onSuccess: () => {
        setDons((current) => [don, ...current]);
        setNewDon({ donateur: "", montant: "", description: "", email: "", telephone: "", currency: "EUR" });
        toast.success("Don enregistré avec succès");
      },
    });
  };

  const handleAddDepense = () => {
    if (!newDepense.description || !newDepense.montant) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const depense: Depense = {
      id: Date.now(),
      description: newDepense.description,
      montant: newDepense.montant,
      currency: newDepense.currency,
      categorie: newDepense.categorie,
      date: new Date(),
      notes: newDepense.notes,
    };

    createDepenseMutation.mutate({
      description: depense.description,
      montant: depense.montant,
      currency: depense.currency,
      categorie: depense.categorie,
      date: depense.date.toISOString(),
      notes: depense.notes || undefined,
    }, {
      onSuccess: () => {
        setDepenses((current) => [depense, ...current]);
        setNewDepense({ description: "", montant: "", categorie: "autre", notes: "", currency: "EUR" });
        toast.success("Dépense enregistrée avec succès");
      },
    });
  };

  const printExistingReceipt = (receipt: (typeof receipts)[number]) => {
    const amount = Number(receipt.amount);
    const equivalentCurrency = receipt.currency === "EUR" ? "XOF" : "EUR";
    const equivalentAmount = convertCurrency(amount, receipt.currency, equivalentCurrency);
    const date = new Date(receipt.donationDate).toLocaleDateString("fr-FR");
    const title = receipt.documentType === "tax_receipt" ? "Reçu fiscal de don" : "Certificat de don";
    openPrintableDocument(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)} · ${escapeHtml(receipt.receiptNumber)}</title><style>body{font-family:Arial,sans-serif;color:#123b38;margin:48px;line-height:1.5}header{border-bottom:3px solid #f27c62;padding-bottom:18px;margin-bottom:28px}h1{margin:0 0 8px;font-size:28px}h2{color:#0b6b62;font-size:18px}table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:11px 0;border-bottom:1px solid #dce7e3}td:last-child{text-align:right;font-weight:700}.notice{background:#fff2ed;border-left:4px solid #f27c62;padding:14px;margin-top:28px;font-size:12px}.footer{margin-top:52px;font-size:12px;color:#55716c}</style></head><body><header><h1>${title}</h1><div>Les Bâtisseurs Engagés</div></header><p><strong>Référence :</strong> ${escapeHtml(receipt.receiptNumber)}</p><p><strong>Date du don :</strong> ${escapeHtml(date)}</p><h2>Donateur</h2><p>${escapeHtml(receipt.donorName)}${receipt.donorEmail ? `<br>${escapeHtml(receipt.donorEmail)}` : ""}</p><h2>Montant reçu</h2><table><tr><td>Montant déclaré</td><td>${amount.toLocaleString("fr-FR")} ${receipt.currency === "EUR" ? "€" : "F CFA"}</td></tr><tr><td>Équivalence indicative</td><td>${equivalentAmount.toLocaleString("fr-FR")} ${equivalentCurrency === "EUR" ? "€" : "F CFA"}</td></tr></table><div class="notice">Document généré par la plateforme. Vérifiez les conditions fiscales applicables auprès du responsable légal de l’association avant toute déclaration.</div><p class="footer">Justificatif généré à partir des informations enregistrées. Il doit être vérifié et signé selon les procédures applicables.</p><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  };

  const totalCotisations = cotisations.reduce((sum, c) => sum + convertCurrency(parseFloat(c.montant || "0"), c.currency, currency), 0);
  const totalDons = dons.reduce((sum, d) => sum + convertCurrency(parseFloat(d.montant || "0"), d.currency, currency), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + convertCurrency(parseFloat(d.montant || "0"), d.currency, currency), 0);
  const solde = totalCotisations + totalDons - totalDepenses;

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "payée":
        return "bg-green-100 text-green-800";
      case "en attente":
        return "bg-yellow-100 text-yellow-800";
      case "en retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        title="Gestion Financière"
        subtitle="Suivez les cotisations, dons et dépenses de votre association avec précision"
        icon="💰"
        variant="secondary"
      />

      {/* Vue d'ensemble */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Vue d'ensemble</h2>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotisations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={totalCotisations} sourceCurrency={currency} showEquivalent /></div>
            <p className="text-xs text-muted-foreground">{cotisations.length} cotisations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={totalDons} sourceCurrency={currency} showEquivalent /></div>
            <p className="text-xs text-muted-foreground">{dons.length} dons reçus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={totalDepenses} sourceCurrency={currency} showEquivalent /></div>
            <p className="text-xs text-muted-foreground">{depenses.length} dépenses</p>
          </CardContent>
        </Card>

        <Card className={solde >= 0 ? "border-green-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <AlertCircle className={`h-4 w-4 ${solde >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde >= 0 ? "text-green-600" : "text-red-600"}`}>
              <AmountDisplay amount={solde} sourceCurrency={currency} showEquivalent />
            </div>
            <p className="text-xs text-muted-foreground">Bilan financier</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="dons">Dons</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="recus">Reçus</TabsTrigger>
        </TabsList>

        {/* Cotisations Tab */}
        <TabsContent value="cotisations" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Gestion des Cotisations</h2>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une cotisation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle Cotisation</DialogTitle>
                  <DialogDescription>
                    Enregistrez une nouvelle cotisation de membre
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="memberId">ID Membre</Label>
                    <Input
                      id="memberId"
                      type="number"
                      value={newCotisation.memberId}
                      onChange={(e) => setNewCotisation({ ...newCotisation, memberId: e.target.value })}
                      placeholder="ID du membre"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <div>
                      <Label htmlFor="montant">Montant</Label>
                      <Input
                        id="montant"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newCotisation.montant}
                        onChange={(e) => setNewCotisation({ ...newCotisation, montant: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Devise</Label>
                      <Select value={newCotisation.currency} onValueChange={(value) => setNewCotisation({ ...newCotisation, currency: value as "EUR" | "XOF" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (F CFA)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dateDebut">Date de début</Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={newCotisation.dateDebut}
                      onChange={(e) => setNewCotisation({ ...newCotisation, dateDebut: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateFin">Date de fin</Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={newCotisation.dateFin}
                      onChange={(e) => setNewCotisation({ ...newCotisation, dateFin: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Input
                      id="notes"
                      value={newCotisation.notes}
                      onChange={(e) => setNewCotisation({ ...newCotisation, notes: e.target.value })}
                      placeholder="Notes..."
                    />
                  </div>
                  <Button onClick={handleAddCotisation} className="w-full">
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              {cotisations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune cotisation enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {cotisations
                    .sort((a, b) => {
                      switch (sortBy) {
                        case "date-newest":
                          return new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
                        case "date-oldest":
                          return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
                        case "amount-high":
                          return convertCurrency(parseFloat(b.montant || "0"), b.currency, currency) - convertCurrency(parseFloat(a.montant || "0"), a.currency, currency);
                        case "amount-low":
                          return convertCurrency(parseFloat(a.montant || "0"), a.currency, currency) - convertCurrency(parseFloat(b.montant || "0"), b.currency, currency);
                        default:
                          return 0;
                      }
                    })
                    .map((cot) => (
                    <div key={cot.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Membre #{cot.memberId}</p>
                        <p className="text-sm text-muted-foreground">{cot.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold"><AmountDisplay amount={parseFloat(cot.montant || "0")} sourceCurrency={cot.currency} showEquivalent /></p>
                        <span className={`text-xs px-2 py-1 rounded ${getStatutColor(cot.statut)}`}>
                          {cot.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dons Tab */}
        <TabsContent value="dons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des Dons</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Enregistrer un don
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau Don</DialogTitle>
                  <DialogDescription>
                    Enregistrez un nouveau don reçu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="donateur">Donateur</Label>
                    <Input
                      id="donateur"
                      value={newDon.donateur}
                      onChange={(e) => setNewDon({ ...newDon, donateur: e.target.value })}
                      placeholder="Nom du donateur"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <div>
                      <Label htmlFor="montantDon">Montant</Label>
                      <Input
                        id="montantDon"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newDon.montant}
                        onChange={(e) => setNewDon({ ...newDon, montant: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Devise</Label>
                      <Select value={newDon.currency} onValueChange={(value) => setNewDon({ ...newDon, currency: value as "EUR" | "XOF" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (F CFA)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Input
                      id="description"
                      value={newDon.description}
                      onChange={(e) => setNewDon({ ...newDon, description: e.target.value })}
                      placeholder="Description du don..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailDon">Email (optionnel)</Label>
                    <Input
                      id="emailDon"
                      type="email"
                      value={newDon.email}
                      onChange={(e) => setNewDon({ ...newDon, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                    <Input
                      id="telephone"
                      value={newDon.telephone}
                      onChange={(e) => setNewDon({ ...newDon, telephone: e.target.value })}
                      placeholder="+33 6 XX XX XX XX"
                    />
                  </div>
                  <Button onClick={handleAddDon} className="w-full">
                    Enregistrer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              {dons.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun don enregistré</p>
              ) : (
                <div className="space-y-2">
                  {dons.map((don) => (
                    <div key={don.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{don.donateur}</p>
                        <p className="text-sm text-muted-foreground">{don.description}</p>
                      </div>
                      <p className="font-semibold text-green-600"><AmountDisplay amount={parseFloat(don.montant || "0")} sourceCurrency={don.currency} showEquivalent /></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dépenses Tab */}
        <TabsContent value="depenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des Dépenses</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une dépense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle Dépense</DialogTitle>
                  <DialogDescription>
                    Enregistrez une nouvelle dépense
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="descriptionDepense">Description</Label>
                    <Input
                      id="descriptionDepense"
                      value={newDepense.description}
                      onChange={(e) => setNewDepense({ ...newDepense, description: e.target.value })}
                      placeholder="Description de la dépense"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <div>
                      <Label htmlFor="montantDepense">Montant</Label>
                      <Input
                        id="montantDepense"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newDepense.montant}
                        onChange={(e) => setNewDepense({ ...newDepense, montant: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Devise</Label>
                      <Select value={newDepense.currency} onValueChange={(value) => setNewDepense({ ...newDepense, currency: value as "EUR" | "XOF" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (F CFA)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="categorie">Catégorie</Label>
                    <Select value={newDepense.categorie} onValueChange={(value) => setNewDepense({ ...newDepense, categorie: value })}>
                      <SelectTrigger id="categorie">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="autre">Autre</SelectItem>
                        <SelectItem value="fournitures">Fournitures</SelectItem>
                        <SelectItem value="loyer">Loyer</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notesDepense">Notes (optionnel)</Label>
                    <Input
                      id="notesDepense"
                      value={newDepense.notes}
                      onChange={(e) => setNewDepense({ ...newDepense, notes: e.target.value })}
                      placeholder="Notes..."
                    />
                  </div>
                  <Button onClick={handleAddDepense} className="w-full">
                    Ajouter
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              {depenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune dépense enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {depenses.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{dep.description}</p>
                        <p className="text-sm text-muted-foreground">{dep.categorie}</p>
                      </div>
                      <p className="font-semibold text-red-600"><AmountDisplay amount={parseFloat(dep.montant || "0")} sourceCurrency={dep.currency} showEquivalent /></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reçus et certificats Tab */}
        <TabsContent value="recus" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Reçus et certificats</h2>
              <p className="text-sm text-muted-foreground">Générez un justificatif imprimable avec le montant d’origine et son équivalence.</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2"><FileText className="h-4 w-4" />Nouveau document</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Générer un document de don</DialogTitle>
                  <DialogDescription>Les mentions fiscales doivent être vérifiées par le responsable légal de l’association.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type de document</Label>
                    <Select value={receiptDraft.documentType} onValueChange={(value) => setReceiptDraft({ ...receiptDraft, documentType: value as "tax_receipt" | "donation_certificate" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="tax_receipt">Reçu fiscal de don</SelectItem><SelectItem value="donation_certificate">Certificat de don</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label htmlFor="receiptDonorName">Nom du donateur</Label><Input id="receiptDonorName" value={receiptDraft.donorName} onChange={(e) => setReceiptDraft({ ...receiptDraft, donorName: e.target.value })} placeholder="Nom complet" /></div>
                  <div><Label htmlFor="receiptDonorEmail">Email (optionnel)</Label><Input id="receiptDonorEmail" type="email" value={receiptDraft.donorEmail} onChange={(e) => setReceiptDraft({ ...receiptDraft, donorEmail: e.target.value })} placeholder="donateur@example.org" /></div>
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <div><Label htmlFor="receiptAmount">Montant</Label><Input id="receiptAmount" type="number" min="0.01" step="0.01" value={receiptDraft.amount} onChange={(e) => setReceiptDraft({ ...receiptDraft, amount: e.target.value })} placeholder="0.00" /></div>
                    <div><Label>Devise</Label><Select value={receiptDraft.currency} onValueChange={(value) => setReceiptDraft({ ...receiptDraft, currency: value as "EUR" | "XOF" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (F CFA)</SelectItem></SelectContent></Select></div>
                  </div>
                  <div><Label htmlFor="receiptDonationDate">Date du don</Label><Input id="receiptDonationDate" type="date" value={receiptDraft.donationDate} onChange={(e) => setReceiptDraft({ ...receiptDraft, donationDate: e.target.value })} /></div>
                  <div><Label htmlFor="receiptLegalMention">Mention complémentaire (optionnel)</Label><Input id="receiptLegalMention" value={receiptDraft.legalMention} onChange={(e) => setReceiptDraft({ ...receiptDraft, legalMention: e.target.value })} placeholder="Référence ou mention validée par l’association" /></div>
                  <Button onClick={handleIssueReceipt} disabled={issueReceipt.isPending} className="w-full">{issueReceipt.isPending ? "Génération…" : "Générer et imprimer"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader><CardTitle>Documents générés</CardTitle><CardDescription>Références persistées dans le registre financier.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {receipts.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun reçu ou certificat enregistré.</p> : receipts.map((receipt) => {
                const sourceAmount = Number(receipt.amount);
                const equivalentCurrency = receipt.currency === "EUR" ? "XOF" : "EUR";
                const equivalentAmount = convertCurrency(sourceAmount, receipt.currency, equivalentCurrency);
                return <div key={receipt.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{receipt.documentType === "tax_receipt" ? "Reçu fiscal de don" : "Certificat de don"}</p><span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{receipt.receiptNumber}</span></div><p className="text-sm text-muted-foreground">{receipt.donorName} · {new Date(receipt.donationDate).toLocaleDateString("fr-FR")}</p><p className="text-sm">{sourceAmount.toLocaleString("fr-FR")} {receipt.currency === "EUR" ? "€" : "F CFA"} <span className="text-muted-foreground">(≈ {equivalentAmount.toLocaleString("fr-FR")} {equivalentCurrency === "EUR" ? "€" : "F CFA"})</span></p></div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => printExistingReceipt(receipt)}><Printer className="h-4 w-4" />Imprimer</Button>
                </div>;
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphiques Tab */}
        <TabsContent value="graphiques" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Visualisation Financière</h2>
            <FinanceCharts
              expensesByCategory={depenses.map((d) => ({
                category: d.categorie,
                amount: parseFloat(d.montant || "0"),
              }))}
              monthlyData={[
                {
                  month: "Janvier",
                  revenues: totalCotisations + totalDons,
                  expenses: totalDepenses,
                },
              ]}
              balanceHistory={[
                {
                  month: "Janvier",
                  balance: solde,
                },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
