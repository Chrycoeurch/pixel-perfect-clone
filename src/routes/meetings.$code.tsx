import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Users, Calendar, MapPin, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

export const Route = createFileRoute("/meetings/$code")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Pointage de présence · FANISA" }] }),
});

interface Meeting { id: string; title: string; starts_at: string; location: string | null; status: string; agenda: string | null }
interface Household { id: string; household_number: string; head_full_name: string; fokontany: string | null }
interface AttRow { id: string; citizen_label: string; checked_in_at: string }

function AttendancePage() {
  const { code } = useParams({ from: "/meetings/$code" });
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [householdId, setHouseholdId] = useState("");
  const [manualName, setManualName] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadAttendance = async (meetingId: string) => {
    const { data } = await supabase.from("meeting_attendance").select("id,citizen_label,checked_in_at").eq("meeting_id", meetingId).order("checked_in_at", { ascending: false });
    setAttendance((data as AttRow[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("meetings").select("*").eq("attendance_code", code).maybeSingle();
      setMeeting(data as Meeting | null);
      if (data) loadAttendance(data.id);
      const { data: hs } = await supabase.from("households").select("id,household_number,head_full_name,fokontany").order("household_number");
      setHouseholds((hs as Household[]) ?? []);
    })();
  }, [code]);

  const registerCheckIn = async (label: string, hId: string | null) => {
    if (!meeting) return;
    // Prevent duplicate per household for same meeting
    if (hId && attendance.some((a) => a.citizen_label === label)) {
      toast.error("Foyer déjà pointé");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("meeting_attendance").insert({
      meeting_id: meeting.id,
      citizen_id: null,
      citizen_label: label,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") return toast.error("Déjà pointé");
      return toast.error(error.message);
    }
    toast.success(`Présence enregistrée : ${label}`);
    setHouseholdId(""); setManualName("");
    loadAttendance(meeting.id);
  };

  const checkIn = async () => {
    let label = manualName.trim();
    let hId: string | null = null;
    if (householdId) {
      const h = households.find((x) => x.id === householdId);
      if (h) { label = `${h.household_number} — ${h.head_full_name}`; hId = h.id; }
    }
    if (!label) return toast.error("Sélectionnez un foyer ou saisissez un nom");
    registerCheckIn(label, hId);
  };

  // Scanner lifecycle
  useEffect(() => {
    if (!scannerOpen) return;
    const id = "qr-reader";
    const html5 = new Html5Qrcode(id);
    scannerRef.current = html5;
    html5
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          // Expect URL ending with /foyer/<uuid>
          const match = decoded.match(/\/foyer\/([0-9a-f-]{36})/i);
          if (!match) {
            toast.error("QR code non reconnu");
            return;
          }
          const hid = match[1];
          const h = households.find((x) => x.id === hid);
          if (!h) {
            toast.error("Foyer introuvable");
            return;
          }
          const label = `${h.household_number} — ${h.head_full_name}`;
          // stop scanner then register
          html5.stop().then(() => {
            setScannerOpen(false);
            registerCheckIn(label, h.id);
          }).catch(() => {});
        },
        () => {}
      )
      .catch((e) => { toast.error("Caméra inaccessible : " + (e?.message ?? e)); setScannerOpen(false); });
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen, households]);

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">Réunion introuvable ou code invalide.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 lg:p-10 space-y-6">
        <div className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <Badge className="mb-3">Pointage de présence</Badge>
          <h1 className="font-display text-2xl font-bold">{meeting.title}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(meeting.starts_at).toLocaleString("fr-FR")}</span>
            {meeting.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{meeting.location}</span>}
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{attendance.length} présent(s)</span>
          </div>
          {meeting.agenda && <p className="mt-4 text-sm whitespace-pre-line">{meeting.agenda}</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Pointer un foyer</h2>
            <Button variant="outline" size="sm" onClick={() => setScannerOpen((v) => !v)}>
              {scannerOpen ? <><X className="w-4 h-4 mr-1.5" />Fermer</> : <><QrCode className="w-4 h-4 mr-1.5" />Scanner QR</>}
            </Button>
          </div>

          {scannerOpen && (
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <div id="qr-reader" className="w-full" />
              <p className="text-xs text-center text-muted-foreground py-2 bg-card">Placez le QR code du foyer dans le cadre</p>
            </div>
          )}

          <div>
            <Label>Foyer enregistré</Label>
            <Select value={householdId} onValueChange={(v) => { setHouseholdId(v); setManualName(""); }}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un foyer…" /></SelectTrigger>
              <SelectContent>
                {households.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.household_number} — {h.head_full_name}{h.fokontany ? ` · ${h.fokontany}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center text-xs text-muted-foreground">— ou —</div>
          <div>
            <Label>Nom libre (visiteur)</Label>
            <Input value={manualName} onChange={(e) => { setManualName(e.target.value); setHouseholdId(""); }} placeholder="Nom et prénoms" />
          </div>
          <Button onClick={checkIn} disabled={loading} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />Enregistrer la présence
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-3 border-b border-border font-medium text-sm">Présences ({attendance.length})</div>
          <ul className="divide-y divide-border max-h-80 overflow-auto">
            {attendance.map((a) => (
              <li key={a.id} className="px-6 py-2.5 flex justify-between text-sm">
                <span className="font-medium">{a.citizen_label}</span>
                <span className="text-muted-foreground">{new Date(a.checked_in_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
            {attendance.length === 0 && <li className="px-6 py-8 text-center text-sm text-muted-foreground">Aucun foyer encore pointé.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
