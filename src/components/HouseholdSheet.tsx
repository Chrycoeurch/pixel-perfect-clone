import { useEffect, useMemo, useState } from "react";
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
import { Plus, Trash2, Pencil, QrCode, Save, X, Check, Printer } from "lucide-react";
import QRCode from "qrcode";

interface HouseholdSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  householdId: string | null; // null = création
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

interface Citizen {
  id: string;
  last_name: string;
  first_names: string;
  sex: "M" | "F";
  birth_date: string | null;
  cin: string | null;
  phone: string | null;
  profession: string | null;
  relationship: string | null;
  is_head: boolean;
  household_id: string | null;
}

interface MemberDraft {
  last_name: string;
  first_names: string;
  sex: "M" | "F";
  birth_date: string;
  cin: string;
  phone: string;
  profession: string;
  relationship: string;
}

const emptyMember = (): MemberDraft => ({
  last_name: "", first_names: "", sex: "M", birth_date: "", cin: "", phone: "", profession: "", relationship: "fils",
});

export function HouseholdSheet({ open, onOpenChange, householdId, onSaved, onCreated }: HouseholdSheetProps) {
  const isNew = !householdId;
  const [loading, setLoading] = useState(false);
  const [household, setHousehold] = useState({
    household_number: "", head_full_name: "", address: "", fokontany: "",
    socio_level: "", lat: "", lng: "", notes: "",
  });
  const [members, setMembers] = useState<Citizen[]>([]);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMember());
  const [adding, setAdding] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  const verifyUrl = useMemo(() => {
    if (!householdId) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/foyer/${householdId}`;
  }, [householdId]);

  // Load household & members
  useEffect(() => {
    if (!open) return;
    if (isNew) {
      setHousehold({ household_number: "", head_full_name: "", address: "", fokontany: "", socio_level: "", lat: "", lng: "", notes: "" });
      setMembers([]);
      setQrUrl("");
      return;
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
          address: h.address ?? "",
          fokontany: h.fokontany ?? "",
          socio_level: h.socio_level ?? "",
          lat: h.lat?.toString() ?? "",
          lng: h.lng?.toString() ?? "",
          notes: h.notes ?? "",
        });
      }
      setMembers((c as Citizen[]) ?? []);
    })();
  }, [open, householdId, isNew]);

  // Generate QR
  useEffect(() => {
    if (!verifyUrl) { setQrUrl(""); return; }
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 }).then(setQrUrl).catch(() => setQrUrl(""));
  }, [verifyUrl]);

  const upd = (k: keyof typeof household, v: string) => setHousehold((f) => ({ ...f, [k]: v }));
  const updM = (k: keyof MemberDraft, v: string) => setMemberDraft((f) => ({ ...f, [k]: v }));

  const saveHousehold = async () => {
    if (!household.household_number.trim() || !household.head_full_name.trim()) {
      toast.error("N° de foyer et chef de famille requis"); return;
    }
    const lat = household.lat.trim() ? Number(household.lat) : null;
    const lng = household.lng.trim() ? Number(household.lng) : null;
    if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) {
      toast.error("Coordonnées invalides"); return;
    }
    setLoading(true);
    const payload = { ...household, lat, lng };
    if (isNew) {
      const { data, error } = await supabase.from("households").insert(payload).select("id").single();
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Foyer créé — ajoutez maintenant les membres");
      onSaved();
      onCreated?.(data!.id);
    } else {
      const { error } = await supabase.from("households").update(payload).eq("id", householdId!);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Foyer mis à jour");
      onSaved();
    }
  };

  const addMember = async () => {
    if (!householdId) { toast.error("Enregistrez d'abord le foyer"); return; }
    if (!memberDraft.last_name.trim() || !memberDraft.first_names.trim()) {
      toast.error("Nom et prénoms requis"); return;
    }
    const isHead = memberDraft.relationship === "chef";
    const payload: Record<string, unknown> = {
      household_id: householdId,
      last_name: memberDraft.last_name,
      first_names: memberDraft.first_names,
      sex: memberDraft.sex,
      relationship: memberDraft.relationship,
      is_head: isHead,
    };
    if (memberDraft.birth_date) payload.birth_date = memberDraft.birth_date;
    if (memberDraft.cin) payload.cin = memberDraft.cin;
    if (memberDraft.phone) payload.phone = memberDraft.phone;
    if (memberDraft.profession) payload.profession = memberDraft.profession;
    const { error } = await supabase.from("citizens").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Membre ajouté");
    setMemberDraft(emptyMember());
    setAdding(false);
    await reloadMembers();
  };

  const reloadMembers = async () => {
    const { data } = await supabase.from("citizens").select("*").eq("household_id", householdId!).order("is_head", { ascending: false }).order("last_name");
    setMembers((data as Citizen[]) ?? []);
    onSaved();
  };

  const startEdit = (m: Citizen) => {
    setEditingMember(m.id);
    setMemberDraft({
      last_name: m.last_name, first_names: m.first_names, sex: m.sex,
      birth_date: m.birth_date ?? "", cin: m.cin ?? "", phone: m.phone ?? "",
      profession: m.profession ?? "", relationship: m.relationship ?? "autre",
    });
  };

  const saveEdit = async () => {
    if (!editingMember) return;
    const isHead = memberDraft.relationship === "chef";
    const payload: Record<string, unknown> = {
      last_name: memberDraft.last_name, first_names: memberDraft.first_names,
      sex: memberDraft.sex, relationship: memberDraft.relationship, is_head: isHead,
      birth_date: memberDraft.birth_date || null,
      cin: memberDraft.cin || null, phone: memberDraft.phone || null,
      profession: memberDraft.profession || null,
    };
    const { error } = await supabase.from("citizens").update(payload as never).eq("id", editingMember);
    if (error) return toast.error(error.message);
    toast.success("Membre mis à jour");
    setEditingMember(null);
    setMemberDraft(emptyMember());
    await reloadMembers();
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Supprimer ce membre ?")) return;
    const { error } = await supabase.from("citizens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Membre supprimé");
    await reloadMembers();
  };

  const printQR = () => {
    if (!qrUrl) return;
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>QR Foyer ${household.household_number}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:24px;display:flex;justify-content:center;align-items:center;min-height:100vh}
  .sheet{display:flex;gap:48px;justify-content:center;align-items:center}
  .card{border:2px dashed #999;border-radius:12px;padding:20px;text-align:center;width:280px}
  .card h2{margin:0 0 4px;font-size:14px;color:#666;letter-spacing:1px;text-transform:uppercase}
  .card h1{margin:0 0 12px;font-size:20px}
  .card img{width:220px;height:220px}
  .card p{margin:8px 0 0;font-size:12px;color:#555;word-break:break-all}
  @media print { @page { size: A5 landscape; margin: 10mm; } }
</style></head><body><div class="sheet">
  <div class="card"><h2>Fokontany</h2><h1>Foyer ${household.household_number}</h1><img src="${qrUrl}"/><p>${household.head_full_name}</p></div>
  <div class="card"><h2>Fokontany</h2><h1>Foyer ${household.household_number}</h1><img src="${qrUrl}"/><p>${household.head_full_name}</p></div>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`);
    w.document.close();
  };

  const cancelMemberForm = () => {
    setAdding(false);
    setEditingMember(null);
    setMemberDraft(emptyMember());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? "Nouveau foyer" : `Foyer ${household.household_number}`}</SheetTitle>
        </SheetHeader>

        {/* Household form */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>N° foyer *</Label><Input value={household.household_number} onChange={(e) => upd("household_number", e.target.value)} placeholder="F-2026-001" /></div>
            <div><Label>Chef de famille *</Label><Input value={household.head_full_name} onChange={(e) => upd("head_full_name", e.target.value)} /></div>
            <div className="col-span-2"><Label>Adresse</Label><Input value={household.address} onChange={(e) => upd("address", e.target.value)} /></div>
            <div><Label>Fokontany</Label><Input value={household.fokontany} onChange={(e) => upd("fokontany", e.target.value)} /></div>
            <div><Label>Niveau socio.</Label><Input value={household.socio_level} onChange={(e) => upd("socio_level", e.target.value)} /></div>
            <div><Label>Latitude</Label><Input value={household.lat} onChange={(e) => upd("lat", e.target.value)} /></div>
            <div><Label>Longitude</Label><Input value={household.lng} onChange={(e) => upd("lng", e.target.value)} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={household.notes} onChange={(e) => upd("notes", e.target.value)} /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveHousehold} disabled={loading}><Save className="w-4 h-4 mr-1" />{isNew ? "Créer le foyer" : "Mettre à jour"}</Button>
          </div>
        </div>

        {/* Members section — only when household exists */}
        {!isNew && (
          <>
            <Separator className="my-6" />
            <div className="flex items-center justify-between mb-3">
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
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Lien</Label>
                    <Select value={memberDraft.relationship} onValueChange={(v) => updM("relationship", v)}>
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

            {/* QR section */}
            <Separator className="my-6" />
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
      </SheetContent>
    </Sheet>
  );
}
