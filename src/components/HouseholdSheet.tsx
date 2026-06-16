import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, QrCode, Save, X, Check, Printer, MapPin, Home, Landmark, Phone, FileText, Camera, Upload, Loader2 } from "lucide-react";
import QRCode from "qrcode";

interface HouseholdSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  householdId: string | null;
  onSaved: () => void;
  onCreated?: (id: string) => void;
}

const RELATIONSHIPS = [
  { v: "chef", l: "Chef de famille" },
  { v: "epoux", l: "Époux / Épouse" },
  { v: "fils", l: "Fils" },
  { v: "fille", l: "Fille" },
  { v: "pere", l: "Père" },
  { v: "mere", l: "Mère" },
  { v: "frere", l: "Frère" },
  { v: "soeur", l: "Sœur" },
  { v: "autre", l: "Autre" },
];

const HOUSING_TYPES = ["Maison", "Maison traditionnelle", "Abri", "Appartement", "Studio", "Baraquement", "Autre"];
const OCCUPANCY = ["Propriétaire", "Locataire", "Hébergé", "Squatteur"];

interface Citizen {
  id: string; last_name: string; first_names: string; sex: "M" | "F";
  birth_date: string | null; cin: string | null; phone: string | null;
  profession: string | null; relationship: string | null; is_head: boolean; household_id: string | null;
  father_name: string | null; mother_name: string | null;
}
interface MemberDraft {
  last_name: string; first_names: string; sex: "M" | "F"; birth_date: string;
  cin: string; phone: string; profession: string; relationship: string;
  father_name: string; mother_name: string;
}
const emptyMember = (): MemberDraft => ({
  last_name: "", first_names: "", sex: "M", birth_date: "", cin: "", phone: "", profession: "", relationship: "fils",
  father_name: "", mother_name: "",
});

// Calcule les parents proposés en fonction de la relation au chef de foyer
function inferParents(
  relationship: string,
  head: { full_name: string; sex: "M" | "F"; father_name: string | null; mother_name: string | null } | null,
  spouseFullName: string | null,
): { father_name: string; mother_name: string } {
  if (!head) return { father_name: "", mother_name: "" };
  if (relationship === "fils" || relationship === "fille") {
    // Le chef est l'un des parents (selon son sexe), l'époux/épouse l'autre
    if (head.sex === "M") return { father_name: head.full_name, mother_name: spouseFullName ?? "" };
    return { father_name: spouseFullName ?? "", mother_name: head.full_name };
  }
  if (relationship === "frere" || relationship === "soeur") {
    // Mêmes parents que le chef
    return { father_name: head.father_name ?? "", mother_name: head.mother_name ?? "" };
  }
  return { father_name: "", mother_name: "" };
}

interface Land {
  id: string; code: string | null; name: string;
  district: string | null; commune: string | null; fokontany: string | null;
  carreau_name: string | null; carreau_number: string | null;
  lat: number | null; lng: number | null;
  total_area_m2: number | null; legal_status: string | null; owner_label: string | null;
}

const emptyHousehold = () => ({
  household_number: "", head_full_name: "",
  land_id: "",
  address: "",
  housing_type: "", house_area_m2: "", occupancy_status: "",
  head_phone: "", head_facebook: "",
  agent_notes: "",
  housing_photos: [] as string[], document_photos: [] as string[],
});

const genHouseholdNumber = () => `FY-${Math.floor(100000 + Math.random() * 900000)}`;

function SectionCard({ icon: Icon, title, color, children }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
        <Icon className="w-4 h-4" style={{ color }} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o === value ? "" : o)}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors text-left ${value === o ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background hover:bg-muted/50"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function PhotoGrid({ paths, onAdd, onRemove, uploading, icon: Icon }: { paths: string[]; onAdd: (files: FileList) => void; onRemove: (p: string) => void; uploading: boolean; icon: React.ComponentType<{ className?: string }> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const missing = paths.filter((p) => !urls[p]);
      if (missing.length === 0) return;
      const { data } = await supabase.storage.from("household-photos").createSignedUrls(missing, 3600);
      if (!alive || !data) return;
      const next: Record<string, string> = { ...urls };
      data.forEach((d, i) => { if (d.signedUrl) next[missing[i]] = d.signedUrl; });
      setUrls(next);
    })();
    return () => { alive = false; };
  }, [paths]);
  return (
    <div className="grid grid-cols-3 gap-2">
      {paths.map((p) => (
        <div key={p} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted/30 group">
          {urls[p] ? <img src={urls[p]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>}
          <button type="button" onClick={() => onRemove(p)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors disabled:opacity-50">
        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
        <span className="text-[10px]">Ajouter</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.length) onAdd(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

export function HouseholdSheet({ open, onOpenChange, householdId, onSaved, onCreated }: HouseholdSheetProps) {
  const isNew = !householdId;
  const [loading, setLoading] = useState(false);
  const [household, setHousehold] = useState(emptyHousehold());
  const [members, setMembers] = useState<Citizen[]>([]);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMember());
  const [adding, setAdding] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  
  const [uploadingHouse, setUploadingHouse] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [lands, setLands] = useState<Land[]>([]);
  const selectedLand = useMemo(() => lands.find((l) => l.id === household.land_id) ?? null, [lands, household.land_id]);

  useEffect(() => {
    if (!open) return;
    supabase.from("lands" as never).select("*").order("name").then(({ data }) => {
      setLands((data as Land[]) ?? []);
    });
  }, [open]);

  const verifyUrl = useMemo(() => {
    if (!householdId) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/foyer/${householdId}`;
  }, [householdId]);

  useEffect(() => {
    if (!open) return;
    if (isNew) {
      setHousehold({ ...emptyHousehold(), household_number: genHouseholdNumber() });
      setMembers([]); setQrUrl(""); setAdding(false); setEditingMember(null); return;
    }
    (async () => {
      const [{ data: h }, { data: c }] = await Promise.all([
        supabase.from("households").select("*").eq("id", householdId).single(),
        supabase.from("citizens").select("*").eq("household_id", householdId).order("is_head", { ascending: false }).order("last_name"),
      ]);
      if (h) {
        setHousehold({
          household_number: h.household_number ?? "",
          head_full_name: h.head_full_name ?? "",
          land_id: (h as Record<string, unknown>).land_id as string ?? "",
          address: h.address ?? "",
          housing_type: (h as Record<string, unknown>).housing_type as string ?? "",
          house_area_m2: ((h as Record<string, unknown>).house_area_m2 as number | null)?.toString() ?? "",
          occupancy_status: (h as Record<string, unknown>).occupancy_status as string ?? "",
          head_phone: (h as Record<string, unknown>).head_phone as string ?? "",
          head_facebook: (h as Record<string, unknown>).head_facebook as string ?? "",
          agent_notes: (h as Record<string, unknown>).agent_notes as string ?? h.notes ?? "",
          housing_photos: ((h as Record<string, unknown>).housing_photos as string[]) ?? [],
          document_photos: ((h as Record<string, unknown>).document_photos as string[]) ?? [],
        });
      }
      setMembers((c as Citizen[]) ?? []);
    })();
  }, [open, householdId, isNew]);

  useEffect(() => {
    if (!verifyUrl) { setQrUrl(""); return; }
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 }).then(setQrUrl).catch(() => setQrUrl(""));
  }, [verifyUrl]);

  const upd = <K extends keyof ReturnType<typeof emptyHousehold>>(k: K, v: ReturnType<typeof emptyHousehold>[K]) => setHousehold((f) => ({ ...f, [k]: v }));
  const updM = (k: keyof MemberDraft, v: string) => setMemberDraft((f) => ({ ...f, [k]: v }));

  const completion = useMemo(() => {
    const fields = [
      household.household_number, household.head_full_name,
      household.land_id, household.address,
      household.housing_type, household.occupancy_status, household.head_phone,
    ];
    const done = fields.filter((f) => f && f.toString().trim()).length;
    return Math.round((done / fields.length) * 100);
  }, [household]);

  const saveHousehold = async () => {
    if (!household.household_number.trim() || !household.head_full_name.trim()) {
      toast.error("N° de foyer et chef de famille requis"); return;
    }
    const payload: Record<string, unknown> = {
      household_number: household.household_number,
      head_full_name: household.head_full_name,
      land_id: household.land_id || null,
      // Champs hérités du terrain (dénormalisés pour la lisibilité dans la liste)
      district: selectedLand?.district ?? null,
      commune: selectedLand?.commune ?? null,
      fokontany: selectedLand?.fokontany ?? null,
      carreau_name: selectedLand?.carreau_name ?? null,
      carreau_number: selectedLand?.carreau_number ?? null,
      lat: selectedLand?.lat ?? null,
      lng: selectedLand?.lng ?? null,
      land_area_m2: selectedLand?.total_area_m2 ?? null,
      land_legal_status: selectedLand?.legal_status ?? null,
      // Champs propres au foyer
      address: household.address || null,
      housing_type: household.housing_type || null,
      house_area_m2: household.house_area_m2 ? Number(household.house_area_m2) : null,
      occupancy_status: household.occupancy_status || null,
      head_phone: household.head_phone || null,
      head_facebook: household.head_facebook || null,
      agent_notes: household.agent_notes || null,
      housing_photos: household.housing_photos,
      document_photos: household.document_photos,
    };
    setLoading(true);
    if (isNew) {
      const { data, error } = await supabase.from("households").insert(payload as never).select("id").single();
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Foyer créé — ajoutez les membres et photos");
      onSaved(); onCreated?.(data!.id);
    } else {
      const { error } = await supabase.from("households").update(payload as never).eq("id", householdId!);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Foyer mis à jour");
      onSaved();
    }
  };

  const uploadPhotos = async (files: FileList, field: "housing_photos" | "document_photos") => {
    if (!householdId) { toast.error("Enregistrez d'abord le foyer"); return; }
    const setUploading = field === "housing_photos" ? setUploadingHouse : setUploadingDoc;
    setUploading(true);
    const newPaths: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${householdId}/${field}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("household-photos").upload(path, file, { contentType: file.type });
      if (error) { toast.error(error.message); continue; }
      newPaths.push(path);
    }
    if (newPaths.length === 0) { setUploading(false); return; }
    const updated = [...household[field], ...newPaths];
    const { error } = await supabase.from("households").update({ [field]: updated } as never).eq("id", householdId);
    setUploading(false);
    if (error) return toast.error(error.message);
    upd(field, updated);
    toast.success(`${newPaths.length} photo(s) ajoutée(s)`);
  };

  const removePhoto = async (path: string, field: "housing_photos" | "document_photos") => {
    if (!householdId) return;
    const updated = household[field].filter((p) => p !== path);
    const { error } = await supabase.from("households").update({ [field]: updated } as never).eq("id", householdId);
    if (error) return toast.error(error.message);
    await supabase.storage.from("household-photos").remove([path]);
    upd(field, updated);
  };

  const reloadMembers = async () => {
    const { data } = await supabase.from("citizens").select("*").eq("household_id", householdId!).order("is_head", { ascending: false }).order("last_name");
    setMembers((data as Citizen[]) ?? []); onSaved();
  };

  // Chef du foyer + époux/épouse (utilisés pour pré-remplir la filiation)
  const headMember = useMemo(() => members.find((m) => m.is_head || m.relationship === "chef") ?? null, [members]);
  const spouseMember = useMemo(() => members.find((m) => m.relationship === "epoux") ?? null, [members]);
  const headInfo = useMemo(() => {
    if (headMember) return {
      full_name: `${headMember.last_name} ${headMember.first_names}`.trim(),
      sex: headMember.sex,
      father_name: headMember.father_name,
      mother_name: headMember.mother_name,
    };
    if (household.head_full_name.trim()) return {
      full_name: household.head_full_name.trim(),
      sex: "M" as const, // par défaut, l'utilisateur peut corriger
      father_name: null, mother_name: null,
    };
    return null;
  }, [headMember, household.head_full_name]);
  const spouseFullName = spouseMember ? `${spouseMember.last_name} ${spouseMember.first_names}`.trim() : null;

  // Auto-remplissage des parents lors du changement de relation (uniquement si les champs sont vides)
  const handleRelationshipChange = (v: string) => {
    setMemberDraft((d) => {
      const inferred = inferParents(v, headInfo, spouseFullName);
      return {
        ...d,
        relationship: v,
        father_name: d.father_name.trim() ? d.father_name : inferred.father_name,
        mother_name: d.mother_name.trim() ? d.mother_name : inferred.mother_name,
      };
    });
  };

  const addMember = async () => {
    if (!householdId) { toast.error("Enregistrez d'abord le foyer"); return; }
    if (!memberDraft.last_name.trim() || !memberDraft.first_names.trim()) { toast.error("Nom et prénoms requis"); return; }
    const isHead = memberDraft.relationship === "chef";
    const payload: Record<string, unknown> = {
      household_id: householdId, last_name: memberDraft.last_name, first_names: memberDraft.first_names,
      sex: memberDraft.sex, relationship: memberDraft.relationship, is_head: isHead,
      father_name: memberDraft.father_name || null,
      mother_name: memberDraft.mother_name || null,
    };
    if (memberDraft.birth_date) payload.birth_date = memberDraft.birth_date;
    if (memberDraft.cin) payload.cin = memberDraft.cin;
    if (memberDraft.phone) payload.phone = memberDraft.phone;
    if (memberDraft.profession) payload.profession = memberDraft.profession;
    const { error } = await supabase.from("citizens").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Membre ajouté"); setMemberDraft(emptyMember()); setAdding(false); await reloadMembers();
  };

  const startEdit = (m: Citizen) => {
    setEditingMember(m.id);
    setMemberDraft({
      last_name: m.last_name, first_names: m.first_names, sex: m.sex,
      birth_date: m.birth_date ?? "", cin: m.cin ?? "", phone: m.phone ?? "",
      profession: m.profession ?? "", relationship: m.relationship ?? "autre",
      father_name: m.father_name ?? "", mother_name: m.mother_name ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editingMember) return;
    const isHead = memberDraft.relationship === "chef";
    const payload: Record<string, unknown> = {
      last_name: memberDraft.last_name, first_names: memberDraft.first_names,
      sex: memberDraft.sex, relationship: memberDraft.relationship, is_head: isHead,
      birth_date: memberDraft.birth_date || null, cin: memberDraft.cin || null,
      phone: memberDraft.phone || null, profession: memberDraft.profession || null,
      father_name: memberDraft.father_name || null,
      mother_name: memberDraft.mother_name || null,
    };
    const { error } = await supabase.from("citizens").update(payload as never).eq("id", editingMember);
    if (error) return toast.error(error.message);
    toast.success("Membre mis à jour"); setEditingMember(null); setMemberDraft(emptyMember()); await reloadMembers();
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Supprimer ce membre ?")) return;
    const { error } = await supabase.from("citizens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Membre supprimé"); await reloadMembers();
  };

  const printQR = () => {
    if (!qrUrl) return;
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>QR Foyer ${household.household_number}</title>
<style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;display:flex;justify-content:center;align-items:center;min-height:100vh}
.sheet{display:flex;gap:48px;justify-content:center;align-items:center}
.card{border:2px dashed #999;border-radius:12px;padding:20px;text-align:center;width:280px}
.card h2{margin:0 0 4px;font-size:14px;color:#666;letter-spacing:1px;text-transform:uppercase}
.card h1{margin:0 0 12px;font-size:20px}.card img{width:220px;height:220px}.card p{margin:8px 0 0;font-size:12px;color:#555;word-break:break-all}
@media print { @page { size: A5 landscape; margin: 10mm; } }</style></head><body><div class="sheet">
<div class="card"><h2>Fokontany</h2><h1>Foyer ${household.household_number}</h1><img src="${qrUrl}"/><p>${household.head_full_name}</p></div>
<div class="card"><h2>Fokontany</h2><h1>Foyer ${household.household_number}</h1><img src="${qrUrl}"/><p>${household.head_full_name}</p></div>
</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
    w.document.close();
  };

  const cancelMemberForm = () => { setAdding(false); setEditingMember(null); setMemberDraft(emptyMember()); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground px-6 py-4">
          <SheetHeader>
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-primary-foreground">{isNew ? "Identification du foyer" : `Foyer ${household.household_number}`}</SheetTitle>
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">{completion}% complet</Badge>
            </div>
          </SheetHeader>
          <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Identifiant */}
          <SectionCard icon={QrCode} title="Identifiant du foyer" color="hsl(217 91% 60%)">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">N° foyer *</Label><Input value={household.household_number} onChange={(e) => upd("household_number", e.target.value)} className="font-mono" /></div>
              <div><Label className="text-xs">Chef de famille *</Label><Input value={household.head_full_name} onChange={(e) => upd("head_full_name", e.target.value)} /></div>
            </div>
          </SectionCard>

          {/* Terrain de rattachement */}
          <SectionCard icon={Landmark} title="Terrain de rattachement" color="hsl(280 70% 60%)">
            <Label className="text-xs">Sélectionner un terrain *</Label>
            <Select value={household.land_id || "_none"} onValueChange={(v) => upd("land_id", v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="— Choisir un terrain —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Aucun terrain —</SelectItem>
                {lands.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.code ? `${l.code} · ` : ""}{l.name}{l.fokontany ? ` (${l.fokontany})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Toutes les informations géographiques et foncières (district, commune, fokontany, carreau, GPS, superficie, statut légal) proviennent du terrain et sont partagées entre les foyers qui y sont rattachés.
            </p>

            {selectedLand ? (
              <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{selectedLand.name}</div>
                  {selectedLand.code && <Badge variant="secondary" className="font-mono text-xs">{selectedLand.code}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div><span className="text-foreground/70">District :</span> {selectedLand.district ?? "—"}</div>
                  <div><span className="text-foreground/70">Commune :</span> {selectedLand.commune ?? "—"}</div>
                  <div className="col-span-2"><span className="text-foreground/70">Fokontany :</span> {selectedLand.fokontany ?? "—"}</div>
                  <div><span className="text-foreground/70">Carreau :</span> {selectedLand.carreau_name ?? "—"}</div>
                  <div><span className="text-foreground/70">N° carreau :</span> {selectedLand.carreau_number ?? "—"}</div>
                  <div><span className="text-foreground/70">Superficie :</span> {selectedLand.total_area_m2 != null ? `${selectedLand.total_area_m2} m²` : "—"}</div>
                  <div><span className="text-foreground/70">Statut :</span> {selectedLand.legal_status ?? "—"}</div>
                  <div className="col-span-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedLand.lat != null && selectedLand.lng != null ? `${selectedLand.lat.toFixed(6)}, ${selectedLand.lng.toFixed(6)}` : "GPS non renseigné"}</div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground italic">Sélectionnez un terrain pour afficher ses informations. Les terrains se gèrent dans l'onglet « Terrains ».</p>
            )}
          </SectionCard>

          {/* Adresse spécifique du foyer */}
          <SectionCard icon={MapPin} title="Adresse du foyer" color="hsl(142 71% 45%)">
            <Label className="text-xs">Adresse / point de repère *</Label>
            <Textarea rows={2} value={household.address} onChange={(e) => upd("address", e.target.value)} placeholder="Numéro de porte, étage, point de repère…" />
          </SectionCard>

          {/* Logement */}
          <SectionCard icon={Home} title="Caractéristiques du logement" color="hsl(38 92% 50%)">
            <div className="space-y-3">
              <div><Label className="text-xs">Type de logement *</Label><div className="mt-2"><ChipGroup options={HOUSING_TYPES} value={household.housing_type} onChange={(v) => upd("housing_type", v)} /></div></div>
              <div><Label className="text-xs">Superficie de la maison (m²)</Label><Input type="number" inputMode="decimal" value={household.house_area_m2} onChange={(e) => upd("house_area_m2", e.target.value)} placeholder="Superficie de la maison" /></div>
              <div><Label className="text-xs">Statut d'occupation *</Label><div className="mt-2"><ChipGroup options={OCCUPANCY} value={household.occupancy_status} onChange={(v) => upd("occupancy_status", v)} /></div></div>
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard icon={Phone} title="Contact du chef de ménage" color="hsl(199 89% 48%)">
            <div className="space-y-3">
              <div><Label className="text-xs">Numéro de téléphone</Label><Input type="tel" value={household.head_phone} onChange={(e) => upd("head_phone", e.target.value)} placeholder="034 XX XXX XX" /></div>
              <div>
                <Label className="text-xs">Compte Facebook</Label>
                <Input value={household.head_facebook} onChange={(e) => upd("head_facebook", e.target.value)} placeholder="Nom ou lien du profil Facebook" />
                <p className="text-[10px] text-muted-foreground mt-1">Optionnel — pour les communications numériques</p>
              </div>
            </div>
          </SectionCard>

          {/* Remarques */}
          <SectionCard icon={FileText} title="Remarques de l'agent" color="hsl(330 70% 55%)">
            <Textarea rows={4} value={household.agent_notes} onChange={(e) => upd("agent_notes", e.target.value.slice(0, 500))} placeholder="Observations particulières, difficultés rencontrées, informations complémentaires…" />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{household.agent_notes.length}/500 caractères</p>
          </SectionCard>

          {/* Photos */}
          <SectionCard icon={Camera} title="Photos du logement" color="hsl(15 90% 55%)">
            {isNew ? (
              <p className="text-xs text-muted-foreground text-center py-4">Enregistrez le foyer pour ajouter des photos.</p>
            ) : (
              <PhotoGrid paths={household.housing_photos} onAdd={(f) => uploadPhotos(f, "housing_photos")} onRemove={(p) => removePhoto(p, "housing_photos")} uploading={uploadingHouse} icon={Camera} />
            )}
          </SectionCard>

          <SectionCard icon={Upload} title="Photos des documents (optionnel)" color="hsl(260 70% 60%)">
            {isNew ? (
              <p className="text-xs text-muted-foreground text-center py-4">Titre foncier, permis, jorolava, etc.</p>
            ) : (
              <>
                <PhotoGrid paths={household.document_photos} onAdd={(f) => uploadPhotos(f, "document_photos")} onRemove={(p) => removePhoto(p, "document_photos")} uploading={uploadingDoc} icon={Upload} />
                <p className="text-[10px] text-muted-foreground mt-2">Titre foncier, permis, jorolava, etc.</p>
              </>
            )}
          </SectionCard>

          <Button onClick={saveHousehold} disabled={loading} className="w-full h-12 text-base" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? "Enregistrer et passer au module suivant" : "Mettre à jour le foyer"}
          </Button>

          {/* Membres */}
          {!isNew && (
            <>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg">Membres du foyer</h3>
                  <p className="text-xs text-muted-foreground">{members.length} personne(s) enregistrée(s)</p>
                </div>
                {!adding && !editingMember && (
                  <Button size="sm" onClick={() => { setAdding(true); setMemberDraft(emptyMember()); }}>
                    <Plus className="w-4 h-4 mr-1" />Ajouter
                  </Button>
                )}
              </div>

              {(adding || editingMember) && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Lien</Label>
                      <Select value={memberDraft.relationship} onValueChange={handleRelationshipChange}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Sexe</Label>
                      <Select value={memberDraft.sex} onValueChange={(v) => updM("sex", v as "M" | "F")}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Nom *</Label><Input className="h-9" value={memberDraft.last_name} onChange={(e) => updM("last_name", e.target.value)} /></div>
                    <div><Label className="text-xs">Prénoms *</Label><Input className="h-9" value={memberDraft.first_names} onChange={(e) => updM("first_names", e.target.value)} /></div>
                    <div><Label className="text-xs">Naissance</Label><Input type="date" className="h-9" value={memberDraft.birth_date} onChange={(e) => updM("birth_date", e.target.value)} /></div>
                    <div><Label className="text-xs">CIN</Label><Input className="h-9" value={memberDraft.cin} onChange={(e) => updM("cin", e.target.value)} /></div>
                    <div><Label className="text-xs">Profession</Label><Input className="h-9" value={memberDraft.profession} onChange={(e) => updM("profession", e.target.value)} /></div>
                    <div><Label className="text-xs">Téléphone</Label><Input className="h-9" value={memberDraft.phone} onChange={(e) => updM("phone", e.target.value)} /></div>
                    <div className="col-span-2 border-t border-border pt-2 mt-1">
                      <p className="text-[11px] text-muted-foreground mb-2">Filiation — pré-remplie selon le lien avec le chef de foyer (modifiable).</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Nom du père</Label><Input className="h-9" value={memberDraft.father_name} onChange={(e) => updM("father_name", e.target.value)} placeholder="Nom complet du père" /></div>
                        <div><Label className="text-xs">Nom de la mère</Label><Input className="h-9" value={memberDraft.mother_name} onChange={(e) => updM("mother_name", e.target.value)} placeholder="Nom complet de la mère" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={cancelMemberForm}><X className="w-4 h-4 mr-1" />Annuler</Button>
                    <Button size="sm" onClick={editingMember ? saveEdit : addMember}><Check className="w-4 h-4 mr-1" />{editingMember ? "Enregistrer" : "Ajouter"}</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.last_name} {m.first_names}</span>
                        {m.is_head && <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Chef</Badge>}
                        <Badge variant="secondary" className="text-xs">{RELATIONSHIPS.find((r) => r.v === m.relationship)?.l ?? "—"}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {m.sex === "M" ? "Masculin" : "Féminin"}{m.birth_date && ` · né(e) ${new Date(m.birth_date).toLocaleDateString("fr-FR")}`}{m.cin && ` · CIN ${m.cin}`}{m.profession && ` · ${m.profession}`}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(m)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMember(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && !adding && (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucun membre. Ajoutez le chef de famille et ses proches.</p>
                )}
              </div>

              <Separator className="my-4" />
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold">Code QR du foyer</h3>
                  </div>
                  <Button size="sm" variant="outline" onClick={printQR} disabled={!qrUrl}><Printer className="w-4 h-4 mr-1" />Imprimer</Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Deux QR identiques côte à côte : un à coller en début et un en fin de carnet fokontany.</p>
                {qrUrl && (
                  <div className="flex gap-4 justify-center bg-muted/30 rounded-lg p-4">
                    <img src={qrUrl} alt="QR foyer" className="w-32 h-32" />
                    <img src={qrUrl} alt="QR foyer" className="w-32 h-32" />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono break-all">{verifyUrl}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
