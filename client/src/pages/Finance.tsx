import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, Gift, TrendingUp, AlertCircle, FileText, Printer, Mail } from "lucide-react";
import { toast } from "sonner";
import { FinanceCharts } from "@/components/FinanceCharts";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { HeroSection } from "@/components/HeroSection";
import { FinanceReportPDF } from "@/components/FinanceReportPDF";
import { useCotisationReminders } from "@/hooks/useCotisationReminders";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { AmountDisplay } from "@/components/AmountDisplay";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { StripeCheckoutCard } from "@/components/StripeCheckoutCard";

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

const EMPTY_COTISATIONS: Cotisation[] = [];
const EMPTY_DONS: Don[] = [];
const EMPTY_DEPENSES: Depense[] = [];

const SORT_OPTIONS = [
  { value: "date-newest", label: "Plus recents" },
  { value: "date-oldest", label: "Plus anciens" },
  { value: "amount-high", label: "Montant (Eleve)" },
  { value: "amount-low", label: "Montant (Bas)" },
];

const MEMBERSHIP_CATEGORIES = [
  { value: "standard", label: "Standard" },
  { value: "etudiant", label: "Étudiant" },
  { value: "bienfaiteur", label: "Bienfaiteur" },
  { value: "fondateur", label: "Fondateur" },
  { value: "actif", label: "Actif" },
  { value: "honoraire", label: "Honoraire" },
] as const;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));

type FinancialReportData = {
  monthly: Array<{ period: string; incomeXof: number; expensesXof: number; balanceXof: number; incomeEur: number; expensesEur: number; balanceEur: number }>;
  total: { incomeXof: number; expensesXof: number; balanceXof: number; incomeEur: number; expensesEur: number; balanceEur: number };
};

const exportFinancialReportCsv = (report: FinancialReportData, year: number) => {
  const rows = [
    ["Période", "Recettes (F CFA)", "Dépenses (F CFA)", "Solde (F CFA)", "Recettes (€)", "Dépenses (€)", "Solde (€)"],
    ...report.monthly.map((row) => [row.period, row.incomeXof, row.expensesXof, row.balanceXof, row.incomeEur, row.expensesEur, row.balanceEur]),
    ["Total", report.total.incomeXof, report.total.expensesXof, report.total.balanceXof, report.total.incomeEur, report.total.expensesEur, report.total.balanceEur],
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\\r\\n");
  const url = URL.createObjectURL(new Blob([`\\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `rapport-financier-${year}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast.success("Rapport CSV téléchargé");
};

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
  const utils = trpc.useUtils();
  const { currency, convertCurrency } = useCurrency();
  const { formatAmountWithConversion } = useFormatAmount();
  const { data: receipts = [], refetch: refetchReceipts } = trpc.finances.receipts.useQuery({ limit: 100 });
  const { data: members = [] } = trpc.members.list.useQuery();
  const { data: feeRules = [] } = trpc.finances.feeRules.useQuery();
  const { data: storedCotisations = EMPTY_COTISATIONS } = trpc.finances.cotisations.useQuery();
  const { data: storedDons = EMPTY_DONS } = trpc.finances.dons.useQuery();
  const { data: storedDepenses = EMPTY_DEPENSES } = trpc.finances.depenses.useQuery();
  const createCotisationMutation = trpc.finances.createCotisation.useMutation({ onError: (error) => toast.error(error.message) });
  const createFeeRuleMutation = trpc.finances.createFeeRule.useMutation({
    onSuccess: async () => {
      await utils.finances.feeRules.invalidate();
      toast.success("Tarif de cotisation enregistré");
      setNewFeeRule({ category: "standard", currency: "EUR", amount: "", validFrom: new Date().toISOString().slice(0, 10) });
    },
    onError: (error) => toast.error(error.message),
  });
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
  const sendReceiptEmail = trpc.email.sendReceiptEmail.useMutation({
    onSuccess: () => toast.success("Le reçu a été envoyé par e-mail"),
    onError: (error) => toast.error(error.message),
  });
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [dons, setDons] = useState<Don[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") === "paiements" ? "paiements" : "cotisations");
  const [reportYear, setReportYear] = useState(() => new Date().getUTCFullYear());
  const [compareYear, setCompareYear] = useState(() => new Date().getUTCFullYear() - 1);
  const reportInput = useMemo(() => ({ year: reportYear, compareYear }), [reportYear, compareYear]);
  const { data: financialReport, isFetching: isReportFetching } = trpc.finances.report.useQuery(reportInput);
  const { data: analyticReport = [], isFetching: isAnalyticFetching } = trpc.finances.analyticReport.useQuery();
  const { data: financialForecast, isFetching: isForecastFetching } = trpc.finances.forecast.useQuery({ horizonMonths: 3 });
  const { data: reconciliationRows = [], isFetching: isReconciliationFetching } = trpc.finances.listReconciliations.useQuery({ status: "unmatched" });
  const { data: expenseClaims = [], isFetching: isExpenseClaimsFetching } = trpc.finances.listExpenseClaims.useQuery();
  const transitionExpenseClaim = trpc.finances.transitionExpenseClaim.useMutation({ onSuccess: () => { void utils.finances.listExpenseClaims.invalidate({ status: "submitted" }); toast.success("Note de frais mise à jour"); }, onError: (error) => toast.error(error.message) });
  const matchReconciliation = trpc.finances.matchReconciliation.useMutation({ onSuccess: () => { void utils.finances.listReconciliations.invalidate({ status: "unmatched" }); toast.success("Rapprochement mis à jour"); }, onError: (error) => toast.error(error.message) });
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [newFeeRule, setNewFeeRule] = useState({ category: "standard" as typeof MEMBERSHIP_CATEGORIES[number]["value"], currency: "EUR" as "EUR" | "XOF", amount: "", validFrom: new Date().toISOString().slice(0, 10) });
  useEffect(() => {
    setCotisations(storedCotisations.map((item) => ({ ...item, currency: item.currency as "EUR" | "XOF", dateDebut: new Date(item.dateDebut), dateFin: new Date(item.dateFin), datePayment: item.datePayment ? new Date(item.datePayment) : undefined })));
  }, [storedCotisations]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("stripe");
    if (status === "success") {
      toast.success("Paiement Stripe confirmé", { description: "Le rapprochement financier sera mis à jour après réception du webhook." });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "cancelled") {
      toast.info("Paiement Stripe annulé");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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
  const suggestedFeeInput = useMemo(() => ({ memberId: Number(newCotisation.memberId), currency: newCotisation.currency }), [newCotisation.memberId, newCotisation.currency]);
  const { data: suggestedFee, isFetching: isSuggestedFeeLoading } = trpc.finances.suggestedFee.useQuery(suggestedFeeInput, { enabled: suggestedFeeInput.memberId > 0 });

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
    const suggestedAmount = suggestedFee?.amount?.toString() ?? "";
    const amount = newCotisation.montant || suggestedAmount;
    if (!newCotisation.memberId || !amount || !newCotisation.dateDebut || !newCotisation.dateFin) {
      toast.error("Renseignez le membre, le montant ou configurez un tarif, ainsi que les deux dates");
      return;
    }

    const cotisation: Cotisation = {
      id: Date.now(),
      memberId: parseInt(newCotisation.memberId),
      montant: amount,
      currency: newCotisation.currency,
      dateDebut: new Date(newCotisation.dateDebut),
      dateFin: new Date(newCotisation.dateFin),
      statut: "en attente",
      notes: newCotisation.notes,
    };

    createCotisationMutation.mutate({
      memberId: cotisation.memberId,
      montant: newCotisation.montant || undefined,
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

  const handleCreateFeeRule = () => {
    if (!newFeeRule.amount || !newFeeRule.validFrom) {
      toast.error("Renseignez le montant et la date d’entrée en vigueur");
      return;
    }
    createFeeRuleMutation.mutate({
      category: newFeeRule.category,
      currency: newFeeRule.currency,
      amount: newFeeRule.amount,
      validFrom: newFeeRule.validFrom,
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

  const handleSendReceiptEmail = (receiptId: number) => {
    sendReceiptEmail.mutate({ receiptId });
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="dons">Dons</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
          <TabsTrigger value="rapport">Rapport</TabsTrigger>
          <TabsTrigger value="previsions">Prévisions</TabsTrigger>
          <TabsTrigger value="analytique">Analytique</TabsTrigger>
          <TabsTrigger value="rapprochement">Rapprochement</TabsTrigger>
          <TabsTrigger value="frais">Notes de frais</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="recus">Reçus</TabsTrigger>
          <TabsTrigger value="paiements">Paiements Stripe</TabsTrigger>
        </TabsList>

        <TabsContent value="paiements" className="space-y-4">
          <Card className="border-primary/20 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle>Paiements en ligne</CardTitle>
              <CardDescription>Utilisez Stripe pour les cotisations, les dons et les campagnes de collecte. Le paiement s’ouvre dans une nouvelle fenêtre sécurisée.</CardDescription>
            </CardHeader>
            <CardContent>
              <StripeCheckoutCard members={members} />
            </CardContent>
          </Card>
        </TabsContent>

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
                <Button variant="outline" className="gap-2">Gérer les tarifs</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Tarifs annuels par catégorie</DialogTitle><DialogDescription>Configurez les montants proposés automatiquement lors de l’enregistrement d’une cotisation.</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Catégorie</Label><Select value={newFeeRule.category} onValueChange={(value) => setNewFeeRule({ ...newFeeRule, category: value as typeof MEMBERSHIP_CATEGORIES[number]["value"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MEMBERSHIP_CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Devise</Label><Select value={newFeeRule.currency} onValueChange={(value) => setNewFeeRule({ ...newFeeRule, currency: value as "EUR" | "XOF" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (F CFA)</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="feeAmount">Montant</Label><Input id="feeAmount" type="number" min="0.01" step="0.01" value={newFeeRule.amount} onChange={(event) => setNewFeeRule({ ...newFeeRule, amount: event.target.value })} placeholder="0.00" /></div><div><Label htmlFor="feeValidFrom">Valable à partir du</Label><Input id="feeValidFrom" type="date" value={newFeeRule.validFrom} onChange={(event) => setNewFeeRule({ ...newFeeRule, validFrom: event.target.value })} /></div></div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">Tarifs actuellement enregistrés</p>{feeRules.length === 0 ? <p className="mt-1 text-muted-foreground">Aucun barème configuré.</p> : <div className="mt-2 space-y-1">{feeRules.map((rule) => <div key={rule.id} className="flex justify-between gap-3"><span>{MEMBERSHIP_CATEGORIES.find((category) => category.value === rule.category)?.label ?? rule.category} · {rule.currency}</span><span className="font-medium">{Number(rule.amount).toLocaleString("fr-FR")}</span></div>)}</div>}</div>
                  <Button onClick={handleCreateFeeRule} disabled={createFeeRuleMutation.isPending} className="w-full">{createFeeRuleMutation.isPending ? "Enregistrement…" : "Enregistrer le tarif"}</Button>
                </div>
              </DialogContent>
            </Dialog>
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
                    <Label htmlFor="memberId">Membre</Label>
                    <Select value={newCotisation.memberId} onValueChange={(value) => setNewCotisation({ ...newCotisation, memberId: value, montant: "" })}>
                      <SelectTrigger id="memberId"><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                      <SelectContent>
                        {members.filter((member) => member.status === "active").map((member) => (
                          <SelectItem key={member.id} value={String(member.id)}>
                            {member.firstName} {member.lastName} · {member.membershipCategory ?? "standard"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {suggestedFeeInput.memberId > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {isSuggestedFeeLoading ? "Recherche du tarif de la catégorie…" : suggestedFee?.amount ? `Tarif recommandé : ${suggestedFee.amount.toLocaleString("fr-FR")} ${newCotisation.currency}` : "Aucun tarif configuré pour cette catégorie dans cette devise."}
                      </p>
                    )}
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
                        placeholder={suggestedFee?.amount ? `Automatique · ${suggestedFee.amount}` : "Montant ou tarif automatique"}
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
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => printExistingReceipt(receipt)}><Printer className="h-4 w-4" />Imprimer</Button>
                    <Button variant="outline" size="sm" className="gap-2" disabled={!receipt.donorEmail || sendReceiptEmail.isPending} onClick={() => handleSendReceiptEmail(receipt.id)} title={receipt.donorEmail ? "Envoyer le reçu par e-mail" : "Aucune adresse e-mail enregistrée"}><Mail className="h-4 w-4" />{sendReceiptEmail.isPending ? "Envoi…" : "Envoyer"}</Button>
                  </div>
                </div>;
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport Tab */}
        <TabsContent value="rapport" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rapport financier comparatif</CardTitle>
              <CardDescription>Les montants sont présentés dans leur devise d’origine et avec leur équivalence indicative en EUR et F CFA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="report-year">Année</Label><Input id="report-year" type="number" min={2000} max={2100} value={reportYear} onChange={(event) => setReportYear(Number(event.target.value) || new Date().getUTCFullYear())} /></div>
                  <div className="space-y-2"><Label htmlFor="compare-year">Comparer à</Label><Input id="compare-year" type="number" min={2000} max={2100} value={compareYear} onChange={(event) => setCompareYear(Number(event.target.value) || reportYear - 1)} /></div>
                </div>
                {financialReport && <Button type="button" variant="outline" onClick={() => exportFinancialReportCsv(financialReport, reportYear)}>Exporter CSV</Button>}
              </div>
              {isReportFetching ? <p className="text-sm text-muted-foreground" role="status">Actualisation du rapport…</p> : financialReport ? <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-emerald-50/60"><CardHeader className="pb-2"><CardDescription>Recettes</CardDescription><CardTitle>{financialReport.total.incomeXof.toLocaleString("fr-FR")} F CFA</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-muted-foreground">{financialReport.total.incomeEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</CardContent></Card>
                  <Card className="bg-rose-50/60"><CardHeader className="pb-2"><CardDescription>Dépenses</CardDescription><CardTitle>{financialReport.total.expensesXof.toLocaleString("fr-FR")} F CFA</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-muted-foreground">{financialReport.total.expensesEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</CardContent></Card>
                  <Card className="bg-primary/5"><CardHeader className="pb-2"><CardDescription>Solde</CardDescription><CardTitle>{financialReport.total.balanceXof.toLocaleString("fr-FR")} F CFA</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-muted-foreground">{financialReport.total.balanceEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</CardContent></Card>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["cotisation", "don", "depense"] as const).map((type) => {
                    const label = type === "cotisation" ? "Cotisations" : type === "don" ? "Dons" : "Dépenses";
                    const item = financialReport.breakdown[type];
                    return <div key={type} className="rounded-lg border p-3"><p className="text-sm font-medium">{label}</p><p className="mt-1 font-semibold">{item.amountXof.toLocaleString("fr-FR")} F CFA</p><p className="text-xs text-muted-foreground">{item.amountEur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p></div>;
                  })}
                </div>
                {financialReport.comparison && <p className="text-sm text-muted-foreground">Variation du solde par rapport à {financialReport.comparison.year} : {financialReport.comparison.variationXof === null ? "référence indisponible" : `${financialReport.comparison.variationXof > 0 ? "+" : ""}${financialReport.comparison.variationXof.toLocaleString("fr-FR")} %`} en F CFA, soit {financialReport.comparison.variationEur === null ? "référence indisponible" : `${financialReport.comparison.variationEur > 0 ? "+" : ""}${financialReport.comparison.variationEur.toLocaleString("fr-FR")} %`} en €.</p>}
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Période</th><th className="p-2">Recettes (F CFA)</th><th className="p-2">Dépenses (F CFA)</th><th className="p-2">Solde (F CFA)</th></tr></thead><tbody>{financialReport.monthly.map((row) => <tr key={row.period} className="border-b"><td className="p-2">{row.period}</td><td className="p-2">{row.incomeXof.toLocaleString("fr-FR")}</td><td className="p-2">{row.expensesXof.toLocaleString("fr-FR")}</td><td className="p-2 font-medium">{row.balanceXof.toLocaleString("fr-FR")}</td></tr>)}</tbody></table></div>
              </> : <p className="text-sm text-muted-foreground">Aucune donnée disponible pour cette période.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previsions" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Prévisions budgétaires</CardTitle><CardDescription>Estimation prudente fondée sur la moyenne des trois derniers mois complets. Elle ne remplace pas une décision budgétaire validée.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {isForecastFetching ? <p className="text-sm text-muted-foreground" role="status">Calcul de la tendance…</p> : financialForecast ? <>
                <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Tendance recettes</p><p className="mt-1 text-lg font-semibold">{financialForecast.trend.incomeXofPercent === null ? "Référence indisponible" : `${financialForecast.trend.incomeXofPercent > 0 ? "+" : ""}${financialForecast.trend.incomeXofPercent.toLocaleString("fr-FR")} %`}</p><p className="text-xs text-muted-foreground">comparaison moyenne précédente</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Tendance dépenses</p><p className="mt-1 text-lg font-semibold">{financialForecast.trend.expensesXofPercent === null ? "Référence indisponible" : `${financialForecast.trend.expensesXofPercent > 0 ? "+" : ""}${financialForecast.trend.expensesXofPercent.toLocaleString("fr-FR")} %`}</p><p className="text-xs text-muted-foreground">comparaison moyenne précédente</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Référence</p><p className="mt-1 text-lg font-semibold">{financialForecast.referencePeriod}</p><p className="text-xs text-muted-foreground">{financialForecast.historyMonths} mois observés · taux {financialForecast.euroToXofRate.toLocaleString("fr-FR")} XOF/€</p></div></div>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Période estimée</th><th className="p-2">Recettes</th><th className="p-2">Dépenses</th><th className="p-2">Solde</th></tr></thead><tbody>{financialForecast.forecast.map((row) => <tr key={row.period} className="border-b"><td className="p-2 font-medium">{row.period}</td><td className="p-2">{row.incomeXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.incomeEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td><td className="p-2">{row.expensesXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.expensesEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td><td className="p-2 font-semibold">{row.balanceXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.balanceEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td></tr>)}</tbody></table></div>
              </> : <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucune donnée historique suffisante pour produire une estimation.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytique" className="space-y-6">
          <Card><CardHeader><CardTitle>Ventilation analytique</CardTitle><CardDescription>Recettes et dépenses regroupées par projet, antenne et catégorie. Les montants sont présentés en F CFA avec leur équivalence en euros.</CardDescription></CardHeader><CardContent>{isAnalyticFetching ? <p className="text-sm text-muted-foreground" role="status">Chargement de la ventilation…</p> : analyticReport.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucune écriture analytique renseignée.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Catégorie</th><th className="p-2">Projet</th><th className="p-2">Antenne</th><th className="p-2">Recettes</th><th className="p-2">Dépenses</th><th className="p-2">Solde</th></tr></thead><tbody>{analyticReport.map((row) => <tr key={`${row.projectId ?? "none"}-${row.antenneId ?? "none"}-${row.category}`} className="border-b"><td className="p-2">{row.category}</td><td className="p-2">{row.projectId ?? "Non affecté"}</td><td className="p-2">{row.antenneId ?? "Non affectée"}</td><td className="p-2">{row.incomeXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.incomeEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td><td className="p-2">{row.expensesXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.expensesEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td><td className="p-2 font-medium">{row.balanceXof.toLocaleString("fr-FR")} F CFA <span className="text-xs text-muted-foreground">({row.balanceEur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €)</span></td></tr>)}</tbody></table></div>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="rapprochement" className="space-y-6">
          <Card><CardHeader><CardTitle>Rapprochement des paiements</CardTitle><CardDescription>Écritures importées depuis Stripe ou une autre source, en attente de lettrage. Les références externes sont dédupliquées.</CardDescription></CardHeader><CardContent>{isReconciliationFetching ? <p className="text-sm text-muted-foreground" role="status">Chargement des écritures…</p> : reconciliationRows.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucune écriture en attente de rapprochement.</p> : <div className="space-y-3">{reconciliationRows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{row.provider} · {row.externalReference}</p><p className="text-sm text-muted-foreground">{Number(row.amount).toLocaleString("fr-FR")} {row.currency === "EUR" ? "€" : "F CFA"} · {new Date(row.transactionDate).toLocaleDateString("fr-FR")}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" aria-label={`Ignorer ${row.externalReference}`} onClick={() => matchReconciliation.mutate({ id: row.id, status: "ignored" })}>Ignorer</Button><Button size="sm" aria-label={`Marquer ${row.externalReference} comme rapproché`} onClick={() => matchReconciliation.mutate({ id: row.id, status: "matched", stripePaymentId: row.stripePaymentId ?? undefined })}>Marquer rapproché</Button></div></div>)}</div>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="frais" className="space-y-6">
          <Card><CardHeader><CardTitle>Notes de frais bénévoles</CardTitle><CardDescription>Vérifiez les justificatifs et validez les remboursements. Les montants conservent leur devise d’origine.</CardDescription></CardHeader><CardContent>{isExpenseClaimsFetching ? <p className="text-sm text-muted-foreground" role="status">Chargement des notes de frais…</p> : expenseClaims.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucune note de frais en attente.</p> : <div className="space-y-3">{expenseClaims.map((claim) => <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{claim.title}</p><p className="text-sm text-muted-foreground">Membre #{claim.memberId} · {Number(claim.amount).toLocaleString("fr-FR")} {claim.currency === "EUR" ? "€" : "F CFA"}</p>{claim.receiptUrl ? <a className="text-sm underline" href={claim.receiptUrl} target="_blank" rel="noreferrer">Voir le justificatif</a> : <p className="text-xs text-amber-700">Justificatif non joint</p>}</div><div className="flex flex-wrap gap-2">{claim.status === "submitted" && <><Button variant="outline" size="sm" aria-label={`Rejeter ${claim.title}`} onClick={() => transitionExpenseClaim.mutate({ id: claim.id, status: "rejected", rejectionReason: "Rejeté depuis Finance" })}>Rejeter</Button><Button size="sm" aria-label={`Approuver ${claim.title}`} onClick={() => transitionExpenseClaim.mutate({ id: claim.id, status: "approved" })}>Approuver</Button></>}{claim.status === "approved" && <Button size="sm" aria-label={`Marquer ${claim.title} comme remboursée`} onClick={() => transitionExpenseClaim.mutate({ id: claim.id, status: "reimbursed" })}>Rembourser</Button>}<Badge variant="outline">{claim.status}</Badge></div></div>)}</div>}</CardContent></Card>
        </TabsContent>

        {/* Graphiques Tab */}
        <TabsContent value="graphiques" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Visualisation Financière et Analytique</h2>
          </div>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cotisations encaissées par catégorie d’adhésion</CardTitle>
                <CardDescription>Répartition du volume des cotisations payées selon le profil des membres</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const categoryMap: Record<string, number> = {};
                  MEMBERSHIP_CATEGORIES.forEach(cat => { categoryMap[cat.value] = 0; });
                  
                  cotisations.filter(c => c.statut === "payée").forEach(cot => {
                    const member = members.find(m => m.id === cot.memberId);
                    const cat = member?.membershipCategory ?? "standard";
                    const amount = parseFloat(cot.montant || "0");
                    categoryMap[cat] = (categoryMap[cat] || 0) + amount;
                  });

                  const data = MEMBERSHIP_CATEGORIES.map(cat => ({
                    name: cat.label,
                    amount: categoryMap[cat.value] || 0,
                  })).filter(d => d.amount > 0);

                  if (data.length === 0) {
                    return <div className="py-12 text-center text-sm text-muted-foreground">Aucune cotisation payée enregistrée pour l’instant.</div>;
                  }

                  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString("fr-FR")} F`, "Montant"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Synthèse des catégories d’adhésion</CardTitle>
                <CardDescription>Nombre de cotisants et part du chiffre d’affaires associatif</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MEMBERSHIP_CATEGORIES.map(cat => {
                    const paidCotis = cotisations.filter(c => c.statut === "payée");
                    const catCotis = paidCotis.filter(cot => {
                      const member = members.find(m => m.id === cot.memberId);
                      return (member?.membershipCategory ?? "standard") === cat.value;
                    });
                    const totalAmount = catCotis.reduce((sum, c) => sum + parseFloat(c.montant || "0"), 0);
                    const memberCount = members.filter(m => (m.membershipCategory ?? "standard") === cat.value).length;

                    return (
                      <div key={cat.value} className="flex items-center justify-between border-b pb-3 text-sm">
                        <div>
                          <p className="font-medium">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{memberCount} membre(s) dans cette catégorie</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{totalAmount.toLocaleString("fr-FR")} F</p>
                          <p className="text-xs text-muted-foreground">{catCotis.length} cotisation(s) réglée(s)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  );
}
