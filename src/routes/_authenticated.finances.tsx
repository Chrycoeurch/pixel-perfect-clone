import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finances")({
  component: FinancesPage,
  head: () => ({ meta: [{ title: "Finances · FANISA" }] }),
});

function FinancesPage() {
  return (
    <div>
      <PageHeader
        pillar="Pilier 3"
        title="Finances & Gouvernance participative"
        description="Campagnes de cotisation, suivi des recettes/dépenses, archivage des réunions et pointage QR Tanamaro."
      />
      <div className="p-6 lg:p-10">
        <div className="h-[50vh] rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3 bg-card">
          <Wallet className="w-10 h-10 text-muted-foreground" />
          <div className="text-sm font-medium">Module Finances</div>
          <div className="text-xs text-muted-foreground">Disponible en Phase 3</div>
        </div>
      </div>
    </div>
  );
}
