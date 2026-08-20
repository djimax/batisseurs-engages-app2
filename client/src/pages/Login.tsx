import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock, Mail, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
  onForgotPassword?: () => void;
}

export default function Login({ onLogin, error, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="app-auth-shell flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[8%] top-[12%] h-40 w-40 rounded-full bg-accent/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[12%] left-[8%] h-48 w-48 rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="border-primary/10 bg-card/90 shadow-[0_28px_70px_-42px_oklch(0.25_0.08_184_/_0.75)] backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-8">
              <div className="flex justify-center mb-4 animate-fade-in-up">
              <div className="brand-mark h-20 w-20 rounded-[1.6rem]">
                <img src="/logo.png" alt="Les Bâtisseurs Engagés" className="h-12 w-12" />
              </div>
            </div>
            <div className="space-y-2 animate-fade-in-up delay-1">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <CardTitle className="font-display text-3xl font-bold tracking-tight text-primary">
                  Les Bâtisseurs Engagés
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Plateforme de gestion d'association
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="animate-fade-in-up delay-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-fade-in-up">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Adresse Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="votre.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-xl border-border/80 bg-background/70 focus:border-primary focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Mot de passe
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit(e as any);
                      }
                    }}
                    disabled={isLoading}
                    className="pl-10 h-11 rounded-xl border-border/80 bg-background/70 focus:border-primary focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Avez-vous oublié vos identifiants ?
                  </p>
                  {onForgotPassword && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-xs font-semibold text-primary hover:text-primary/75 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="button-interactive w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_14px_26px_-18px_var(--primary)] hover:bg-primary/90"
                disabled={isLoading || !email || !password}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connexion en cours...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/70">
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                Cette application est protégée par authentification.
                <br />
                <span className="font-semibold text-primary">
                  Accès réservé aux membres de l'association.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Version 1.0 • Plateforme sécurisée</p>
        </div>
      </div>
    </div>
  );
}
