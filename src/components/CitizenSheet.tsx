import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { User, Home, FileCheck2, Wallet, Package, Users } from "lucide-react";
import { DOC_TYPES, SEX_LABEL, MARITAL_LABEL } from "@/lib/acte-types";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; citizenId: string | null }

interface Citizen {
  id: string; last_name: string; first_names: string; sex: "M" | "F";
  birth_date: string | null; birth_place: string | null; cin: string | null;
  profession: string | null; education: string | null; marital_status: keyof typeof MARITAL_LABEL | null;
  phone: string | null; is_head: boolean; relationship: string | null;
  household_id: string | null; notes: string | null; created_at: string;
}
interface Household { id: string; household_number: string; head_full_name: string; fokontany: string | null; address: string | null; member_count: number }
interface Member { id: string; last_name: string; first_names: string; relationship: string | null; is_head: boolean }
interface Doc { id: string; doc_number: string; doc_type: keyof typeof DOC_TYPES; issued_at: string; status: string }
interface Contribution { id: string; amount: number; paid_at: string; campaign_id: string }
interface Loan { id: string; borrower_label: string; loan_date: string; due_date: string | null; returned_date: string | null; status: string; fee_amount: number; paid_amount: number }
interface Attendance { id: string; checked_in_at: string; meeting_id: string }

export function CitizenSheet({ open, onOpenChange, citizenId }: Props) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !citizenId) return;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("citizens").select("*").eq("id", citizenId).single();
      setCitizen(c as Citizen);
      const hid = (c as Citizen | null)?.household_id ?? null;
      const [hRes, mRes, dRes, aRes] = await Promise.all([
        hid ? supabase.from("households").select("*").eq("id", hid).single() : Promise.resolve({ data: null }),
        hid ? supabase.from("citizens").select("id,last_name,first_names,relationship,is_head").eq("household_id", hid) : Promise.resolve({ data: [] }),
        supabase.from("documents_issued").select("id,doc_number,doc_type,issued_at,status").eq("citizen_id", citizenId).order("issued_at", { ascending: false }),
        supabase.from("meeting_attendance").select("id,checked_in_at,meeting_id").eq("citizen_id", citizenId).order("checked_in_at", { ascending: false }),
      ]);
      setHousehold((hRes.data as Household) ?? null);
      setMembers(((mRes.data as Member[]) ?? []).filter((m) => m.id !== citizenId));
      setDocs((dRes.data as Doc[]) ?? []);
      setAttendance((aRes.data as Attendance[]) ?? []);
      if (hid) {
        const [cRes, lRes] = await Promise.all([
          supabase.from("contributions").select("id,amount,paid_at,campaign_id").eq("household_id", hid).order("paid_at", { ascending: false }),
          supabase.from("asset_loans").select("id,borrower_label,loan_date,due_date,returned_date,status,fee_amount,paid_amount").eq("household_id", hid).order("loan_date", { ascending: false }),
        ]);
        setContribs((cRes.data as Contribution[]) ?? []);
        setLoans((lRes.data as Loan[]) ?? []);
      } else { setContribs([]); setLoans([]); }
      setLoading(false);
    })();
  }, [open, citizenId]);

  const age = citizen?.birth_date ? Math.floor((Date.now() - new Date(citizen.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const initials = citizen ? `${citizen.first_names.charAt(0)}${citizen.last_name.charAt(0)}`.toUpperCase() : "";
  const totalContrib = contribs.reduce((s, c) => s + Number(c.amount), 0);
  const activeLoans = loans.filter((l) => l.status === "active").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Profil citoyen</SheetTitle>
        </SheetHeader>

        {loading && <p className="text-sm text-muted-foreground mt-6">Chargement…</p>}

        {citizen && !loading && (
          <div className="mt-6 space-y-6">
            {/* Identity header */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-border">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-2xl font-bold">{citizen.last_name} {citizen.first_names}</h2>
                  {citizen.is_head && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Chef de famille</Badge>}
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span><User className="w-3 h-3 inline mr-1" />{SEX_LABEL[citizen.sex]}</span>
                  {age !== null && <span>{age} ans</span>}
                  {citizen.marital_status && <span>{MARITAL_LABEL[citizen.marital_status]}</span>}
                  {citizen.cin && <span className="font-mono">CIN {citizen.cin}</span>}
                  {citizen.phone && <span>📞 {citizen.phone}</span>}
                </div>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-4 gap-3">
              <Kpi icon={<FileCheck2 className="w-4 h-4" />} label="Actes" value={docs.length} />
              <Kpi icon={<Wallet className="w-4 h-4" />} label="Cotisations" value={`${totalContrib.toLocaleString("fr-FR")} Ar`} />
              <Kpi icon={<Package className="w-4 h-4" />} label="Prêts actifs" value={activeLoans} />
              <Kpi icon={<Users className="w-4 h-4" />} label="Réunions" value={attendance.length} />
            </div>

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Identité</TabsTrigger>
                <TabsTrigger value="foyer">Foyer</TabsTrigger>
                <TabsTrigger value="actes">Actes ({docs.length})</TabsTrigger>
                <TabsTrigger value="finances">Finances</TabsTrigger>
                <TabsTrigger value="presence">Présence</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-2">
                <Row label="Nom complet" value={`${citizen.last_name} ${citizen.first_names}`} />
                <Row label="Sexe" value={SEX_LABEL[citizen.sex]} />
                <Row label="Date de naissance" value={citizen.birth_date ? new Date(citizen.birth_date).toLocaleDateString("fr-FR") : "—"} />
                <Row label="Lieu de naissance" value={citizen.birth_place ?? "—"} />
                <Row label="CIN" value={citizen.cin ?? "—"} />
                <Row label="État civil" value={citizen.marital_status ? MARITAL_LABEL[citizen.marital_status] : "—"} />
                <Row label="Profession" value={citizen.profession ?? "—"} />
                <Row label="Scolarité" value={citizen.education ?? "—"} />
                <Row label="Téléphone" value={citizen.phone ?? "—"} />
                <Row label="Enregistré le" value={new Date(citizen.created_at).toLocaleDateString("fr-FR")} />
                {citizen.notes && <Row label="Notes" value={citizen.notes} />}
              </TabsContent>

              <TabsContent value="foyer" className="mt-4">
                {household ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-center gap-2 mb-2"><Home className="w-4 h-4 text-primary" /><span className="font-display font-bold">Foyer {household.household_number}</span></div>
                      <div className="text-sm space-y-1">
                        <div><span className="text-muted-foreground">Chef :</span> {household.head_full_name}</div>
                        <div><span className="text-muted-foreground">Fokontany :</span> {household.fokontany ?? "—"}</div>
                        <div><span className="text-muted-foreground">Adresse :</span> {household.address ?? "—"}</div>
                        <div><span className="text-muted-foreground">Membres :</span> {household.member_count}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Autres membres ({members.length})</h4>
                      <div className="space-y-1">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                            <span>{m.last_name} {m.first_names}</span>
                            <Badge variant="secondary" className="text-xs">{m.relationship ?? "—"}</Badge>
                          </div>
                        ))}
                        {members.length === 0 && <p className="text-xs text-muted-foreground">Pas d'autres membres.</p>}
                      </div>
                    </div>
                  </div>
                ) : <p className="text-sm text-muted-foreground">Aucun foyer rattaché.</p>}
              </TabsContent>

              <TabsContent value="actes" className="mt-4 space-y-2">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <div className="font-medium text-sm">{DOC_TYPES[d.doc_type]}</div>
                      <div className="text-xs text-muted-foreground font-mono">{d.doc_number} · {new Date(d.issued_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    {d.status === "active"
                      ? <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Actif</Badge>
                      : <Badge variant="destructive">Annulé</Badge>}
                  </div>
                ))}
                {docs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucun acte délivré.</p>}
              </TabsContent>

              <TabsContent value="finances" className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Cotisations du foyer</h4>
                  <div className="space-y-1">
                    {contribs.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                        <span>{new Date(c.paid_at).toLocaleDateString("fr-FR")}</span>
                        <span className="font-mono">{Number(c.amount).toLocaleString("fr-FR")} Ar</span>
                      </div>
                    ))}
                    {contribs.length === 0 && <p className="text-xs text-muted-foreground">Aucune cotisation enregistrée.</p>}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Prêts patrimoine</h4>
                  <div className="space-y-1">
                    {loans.map((l) => (
                      <div key={l.id} className="p-2 rounded border border-border text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{l.borrower_label}</span>
                          <Badge variant={l.status === "active" ? "default" : "secondary"} className="text-xs">{l.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Prêt le {new Date(l.loan_date).toLocaleDateString("fr-FR")}
                          {l.returned_date && ` · Retourné le ${new Date(l.returned_date).toLocaleDateString("fr-FR")}`}
                          {l.fee_amount > 0 && ` · ${Number(l.paid_amount).toLocaleString("fr-FR")}/${Number(l.fee_amount).toLocaleString("fr-FR")} Ar`}
                        </div>
                      </div>
                    ))}
                    {loans.length === 0 && <p className="text-xs text-muted-foreground">Aucun prêt.</p>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="presence" className="mt-4 space-y-2">
                {attendance.map((a) => (
                  <div key={a.id} className="p-2 rounded border border-border text-sm flex items-center justify-between">
                    <span>Réunion #{a.meeting_id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.checked_in_at).toLocaleString("fr-FR")}</span>
                  </div>
                ))}
                {attendance.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune présence enregistrée.</p>}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="font-display font-bold text-lg mt-1 truncate">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
