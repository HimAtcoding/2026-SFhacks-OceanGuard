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
    if (globeRef.current && selectedCity) {
      globeRef.current.pointOfView(
        { lat: selectedCity.latitude, lng: selectedCity.longitude, altitude: 0.5 },
        1500
      );
    } else if (globeRef.current && !selectedCity) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 }, 1500);
    }
  }, [selectedCity]);

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
      const furthest = preds.reduce((a, b) => a.hours > b.hours ? a : b);
      arcs.push({
        startLat: track.latitude,
        startLng: track.longitude,
        endLat: furthest.latitude,
        endLng: furthest.longitude,
        color: track.trackType === "kelp"
          ? ["rgba(34, 197, 94, 0.8)", "rgba(34, 197, 94, 0.2)"]
          : ["rgba(239, 68, 68, 0.8)", "rgba(239, 68, 68, 0.2)"],
        stroke: 1,
        dashLength: 0.3,
        dashGap: 0.1,
      });
    });
    return arcs;
  }, [predictions, tracks, showPredictions, selectedCity]);

  const allPoints = useMemo(() => [
    ...cityPoints,
    ...kelpPoints,
    ...trashPoints,
  ], [cityPoints, kelpPoints, trashPoints]);

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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        pointsData={allPoints}
        pointLat="lat"
        pointLng="lng"
        pointRadius="size"
        pointColor="color"
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
        arcColor="color"
        arcStroke="stroke"
        arcDashLength="dashLength"
        arcDashGap="dashGap"
        arcDashAnimateTime={2000}
        width={containerRef.current?.clientWidth || 700}
        height={containerRef.current?.clientHeight || 480}
        atmosphereColor="#0ea5e9"
        atmosphereAltitude={0.15}
      />
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => {
            onCitySelect(null);
          }}
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
      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-md px-3 py-2 z-10">
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
        {showPredictions && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#22c55e] rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, #22c55e 2px, #22c55e 4px)" }} />
            <span className="text-xs text-foreground">Predictions</span>
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
