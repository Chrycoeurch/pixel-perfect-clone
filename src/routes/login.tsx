import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Connexion · FANISA Web Pro" },
      { name: "description", content: "Accédez à l'interface de gestion administrative du Fokontany." },
    ],
  }),
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/dashboard";
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Email ou mot de passe incorrect.");
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center font-bold text-xl">F</div>
            <div>
              <div className="font-display text-2xl font-bold">FANISA Web Pro</div>
              <div className="text-sm text-white/70">Toamasina · Madagascar</div>
            </div>
          </div>
          <div className="max-w-md space-y-4">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Gestion administrative, financière et patrimoniale du Fokontany.
            </h2>
            <p className="text-white/80">
              Une plateforme unifiée pour piloter le territoire, délivrer des actes
              officiels sécurisés et gérer la participation citoyenne.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {["SIG décisionnel", "E-Gouvernance", "Finances participatives", "Patrimoine"].map((p) => (
                <div key={p} className="px-3 py-2 rounded-md bg-white/10 backdrop-blur text-sm">{p}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Shield className="w-3 h-3" /> Données chiffrées · Historique immuable
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">F</div>
            <div className="font-display font-bold">FANISA Web Pro</div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Connexion</h1>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre espace agent.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
