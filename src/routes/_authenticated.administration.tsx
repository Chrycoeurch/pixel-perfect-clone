import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Users, FileCheck2, QrCode } from "lucide-react";

export const Route = createFileRoute("/_authenticated/administration")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Administration · FANISA" }] }),
});

const features = [
  { icon: Users, title: "Dossier individuel 360°", desc: "Identité, santé, éducation, historique des documents." },
  { icon: FileCheck2, title: "Générateur d'actes", desc: "Résidence, vie, bonne conduite, naissance, vente." },
  { icon: QrCode, title: "Vérification QR", desc: "Authentification publique de chaque acte délivré." },
];

function AdminPage() {
  return (
    <div>
      <PageHeader
        pillar="Pilier 2"
        title="Administration & E-Gouvernance"
        description="Base citoyenne, dossiers individuels et délivrance d'actes officiels avec historique immuable."
      />
      <div className="p-6 lg:p-10 grid md:grid-cols-3 gap-4">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="p-6 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          );
        })}
      </div>
      <div className="px-6 lg:px-10 pb-10">
        <div className="p-6 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          Module à construire en <strong className="text-foreground">Phase 1</strong> — cœur métier du système.
        </div>
      </div>
    </div>
  );
}
