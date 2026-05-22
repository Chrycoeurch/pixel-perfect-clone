import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Users, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/meetings/$code")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Pointage de présence · FANISA" }] }),
});

interface Meeting { id: string; title: string; starts_at: string; location: string | null; status: string; agenda: string | null }
interface Citizen { id: string; last_name: string; first_names: string; cin: string | null }
interface AttRow { id: string; citizen_label: string; checked_in_at: string }

function AttendancePage() {
  const { code } = useParams({ from: "/meetings/$code" });
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [citizenId, setCitizenId] = useState("");
  const [manualName, setManualName] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAttendance = async (meetingId: string) => {
    const { data } = await supabase.from("meeting_attendance").select("id,citizen_label,checked_in_at").eq("meeting_id", meetingId).order("checked_in_at", { ascending: false });
    setAttendance((data as AttRow[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("meetings").select("*").eq("attendance_code", code).maybeSingle();
      setMeeting(data as Meeting | null);
      if (data) loadAttendance(data.id);
      const { data: cs } = await supabase.from("citizens").select("id,last_name,first_names,cin").order("last_name");
      setCitizens((cs as Citizen[]) ?? []);
    })();
  }, [code]);

  const checkIn = async () => {
    if (!meeting) return;
    let label = manualName.trim();
    let cId: string | null = null;
    if (citizenId) {
      const c = citizens.find((x) => x.id === citizenId);
      if (c) { label = `${c.last_name} ${c.first_names}`; cId = c.id; }
    }
    if (!label) return toast.error("Sélectionnez un citoyen ou saisissez un nom");
    setLoading(true);
    const { error } = await supabase.from("meeting_attendance").insert({
      meeting_id: meeting.id,
      citizen_id: cId,
      citizen_label: label,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") return toast.error("Citoyen déjà pointé");
      return toast.error(error.message);
    }
    toast.success("Présence enregistrée");
    setCitizenId(""); setManualName("");
    loadAttendance(meeting.id);
  };

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
          <h2 className="font-display text-lg font-semibold">Pointer un participant</h2>
          <div>
            <Label>Citoyen enregistré</Label>
            <Select value={citizenId} onValueChange={(v) => { setCitizenId(v); setManualName(""); }}>
              <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
              <SelectContent>
                {citizens.map((c) => <SelectItem key={c.id} value={c.id}>{c.last_name} {c.first_names}{c.cin ? ` · ${c.cin}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center text-xs text-muted-foreground">— ou —</div>
          <div>
            <Label>Nom libre (visiteur)</Label>
            <Input value={manualName} onChange={(e) => { setManualName(e.target.value); setCitizenId(""); }} placeholder="Nom et prénoms" />
          </div>
          <Button onClick={checkIn} disabled={loading} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />Enregistrer ma présence
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
            {attendance.length === 0 && <li className="px-6 py-8 text-center text-sm text-muted-foreground">Aucun participant encore pointé.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
