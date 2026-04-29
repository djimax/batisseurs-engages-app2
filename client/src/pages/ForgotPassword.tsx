import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ForgotPasswordProps {
  onBack: () => void;
}

const SUPPORT_EMAIL = "contact.lesbatisseursengages@gmail.com";

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPasswordMutation = trpc.email.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Valider l'email
    if (!email) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    try {
      const result = await resetPasswordMutation.mutateAsync({ email });
      
      if (result.success) {
        setIsSubmitted(true);
        toast.success(result.message);
      } else {
        setError(result.error || "Une erreur s'est produite");
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur s'est produite";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Demande envoyée !</CardTitle>
            <CardDescription>
              Votre demande de réinitialisation a été transmise à l'administrateur
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Une demande de réinitialisation de mot de passe a été envoyée à <strong>{SUPPORT_EMAIL}</strong>.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Prochaines étapes :</strong>
                <br />
                L'administrateur vous enverra un nouveau mot de passe à l'adresse <strong>{email}</strong>.
              </p>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Vérifiez votre boîte mail (et le dossier spam) pour recevoir votre nouveau mot de passe.
            </p>

            <Button
              onClick={onBack}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre adresse email pour demander une réinitialisation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nous enverrons votre demande à l'administrateur qui vous contactera
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending || !email}
              size="lg"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Demander une réinitialisation"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={resetPasswordMutation.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Besoin d'aide immédiate ?
              <br />
              Contactez directement : <strong>{SUPPORT_EMAIL}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
