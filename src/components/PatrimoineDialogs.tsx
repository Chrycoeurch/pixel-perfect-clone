import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { v: "mobilier", l: "Mobilier (chaises, tables)" },
  { v: "tente", l: "Tente / bâche" },
  { v: "sono", l: "Sonorisation" },
  { v: "outillage", l: "Outillage" },
  { v: "vaisselle", l: "Vaisselle" },
  { v: "autre", l: "Autre" },
];
const CONDITIONS = [
  { v: "neuf", l: "Neuf" },
  { v: "bon", l: "Bon état" },
  { v: "use", l: "Usé" },
  { v: "hors_service", l: "Hors service" },
];

export function AssetDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ name: "", category: "mobilier", total_quantity: "10", condition: "bon", unit_value: "0", location: "", notes: "" });
  const u = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) return toast.error("Nom requis");
    setLoading(true);
    const { error } = await supabase.from("assets").insert({
      name: f.name,
      category: f.category as never,
      total_quantity: Number(f.total_quantity) || 0,
      condition: f.condition as never,
      unit_value: Number(f.unit_value) || 0,
      location: f.location || null,
      notes: f.notes || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bien ajouté");
    setF({ name: "", category: "mobilier", total_quantity: "10", condition: "bon", unit_value: "0", location: "", notes: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouveau bien</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2"><Label>Nom *</Label><Input value={f.name} onChange={(e) => u("name", e.target.value)} placeholder="Chaises plastiques bleues" /></div>
          <div>
            <Label>Catégorie</Label>
            <Select value={f.category} onValueChange={(v) => u("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>État</Label>
            <Select value={f.condition} onValueChange={(v) => u("condition", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Quantité totale</Label><Input type="number" min={0} value={f.total_quantity} onChange={(e) => u("total_quantity", e.target.value)} /></div>
          <div><Label>Valeur unitaire (MGA)</Label><Input type="number" min={0} value={f.unit_value} onChange={(e) => u("unit_value", e.target.value)} /></div>
          <div className="col-span-2"><Label>Emplacement</Label><Input value={f.location} onChange={(e) => u("location", e.target.value)} placeholder="Local bureau Fokontany" /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => u("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Asset { id: string; name: string; total_quantity: number }
interface Household { id: string; household_number: string; head_full_name: string }

export function LoanDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [f, setF] = useState({
    asset_id: "",
    household_id: "none",
    borrower_label: "",
    quantity: "1",
    loan_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    deposit_amount: "0",
    fee_amount: "0",
    paid_amount: "0",
    notes: "",
  });
  const u = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from("assets").select("id,name,total_quantity").order("name"),
      supabase.from("households").select("id,household_number,head_full_name").order("household_number"),
    ]).then(([a, h]) => {
      setAssets((a.data as Asset[]) ?? []);
      setHouseholds((h.data as Household[]) ?? []);
    });
  }, [open]);

  const submit = async () => {
    if (!f.asset_id) return toast.error("Bien requis");
    if (!f.borrower_label.trim() && f.household_id === "none") return toast.error("Emprunteur requis");
    setLoading(true);
    const hh = f.household_id !== "none" ? households.find((h) => h.id === f.household_id) : null;
    const label = f.borrower_label.trim() || (hh ? `${hh.household_number} · ${hh.head_full_name}` : "");
    const { error } = await supabase.from("asset_loans").insert({
      asset_id: f.asset_id,
      household_id: f.household_id !== "none" ? f.household_id : null,
      borrower_label: label,
      quantity: Number(f.quantity) || 1,
      loan_date: f.loan_date,
      due_date: f.due_date || null,
      deposit_amount: Number(f.deposit_amount) || 0,
      fee_amount: Number(f.fee_amount) || 0,
      paid_amount: Number(f.paid_amount) || 0,
      notes: f.notes || null,
      status: "active" as never,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Prêt enregistré");
    setF({ asset_id: "", household_id: "none", borrower_label: "", quantity: "1", loan_date: new Date().toISOString().slice(0, 10), due_date: "", deposit_amount: "0", fee_amount: "0", paid_amount: "0", notes: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouveau prêt de bien</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Bien *</Label>
            <Select value={f.asset_id} onValueChange={(v) => u("asset_id", v)}>
              <SelectTrigger><SelectValue placeholder="Choisir un bien" /></SelectTrigger>
              <SelectContent>{assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} (dispo {a.total_quantity})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Foyer (optionnel)</Label>
            <Select value={f.household_id} onValueChange={(v) => u("household_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucun (visiteur) —</SelectItem>
                {households.map((h) => <SelectItem key={h.id} value={h.id}>{h.household_number} · {h.head_full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Nom emprunteur</Label><Input value={f.borrower_label} onChange={(e) => u("borrower_label", e.target.value)} placeholder="Laisser vide si foyer choisi" /></div>
          <div><Label>Quantité</Label><Input type="number" min={1} value={f.quantity} onChange={(e) => u("quantity", e.target.value)} /></div>
          <div><Label>Date prêt</Label><Input type="date" value={f.loan_date} onChange={(e) => u("loan_date", e.target.value)} /></div>
          <div><Label>Retour prévu</Label><Input type="date" value={f.due_date} onChange={(e) => u("due_date", e.target.value)} /></div>
          <div><Label>Caution (MGA)</Label><Input type="number" min={0} value={f.deposit_amount} onChange={(e) => u("deposit_amount", e.target.value)} /></div>
          <div><Label>Frais location (MGA)</Label><Input type="number" min={0} value={f.fee_amount} onChange={(e) => u("fee_amount", e.target.value)} /></div>
          <div><Label>Déjà payé (MGA)</Label><Input type="number" min={0} value={f.paid_amount} onChange={(e) => u("paid_amount", e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={f.notes} onChange={(e) => u("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
