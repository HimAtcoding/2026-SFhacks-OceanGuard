import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { CityMonitor, KelpTrashTrack } from "@shared/schema";
import {
  MapPin,
  Waves,
  Trash2,
  Leaf,
  Globe as GlobeIcon,
  TrendingUp,
  ArrowRight,
  Navigation,
  Maximize2,
  Minimize2,
  Eye,
  Droplets,
  Wind,
  ThermometerSun,
  Activity,
  Crosshair,
  X,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function getRatingColor(rating: string): string {
  switch (rating) {
    case "Excellent": return "#22c55e";
    case "Good": return "#0ea5e9";
    case "Fair": return "#eab308";
    case "Poor": return "#ef4444";
    default: return "#94a3b8";
  }
}

function getRatingBadgeVariant(rating: string): "default" | "secondary" | "destructive" | "outline" {
  switch (rating) {
    case "Excellent": return "default";
    case "Good": return "secondary";
    case "Fair": return "outline";
    case "Poor": return "destructive";
    default: return "outline";
  }
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface PredictionPoint {
  trackId: string;
  trackType: string;
  hours: number;
  latitude: number;
  longitude: number;
  density: number;
  confidence: number;
}

const MARBLE_URL = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const TOPO_URL = "//unpkg.com/three-globe/example/img/earth-topology.png";
const BUMP_URL = "//unpkg.com/three-globe/example/img/earth-topology.png";
const SKY_URL = "//unpkg.com/three-globe/example/img/night-sky.png";

interface LayerState {
  currents: boolean;
  kelp: boolean;
  topography: boolean;
  ecoMarkers: boolean;
}

interface InfoData {
  title: string;
  description: string;
  stats?: { label: string; value: string }[];
}

const LAYER_CONFIG: {
  key: keyof LayerState;
  label: string;
  icon: any;
  color: string;
  description: string;
  source: string;
}[] = [
  {
    key: "currents",
    label: "Ocean Currents",
    icon: Waves,
    color: "#06b6d4",
    description: "Animated surface current flows modeled with hemisphere-based Coriolis patterns. Shows dominant gyre direction and approximate flow speed near the selected city.",
    source: "Simulated from hemispheric oceanographic models",
  },
  {
    key: "kelp",
    label: "Kelp Coverage",
    icon: Leaf,
    color: "#22c55e",
    description: "Pulsing rings indicate kelp forest density zones. Kelp forests are critical carbon sinks and biodiversity hotspots, absorbing CO2 and sheltering hundreds of marine species.",
    source: "OceanGuard drone scan aggregation",
  },
  {
    key: "topography",
    label: "Topography",
    icon: Activity,
    color: "#8b9fad",
    description: "Switches the globe surface to a grayscale heightmap with terrain tinting, revealing ocean floor elevation and continental shelf boundaries for geological context.",
    source: "ETOPO1 global relief dataset",
  },
  {
    key: "ecoMarkers",
    label: "Ecosystem Markers",
    icon: MapPin,
    color: "#f59e0b",
    description: "Clickable points of interest including Marine Protected Areas, coral reef systems, shipping corridors, and research stations. Click any marker on the globe for details.",
    source: "IUCN & regional conservation databases",
  },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateOceanCurrents(city: CityMonitor) {
  const lat = city.latitude;
  const lng = city.longitude;
  const R = 0.72;
  const isNorthern = lat > 0;
  const speed = city.currentSpeed || 0.5;
  const cosLat = Math.cos(lat * Math.PI / 180) || 0.5;
  const rng = seededRandom(Math.abs(Math.round(lat * 1000 + lng * 1000)));

  const baseAngle = isNorthern ? -25 : 25;
  const paths: any[] = [];

  for (let i = 0; i < 14; i++) {
    const streamOffset = ((i / 14) - 0.5) * R * 1.6;
    const angle = (baseAngle + (rng() - 0.5) * 50) * Math.PI / 180;
    const pathLen = R * (0.5 + rng() * 0.7);
    const curvature = (rng() - 0.5) * 0.5;
    const numPts = 7;
    const points: { lat: number; lng: number }[] = [];

    for (let j = 0; j < numPts; j++) {
      const t = j / (numPts - 1);
      const along = (t - 0.5) * pathLen;
      const across = streamOffset + curvature * Math.sin(t * Math.PI) * R * 0.3;
      points.push({
        lat: lat + along * Math.sin(angle) + across * Math.cos(angle),
        lng: lng + (along * Math.cos(angle) - across * Math.sin(angle)) / cosLat,
      });
    }

    const opacity = 0.35 + rng() * 0.35;
    paths.push({
      points,
      color: `rgba(6, 182, 212, ${opacity})`,
      stroke: 0.6 + speed * 1.2 + rng() * 0.6,
      animateTime: 1200 + (1 - speed) * 2000 + rng() * 1500,
      info: {
        title: "Ocean Current",
        description: `This current flows ${isNorthern ? "as part of a clockwise gyre typical of the Northern Hemisphere" : "in a counterclockwise gyre pattern typical of the Southern Hemisphere"}. Near ${city.cityName}, surface currents move at approximately ${speed.toFixed(1)} m/s, transporting nutrients, heat, and marine organisms. These flows are critical for distributing plankton and regulating regional water temperatures.`,
        stats: [
          { label: "Speed", value: `${speed.toFixed(1)} m/s` },
          { label: "Depth Range", value: "0-200m" },
          { label: "Water Temp", value: `${(city.waterTemp || 18).toFixed(1)}C` },
          { label: "Gyre", value: isNorthern ? "Clockwise" : "Counter-CW" },
        ],
      },
    });
  }
  return paths;
}

function generateKelpRings(city: CityMonitor, tracks: KelpTrashTrack[]) {
  const cityKelp = tracks.filter(t => t.cityId === city.id && t.trackType === "kelp");
  const rings: any[] = [];
  const rng = seededRandom(Math.abs(Math.round(city.latitude * 1000 + city.longitude * 1000)) + 42);
  const cosLat = Math.cos(city.latitude * Math.PI / 180) || 0.5;

  cityKelp.slice(0, 8).forEach((track) => {
    const density = track.density || 0.5;
    rings.push({
      lat: track.latitude,
      lng: track.longitude,
      maxR: 0.03 + density * 0.06,
      speed: 0.3 + rng() * 0.4,
      period: 2500 + rng() * 2000,
      color: (t: number) => `rgba(34, 197, 94, ${Math.max(0, 0.45 * (1 - t))})`,
      info: {
        title: "Kelp Forest Zone",
        description: `Kelp forests near ${city.cityName} function as vital underwater carbon sinks, absorbing atmospheric CO2 while sheltering hundreds of marine species. A healthy kelp forest sequesters up to 20 times more carbon per hectare than terrestrial forests and generates significant dissolved oxygen.`,
        stats: [
          { label: "Density", value: `${(density * 100).toFixed(0)}%` },
          { label: "Carbon Capture", value: `${(density * 12).toFixed(1)} t/yr` },
          { label: "Biodiversity", value: density > 0.6 ? "High" : "Moderate" },
          { label: "Health", value: city.kelpHealthRating },
        ],
      },
    });
  });

  if (rings.length < 5) {
    const needed = 5 - rings.length;
    for (let i = 0; i < needed; i++) {
      const angle = (i / needed) * Math.PI * 2 + rng() * 0.8;
      const r = 0.12 + rng() * 0.35;
      rings.push({
        lat: city.latitude + r * Math.sin(angle),
        lng: city.longitude + (r * Math.cos(angle)) / cosLat,
        maxR: 0.02 + rng() * 0.04,
        speed: 0.25 + rng() * 0.35,
        period: 3000 + rng() * 2000,
        color: (t: number) => `rgba(34, 197, 94, ${Math.max(0, 0.3 * (1 - t))})`,
        info: {
          title: "Potential Kelp Habitat",
          description: `This area near ${city.cityName} has favorable conditions for marine vegetation: suitable water temperature, nutrient levels, and light penetration. Monitoring indicates ${city.kelpHealthRating.toLowerCase()} overall kelp ecosystem health across this region.`,
          stats: [
            { label: "Suitability", value: "Moderate" },
            { label: "Water Temp", value: `${(city.waterTemp || 18).toFixed(1)}C` },
            { label: "Depth", value: "5-30m" },
            { label: "Status", value: "Monitored" },
          ],
        },
      });
    }
  }
  return rings;
}

function generateEcoMarkers(city: CityMonitor) {
  const cosLat = Math.cos(city.latitude * Math.PI / 180) || 0.5;
  const rng = seededRandom(Math.abs(Math.round(city.latitude * 1000 + city.longitude * 1000)) + 99);

  const defs = [
    {
      title: "Marine Protected Area",
      offset: { lat: 0.18, lng: 0.22 },
      colorHex: "#22c55e",
      description: `This marine protected area near ${city.cityName} restricts human activity to preserve biodiversity. Protected marine zones have demonstrated up to 600% increases in fish biomass and 21% greater species richness compared to unprotected areas. These zones are critical for allowing degraded ecosystems to recover naturally.`,
      stats: [
        { label: "Protection", value: "IUCN Cat. II" },
        { label: "Area", value: `${(150 + rng() * 200).toFixed(0)} km2` },
        { label: "Species", value: `${(80 + Math.floor(rng() * 120))}+` },
        { label: "Established", value: `${2005 + Math.floor(rng() * 15)}` },
      ],
    },
    {
      title: "Coral Reef System",
      offset: { lat: -0.15, lng: -0.2 },
      colorHex: "#f59e0b",
      description: `Coral reefs near ${city.cityName} support roughly 25% of all marine species while covering less than 1% of the ocean floor. These reefs serve as natural breakwaters, protecting coastlines from wave energy and erosion. Rising ocean temperatures pose increasing bleaching risks to reef health.`,
      stats: [
        { label: "Coverage", value: `${(5 + rng() * 15).toFixed(1)} km2` },
        { label: "Health", value: city.waterTemp && city.waterTemp > 26 ? "At Risk" : "Stable" },
        { label: "Bleaching", value: `${(5 + rng() * 20).toFixed(0)}%` },
        { label: "Diversity", value: "High" },
      ],
    },
    {
      title: "Shipping Corridor",
      offset: { lat: 0.28, lng: -0.12 },
      colorHex: "#94a3b8",
      description: `Major shipping routes near ${city.cityName} carry vital global trade but contribute to ocean noise pollution, oil spill risks, and marine life collisions. Vessel traffic through this corridor averages significant daily transits, requiring careful regulation to balance economic demand with ecological preservation.`,
      stats: [
        { label: "Traffic", value: `${(20 + Math.floor(rng() * 40))}/day` },
        { label: "Noise Impact", value: "Moderate" },
        { label: "Speed Limit", value: "12 knots" },
        { label: "Monitoring", value: "Active" },
      ],
    },
    {
      title: "Research Station",
      offset: { lat: -0.22, lng: 0.18 },
      colorHex: "#0ea5e9",
      description: `This oceanographic station continuously monitors water temperature, salinity, current patterns, and marine populations around ${city.cityName}. Data from stations like this feeds directly into OceanGuard's prediction models for kelp drift and debris movement forecasting.`,
      stats: [
        { label: "Sensors", value: `${(12 + Math.floor(rng() * 8))}` },
        { label: "Data Rate", value: "1 Hz" },
        { label: "Max Depth", value: `${(50 + Math.floor(rng() * 150))}m` },
        { label: "Uptime", value: "99.7%" },
      ],
    },
  ];

  return defs.map((m) => ({
    lat: city.latitude + m.offset.lat,
    lng: city.longitude + m.offset.lng / cosLat,
    text: m.title,
    size: 0.55,
    color: m.colorHex,
    dotRadius: 0.25,
    info: { title: m.title, description: m.description, stats: m.stats },
  }));
}

function GlobeComponent({
  cities,
  tracks,
  predictions,
  selectedCity,
  onCitySelect,
}: {
  cities: CityMonitor[];
  tracks: KelpTrashTrack[];
  predictions: PredictionPoint[];
  selectedCity: CityMonitor | null;
  onCitySelect: (city: CityMonitor | null) => void;
}) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [GlobeGL, setGlobeGL] = useState<any>(null);
  const [showPredictions, setShowPredictions] = useState(true);
  const [globeError, setGlobeError] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    currents: true,
    kelp: true,
    topography: true,
    ecoMarkers: true,
  });
  const [infoData, setInfoData] = useState<InfoData | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [expandedLayer, setExpandedLayer] = useState<keyof LayerState | null>(null);

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleExpanded = useCallback((key: keyof LayerState) => {
    setExpandedLayer(prev => prev === key ? null : key);
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setGlobeError(true);
        return;
      }
    } catch {
      setGlobeError(true);
      return;
    }
    import("react-globe.gl").then((mod) => {
      setGlobeGL(() => mod.default);
    }).catch(() => setGlobeError(true));
  }, []);

  useEffect(() => {
    setInfoData(null);
    if (globeRef.current && selectedCity) {
      globeRef.current.pointOfView(
        { lat: selectedCity.latitude, lng: selectedCity.longitude, altitude: 0.35 },
        1500
      );
    } else if (globeRef.current && !selectedCity) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1500);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (!globeRef.current || !GlobeGL) return;
    try {
      const material = globeRef.current.globeMaterial();
      if (!material) return;
      if (selectedCity && layers.topography) {
        material.color.set(0x88bbaa);
        material.bumpScale = 14;
      } else {
        material.color.set(0xffffff);
        material.bumpScale = 10;
      }
    } catch {}
  }, [selectedCity, layers.topography, GlobeGL]);

  const cityPoints = useMemo(() => cities.map(c => ({
    lat: c.latitude,
    lng: c.longitude,
    size: Math.max(0.3, c.overallScore / 80),
    color: getRatingColor(c.kelpHealthRating),
    city: c,
    label: `${c.cityName} (${c.overallScore.toFixed(0)}/100)`,
  })), [cities]);

  const kelpPoints = useMemo(() => tracks
    .filter(t => t.trackType === "kelp")
    .map(t => ({
      lat: t.latitude,
      lng: t.longitude,
      size: 0.15,
      color: "rgba(34, 197, 94, 0.6)",
    })), [tracks]);

  const trashPoints = useMemo(() => tracks
    .filter(t => t.trackType === "trash")
    .map(t => ({
      lat: t.latitude,
      lng: t.longitude,
      size: 0.12,
      color: "rgba(239, 68, 68, 0.6)",
    })), [tracks]);

  const predictionArcs = useMemo(() => {
    if (!showPredictions) return [];
    const grouped = new Map<string, PredictionPoint[]>();
    predictions.forEach(p => {
      const key = p.trackId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });
    const arcs: any[] = [];
    const relevantTracks = tracks.filter(t =>
      selectedCity ? t.cityId === selectedCity.id : true
    );
    relevantTracks.forEach(track => {
      const preds = grouped.get(track.id);
      if (!preds || preds.length === 0) return;
      const sorted = [...preds].sort((a, b) => a.hours - b.hours);
      const isKelp = track.trackType === "kelp";
      let prevLat = track.latitude;
      let prevLng = track.longitude;
      sorted.forEach((pred, i) => {
        const opacity = 1.0 - (i * 0.15);
        const thickness = 2.5 - (i * 0.4);
        arcs.push({
          startLat: prevLat,
          startLng: prevLng,
          endLat: pred.latitude,
          endLng: pred.longitude,
          color: isKelp
            ? `rgba(34, 197, 94, ${opacity})`
            : `rgba(239, 68, 68, ${opacity})`,
          stroke: Math.max(0.8, thickness),
          dashLength: 1,
          dashGap: 0,
          label: i === sorted.length - 1 ? `${pred.hours}h` : undefined,
        });
        prevLat = pred.latitude;
        prevLng = pred.longitude;
      });
    });
    return arcs;
  }, [predictions, tracks, showPredictions, selectedCity]);

  const allPoints = useMemo(() => [
    ...cityPoints,
    ...(selectedCity ? [] : kelpPoints),
    ...(selectedCity ? [] : trashPoints),
  ], [cityPoints, kelpPoints, trashPoints, selectedCity]);

  const oceanCurrents = useMemo(() => {
    if (!selectedCity || !layers.currents) return [];
    return generateOceanCurrents(selectedCity);
  }, [selectedCity, layers.currents]);

  const kelpRings = useMemo(() => {
    if (!selectedCity || !layers.kelp) return [];
    return generateKelpRings(selectedCity, tracks);
  }, [selectedCity, layers.kelp, tracks]);

  const ecoLabels = useMemo(() => {
    if (!selectedCity || !layers.ecoMarkers) return [];
    return generateEcoMarkers(selectedCity);
  }, [selectedCity, layers.ecoMarkers]);

  const globeTexture = selectedCity && layers.topography ? TOPO_URL : MARBLE_URL;

  if (globeError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 p-6" data-testid="section-globe">
        <div className="text-center space-y-3 max-w-md">
          <GlobeIcon className="h-10 w-10 text-primary mx-auto" />
          <h3 className="font-semibold text-foreground">3D Globe Visualization</h3>
          <p className="text-sm text-muted-foreground">
            The interactive 3D globe requires WebGL support. Select a city from the rankings panel to view detailed monitoring data.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {cities.slice(0, 4).map(city => (
              <div
                key={city.id}
                className="bg-muted rounded-md p-2 cursor-pointer hover-elevate"
                onClick={() => onCitySelect(city)}
              >
                <p className="text-xs font-medium text-foreground">{city.cityName}</p>
                <p className="text-[10px] text-muted-foreground">Score: {city.overallScore.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!GlobeGL) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20" data-testid="section-globe">
        <div className="text-center space-y-2">
          <GlobeIcon className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading interactive globe...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full" data-testid="section-globe">
      <GlobeGL
        ref={globeRef}
        globeImageUrl={globeTexture}
        bumpImageUrl={BUMP_URL}
        backgroundImageUrl={SKY_URL}
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointRadius="size"
        pointColor={(d: any) => d.color || "#0ea5e9"}
        pointAltitude={0.01}
        onPointClick={(point: any) => {
          if (point.city) {
            onCitySelect(point.city);
          }
        }}
        pointLabel={(point: any) => point.label || ""}
        arcsData={predictionArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={(d: any) => d.color || "rgba(6, 182, 212, 0.5)"}
        arcStroke="stroke"
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={1200}
        arcLabel="label"
        pathsData={oceanCurrents}
        pathPoints="points"
        pathPointLat={(p: any) => p.lat}
        pathPointLng={(p: any) => p.lng}
        pathColor={(d: any) => d.color || "rgba(6, 182, 212, 0.5)"}
        pathStroke="stroke"
        pathDashLength={0.15}
        pathDashGap={0.06}
        pathDashAnimateTime={(d: any) => d.animateTime}
        pathTransitionDuration={800}
        onPathClick={(path: any) => { if (path?.info) setInfoData(path.info); }}
        ringsData={kelpRings}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="speed"
        ringRepeatPeriod="period"
        ringColor={(d: any) => d.color}
        onRingClick={(ring: any) => { if (ring?.info) setInfoData(ring.info); }}
        labelsData={ecoLabels}
        labelLat="lat"
        labelLng="lng"
        labelText="text"
        labelSize="size"
        labelColor={(d: any) => d.color || "#0ea5e9"}
        labelDotRadius="dotRadius"
        labelResolution={2}
        labelAltitude={0.01}
        onLabelClick={(label: any) => { if (label?.info) setInfoData(label.info); }}
        width={containerRef.current?.clientWidth || 700}
        height={containerRef.current?.clientHeight || 480}
        atmosphereColor={selectedCity && layers.topography ? "#06b6d4" : "#0ea5e9"}
        atmosphereAltitude={selectedCity ? 0.12 : 0.15}
      />

      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => onCitySelect(null)}
          data-testid="button-globe-reset"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={showPredictions ? "default" : "outline"}
          className={showPredictions ? "" : "bg-background/80 backdrop-blur-sm"}
          onClick={() => setShowPredictions(!showPredictions)}
          data-testid="button-toggle-predictions"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {selectedCity && (
        <div
          className="absolute top-0 left-0 bottom-0 z-10 pointer-events-none flex items-stretch"
          data-testid="section-layer-controls"
        >
          <div
            className="flex flex-col bg-background/90 backdrop-blur-md border-r border-border/30 overflow-hidden pointer-events-auto"
            style={{
              width: panelOpen ? 240 : 0,
              opacity: panelOpen ? 1 : 0,
              transition: "width 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-border/30 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" data-testid="text-layers-header">Layers</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPanelOpen(false)}
                data-testid="button-collapse-layers"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-1.5">
              {LAYER_CONFIG.map(({ key, label, icon: Icon, color, description, source }) => {
                const active = layers[key];
                const expanded = expandedLayer === key;
                return (
                  <div key={key} className="border-b border-border/20 last:border-b-0">
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <div
                        className="w-[3px] h-5 rounded-full flex-shrink-0 transition-opacity duration-200"
                        style={{ backgroundColor: color, opacity: active ? 1 : 0.2 }}
                        data-testid={`indicator-layer-${key}`}
                      />
                      <button
                        onClick={() => toggleLayer(key)}
                        className="relative w-7 h-4 rounded-full flex-shrink-0 transition-colors duration-200 focus:outline-none"
                        style={{ backgroundColor: active ? color : "hsl(var(--muted))" }}
                        data-testid={`button-toggle-${key}`}
                        aria-label={`Toggle ${label}`}
                      >
                        <span
                          className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                          style={{ transform: active ? "translateX(14px)" : "translateX(2px)" }}
                        />
                      </button>
                      <span
                        className={`text-xs font-medium flex-1 min-w-0 truncate transition-colors duration-150 ${active ? "text-foreground" : "text-muted-foreground"}`}
                        data-testid={`text-layer-${key}`}
                      >
                        {label}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleExpanded(key)}
                        className="transition-transform duration-200"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        data-testid={`button-expand-${key}`}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <div
                      className="overflow-hidden"
                      style={{
                        maxHeight: expanded ? 200 : 0,
                        opacity: expanded ? 1 : 0,
                        transition: "max-height 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
                      }}
                    >
                      <div className="px-3.5 pb-3 pl-[2.75rem]">
                        <p className="text-[11px] leading-relaxed text-muted-foreground" data-testid={`text-desc-${key}`}>{description}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 italic" data-testid={`text-source-${key}`}>{source}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border/30 px-3.5 py-2 flex-shrink-0">
              <p className="text-[10px] text-muted-foreground/50 text-center" data-testid="text-active-count">
                {Object.values(layers).filter(Boolean).length}/{LAYER_CONFIG.length} active
              </p>
            </div>
          </div>

          {!panelOpen && (
            <div
              className="flex items-center justify-center w-8 bg-background/80 backdrop-blur-sm border-r border-border/30 text-muted-foreground pointer-events-auto cursor-pointer hover-elevate"
              onClick={() => setPanelOpen(true)}
              data-testid="button-expand-layers"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
      )}

      {infoData && (
        <div
          className="absolute bottom-14 right-3 z-20 w-72 pointer-events-auto"
          style={{ animation: "fadeSlideUp 200ms ease-out" }}
        >
          <Card className="bg-background/95 backdrop-blur-sm" data-testid="section-info-panel">
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{infoData.title}</h4>
                <Button size="icon" variant="ghost" onClick={() => setInfoData(null)} data-testid="button-close-info">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{infoData.description}</p>
              {infoData.stats && infoData.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {infoData.stats.map((s, i) => (
                    <div key={i} className="bg-muted rounded-md px-2 py-1.5 text-center">
                      <p className="text-xs font-semibold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 z-10 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          <span className="text-xs text-foreground">Kelp</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
          <span className="text-xs text-foreground">Trash</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
          <span className="text-xs text-foreground">City</span>
        </div>
        {selectedCity && layers.currents && (
          <div className="flex items-center gap-1.5">
            <svg width="16" height="8" viewBox="0 0 16 8"><line x1="0" y1="4" x2="12" y2="4" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 2" /><polygon points="12,0 16,4 12,8" fill="#06b6d4" /></svg>
            <span className="text-xs text-foreground">Current</span>
          </div>
        )}
        {showPredictions && (
          <div className="flex items-center gap-1.5">
            <svg width="16" height="8" viewBox="0 0 16 8"><line x1="0" y1="4" x2="12" y2="4" stroke="#22c55e" strokeWidth="2" /><polygon points="12,0 16,4 12,8" fill="#22c55e" /></svg>
            <span className="text-xs text-foreground">Drift Path</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tracking() {
  const [selectedCity, setSelectedCity] = useState<CityMonitor | null>(null);

  const { data: cities, isLoading: citiesLoading } = useQuery<CityMonitor[]>({
    queryKey: ["/api/cities"],
    refetchInterval: 15000,
  });

  const { data: tracks } = useQuery<KelpTrashTrack[]>({
    queryKey: ["/api/tracks"],
    refetchInterval: 15000,
  });

  const { data: predictionData } = useQuery<any>({
    queryKey: ["/api/predictions", selectedCity?.id || ""],
    enabled: !!selectedCity,
    refetchInterval: 30000,
  });

  if (citiesLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const sortedCities = [...(cities || [])].sort((a, b) => b.overallScore - a.overallScore);
  const predictions: PredictionPoint[] = predictionData?.predictions || [];

  const totalKelpDensity = cities ? (cities.reduce((s, c) => s + c.kelpDensity, 0) / cities.length).toFixed(1) : "0";
  const totalTrashLevel = cities ? (cities.reduce((s, c) => s + c.trashLevel, 0) / cities.length).toFixed(1) : "0";
  const avgScore = cities ? (cities.reduce((s, c) => s + c.overallScore, 0) / cities.length).toFixed(0) : "0";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-tracking-title">Global Ocean Tracking</h1>
            <Badge variant="secondary" className="gap-1">
              <GlobeIcon className="h-3 w-3" />
              {cities?.length || 0} Cities
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Interactive 3D globe with real-time kelp &amp; trash predictions across {cities?.length || 0} coastal cities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-2/10 p-2.5 shrink-0">
              <Leaf className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Kelp Density</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-avg-kelp">{totalKelpDensity}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-destructive/10 p-2.5 shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Trash Level</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-avg-trash">{totalTrashLevel}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-1/10 p-2.5 shrink-0">
              <Waves className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Ocean Score</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-avg-score">{avgScore}/100</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-visible" data-testid="section-world-map">
            <div style={{ height: "520px", background: "#000" }} className="rounded-md overflow-hidden">
              <GlobeComponent
                cities={cities || []}
                tracks={tracks || []}
                predictions={predictions}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4 max-h-[580px] overflow-auto">
          <h3 className="font-semibold text-foreground text-sm sticky top-0 bg-background py-1 z-10" data-testid="text-city-rankings">City Quality Rankings</h3>
          {sortedCities.map((city, idx) => (
            <Card
              key={city.id}
              className={`p-3 cursor-pointer hover-elevate ${selectedCity?.id === city.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedCity(city)}
              data-testid={`card-city-${city.cityName.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{city.cityName}</p>
                  <p className="text-xs text-muted-foreground">{city.country}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{city.overallScore.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <ScoreBar label="Kelp Health" value={city.kelpDensity} max={100} color={getRatingColor(city.kelpHealthRating)} />
                <ScoreBar label="Trash Level" value={city.trashLevel} max={100} color={city.trashLevel > 50 ? "#ef4444" : "#eab308"} />
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge variant={getRatingBadgeVariant(city.kelpHealthRating)} className="text-[10px]">
                  {city.kelpHealthRating}
                </Badge>
                <Badge variant={getRatingBadgeVariant(city.trashRating)} className="text-[10px]">
                  Trash: {city.trashRating}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedCity && (
        <Card className="p-6" data-testid="section-city-detail">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">{selectedCity.cityName}, {selectedCity.country}</h3>
                <p className="text-xs text-muted-foreground">{selectedCity.latitude.toFixed(4)}, {selectedCity.longitude.toFixed(4)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getRatingBadgeVariant(selectedCity.kelpHealthRating)} className="gap-1">
                <Leaf className="h-3 w-3" />
                Kelp: {selectedCity.kelpHealthRating}
              </Badge>
              <Badge variant={getRatingBadgeVariant(selectedCity.trashRating)} className="gap-1">
                <Trash2 className="h-3 w-3" />
                Trash: {selectedCity.trashRating}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCity.kelpDensity.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Kelp Density</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCity.trashLevel.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Trash Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCity.overallScore.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Overall Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCity.waterTemp?.toFixed(1) || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Water Temp (C)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{selectedCity.currentSpeed?.toFixed(1) || "N/A"}</p>
              <p className="text-xs text-muted-foreground">Current (m/s)</p>
            </div>
          </div>

          {predictions.length > 0 && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                Movement Predictions (Kelp &amp; Trash)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[6, 12, 24, 48].map(hours => {
                  const hourPreds = predictions.filter(p => p.hours === hours);
                  const kelpPreds = hourPreds.filter(p => p.trackType === "kelp");
                  const trashPreds = hourPreds.filter(p => p.trackType === "trash");
                  const avgKelpConf = kelpPreds.length > 0 ? (kelpPreds.reduce((s, p) => s + p.confidence, 0) / kelpPreds.length) : 0;
                  const avgTrashConf = trashPreds.length > 0 ? (trashPreds.reduce((s, p) => s + p.confidence, 0) / trashPreds.length) : 0;
                  return (
                    <div key={hours} className="bg-muted rounded-md p-3" data-testid={`prediction-${hours}h`}>
                      <p className="text-xs font-semibold text-foreground mb-2">+{hours}h Forecast</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kelp tracks</span>
                          <span className="text-foreground">{kelpPreds.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Trash tracks</span>
                          <span className="text-foreground">{trashPreds.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="text-foreground">{Math.round((avgKelpConf + avgTrashConf) / 2)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Data Flow Pipeline</h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
              {[
                { label: "Satellite Feed", icon: GlobeIcon },
                { label: "Drone Scan", icon: Navigation },
                { label: "AI Analysis", icon: Activity },
                { label: "Kelp Detection", icon: Leaf },
                { label: "Trash Detection", icon: Trash2 },
                { label: "Predictions", icon: Crosshair },
                { label: "City Dashboard", icon: MapPin },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 shrink-0" data-testid={`flow-step-${i}`}>
                  <div className="flex items-center gap-1.5 bg-muted rounded-md px-3 py-2">
                    <step.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{step.label}</span>
                  </div>
                  {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
