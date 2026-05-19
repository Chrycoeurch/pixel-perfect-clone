import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Users, Wallet, Package, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "FANISA Web Pro · Gestion du Fokontany" },
      {
        name: "description",
        content:
          "Plateforme intégrée de gestion administrative, financière et patrimoniale du Fokontany : SIG, e-gouvernance, finances participatives, patrimoine.",
      },
    ],
  }),
});

const pillars = [
  { icon: Map, title: "SIG & Cartographie", desc: "Visualisation des foyers, alertes et zones de risque." },
  { icon: Users, title: "Administration", desc: "Dossier 360° et actes officiels avec QR de vérification." },
  { icon: Wallet, title: "Finances participatives", desc: "Cotisations, dépenses et présence aux réunions." },
  { icon: Package, title: "Patrimoine", desc: "Inventaire des biens et gestion des prêts." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">F</div>
            <div>
              <div className="font-display font-bold leading-none">FANISA</div>
              <div className="text-[10px] text-muted-foreground">Web Pro · Toamasina</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/dashboard">Accéder à la plateforme</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
              <ShieldCheck className="w-3 h-3" /> Système officiel · Version 2.0
            </div>
            <h1 className="font-display text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
              Gestion administrative, financière et patrimoniale du Fokontany.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              FANISA Web Pro unifie la cartographie décisionnelle, la délivrance d'actes
              officiels, les finances participatives et le patrimoine communautaire dans
              une plateforme sécurisée et conçue pour le terrain.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/login">
                  Commencer <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">Voir la démo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-[var(--shadow-elevated)] transition-shadow"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Pilier {i + 1}</div>
                <h3 className="font-display font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-2">
          <div>© FANISA · Système de gestion du Fokontany — Toamasina</div>
          <div>Données chiffrées · Historique immuable</div>
        </div>
      </footer>
    </div>
  );
}
