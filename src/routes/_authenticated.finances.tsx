import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Wallet, Receipt, Calendar, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CampaignDialog, ContributionDialog, ExpenseDialog, MeetingDialog } from "@/components/FinanceDialogs";

export const Route = createFileRoute("/_authenticated/finances")({
  component: FinancesPage,
  head: () => ({ meta: [{ title: "Finances · FANISA" }] }),
});

interface Campaign { id: string; title: string; target_amount_per_household: number; currency: string; deadline: string | null; status: string; created_at: string }
interface Contribution { id: string; campaign_id: string; household_label: string | null; amount: number; paid_at: string; method: string | null }
interface Expense { id: string; title: string; category: string; amount: number; currency: string; spent_at: string; vendor: string | null }
interface Meeting { id: string; title: string; starts_at: string; location: string | null; status: string; attendance_code: string }

const fmt = (n: number, cur = "MGA") => new Intl.NumberFormat("fr-FR").format(n) + " " + cur;

function FinancesPage() {
  const [tab, setTab] = useState("campagnes");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dlgCamp, setDlgCamp] = useState(false);
  const [dlgContrib, setDlgContrib] = useState(false);
  const [dlgExp, setDlgExp] = useState(false);
  const [dlgMeet, setDlgMeet] = useState(false);

  const reload = async () => {
    const [{ data: c }, { data: co }, { data: e }, { data: m }] = await Promise.all([
      supabase.from("contribution_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("contributions").select("*").order("paid_at", { ascending: false }).limit(200),
      supabase.from("expenses").select("*").order("spent_at", { ascending: false }).limit(200),
      supabase.from("meetings").select("*").order("starts_at", { ascending: false }).limit(100),
    ]);
    setCampaigns((c as Campaign[]) ?? []);
    setContributions((co as Contribution[]) ?? []);
    setExpenses((e as Expense[]) ?? []);
    setMeetings((m as Meeting[]) ?? []);
  };
  useEffect(() => { reload(); }, []);

  const totals = useMemo(() => {
    const inc = contributions.reduce((s, c) => s + Number(c.amount), 0);
    const out = expenses.reduce((s, c) => s + Number(c.amount), 0);
    return { inc, out, balance: inc - out };
  }, [contributions, expenses]);

  const perCampaign = useMemo(() => {
    const map = new Map<string, number>();
    contributions.forEach((c) => map.set(c.campaign_id, (map.get(c.campaign_id) ?? 0) + Number(c.amount)));
    return map;
  }, [contributions]);

  return (
    <div>
      <PageHeader
        pillar="Pilier 3"
        title="Finances & Gouvernance participative"
        description="Campagnes de cotisations, dépenses transparentes, réunions et pointage QR."
        actions={
          <>
            {tab === "campagnes" && <Button onClick={() => setDlgCamp(true)}><Plus className="w-4 h-4 mr-1" />Campagne</Button>}
            {tab === "contributions" && <Button onClick={() => setDlgContrib(true)} disabled={campaigns.length === 0}><Plus className="w-4 h-4 mr-1" />Contribution</Button>}
            {tab === "depenses" && <Button onClick={() => setDlgExp(true)}><Plus className="w-4 h-4 mr-1" />Dépense</Button>}
            {tab === "reunions" && <Button onClick={() => setDlgMeet(true)}><Plus className="w-4 h-4 mr-1" />Réunion</Button>}
          </>
        }
      />
      <div className="p-6 lg:p-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard icon={<Wallet className="w-4 h-4" />} label="Recettes" value={fmt(totals.inc)} tone="primary" />
          <KpiCard icon={<Receipt className="w-4 h-4" />} label="Dépenses" value={fmt(totals.out)} tone="warn" />
          <KpiCard icon={<Wallet className="w-4 h-4" />} label="Solde net" value={fmt(totals.balance)} tone={totals.balance >= 0 ? "primary" : "danger"} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="campagnes">Campagnes ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="contributions">Contributions ({contributions.length})</TabsTrigger>
            <TabsTrigger value="depenses">Dépenses ({expenses.length})</TabsTrigger>
            <TabsTrigger value="reunions">Réunions ({meetings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="campagnes" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Cible / foyer</TableHead><TableHead>Collecté</TableHead><TableHead>Échéance</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{fmt(Number(c.target_amount_per_household), c.currency)}</TableCell>
                      <TableCell className="font-semibold text-primary">{fmt(perCampaign.get(c.id) ?? 0, c.currency)}</TableCell>
                      <TableCell>{c.deadline ? new Date(c.deadline).toLocaleDateString("fr-FR") : "—"}</TableCell>
                      <TableCell><Badge variant={c.status === "active" ? "secondary" : "outline"}>{c.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && <Empty colSpan={5} text="Aucune campagne." />}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="contributions" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Foyer</TableHead><TableHead>Campagne</TableHead><TableHead>Mode</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.paid_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-medium">{c.household_label ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{campaigns.find((x) => x.id === c.campaign_id)?.title ?? "—"}</TableCell>
                      <TableCell>{c.method ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(Number(c.amount))}</TableCell>
                    </TableRow>
                  ))}
                  {contributions.length === 0 && <Empty colSpan={5} text="Aucune contribution." />}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="depenses" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Intitulé</TableHead><TableHead>Catégorie</TableHead><TableHead>Fournisseur</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.spent_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                      <TableCell>{e.vendor ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(Number(e.amount), e.currency)}</TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && <Empty colSpan={5} text="Aucune dépense." />}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="reunions" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Réunion</TableHead><TableHead>Date</TableHead><TableHead>Lieu</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Présence</TableHead></TableRow></TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{m.title}</TableCell>
                      <TableCell>{new Date(m.starts_at).toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{m.location ?? "—"}</TableCell>
                      <TableCell><Badge variant={m.status === "ongoing" ? "default" : "outline"}>{m.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link to="/meetings/$code" params={{ code: m.attendance_code }}>
                          <Button size="sm" variant="outline"><QrCode className="w-3 h-3 mr-1" />Pointer</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                  {meetings.length === 0 && <Empty colSpan={5} text="Aucune réunion." />}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CampaignDialog open={dlgCamp} onOpenChange={setDlgCamp} onSaved={reload} />
      <ContributionDialog open={dlgContrib} onOpenChange={setDlgContrib} onSaved={reload} campaigns={campaigns} />
      <ExpenseDialog open={dlgExp} onOpenChange={setDlgExp} onSaved={reload} />
      <MeetingDialog open={dlgMeet} onOpenChange={setDlgMeet} onSaved={reload} />
    </div>
  );
}

function KpiCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "warn" | "danger" }) {
  const colors = {
    primary: "text-primary bg-primary/10",
    warn: "text-amber-600 bg-amber-500/10",
    danger: "text-destructive bg-destructive/10",
  };
  return (
    <div className="p-5 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[tone]}`}>{icon}</div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground mt-2">{value}</div>
    </div>
  );
}

function Empty({ colSpan, text }: { colSpan: number; text: string }) {
  return <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-12">{text}</TableCell></TableRow>;
}
