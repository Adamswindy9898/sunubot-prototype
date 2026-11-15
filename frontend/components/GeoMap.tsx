"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search, X, ExternalLink } from "lucide-react";

interface ServicePoint {
  id: string;
  nom: string;
  type: "mairie" | "centre_fiscal" | "cnss" | "prefecture" | "hopital" | "etat_civil";
  adresse: string;
  ville: string;
  region: string;
  lat: number;
  lng: number;
  telephone?: string;
  horaires?: string;
}

const TYPE_CONFIG: Record<ServicePoint["type"], { label: string; color: string; emoji: string }> = {
  mairie:        { label: "Mairie",           color: "#2980B9", emoji: "🏛️" },
  centre_fiscal: { label: "Centre Fiscal",    color: "#E67E22", emoji: "💰" },
  cnss:          { label: "Agence CNSS",      color: "#C0392B", emoji: "🏥" },
  prefecture:    { label: "Préfecture",       color: "#8E44AD", emoji: "🏢" },
  hopital:       { label: "Hôpital / Santé",  color: "#27AE60", emoji: "🏨" },
  etat_civil:    { label: "État Civil",       color: "#1F5C99", emoji: "📋" },
};

// Points de service administratifs au Sénégal
const SERVICES_SENEGAL: ServicePoint[] = [
  // Dakar
  { id: "1",  nom: "Mairie de Dakar Plateau",    type: "mairie",        adresse: "Place de l'Indépendance",          ville: "Dakar",    region: "Dakar",    lat: 14.6937, lng: -17.4441, telephone: "33 823 10 10", horaires: "Lun-Ven 8h-16h" },
  { id: "2",  nom: "Centre Fiscal de Dakar Plateau", type: "centre_fiscal", adresse: "Av. Léopold Sédar Senghor",    ville: "Dakar",    region: "Dakar",    lat: 14.6928, lng: -17.4467, telephone: "33 889 20 00", horaires: "Lun-Ven 8h-16h" },
  { id: "3",  nom: "Agence CNSS Dakar",          type: "cnss",          adresse: "Rue Félix Faure",                  ville: "Dakar",    region: "Dakar",    lat: 14.6892, lng: -17.4385, telephone: "33 849 00 00", horaires: "Lun-Ven 8h-16h" },
  { id: "4",  nom: "Préfecture de Dakar",        type: "prefecture",    adresse: "Av. André Peytavin",               ville: "Dakar",    region: "Dakar",    lat: 14.6915, lng: -17.4380, telephone: "33 823 27 80", horaires: "Lun-Ven 8h-16h" },
  { id: "5",  nom: "Hôpital Principal de Dakar", type: "hopital",       adresse: "Ave. Nelson Mandela",              ville: "Dakar",    region: "Dakar",    lat: 14.6954, lng: -17.4496, telephone: "33 839 50 50", horaires: "24h/24" },
  { id: "6",  nom: "Centre État Civil Dakar",    type: "etat_civil",    adresse: "Rue Moussé Diop",                  ville: "Dakar",    region: "Dakar",    lat: 14.6900, lng: -17.4420, horaires: "Lun-Sam 8h-16h" },
  // Thiès
  { id: "7",  nom: "Mairie de Thiès",            type: "mairie",        adresse: "Rue Président Bourguiba",          ville: "Thiès",    region: "Thiès",    lat: 14.7886, lng: -16.9260, telephone: "33 951 10 50", horaires: "Lun-Ven 8h-16h" },
  { id: "8",  nom: "Centre Fiscal de Thiès",     type: "centre_fiscal", adresse: "Quartier Médina Fall",             ville: "Thiès",    region: "Thiès",    lat: 14.7920, lng: -16.9210, telephone: "33 951 23 14", horaires: "Lun-Ven 8h-16h" },
  { id: "9",  nom: "Agence CNSS Thiès",          type: "cnss",          adresse: "Av. Lamine Guèye",                 ville: "Thiès",    region: "Thiès",    lat: 14.7850, lng: -16.9280, telephone: "33 951 25 62", horaires: "Lun-Ven 8h-16h" },
  { id: "10", nom: "Préfecture de Thiès",        type: "prefecture",    adresse: "Rue de Thiès Centre",              ville: "Thiès",    region: "Thiès",    lat: 14.7900, lng: -16.9300, horaires: "Lun-Ven 8h-16h" },
  // Saint-Louis
  { id: "11", nom: "Mairie de Saint-Louis",      type: "mairie",        adresse: "Place Faidherbe",                  ville: "Saint-Louis", region: "Saint-Louis", lat: 16.0326, lng: -16.5050, telephone: "33 961 10 19", horaires: "Lun-Ven 8h-16h" },
  { id: "12", nom: "Centre Fiscal Saint-Louis",  type: "centre_fiscal", adresse: "Quartier Brack",                   ville: "Saint-Louis", region: "Saint-Louis", lat: 16.0350, lng: -16.5010, horaires: "Lun-Ven 8h-16h" },
  // Kaolack
  { id: "13", nom: "Mairie de Kaolack",          type: "mairie",        adresse: "Quartier Médina Baye",             ville: "Kaolack",  region: "Kaolack",  lat: 14.1504, lng: -16.0723, telephone: "33 941 12 14", horaires: "Lun-Ven 8h-16h" },
  { id: "14", nom: "Agence CNSS Kaolack",        type: "cnss",          adresse: "Route de Fatick",                  ville: "Kaolack",  region: "Kaolack",  lat: 14.1480, lng: -16.0680, horaires: "Lun-Ven 8h-16h" },
  // Ziguinchor
  { id: "15", nom: "Mairie de Ziguinchor",       type: "mairie",        adresse: "Quartier Boucotte",                ville: "Ziguinchor", region: "Ziguinchor", lat: 12.5583, lng: -16.2719, horaires: "Lun-Ven 8h-16h" },
  { id: "16", nom: "Centre Fiscal Ziguinchor",   type: "centre_fiscal", adresse: "Rue du Commerce",                  ville: "Ziguinchor", region: "Ziguinchor", lat: 12.5600, lng: -16.2700, horaires: "Lun-Ven 8h-16h" },
  // Touba
  { id: "17", nom: "Préfecture de Mbacké (Touba)", type: "prefecture",  adresse: "Centre ville Mbacké",              ville: "Touba",    region: "Diourbel",  lat: 14.5180, lng: -15.9060, horaires: "Lun-Ven 8h-16h" },
];

const REGIONS = ["Toutes", "Dakar", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Diourbel"];
const TYPES = ["Tous", "mairie", "centre_fiscal", "cnss", "prefecture", "hopital", "etat_civil"] as const;

interface GeoMapProps {
  langue?: string;
  initialFilter?: ServicePoint["type"];
  onClose: () => void;
}

export default function GeoMap({ langue, initialFilter, onClose }: GeoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const [selectedService, setSelectedService] = useState<ServicePoint | null>(null);
  const [filterRegion, setFilterRegion] = useState("Toutes");
  const [filterType, setFilterType] = useState<string>(initialFilter || "Tous");
  const [search, setSearch] = useState("");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const isWolof = langue === "wolof";

  const filtered = SERVICES_SENEGAL.filter((s) => {
    const matchRegion = filterRegion === "Toutes" || s.region === filterRegion;
    const matchType = filterType === "Tous" || s.type === filterType;
    const matchSearch = !search || s.nom.toLowerCase().includes(search.toLowerCase()) || s.ville.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchType && matchSearch;
  });

  useEffect(() => {
    if (!mapRef.current) return;
    let map: unknown;

    const init = async () => {
      const L = (await import("leaflet")).default;
      // Fix icônes Leaflet avec Webpack
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (leafletMapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map = (L as any).map(mapRef.current!, { center: [14.6937, -17.4441], zoom: 8, zoomControl: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L as any).tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
    };

    init();

    return () => {
      if (leafletMapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (leafletMapRef.current as any).remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand le filtre change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = leafletMapRef.current as any;

      // Supprimer anciens marqueurs
      markersRef.current.forEach((m) => (m as unknown as { remove(): void }).remove());
      markersRef.current = [];

      filtered.forEach((svc) => {
        const cfg = TYPE_CONFIG[svc.type];
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${cfg.color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(45deg);font-size:13px;">${cfg.emoji}</span>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const marker = L.marker([svc.lat, svc.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:180px;">
            <strong style="color:${cfg.color}">${cfg.emoji} ${svc.nom}</strong><br/>
            <small style="color:#666">${svc.adresse}, ${svc.ville}</small><br/>
            ${svc.telephone ? `📞 ${svc.telephone}<br/>` : ""}
            ${svc.horaires ? `🕐 ${svc.horaires}` : ""}
          </div>
        `);
        marker.on("click", () => setSelectedService(svc));
        markersRef.current.push(marker);
      });
    };

    updateMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, filterRegion, filterType, search]);

  const locateUser = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos([lat, lng]);
        setGeoLoading(false);
        if (leafletMapRef.current) {
          const L = (await import("leaflet")).default;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const map = leafletMapRef.current as any;
          map.setView([lat, lng], 13);
          L.circle([lat, lng], { radius: 500, color: "#1F5C99", fillOpacity: 0.1 }).addTo(map);
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: "",
              html: `<div style="background:#1F5C99;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(31,92,153,0.3)"></div>`,
              iconSize: [14, 14], iconAnchor: [7, 7],
            })
          }).addTo(map).bindPopup(isWolof ? "Yow dëkk fii" : "Votre position").openPopup();
        }
      },
      () => setGeoLoading(false)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1F5C99] to-[#174a7a] px-5 py-3 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-white" />
          <div className="flex-1">
            <h2 className="text-white font-bold text-sm">{isWolof ? "Carte yi — Services Administratifs" : "Carte — Services Administratifs"}</h2>
            <p className="text-white/60 text-[10px]">{isWolof ? "Xool fan la services yi nekk" : "Localisez les services près de vous"}</p>
          </div>
          <button onClick={locateUser} disabled={geoLoading}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition border border-white/20">
            <Navigation className={`w-3.5 h-3.5 ${geoLoading ? "animate-spin" : ""}`} />
            {userPos ? (isWolof ? "Ma woon" : "Ma position") : (isWolof ? "Xool ma" : "Me localiser")}
          </button>
          <button onClick={onClose} className="text-white/70 hover:text-white ml-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Filtres */}
        <div className="px-4 py-2 border-b border-gray-100 flex gap-2 flex-wrap items-center bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={isWolof ? "Seet..." : "Rechercher..."} className="pl-7 pr-3 py-1.5 text-xs text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F5C99] w-36" />
          </div>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
            className="text-xs text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1F5C99]">
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-xs text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1F5C99]">
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === "Tous" ? "Tous services" : TYPE_CONFIG[t as ServicePoint["type"]]?.label || t}</option>
            ))}
          </select>
          <span className="text-[10px] text-gray-400 ml-auto">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>

        {/* Corps : carte + liste */}
        <div className="flex-1 flex overflow-hidden">
          {/* Carte */}
          <div className="flex-1 relative">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Liste latérale */}
          <div className="w-64 border-l border-gray-100 overflow-y-auto flex flex-col">
            {selectedService && (
              <div className="p-3 border-b border-gray-100 bg-blue-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{selectedService.nom}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{selectedService.adresse}</p>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: TYPE_CONFIG[selectedService.type].color + "20", color: TYPE_CONFIG[selectedService.type].color }}>
                      {TYPE_CONFIG[selectedService.type].emoji} {TYPE_CONFIG[selectedService.type].label}
                    </span>
                  </div>
                  <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                </div>
                {selectedService.telephone && <p className="text-[10px] text-gray-600 mt-1.5">📞 {selectedService.telephone}</p>}
                {selectedService.horaires && <p className="text-[10px] text-gray-600">🕐 {selectedService.horaires}</p>}
                <a href={`https://www.openstreetmap.org/?mlat=${selectedService.lat}&mlon=${selectedService.lng}&zoom=17`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-[10px] text-[#1F5C99] hover:underline">
                  <ExternalLink className="w-3 h-3" /> {isWolof ? "Xool ci carte bi" : "Voir sur la carte"}
                </a>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">{isWolof ? "Amul résultat" : "Aucun résultat"}</p>
              ) : (
                filtered.map((svc) => {
                  const cfg = TYPE_CONFIG[svc.type];
                  return (
                    <button key={svc.id} onClick={() => {
                      setSelectedService(svc);
                      if (leafletMapRef.current) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (leafletMapRef.current as any).setView([svc.lat, svc.lng], 15);
                      }
                    }} className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition ${selectedService?.id === svc.id ? "bg-blue-50" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0 mt-0.5">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-gray-800 truncate">{svc.nom}</p>
                          <p className="text-[9px] text-gray-500 truncate">{svc.ville} — {svc.region}</p>
                          <span className="text-[8px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
