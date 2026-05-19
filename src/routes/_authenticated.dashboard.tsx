import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Users, FileCheck2, Wallet, AlertTriangle, TrendingUp, Map } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Tableau de bord · FANISA" }] }),
});

const kpis = [
  { label: "Foyers enregistrés", value: "—", icon: Users, hint: "Module Administration" },
  { label: "Actes délivrés (30j)", value: "—", icon: FileCheck2, hint: "Avec QR de vérification" },
  { label: "Taux de recouvrement", value: "—", icon: Wallet, hint: "Cotisations en cours" },
  { label: "Alertes actives", value: "—", icon: AlertTriangle, hint: "Sanitaire · cyclone" },
];

function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue consolidée des indicateurs du Fokontany. Les données apparaîtront dès qu'un module sera alimenté."
      />
      <div className="p-6 lg:p-10 space-y-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="p-5 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium text-muted-foreground">{k.label}</div>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-3 font-display text-3xl font-bold">{k.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Activité récente</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              L'historique des actes délivrés, contributions et prêts s'affichera ici dès l'activation des modules.
            </p>
            <div className="mt-6 h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              Graphiques disponibles en Phase 5 — Dashboard & Recommandations
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Map className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Carte du Fokontany</h2>
            </div>
            <p className="text-sm text-muted-foreground">Aperçu géographique des foyers.</p>
            <div className="mt-6 h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              SIG · Phase 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
