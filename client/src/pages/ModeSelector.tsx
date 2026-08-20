import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, Wifi, Building2, Globe2, ArrowUpRight, Check, Sparkles, ShieldCheck } from "lucide-react";

interface ModeSelectorProps {
  onSelectMode: (mode: "online" | "offline") => void;
}

const onlineBenefits = [
  "Accès depuis n’importe quel ordinateur",
  "Données synchronisées en temps réel",
  "Partage simple entre les équipes",
];

const offlineBenefits = [
  "Aucune connexion Internet requise",
  "Données conservées localement",
  "Pratique pour les réunions et le terrain",
];

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <main className="app-auth-shell min-h-screen overflow-hidden px-4 py-6 sm:px-8 sm:py-10">
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-between gap-12">
        <header className="flex items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="brand-mark h-12 w-12 rounded-2xl">
              <img src="/logo.png" alt="Les Bâtisseurs Engagés" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-tight text-primary sm:text-base">Les Bâtisseurs Engagés</p>
              <p className="text-xs text-muted-foreground">Plateforme associative</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-primary/10 bg-card/70 px-3 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur sm:flex">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Une gestion plus simple, ensemble
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="max-w-xl animate-fade-in-up delay-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-card/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Votre espace de coordination
            </div>
            <h1 className="font-display max-w-2xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Faites avancer vos projets associatifs avec sérénité.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Choisissez votre mode de travail et retrouvez une organisation claire pour vos membres, vos documents, vos finances et vos actions de terrain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Données organisées</span>
              <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-accent" /> Antennes connectées</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="card-hover animate-fade-in-up delay-2 overflow-hidden border-primary/10 bg-card/85 shadow-[0_24px_60px_-36px_oklch(0.28_0.09_184_/_0.5)] backdrop-blur">
              <CardHeader className="pb-4">
                <div className="mb-4 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">Recommandé</span>
                </div>
                <CardTitle className="font-display text-2xl">Mode en ligne</CardTitle>
                <CardDescription className="leading-6">Travaillez ensemble depuis n’importe où avec une synchronisation cloud.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {onlineBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="h-3 w-3" /></span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => onSelectMode("online")} size="lg" className="button-interactive w-full rounded-xl bg-primary text-primary-foreground shadow-[0_14px_24px_-18px_var(--primary)] hover:bg-primary/90">
                  <Globe2 className="mr-2 h-4 w-4" />
                  Utiliser le mode en ligne
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="card-hover animate-fade-in-up delay-3 overflow-hidden border-accent/20 bg-card/85 shadow-[0_24px_60px_-36px_oklch(0.65_0.13_39_/_0.42)] backdrop-blur">
              <CardHeader className="pb-4">
                <div className="mb-4 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-foreground">
                    <Wifi className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">Terrain</span>
                </div>
                <CardTitle className="font-display text-2xl">Mode hors ligne</CardTitle>
                <CardDescription className="leading-6">Continuez à organiser vos activités même lorsque la connexion se fait attendre.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {offlineBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-accent/20 text-accent-foreground"><Check className="h-3 w-3" /></span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => onSelectMode("offline")} size="lg" variant="outline" className="button-interactive w-full rounded-xl border-accent/30 bg-accent/10 text-accent-foreground hover:bg-accent/20">
                  <Wifi className="mr-2 h-4 w-4" />
                  Utiliser le mode hors ligne
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-primary/10 pt-5 text-sm text-muted-foreground animate-fade-in-up delay-4 sm:flex-row sm:items-center sm:justify-between">
          <p>Vous pourrez changer de mode à tout moment depuis les paramètres.</p>
          <p className="flex items-center gap-2 text-xs"><Building2 className="h-3.5 w-3.5 text-primary" /> Pensé pour les associations de terrain</p>
        </footer>
      </div>
    </main>
  );
}
