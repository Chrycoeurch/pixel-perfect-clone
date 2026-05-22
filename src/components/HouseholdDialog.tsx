import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function HouseholdDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    household_number: "",
    head_full_name: "",
    address: "",
    fokontany: "",
    socio_level: "",
    lat: "",
    lng: "",
    notes: "",
  });

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.household_number.trim() || !form.head_full_name.trim()) {
      toast.error("Numéro de foyer et chef de famille requis");
      return;
    }
    const lat = form.lat.trim() ? Number(form.lat) : null;
    const lng = form.lng.trim() ? Number(form.lng) : null;
    if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) {
      toast.error("Coordonnées invalides");
      return;
    }
    setLoading(true);
    const { lat: _l, lng: _g, ...rest } = form;
    const { error } = await supabase.from("households").insert({ ...rest, lat, lng });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Foyer créé");
    setForm({ household_number: "", head_full_name: "", address: "", fokontany: "", socio_level: "", lat: "", lng: "", notes: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Nouveau foyer</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div><Label>N° foyer *</Label><Input value={form.household_number} onChange={(e) => upd("household_number", e.target.value)} placeholder="F-2026-001" /></div>
          <div><Label>Chef de famille *</Label><Input value={form.head_full_name} onChange={(e) => upd("head_full_name", e.target.value)} /></div>
          <div className="col-span-2"><Label>Adresse</Label><Input value={form.address} onChange={(e) => upd("address", e.target.value)} /></div>
          <div><Label>Fokontany</Label><Input value={form.fokontany} onChange={(e) => upd("fokontany", e.target.value)} /></div>
          <div><Label>Niveau socio-éco.</Label><Input value={form.socio_level} onChange={(e) => upd("socio_level", e.target.value)} placeholder="aisé / moyen / vulnérable" /></div>
          <div><Label>Latitude</Label><Input value={form.lat} onChange={(e) => upd("lat", e.target.value)} placeholder="-18.8792" /></div>
          <div><Label>Longitude</Label><Input value={form.lng} onChange={(e) => upd("lng", e.target.value)} placeholder="47.5079" /></div>
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
