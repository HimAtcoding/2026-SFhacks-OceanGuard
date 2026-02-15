import { useState, useEffect } from "react";
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
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Navigation,
  ThermometerSun,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function getRatingColor(rating: string): string {
  switch (rating) {
    case "Excellent": return "hsl(145, 60%, 45%)";
    case "Good": return "hsl(195, 82%, 48%)";
    case "Fair": return "hsl(45, 80%, 50%)";
    case "Poor": return "hsl(0, 72%, 50%)";
    default: return "hsl(210, 8%, 60%)";
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

function FlyToCity({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 8, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1" data-testid={`score-bar-${label.toLowerCase().replace(/\s+/g, "-")}`}>
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

export default function Tracking() {
  const [selectedCity, setSelectedCity] = useState<CityMonitor | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  const { data: cities, isLoading: citiesLoading } = useQuery<CityMonitor[]>({
    queryKey: ["/api/cities"],
    refetchInterval: 15000,
  });

  const { data: tracks } = useQuery<KelpTrashTrack[]>({
    queryKey: ["/api/tracks", selectedCity?.id],
    refetchInterval: 15000,
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
  const kelpTracks = (tracks || []).filter(t => t.trackType === "kelp");
  const trashTracks = (tracks || []).filter(t => t.trackType === "trash");

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
              <Globe className="h-3 w-3" />
              {cities?.length || 0} Cities
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time kelp density and marine debris tracking across {cities?.length || 0} coastal cities worldwide &middot; Data since Feb 14, 2025
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
          <Card className="overflow-hidden" data-testid="section-world-map">
            <div style={{ height: "480px" }}>
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {flyTo && <FlyToCity lat={flyTo.lat} lng={flyTo.lng} />}

                {(cities || []).map((city) => (
                  <CircleMarker
                    key={city.id}
                    center={[city.latitude, city.longitude]}
                    radius={Math.max(6, city.overallScore / 8)}
                    pathOptions={{
                      color: getRatingColor(city.kelpHealthRating),
                      fillColor: getRatingColor(city.kelpHealthRating),
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedCity(city);
                        setFlyTo({ lat: city.latitude, lng: city.longitude });
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 min-w-[160px]">
                        <p className="font-bold text-sm">{city.cityName}, {city.country}</p>
                        <p>Kelp: {city.kelpDensity.toFixed(1)}% ({city.kelpHealthRating})</p>
                        <p>Trash: {city.trashLevel.toFixed(1)}% ({city.trashRating})</p>
                        <p>Score: {city.overallScore.toFixed(0)}/100</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}

                {kelpTracks.map((track) => (
                  <CircleMarker
                    key={track.id}
                    center={[track.latitude, track.longitude]}
                    radius={3}
                    pathOptions={{ color: "hsl(145, 60%, 45%)", fillColor: "hsl(145, 60%, 45%)", fillOpacity: 0.5, weight: 1 }}
                  />
                ))}

                {trashTracks.map((track) => (
                  <CircleMarker
                    key={track.id}
                    center={[track.latitude, track.longitude]}
                    radius={3}
                    pathOptions={{ color: "hsl(0, 72%, 50%)", fillColor: "hsl(0, 72%, 50%)", fillOpacity: 0.5, weight: 1 }}
                  />
                ))}
              </MapContainer>
            </div>
            <div className="p-3 border-t border-border flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(145, 60%, 45%)" }} />
                <span className="text-xs text-muted-foreground">Kelp Beds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(0, 72%, 50%)" }} />
                <span className="text-xs text-muted-foreground">Trash Debris</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "hsl(195, 82%, 48%)" }} />
                <span className="text-xs text-muted-foreground">City Monitor</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 max-h-[540px] overflow-auto">
          <h3 className="font-semibold text-foreground text-sm sticky top-0 bg-background py-1 z-10">City Rankings</h3>
          {sortedCities.map((city, idx) => (
            <Card
              key={city.id}
              className={`p-3 cursor-pointer hover-elevate ${selectedCity?.id === city.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => {
                setSelectedCity(city);
                setFlyTo({ lat: city.latitude, lng: city.longitude });
              }}
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
                <ScoreBar label="Kelp" value={city.kelpDensity} max={100} color={getRatingColor(city.kelpHealthRating)} />
                <ScoreBar label="Trash" value={city.trashLevel} max={100} color={city.trashLevel > 50 ? "hsl(0, 72%, 50%)" : "hsl(45, 80%, 50%)"} />
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
              <Badge variant={getRatingBadgeVariant(selectedCity.trashRating === "Excellent" ? "Excellent" : selectedCity.trashRating === "Good" ? "Good" : selectedCity.trashRating === "Fair" ? "Fair" : "Poor")} className="gap-1">
                <Trash2 className="h-3 w-3" />
                Trash: {selectedCity.trashRating}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Data Flow Pipeline</h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
              {[
                { label: "Satellite Feed", icon: Globe },
                { label: "Drone Scan", icon: Navigation },
                { label: "Kelp Detection", icon: Leaf },
                { label: "Trash Detection", icon: Trash2 },
                { label: "Quality Rating", icon: TrendingUp },
                { label: "City Dashboard", icon: MapPin },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 shrink-0" data-testid={`flow-step-${i}`}>
                  <div className="flex items-center gap-1.5 bg-muted rounded-md px-3 py-2">
                    <step.icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{step.label}</span>
                  </div>
                  {i < 5 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
