import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sig")({
  component: SigPage,
  ssr: false,
  head: () => ({ meta: [{ title: "SIG & Cartographie · FANISA" }] }),
});

interface Household {
  id: string;
  household_number: string;
  head_full_name: string;
  fokontany: string | null;
  address: string | null;
  socio_level: string | null;
  member_count: number;
  lat: number | null;
  lng: number | null;
}

const SOCIO_COLOR: Record<string, string> = {
  aisé: "#15803d",
  aise: "#15803d",
  moyen: "#d97706",
  vulnérable: "#dc2626",
  vulnerable: "#dc2626",
};

function colorFor(level: string | null) {
  if (!level) return "#6b7280";
  return SOCIO_COLOR[level.trim().toLowerCase()] ?? "#2563eb";
}

function SigPage() {
  const mapRef = useRef<MlMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Household | null>(null);

  useEffect(() => {
    supabase.from("households").select("*").then(({ data }) => {
      setHouseholds((data as Household[]) ?? []);
    });
  }, []);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [47.5079, -18.8792], // Antananarivo
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // refresh markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = households.filter((h) => {
      if (h.lat == null || h.lng == null) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        h.household_number.toLowerCase().includes(s) ||
        h.head_full_name.toLowerCase().includes(s) ||
        (h.fokontany ?? "").toLowerCase().includes(s)
      );
    });

    const bounds = new maplibregl.LngLatBounds();
    filtered.forEach((h) => {
      const el = document.createElement("div");
      el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${colorFor(h.socio_level)};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer;`;
      const popup = new Popup({ offset: 14, closeButton: false }).setHTML(
        `<div style="font-family:inherit;font-size:13px;line-height:1.4">
           <div style="font-weight:600">${h.head_full_name}</div>
           <div style="color:#6b7280;font-family:monospace;font-size:11px">${h.household_number}</div>
           ${h.fokontany ? `<div style="margin-top:2px">📍 ${h.fokontany}</div>` : ""}
           <div style="margin-top:2px">👥 ${h.member_count} membre(s)</div>
         </div>`
      );
      const marker = new Marker({ element: el })
        .setLngLat([h.lng!, h.lat!])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener("click", () => setSelected(h));
      markersRef.current.push(marker);
      bounds.extend([h.lng!, h.lat!]);
    });

    if (filtered.length > 0) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
    }
  }, [households, q]);

  const geoCount = households.filter((h) => h.lat != null && h.lng != null).length;

  return (
    <div>
      <PageHeader
        pillar="Pilier 1"
        title="SIG & Cartographie décisionnelle"
        description="Visualisation interactive des foyers géolocalisés. Cliquez sur un marqueur pour le détail."
      />
      <div className="p-6 lg:p-10 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-64 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher foyer, chef, fokontany…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Badge variant="secondary">{geoCount} géolocalisé(s) / {households.length}</Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
            <Legend color="#15803d" label="Aisé" />
            <Legend color="#d97706" label="Moyen" />
            <Legend color="#dc2626" label="Vulnérable" />
            <Legend color="#6b7280" label="Non renseigné" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div ref={containerRef} className="h-[65vh] rounded-xl border border-border overflow-hidden" />
          <aside className="rounded-xl border border-border bg-card p-5 h-[65vh] overflow-auto" style={{ boxShadow: "var(--shadow-card)" }}>
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <div className="font-display text-lg font-semibold">{selected.head_full_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{selected.household_number}</div>
                  </div>
                </div>
                <Info label="Fokontany" value={selected.fokontany} />
                <Info label="Adresse" value={selected.address} />
                <Info label="Niveau socio-éco." value={selected.socio_level} />
                <Info label="Membres" value={String(selected.member_count)} />
                <Info label="Coordonnées" value={`${selected.lat?.toFixed(5)}, ${selected.lng?.toFixed(5)}`} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Sélectionnez un marqueur sur la carte pour afficher le détail du foyer.
                {geoCount === 0 && (
                  <p className="mt-4 text-xs">Aucun foyer géolocalisé. Renseignez latitude/longitude lors de la création d'un foyer dans l'Administration.</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-full border border-white" style={{ background: color }} />
      {label}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}
