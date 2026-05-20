import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DOC_TYPES, makeDocNumber, type DocType } from "@/lib/acte-types";
import { generateActePdf } from "@/lib/generate-acte-pdf";

interface CitizenRow {
  id: string; last_name: string; first_names: string; sex: "M" | "F";
  birth_date: string | null; birth_place: string | null; cin: string | null;
  profession: string | null; household_id: string | null;
}

const DEFAULT_BODY: Record<DocType, string> = {
  residence: "Je soussigné, Chef du Fokontany, certifie que la personne désignée ci-dessus réside effectivement dans ce Fokontany.\n\nEn foi de quoi le présent certificat est délivré pour servir et valoir ce que de droit.",
  vie: "Je soussigné, Chef du Fokontany, certifie que la personne désignée ci-dessus est en vie à ce jour.\n\nEn foi de quoi le présent certificat est délivré pour servir et valoir ce que de droit.",
  bonne_conduite: "Je soussigné, Chef du Fokontany, certifie que la personne désignée ci-dessus est de bonne conduite, vie et mœurs.\n\nEn foi de quoi le présent certificat est délivré pour servir et valoir ce que de droit.",
  naissance: "Déclaration de naissance enregistrée auprès du Fokontany.\n\nLes informations ci-dessus sont reconnues exactes.",
  celibat: "Je soussigné, Chef du Fokontany, certifie que la personne désignée ci-dessus est de statut célibataire à ce jour.",
  vente: "Certificat délivré pour la transaction décrite ci-après.",
  deces: "Déclaration de décès enregistrée auprès du Fokontany.",
  autre: "",
};

export function ActeDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [citizens, setCitizens] = useState<CitizenRow[]>([]);
  const [docType, setDocType] = useState<DocType>("residence");
  const [citizenId, setCitizenId] = useState("");
  const [body, setBody] = useState(DEFAULT_BODY.residence);
  const [issuerName, setIssuerName] = useState("");
  const [fokontany, setFokontany] = useState("Toamasina");

  useEffect(() => { setBody(DEFAULT_BODY[docType]); }, [docType]);

  useEffect(() => {
    if (!open) return;
    supabase.from("citizens").select("id,last_name,first_names,sex,birth_date,birth_place,cin,profession,household_id").order("last_name").then(({ data }) => setCitizens((data as CitizenRow[]) ?? []));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.full_name) setIssuerName(String(data.user.user_metadata.full_name));
      else if (data.user?.email) setIssuerName(data.user.email);
    });
  }, [open]);

  const submit = async () => {
    if (!citizenId) return toast.error("Sélectionner un citoyen");
    const citizen = citizens.find((c) => c.id === citizenId);
    if (!citizen) return;
    setLoading(true);

    const docNumber = makeDocNumber(docType);
    const snapshot = { ...citizen };

    const { data: inserted, error } = await supabase
      .from("documents_issued")
      .insert({
        doc_type: docType, doc_number: docNumber, citizen_id: citizenId,
        citizen_snapshot: snapshot, payload: { body, fokontany }, issuer_name: issuerName,
      })
      .select("verify_code, issued_at")
      .single();

    if (error || !inserted) { setLoading(false); return toast.error(error?.message ?? "Erreur"); }

    try {
      const verifyUrl = `${window.location.origin}/verify/${inserted.verify_code}`;
      const bytes = await generateActePdf({
        docType, docNumber, verifyCode: inserted.verify_code, verifyUrl,
        issuedAt: new Date(inserted.issued_at), issuerName, fokontany,
        citizen: { ...citizen, address: null }, body,
      });
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${docNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Acte ${docNumber} généré`);
    } catch (e) {
      toast.error("Acte enregistré mais erreur de génération PDF");
      console.error(e);
    }
    setLoading(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Délivrer un acte</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <Label>Type d'acte</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Citoyen</Label>
            <Select value={citizenId} onValueChange={setCitizenId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {citizens.map((c) => <SelectItem key={c.id} value={c.id}>{c.last_name} {c.first_names}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Fokontany</Label><Input value={fokontany} onChange={(e) => setFokontany(e.target.value)} /></div>
          <div><Label>Émetteur</Label><Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} /></div>
          <div className="col-span-2">
            <Label>Texte de l'acte</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Génération…" : "Générer & télécharger PDF"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
