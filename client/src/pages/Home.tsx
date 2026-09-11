import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  FolderOpen,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  Activity,
  Cloud,
  Zap,
  Globe,
  Wifi,
  Mail,
  MapPin,
  FileCheck,
  Building2,
  ShieldCheck,
  Landmark,
  Megaphone,
  CreditCard
} from "lucide-react";
import { useLocation } from "wouter";
import { RoleSelector } from "@/components/RoleSelector";
import { useRole } from "@/hooks/useRole";
import { useCurrency } from "@/contexts/CurrencyContext";
import React from "react";

const ORGANIZATION_INFO = {
  name: "Les Batisseurs Engages",
  location: "N'djaména, Tchad",
  folio: "10512",
  email: "contact.lesbatisseursengages@gmail.com",
  website: "www.lesbatisseursengage.com",
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAdmin } = useRole();
  const [mode, setMode] = React.useState<'online' | 'offline'>('online');
  const { data: stats, isLoading: statsLoading } = trpc.documents.stats.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const { data: documents, isLoading: documentsLoading } = trpc.documents.list.useQuery({});
  const { data: dashboardSummary, isLoading: dashboardSummaryLoading } = trpc.dashboard.summary.useQuery();

  const recentDocs = documents?.slice(0, 5) || [];
  const urgentDocs = documents?.filter(d => d.priority === "urgent" && d.status !== "completed") || [];

  const statCards = [
    {
      title: "Total Documents",
      value: stats?.total || 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      gradient: "from-primary/80 to-primary",
    },
    {
      title: "Complétés",
      value: stats?.completed || 0,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bgColor: "bg-emerald-100/80",
      gradient: "from-emerald-500/80 to-emerald-600",
    },
    {
      title: "En cours",
      value: stats?.inProgress || 0,
      icon: TrendingUp,
      color: "text-accent-foreground",
      bgColor: "bg-accent/15",
      gradient: "from-accent/80 to-accent",
    },
    {
      title: "En attente",
      value: stats?.pending || 0,
      icon: Clock,
      color: "text-amber-700",
      bgColor: "bg-amber-100/80",
      gradient: "from-amber-500/80 to-amber-600",
    },
  ];

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

  return (
    <div className="space-y-10">
      {/* Hero d’accueil */}
      <div className="hero-gradient-primary relative overflow-hidden rounded-[1.75rem] p-6 text-white shadow-[0_24px_55px_-34px_oklch(0.25_0.08_184_/_0.75)] animate-fade-in-up sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Bienvenue sur votre Portail
              </h1>
            </div>
            <p className="max-w-2xl text-lg text-white/75">
              Plateforme complète de gestion documentaire, financière et administrative pour votre association
            </p>
            
            {/* Mini stats inline dans le hero */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-white/65" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-white/65">Documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-white/65" />
                <div>
                  <p className="text-2xl font-bold">{categories?.length || 0}</p>
                  <p className="text-xs text-white/65">Catégories</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setLocation("/documents")} 
              className="button-interactive gap-2 bg-white/95 text-primary shadow-lg hover:bg-white h-12 px-6"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Nouveau document
            </Button>
            <Button 
              onClick={() => window.open("https://www.lesbatisseursengages.com/", "_blank")} 
              className="button-interactive gap-2 border border-white/25 bg-white/10 text-white shadow-lg hover:bg-white/20 h-12 px-6"
              size="lg"
              variant="outline"
            >
              <Globe className="h-5 w-5" />
              Visiter le site
            </Button>
          </div>
        </div>
      </div>

      {/* Vue transversale de coordination */}
      <section aria-labelledby="coordination-summary-title" className="space-y-4 animate-fade-in-up">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="coordination-summary-title" className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Activity className="h-6 w-6 text-primary" />Vue de coordination</h2>
            <p className="text-sm text-muted-foreground">Les principaux indicateurs opérationnels, calculés à partir des données enregistrées.</p>
          </div>
          <Badge variant="outline" className="w-fit">Actualisé {dashboardSummary?.generatedAt ? new Date(dashboardSummary.generatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}</Badge>
        </div>
        {dashboardSummaryLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite" aria-label="Chargement des indicateurs">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
          </div>
        ) : dashboardSummary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover border-primary/15 bg-primary/[0.03]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" />Antennes</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardSummary.antennas.active}<span className="ml-2 text-sm font-normal text-muted-foreground">actives / {dashboardSummary.antennas.total}</span></p><Button variant="link" className="h-auto p-0 text-xs" onClick={() => setLocation("/antennes")}>Voir les antennes <ArrowRight className="ml-1 h-3 w-3" /></Button></CardContent></Card>
            <Card className="card-hover border-accent/20 bg-accent/[0.04]"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent-foreground" />Campagnes actives</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardSummary.campaigns.active}<span className="ml-2 text-sm font-normal text-muted-foreground">{dashboardSummary.campaigns.activeProgress}% de l’objectif</span></p><Button variant="link" className="h-auto p-0 text-xs" onClick={() => setLocation("/campaigns")}>Voir les campagnes <ArrowRight className="ml-1 h-3 w-3" /></Button></CardContent></Card>
            <Card className="card-hover border-emerald-200/70 bg-emerald-50/50"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-700" />Paiements récents</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardSummary.recentPayments.length}</p><p className="text-xs text-muted-foreground">cotisations payées sur 7 jours</p></CardContent></Card>
            <Card className="card-hover border-amber-200/70 bg-amber-50/50"><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Users className="h-4 w-4 text-amber-700" />Adhésions</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardSummary.adhesions.active}</p><p className="text-xs text-muted-foreground">actives · {dashboardSummary.adhesions.pending} en attente · {dashboardSummary.adhesions.expired} expirées</p></CardContent></Card>
          </div>
        ) : null}
        {dashboardSummary && dashboardSummary.campaigns.activeList.length > 0 ? (
          <Card><CardHeader><CardTitle className="text-base">Campagnes à suivre</CardTitle><CardDescription>Les cinq campagnes actives dont l’échéance est la plus proche.</CardDescription></CardHeader><CardContent className="space-y-3">{dashboardSummary.campaigns.activeList.map((campaign) => <div key={campaign.id} className="space-y-2"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium">{campaign.title}</span><span className="text-xs text-muted-foreground">{campaign.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={campaign.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progression de ${campaign.title}`}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${campaign.progress}%` }} /></div></div>)}</CardContent></Card>
        ) : null}
      </section>

      {/* 🔄 MODE SELECTOR - Affichage toujours visible */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Sélectionner votre Mode
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Online Mode */}
          <Card className={`card-hover cursor-pointer border ${mode === 'online' ? 'border-primary bg-primary/5 shadow-md' : 'border-border/70 hover:border-primary/30'}`}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Mode En Ligne</CardTitle>
                  {mode === 'online' && <Badge className="mt-1 bg-primary text-primary-foreground">Actif</Badge>}
                </div>
              </div>
              <CardDescription>
                Accès depuis n'importe où avec synchronisation cloud
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Avantages</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Accès depuis n'importe quel ordinateur</li>
                  <li>✅ Données synchronisées en temps réel</li>
                  <li>✅ Stockage illimité dans le cloud</li>
                  <li>✅ Partage facile entre membres</li>
                  <li>✅ Sauvegarde automatique</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Pré-requis</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Connexion Internet</li>
                  <li>• Compte Manus</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  setMode('online');
                  setLocation('/documents');
                }}
                className="button-interactive w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Globe className="w-4 h-4 mr-2" />
                Utiliser Mode En Ligne
              </Button>
            </CardContent>
          </Card>

          {/* Offline Mode */}
          <Card className={`card-hover cursor-pointer border ${mode === 'offline' ? 'border-accent bg-accent/5 shadow-md' : 'border-border/70 hover:border-accent/40'}`}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle>Mode Hors Ligne</CardTitle>
                  {mode === 'offline' && <Badge className="mt-1 bg-accent text-accent-foreground">Actif</Badge>}
                </div>
              </div>
              <CardDescription>
                Utilisez l'application sans connexion Internet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Avantages</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ Aucune connexion Internet requise</li>
                  <li>✅ Données stockées localement</li>
                  <li>✅ Utilisation immédiate</li>
                  <li>✅ Pas d'authentification</li>
                  <li>✅ Parfait pour les réunions offline</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">À savoir</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Données locales uniquement</li>
                  <li>• Pas de synchronisation</li>
                </ul>
              </div>
              <Button
                onClick={() => {
                  setMode('offline');
                  setLocation('/offline');
                }}
                className="button-interactive w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Utiliser Mode Hors Ligne
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="mb-1 font-semibold text-primary">Vous pouvez changer de mode à tout moment</p>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez passer du mode en ligne au mode hors ligne (et vice versa) en utilisant les boutons ci-dessus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Contact Info */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Informations de l'Association
        </h2>
        
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Siège Social</p>
                  <p className="text-base font-semibold">{ORGANIZATION_INFO.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Folio</p>
                  <p className="text-base font-semibold">{ORGANIZATION_INFO.folio}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a href={`mailto:${ORGANIZATION_INFO.email}`} className="text-base font-semibold text-primary underline-offset-4 hover:underline">
                    {ORGANIZATION_INFO.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Site Web</p>
                  <a href={`https://${ORGANIZATION_INFO.website}`} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-primary underline-offset-4 hover:underline">
                    {ORGANIZATION_INFO.website}
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques en direct */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 animate-slide-in-right">
          <TrendingUp className="h-6 w-6 text-primary" />
          Statistiques en Direct
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            statCards.map((stat, index) => (
              <Card 
                key={stat.title} 
                className={`card-hover overflow-hidden relative animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient subtle en arrière-plan */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}></div>
                
                <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl ${stat.bgColor} transition-transform hover:scale-110`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Documents urgents */}
      {urgentDocs.length > 0 && (
        <Card className="border-red-200/70 bg-red-50/60 animate-fade-in-up shadow-lg shadow-red-500/10" style={{ animationDelay: `0.5s` }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <CardTitle className="text-lg text-red-800">
                Documents urgents ({urgentDocs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentDocs.slice(0, 3).map((doc) => (
                <div 
                  key={doc.id} 
                  className="card-hover flex items-center justify-between rounded-xl border border-red-100 bg-white/80 p-4 transition-all cursor-pointer"
                  onClick={() => setLocation("/documents")}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-50 p-2">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">{doc.title}</span>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              ))}
              {urgentDocs.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="w-full text-red-700 hover:bg-red-100"
                  onClick={() => setLocation("/documents")}
                >
                  Voir tous les documents urgents ({urgentDocs.length - 3} de plus)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue d’ensemble */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 animate-slide-in-right">
          <FolderOpen className="h-6 w-6 text-primary" />
          Vue d'Ensemble
        </h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Documents récents */}
          <Card className="glass-card card-hover animate-fade-in-up delay-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents récents
                </CardTitle>
                <CardDescription>Les derniers documents modifiés</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/documents")}
                className="hover:bg-primary/10"
              >
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentDocs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun document</p>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => setLocation("/documents")}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">Document</p>
                        </div>
                      </div>
                      {getPriorityBadge(doc.priority)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

              {/* Résumé rapide */}
          <Card className="glass-card card-hover animate-fade-in-up delay-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Résumé Rapide
              </CardTitle>
              <CardDescription>Aperçu de votre activité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">Complétés</span>
                  </div>
                  <span className="font-bold text-lg">{stats?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">En cours</span>
                  </div>
                  <span className="font-bold text-lg">{stats?.inProgress || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">En attente</span>
                  </div>
                  <span className="font-bold text-lg">{stats?.pending || 0}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/documents")}
                >
                  Voir tous les documents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Selector (Dev) - Hidden by default */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/50">
          Outils de développement
        </summary>
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-muted">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <RoleSelector />
          </div>
        </div>
      </details>
    </div>
  );
}
