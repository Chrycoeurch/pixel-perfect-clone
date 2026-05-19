import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/patrimoine")({
  component: PatrimoinePage,
  head: () => ({ meta: [{ title: "Patrimoine · FANISA" }] }),
});

function PatrimoinePage() {
  return (
    <div>
      <PageHeader
        pillar="Pilier 4"
        title="Gestion du Patrimoine"
        description="Inventaire des biens (chaises, tentes, outils) et gestion des prêts avec enregistrement financier."
      />
      <div className="p-6 lg:p-10">
        <div className="h-[50vh] rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 bg-card">
          <Package className="w-10 h-10 text-muted-foreground" />
          <div className="text-sm font-medium">Module Patrimoine</div>
          <div className="text-xs text-muted-foreground">Disponible en Phase 4</div>
        </div>
      </div>
    </div>
  );
}
