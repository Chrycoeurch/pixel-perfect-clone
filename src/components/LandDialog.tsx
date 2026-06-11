import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  landId: string | null;
  onSaved: () => void;
}

const empty = () => ({
  code: "", name: "",
  district: "", commune: "", fokontany: "",
  carreau_name: "", carreau_number: "",
  address: "", lat: "", lng: "",
  total_area_m2: "", legal_status: "", owner_label: "", notes: "",
});

const LEGAL_OPTIONS = ["Titré", "Bornage", "Cadastré", "Héritage", "Occupation", "Autre"];

export function LandDialog({ open, onOpenChange, landId, onSaved }: Props) {
  const isNew = !landId;
  const [f, setF] = useState(empty());
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isNew) { setF(empty()); return; }
    (async () => {
      const { data } = await supabase.from("lands" as never).select("*").eq("id", landId!).single();
      const d = data as Record<string, unknown> | null;
      if (d) setF({
        code: (d.code as string) ?? "",
        name: (d.name as string) ?? "",
        district: (d.district as string) ?? "",
        commune: (d.commune as string) ?? "",
        fokontany: (d.fokontany as string) ?? "",
        carreau_name: (d.carreau_name as string) ?? "",
        carreau_number: (d.carreau_number as string) ?? "",
        address: (d.address as string) ?? "",
        lat: d.lat != null ? String(d.lat) : "",
        lng: d.lng != null ? String(d.lng) : "",
        total_area_m2: d.total_area_m2 != null ? String(d.total_area_m2) : "",
        legal_status: (d.legal_status as string) ?? "",
        owner_label: (d.owner_label as string) ?? "",
        notes: (d.notes as string) ?? "",
      });
    })();
  }, [open, landId, isNew]);

  const upd = (k: keyof ReturnType<typeof empty>, v: string) => setF((p) => ({ ...p, [k]: v }));

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Géolocalisation indisponible");
    setGps(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { upd("lat", p.coords.latitude.toFixed(6)); upd("lng", p.coords.longitude.toFixed(6)); setGps(false); toast.success("Position acquise"); },
      (e) => { setGps(false); toast.error(e.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async () => {
    if (!f.name.trim()) return toast.error("Nom du terrain requis");
    const lat = f.lat ? Number(f.lat) : null;
    const lng = f.lng ? Number(f.lng) : null;
    if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) return toast.error("Coordonnées invalides");
    const payload = {
      code: f.code || null,
      name: f.name,
      district: f.district || null,
      commune: f.commune || null,
      fokontany: f.fokontany || null,
      carreau_name: f.carreau_name || null,
      carreau_number: f.carreau_number || null,
      address: f.address || null,
      lat, lng,
      total_area_m2: f.total_area_m2 ? Number(f.total_area_m2) : null,
      legal_status: f.legal_status || null,
      owner_label: f.owner_label || null,
      notes: f.notes || null,
    };
    setLoading(true);
    const { error } = isNew
      ? await supabase.from("lands" as never).insert(payload as never)
      : await supabase.from("lands" as never).update(payload as never).eq("id", landId!);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Terrain créé" : "Terrain mis à jour");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isNew ? "Nouveau terrain" : "Modifier le terrain"}</DialogTitle></DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Code / Référence</Label><Input value={f.code} onChange={(e) => upd("code", e.target.value)} placeholder="TR-001" /></div>
            <div><Label className="text-xs">Nom du terrain *</Label><Input value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="Ex : Terrain Ankirihiry Nord" /></div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Localisation administrative</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label className="text-xs">District</Label><Input value={f.district} onChange={(e) => upd("district", e.target.value)} /></div>
              <div><Label className="text-xs">Commune</Label><Input value={f.commune} onChange={(e) => upd("commune", e.target.value)} /></div>
              <div className="col-span-2"><Label className="text-xs">Fokontany</Label><Input value={f.fokontany} onChange={(e) => upd("fokontany", e.target.value)} /></div>
              <div><Label className="text-xs">Nom du carreau</Label><Input value={f.carreau_name} onChange={(e) => upd("carreau_name", e.target.value)} /></div>
              <div><Label className="text-xs">N° carreau</Label><Input value={f.carreau_number} onChange={(e) => upd("carreau_number", e.target.value)} /></div>
              <div className="col-span-2"><Label className="text-xs">Adresse / Repère</Label><Input value={f.address} onChange={(e) => upd("address", e.target.value)} placeholder="À côté de…" /></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Coordonnées GPS</Label>
              <Button type="button" size="sm" variant="outline" onClick={locate} disabled={gps}>
                {gps ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MapPin className="w-3 h-3 mr-1" />}
                Localiser
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Latitude</Label><Input value={f.lat} onChange={(e) => upd("lat", e.target.value)} placeholder="-18.1499" /></div>
              <div><Label className="text-xs">Longitude</Label><Input value={f.lng} onChange={(e) => upd("lng", e.target.value)} placeholder="49.4023" /></div>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Terrain</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label className="text-xs">Superficie totale (m²)</Label><Input type="number" value={f.total_area_m2} onChange={(e) => upd("total_area_m2", e.target.value)} /></div>
              <div><Label className="text-xs">Propriétaire / Détenteur</Label><Input value={f.owner_label} onChange={(e) => upd("owner_label", e.target.value)} /></div>
              <div className="col-span-2">
                <Label className="text-xs">Statut juridique</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {LEGAL_OPTIONS.map((o) => (
                    <button key={o} type="button" onClick={() => upd("legal_status", o === f.legal_status ? "" : o)}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${f.legal_status === o ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background hover:bg-muted/50"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={f.notes} onChange={(e) => upd("notes", e.target.value)} rows={3} maxLength={500} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={save} disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
