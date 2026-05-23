import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AssetDialog, LoanDialog } from "@/components/PatrimoineDialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patrimoine")({
  component: PatrimoinePage,
  head: () => ({ meta: [{ title: "Patrimoine · FANISA" }] }),
});

const CAT_LABEL: Record<string, string> = { mobilier: "Mobilier", tente: "Tente", sono: "Sonorisation", outillage: "Outillage", vaisselle: "Vaisselle", autre: "Autre" };
const COND_LABEL: Record<string, string> = { neuf: "Neuf", bon: "Bon", use: "Usé", hors_service: "HS" };
const STATUS_LABEL: Record<string, string> = { reserved: "Réservé", active: "En cours", returned: "Rendu", overdue: "En retard", cancelled: "Annulé" };

interface Asset { id: string; name: string; category: string; total_quantity: number; condition: string; unit_value: number; location: string | null }
interface Loan { id: string; asset_id: string; borrower_label: string; quantity: number; loan_date: string; due_date: string | null; returned_date: string | null; deposit_amount: number; fee_amount: number; paid_amount: number; status: string }

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " Ar"; }

function PatrimoinePage() {
  const [tab, setTab] = useState("biens");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [dlgA, setDlgA] = useState(false);
  const [dlgL, setDlgL] = useState(false);

  const reload = async () => {
    const [{ data: a }, { data: l }] = await Promise.all([
      supabase.from("assets").select("*").order("name"),
      supabase.from("asset_loans").select("*").order("loan_date", { ascending: false }),
    ]);
    setAssets((a as Asset[]) ?? []);
    setLoans((l as Loan[]) ?? []);
  };
  useEffect(() => { reload(); }, []);

  const assetName = (id: string) => assets.find((a) => a.id === id)?.name ?? "—";

  const setStatus = async (id: string, status: "active" | "returned" | "overdue" | "cancelled" | "reserved", returned = false) => {
    const patch = returned
      ? { status, returned_date: new Date().toISOString().slice(0, 10) }
      : { status };
    const { error } = await supabase.from("asset_loans").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Prêt mis à jour"); reload(); }
  };

  const totalValue = assets.reduce((s, a) => s + a.unit_value * a.total_quantity, 0);
  const activeLoans = loans.filter((l) => l.status === "active" || l.status === "overdue").length;
  const outstanding = loans.filter((l) => l.status === "active" || l.status === "overdue").reduce((s, l) => s + Math.max(0, l.fee_amount - l.paid_amount), 0);

  return (
    <div>
      <PageHeader
        pillar="Pilier 4"
        title="Gestion du Patrimoine"
        description="Inventaire des biens du fokontany et suivi des prêts avec lien financier."
        actions={
          <>
            {tab === "biens" && <Button onClick={() => setDlgA(true)}><Plus className="w-4 h-4 mr-1" />Bien</Button>}
            {tab === "prets" && <Button onClick={() => setDlgL(true)}><HandCoins className="w-4 h-4 mr-1" />Prêt</Button>}
          </>
        }
      />
      <div className="p-6 lg:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Stat label="Biens référencés" value={String(assets.length)} />
          <Stat label="Valeur estimée" value={fmt(totalValue)} />
          <Stat label="Prêts actifs" value={String(activeLoans)} />
          <Stat label="Restes à payer" value={fmt(outstanding)} accent />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="biens">Biens ({assets.length})</TabsTrigger>
            <TabsTrigger value="prets">Prêts ({loans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="biens" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Catégorie</TableHead><TableHead>État</TableHead><TableHead className="text-right">Qté</TableHead><TableHead className="text-right">Valeur unit.</TableHead><TableHead>Emplacement</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell><Badge variant="secondary">{CAT_LABEL[a.category]}</Badge></TableCell>
                      <TableCell>{COND_LABEL[a.condition]}</TableCell>
                      <TableCell className="text-right font-mono">{a.total_quantity}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(a.unit_value)}</TableCell>
                      <TableCell className="text-muted-foreground">{a.location ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {assets.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" />Aucun bien. Ajoutez votre premier inventaire.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="prets" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Bien</TableHead><TableHead>Emprunteur</TableHead><TableHead className="text-right">Qté</TableHead><TableHead>Prêt</TableHead><TableHead>Retour</TableHead><TableHead className="text-right">Frais</TableHead><TableHead className="text-right">Payé</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loans.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{assetName(l.asset_id)}</TableCell>
                      <TableCell>{l.borrower_label}</TableCell>
                      <TableCell className="text-right font-mono">{l.quantity}</TableCell>
                      <TableCell>{new Date(l.loan_date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{l.returned_date ? new Date(l.returned_date).toLocaleDateString("fr-FR") : l.due_date ? <span className="text-muted-foreground">prévu {new Date(l.due_date).toLocaleDateString("fr-FR")}</span> : "—"}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(l.fee_amount)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(l.paid_amount)}</TableCell>
                      <TableCell>
                        <Badge className={
                          l.status === "active" ? "bg-primary/15 text-primary hover:bg-primary/15"
                          : l.status === "returned" ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                          : l.status === "overdue" ? "bg-destructive/15 text-destructive hover:bg-destructive/15"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                        }>{STATUS_LABEL[l.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {(l.status === "active" || l.status === "overdue") && <Button size="sm" variant="outline" onClick={() => setStatus(l.id, "returned", true)}>Rendre</Button>}
                        {l.status === "active" && <Button size="sm" variant="ghost" onClick={() => setStatus(l.id, "overdue")}>Retard</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {loans.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">Aucun prêt enregistré.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AssetDialog open={dlgA} onOpenChange={setDlgA} onSaved={reload} />
      <LoanDialog open={dlgL} onOpenChange={setDlgL} onSaved={reload} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl font-bold mt-1 ${accent ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
