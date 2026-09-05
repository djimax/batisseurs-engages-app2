import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PublicCampaign() {
  const [, params] = useRoute("/campaigns/public/:token");
  const { data, isLoading, error } = trpc.campaigns.publicDetails.useQuery({ token: params?.token || "" }, { enabled: Boolean(params?.token) });

  if (isLoading) return <main className="mx-auto max-w-3xl p-6 text-center text-muted-foreground">Chargement de la campagne…</main>;
  if (error || !data) return <main className="mx-auto max-w-3xl p-6 text-center text-muted-foreground">Cette campagne n’est pas disponible.</main>;

  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <Card className="overflow-hidden">
      {data.image ? <img src={data.image} alt="" className="h-56 w-full object-cover" /> : null}
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-3xl">{data.title}</CardTitle><CardDescription className="mt-2">{data.description || "Campagne de collecte"}</CardDescription></div><Badge>Campagne active</Badge></div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div><div className="flex justify-between text-sm"><span>Progression</span><strong>{data.progress}%</strong></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Progression de ${data.title}`} aria-valuenow={data.progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data.progress}%` }} /></div><div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>{data.montantCollecte.toLocaleString("fr-FR")} € collectés</span><span>Objectif : {data.objectif.toLocaleString("fr-FR")} €</span></div></div>
        <section aria-labelledby="contributions-title"><h2 id="contributions-title" className="text-lg font-semibold">Contributions récentes</h2>{data.contributions.length ? <div className="mt-3 divide-y rounded-xl border">{data.contributions.slice(0, 20).map((contribution) => <div key={contribution.id} className="flex items-center justify-between gap-3 p-3"><div><p className="font-medium">{contribution.displayName || "Donateur anonyme"}</p><p className="text-xs text-muted-foreground">{new Date(contribution.contributionDate).toLocaleDateString("fr-FR")}</p></div><strong>{Number(contribution.amount).toLocaleString("fr-FR")} {contribution.currency === "EUR" ? "€" : "F CFA"}</strong></div>)}</div> : <p className="mt-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Les premières contributions apparaîtront ici.</p>}</section>
      </CardContent>
    </Card>
  </main>;
}
