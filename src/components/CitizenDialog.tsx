import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Household { id: string; household_number: string; head_full_name: string }

const empty = () => ({
  last_name: "", first_names: "", sex: "M" as "M" | "F",
  birth_date: "", birth_place: "", cin: "", profession: "",
  education: "", marital_status: "single", phone: "",
  father_name: "", mother_name: "", household_id: "",
});

export function CitizenDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [form, setForm] = useState(empty());

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      setForm(empty());
      supabase.from("households").select("id,household_number,head_full_name").order("household_number").then(({ data }) => setHouseholds(data ?? []));
    }
  }, [open]);

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.last_name.trim() || !form.first_names.trim()) {
      toast.error("Nom et prénoms requis"); return;
    }
    setLoading(true);
    const payload: Record<string, unknown> = { ...form };
    if (!payload.birth_date) delete payload.birth_date;
    if (!payload.household_id) delete payload.household_id;
    if (!payload.cin) delete payload.cin;
    if (!payload.father_name) delete payload.father_name;
    if (!payload.mother_name) delete payload.mother_name;
    const { error } = await supabase.from("citizens").insert(payload as never);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Citoyen enregistré");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Nouveau citoyen</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2 max-h-[65vh] overflow-y-auto pr-2">
          <div><Label>Nom *</Label><Input value={form.last_name} onChange={(e) => upd("last_name", e.target.value)} /></div>
          <div><Label>Prénoms *</Label><Input value={form.first_names} onChange={(e) => upd("first_names", e.target.value)} /></div>
          <div>
            <Label>Sexe</Label>
            <Select value={form.sex} onValueChange={(v) => upd("sex", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Date de naissance</Label><Input type="date" value={form.birth_date} onChange={(e) => upd("birth_date", e.target.value)} /></div>
          <div><Label>Lieu de naissance</Label><Input value={form.birth_place} onChange={(e) => upd("birth_place", e.target.value)} /></div>
          <div><Label>CIN</Label><Input value={form.cin} onChange={(e) => upd("cin", e.target.value)} /></div>
          <div><Label>Profession</Label><Input value={form.profession} onChange={(e) => upd("profession", e.target.value)} /></div>
          <div><Label>Scolarité</Label><Input value={form.education} onChange={(e) => upd("education", e.target.value)} /></div>
          <div>
            <Label>État civil</Label>
            <Select value={form.marital_status} onValueChange={(v) => upd("marital_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Célibataire</SelectItem>
                <SelectItem value="married">Marié(e)</SelectItem>
                <SelectItem value="divorced">Divorcé(e)</SelectItem>
                <SelectItem value="widowed">Veuf/Veuve</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} /></div>

          {/* Filiation */}
          <div className="col-span-2 border-t border-border pt-3 mt-1">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Filiation</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nom du père</Label><Input value={form.father_name} onChange={(e) => upd("father_name", e.target.value)} placeholder="Nom complet du père" /></div>
              <div><Label>Nom de la mère</Label><Input value={form.mother_name} onChange={(e) => upd("mother_name", e.target.value)} placeholder="Nom complet de la mère" /></div>
            </div>
          </div>

          <div className="col-span-2">
            <Label>Foyer rattaché</Label>
            <Select value={form.household_id || "_none"} onValueChange={(v) => upd("household_id", v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Aucun foyer —</SelectItem>
                {households.map((h) => <SelectItem key={h.id} value={h.id}>{h.household_number} — {h.head_full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
