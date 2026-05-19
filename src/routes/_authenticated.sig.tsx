import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Map } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sig")({
  component: SigPage,
  head: () => ({ meta: [{ title: "SIG & Cartographie · FANISA" }] }),
});

function SigPage() {
  return (
    <div>
      <PageHeader
        pillar="Pilier 1"
        title="SIG & Cartographie décisionnelle"
        description="Visualisation interactive des foyers, superposition de couches (zones inondables, réseaux), filtrage croisé."
      />
      <div className="p-6 lg:p-10">
        <div className="h-[60vh] rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 bg-card">
          <Map className="w-10 h-10 text-muted-foreground" />
          <div className="text-sm font-medium">Carte interactive MapLibre</div>
          <div className="text-xs text-muted-foreground max-w-md">
            Disponible en Phase 2 — après la mise en place de la base citoyenne (Phase 1).
          </div>
        </div>
      </div>
    </div>
  );
}
