import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Household { id: string; household_number: string; head_full_name: string }
interface Campaign { id: string; title: string; target_amount_per_household: number; currency: string }

export function ContributionDialog({ open, onOpenChange, onSaved, campaigns, defaultCampaignId }:
  { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void; campaigns: Campaign[]; defaultCampaignId?: string }) {
  const [loading, setLoading] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [form, setForm] = useState({
    campaign_id: defaultCampaignId ?? "",
    household_id: "",
    amount: "",
    method: "espèces",
    receipt_number: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm((f) => ({ ...f, campaign_id: defaultCampaignId ?? f.campaign_id }));
    supabase.from("households").select("id,household_number,head_full_name").order("household_number")
      .then(({ data }) => setHouseholds((data as Household[]) ?? []));
  }, [open, defaultCampaignId]);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.campaign_id || !form.household_id || !form.amount) {
      toast.error("Campagne, foyer et montant requis");
      return;
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) return toast.error("Montant invalide");
    setLoading(true);
    const house = households.find((h) => h.id === form.household_id);
    const { error } = await supabase.from("contributions").insert({
      campaign_id: form.campaign_id,
      household_id: form.household_id,
      household_label: house ? `${house.household_number} — ${house.head_full_name}` : null,
      amount,
      method: form.method || null,
      receipt_number: form.receipt_number || null,
      notes: form.notes || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contribution enregistrée");
    setForm({ campaign_id: defaultCampaignId ?? "", household_id: "", amount: "", method: "espèces", receipt_number: "", notes: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle contribution</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Campagne *</Label>
            <Select value={form.campaign_id} onValueChange={(v) => upd("campaign_id", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>{campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Foyer *</Label>
            <Select value={form.household_id} onValueChange={(v) => upd("household_id", v)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>{households.map((h) => <SelectItem key={h.id} value={h.id}>{h.household_number} — {h.head_full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Montant *</Label><Input type="number" value={form.amount} onChange={(e) => upd("amount", e.target.value)} /></div>
          <div><Label>Mode</Label><Input value={form.method} onChange={(e) => upd("method", e.target.value)} placeholder="espèces / mobile money" /></div>
          <div className="col-span-2"><Label>N° reçu</Label><Input value={form.receipt_number} onChange={(e) => upd("receipt_number", e.target.value)} /></div>
          <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => upd("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_amount_per_household: "", deadline: "" });
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Titre requis");
    setLoading(true);
    const { error } = await supabase.from("contribution_campaigns").insert({
      title: form.title,
      description: form.description || null,
      target_amount_per_household: Number(form.target_amount_per_household) || 0,
      deadline: form.deadline || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Campagne créée");
    setForm({ title: "", description: "", target_amount_per_household: "", deadline: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle campagne de cotisation</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2"><Label>Titre *</Label><Input value={form.title} onChange={(e) => upd("title", e.target.value)} placeholder="Cotisation trimestre 2026 Q2" /></div>
          <div><Label>Montant cible / foyer (MGA)</Label><Input type="number" value={form.target_amount_per_household} onChange={(e) => upd("target_amount_per_household", e.target.value)} /></div>
          <div><Label>Échéance</Label><Input type="date" value={form.deadline} onChange={(e) => upd("deadline", e.target.value)} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => upd("description", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExpenseDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", category: "autre", amount: "", spent_at: new Date().toISOString().slice(0, 10), vendor: "", invoice_ref: "", description: "" });
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.amount) return toast.error("Titre et montant requis");
    setLoading(true);
    const { error } = await supabase.from("expenses").insert({
      title: form.title,
      category: form.category as any,
      amount: Number(form.amount),
      spent_at: form.spent_at,
      vendor: form.vendor || null,
      invoice_ref: form.invoice_ref || null,
      description: form.description || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Dépense enregistrée");
    setForm({ title: "", category: "autre", amount: "", spent_at: new Date().toISOString().slice(0, 10), vendor: "", invoice_ref: "", description: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2"><Label>Intitulé *</Label><Input value={form.title} onChange={(e) => upd("title", e.target.value)} /></div>
          <div>
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => upd("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["infrastructure","sanitaire","education","securite","evenement","administration","autre"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Montant *</Label><Input type="number" value={form.amount} onChange={(e) => upd("amount", e.target.value)} /></div>
          <div><Label>Date</Label><Input type="date" value={form.spent_at} onChange={(e) => upd("spent_at", e.target.value)} /></div>
          <div><Label>Fournisseur</Label><Input value={form.vendor} onChange={(e) => upd("vendor", e.target.value)} /></div>
          <div className="col-span-2"><Label>Référence facture</Label><Input value={form.invoice_ref} onChange={(e) => upd("invoice_ref", e.target.value)} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => upd("description", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MeetingDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", agenda: "", location: "", starts_at: "", ends_at: "" });
  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.starts_at) return toast.error("Titre et date requis");
    setLoading(true);
    const { error } = await supabase.from("meetings").insert({
      title: form.title,
      agenda: form.agenda || null,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Réunion planifiée");
    setForm({ title: "", agenda: "", location: "", starts_at: "", ends_at: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouvelle réunion</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2"><Label>Titre *</Label><Input value={form.title} onChange={(e) => upd("title", e.target.value)} placeholder="Assemblée trimestrielle" /></div>
          <div><Label>Début *</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => upd("starts_at", e.target.value)} /></div>
          <div><Label>Fin</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => upd("ends_at", e.target.value)} /></div>
          <div className="col-span-2"><Label>Lieu</Label><Input value={form.location} onChange={(e) => upd("location", e.target.value)} /></div>
          <div className="col-span-2"><Label>Ordre du jour</Label><Textarea rows={3} value={form.agenda} onChange={(e) => upd("agenda", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>Planifier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
