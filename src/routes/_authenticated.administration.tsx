import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileCheck2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HouseholdSheet } from "@/components/HouseholdSheet";
import { CitizenSheet } from "@/components/CitizenSheet";
import { CitizenDialog } from "@/components/CitizenDialog";
import { ActeDialog } from "@/components/ActeDialog";
import { DOC_TYPES, SEX_LABEL } from "@/lib/acte-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/administration")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Administration · FANISA" }] }),
});

interface Household { id: string; household_number: string; head_full_name: string; fokontany: string | null; member_count: number; address: string | null }
interface Citizen { id: string; last_name: string; first_names: string; sex: "M" | "F"; cin: string | null; phone: string | null; profession: string | null; household_id: string | null }
interface DocRow { id: string; doc_number: string; doc_type: keyof typeof DOC_TYPES; issued_at: string; status: string; verify_code: string; citizen_snapshot: { last_name: string; first_names: string } }

function AdminPage() {
  const [tab, setTab] = useState("foyers");
  const [households, setHouseholds] = useState<Household[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [q, setQ] = useState("");
  const [dlgH, setDlgH] = useState(false);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [dlgC, setDlgC] = useState(false);
  const [activeCitizenId, setActiveCitizenId] = useState<string | null>(null);
  const [sheetC, setSheetC] = useState(false);
  const [dlgA, setDlgA] = useState(false);

  const openCitizen = (id: string) => { setActiveCitizenId(id); setSheetC(true); };

  const openHousehold = (id: string | null) => { setActiveHouseholdId(id); setDlgH(true); };

  const reload = async () => {
    const [{ data: h }, { data: c }, { data: d }] = await Promise.all([
      supabase.from("households").select("*").order("created_at", { ascending: false }),
      supabase.from("citizens").select("*").order("last_name"),
      supabase.from("documents_issued").select("id,doc_number,doc_type,issued_at,status,verify_code,citizen_snapshot").order("issued_at", { ascending: false }).limit(100),
    ]);
    setHouseholds((h as Household[]) ?? []);
    setCitizens((c as Citizen[]) ?? []);
    setDocs((d as DocRow[]) ?? []);
  };

  useEffect(() => { reload(); }, []);

  const matches = (s: string | null | undefined) => !q || (s ?? "").toLowerCase().includes(q.toLowerCase());

  const cancelDoc = async (id: string) => {
    const reason = window.prompt("Motif d'annulation :");
    if (!reason) return;
    const { error } = await supabase.from("documents_issued").update({ status: "cancelled", cancel_reason: reason, cancelled_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Acte annulé"); reload(); }
  };

  return (
    <div>
      <PageHeader
        pillar="Pilier 2"
        title="Administration & E-Gouvernance"
        description="Foyers, citoyens et délivrance d'actes avec vérification QR."
        actions={
          <>
            {tab === "foyers" && <Button onClick={() => openHousehold(null)}><Plus className="w-4 h-4 mr-1" />Foyer</Button>}
            {tab === "citoyens" && <Button onClick={() => setDlgC(true)}><Plus className="w-4 h-4 mr-1" />Citoyen</Button>}
            {tab === "actes" && <Button onClick={() => setDlgA(true)}><FileCheck2 className="w-4 h-4 mr-1" />Délivrer un acte</Button>}
          </>
        }
      />
      <div className="p-6 lg:p-10 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Foyers" value={households.length} />
          <Stat label="Citoyens" value={citizens.length} />
          <Stat label="Actes délivrés" value={docs.length} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="foyers">Foyers ({households.length})</TabsTrigger>
              <TabsTrigger value="citoyens">Citoyens ({citizens.length})</TabsTrigger>
              <TabsTrigger value="actes">Actes ({docs.length})</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 w-64" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <TabsContent value="foyers" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Chef</TableHead><TableHead>Fokontany</TableHead><TableHead>Adresse</TableHead><TableHead className="text-right">Membres</TableHead></TableRow></TableHeader>
                <TableBody>
                  {households.filter((h) => matches(h.household_number) || matches(h.head_full_name)).map((h) => (
                    <TableRow key={h.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openHousehold(h.id)}>
                      <TableCell className="font-mono">{h.household_number}</TableCell>
                      <TableCell className="font-medium">{h.head_full_name}</TableCell>
                      <TableCell>{h.fokontany ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{h.address ?? "—"}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">{h.member_count}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {households.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Aucun foyer. Ajoutez le premier.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="citoyens" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Nom & prénoms</TableHead><TableHead>Sexe</TableHead><TableHead>CIN</TableHead><TableHead>Profession</TableHead><TableHead>Téléphone</TableHead></TableRow></TableHeader>
                <TableBody>
                  {citizens.filter((c) => matches(c.last_name) || matches(c.first_names) || matches(c.cin)).map((c) => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openCitizen(c.id)}>
                      <TableCell className="font-medium">{c.last_name} {c.first_names}</TableCell>
                      <TableCell>{SEX_LABEL[c.sex]}</TableCell>
                      <TableCell className="font-mono text-xs">{c.cin ?? "—"}</TableCell>
                      <TableCell>{c.profession ?? "—"}</TableCell>
                      <TableCell>{c.phone ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {citizens.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">Aucun citoyen enregistré.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="actes" className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Type</TableHead><TableHead>Bénéficiaire</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {docs.filter((d) => matches(d.doc_number) || matches(d.citizen_snapshot?.last_name)).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.doc_number}</TableCell>
                      <TableCell>{DOC_TYPES[d.doc_type]}</TableCell>
                      <TableCell className="font-medium">{d.citizen_snapshot?.last_name} {d.citizen_snapshot?.first_names}</TableCell>
                      <TableCell>{new Date(d.issued_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        {d.status === "active"
                          ? <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Actif</Badge>
                          : <Badge variant="destructive">Annulé</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <a href={`/verify/${d.verify_code}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline"><Download className="w-3 h-3 mr-1" />Vérifier</Button>
                        </a>
                        {d.status === "active" && <Button size="sm" variant="ghost" onClick={() => cancelDoc(d.id)}>Annuler</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Aucun acte délivré.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <HouseholdSheet open={dlgH} onOpenChange={setDlgH} householdId={activeHouseholdId} onSaved={reload} onCreated={(id) => setActiveHouseholdId(id)} />
      <CitizenSheet open={sheetC} onOpenChange={setSheetC} citizenId={activeCitizenId} />
      <CitizenDialog open={dlgC} onOpenChange={setDlgC} onSaved={reload} />
      <ActeDialog open={dlgA} onOpenChange={setDlgA} onSaved={reload} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
