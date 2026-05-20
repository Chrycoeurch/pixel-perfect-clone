import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { DOC_TYPES } from "@/lib/acte-types";

export const Route = createFileRoute("/verify/$code")({
  component: VerifyPage,
  head: () => ({ meta: [{ title: "Vérification d'acte · FANISA" }] }),
});

interface VerifyResult {
  doc_number: string;
  doc_type: keyof typeof DOC_TYPES;
  status: "active" | "cancelled";
  issued_at: string;
  issuer_name: string | null;
  citizen_snapshot: { last_name: string; first_names: string; sex: string; birth_date?: string | null };
}

function VerifyPage() {
  const { code } = Route.useParams();
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const [doc, setDoc] = useState<VerifyResult | null>(null);

  useEffect(() => {
    supabase.rpc("verify_document", { _code: code }).then(({ data }) => {
      const row = (data as VerifyResult[] | null)?.[0];
      if (row) { setDoc(row); setState("ok"); } else setState("notfound");
    });
  }, [code]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div className="flex items-center gap-2 text-primary mb-6">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-display font-bold">FANISA · Vérification d'acte</span>
        </div>

        {state === "loading" && <p className="text-muted-foreground">Vérification en cours…</p>}

        {state === "notfound" && (
          <div className="text-center py-6">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold">Acte introuvable</h1>
            <p className="text-muted-foreground mt-2">Ce code de vérification ne correspond à aucun acte enregistré.</p>
          </div>
        )}

        {state === "ok" && doc && (
          <>
            <div className="text-center py-4">
              {doc.status === "active" ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-3" />
                  <h1 className="font-display text-2xl font-bold text-foreground">Acte authentique</h1>
                  <p className="text-muted-foreground text-sm mt-1">Ce document est valide et enregistré dans FANISA.</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-destructive mx-auto mb-3" />
                  <h1 className="font-display text-2xl font-bold text-destructive">Acte annulé</h1>
                  <p className="text-muted-foreground text-sm mt-1">Cet acte a été révoqué et n'est plus valide.</p>
                </>
              )}
            </div>

            <div className="mt-6 space-y-2 text-sm border-t border-border pt-6">
              <Row label="Numéro" value={doc.doc_number} mono />
              <Row label="Type" value={DOC_TYPES[doc.doc_type]} />
              <Row label="Bénéficiaire" value={`${doc.citizen_snapshot.last_name} ${doc.citizen_snapshot.first_names}`} />
              {doc.citizen_snapshot.birth_date && <Row label="Né(e) le" value={doc.citizen_snapshot.birth_date} />}
              <Row label="Délivré le" value={new Date(doc.issued_at).toLocaleDateString("fr-FR")} />
              {doc.issuer_name && <Row label="Émetteur" value={doc.issuer_name} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "font-medium text-right"}>{value}</span>
    </div>
  );
}
