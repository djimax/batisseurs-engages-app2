import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type MemberOption = { id: number; firstName?: string | null; lastName?: string | null };

type Props = { members: MemberOption[] };

export function StripeCheckoutCard({ members }: Props) {
  const [paymentType, setPaymentType] = useState<"cotisation" | "don" | "campagne">("cotisation");
  const [currency, setCurrency] = useState<"EUR" | "XOF">("EUR");
  const [amount, setAmount] = useState("");
  const [memberId, setMemberId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const { data: campaigns = [] } = trpc.stripe.campaignOptions.useQuery();
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      setRequestId(crypto.randomUUID());
      toast.success("Redirection vers le paiement sécurisé Stripe");
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = () => {
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Saisissez un montant valide");
      return;
    }
    const amountMinor = currency === "XOF" ? Math.round(numericAmount) : Math.round(numericAmount * 100);
    createCheckout.mutate({
      paymentType,
      amountMinor,
      currency,
      description: paymentType === "cotisation" ? "Cotisation associative" : paymentType === "campagne" ? "Contribution à une campagne" : "Don à l’association",
      memberId: paymentType === "cotisation" && memberId ? Number(memberId) : undefined,
      campaignId: paymentType === "campagne" && campaignId ? Number(campaignId) : undefined,
      idempotencyKey: requestId,
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Paiement en ligne Stripe</CardTitle>
        <CardDescription>Créez une session Checkout sécurisée pour une cotisation, un don ou une campagne.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2"><Label>Type</Label><Select value={paymentType} onValueChange={(value: typeof paymentType) => setPaymentType(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cotisation">Cotisation</SelectItem><SelectItem value="don">Don</SelectItem><SelectItem value="campagne">Campagne</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Montant</Label><Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={currency === "EUR" ? "25,00" : "15000"} /></div>
        <div className="space-y-2"><Label>Devise</Label><Select value={currency} onValueChange={(value: typeof currency) => setCurrency(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="XOF">XOF (FCFA)</SelectItem></SelectContent></Select></div>
        {paymentType === "cotisation" && <div className="space-y-2"><Label>Membre</Label><Select value={memberId} onValueChange={setMemberId}><SelectTrigger><SelectValue placeholder="Choisir un membre" /></SelectTrigger><SelectContent>{members.map((member) => <SelectItem key={member.id} value={String(member.id)}>{member.firstName} {member.lastName}</SelectItem>)}</SelectContent></Select></div>}
        {paymentType === "campagne" && <div className="space-y-2"><Label>Campagne</Label><Select value={campaignId} onValueChange={setCampaignId}><SelectTrigger><SelectValue placeholder="Choisir une campagne" /></SelectTrigger><SelectContent>{campaigns.map((campaign) => <SelectItem key={campaign.id} value={String(campaign.id)}>{campaign.title}</SelectItem>)}</SelectContent></Select></div>}
        <Button className="self-end" onClick={handleSubmit} disabled={createCheckout.isPending}><span className="flex items-center gap-2">{createCheckout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Ouvrir Checkout</span></Button>
      </CardContent>
    </Card>
  );
}
