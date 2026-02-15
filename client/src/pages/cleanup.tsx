import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CleanupOperation, CityMonitor, Donation } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Waves,
  ArrowRight,
  Loader2,
  Shield,
  Target,
  TrendingUp,
  Navigation,
  Satellite,
  Brain,
  BarChart3,
  Leaf,
  Globe,
  Sun,
  Cloud,
  Wind,
  ThermometerSun,
  Droplets,
  Calendar,
  Heart,
  ExternalLink,
  Link2,
  Activity,
  Megaphone,
  Package,
} from "lucide-react";
import { SiSolana } from "react-icons/si";

function getRatingBadgeVariant(rating: string): "default" | "secondary" | "destructive" | "outline" {
  switch (rating) {
    case "Excellent": return "default";
    case "Good": return "secondary";
    case "Fair": return "outline";
    case "Poor": return "destructive";
    default: return "outline";
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "completed": "default",
    "in-progress": "secondary",
    "planned": "outline",
    "on-hold": "destructive",
  };
  return (
    <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
      {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: "text-destructive",
    high: "text-chart-4",
    medium: "text-chart-3",
    low: "text-muted-foreground",
  };
  return (
    <span className={`text-xs font-medium ${colors[priority] || "text-muted-foreground"}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function FlowDiagram() {
  const stages = [
    { icon: Satellite, label: "Detection", desc: "Identify debris" },
    { icon: Brain, label: "AI Analysis", desc: "Classify & rank" },
    { icon: Target, label: "Planning", desc: "Route optimize" },
    { icon: Navigation, label: "Dispatch", desc: "Deploy fleet" },
    { icon: Trash2, label: "Collection", desc: "Cleanup ops" },
    { icon: BarChart3, label: "Reporting", desc: "Impact data" },
  ];

  return (
    <div className="space-y-3" data-testid="section-flow-diagram">
      <h3 className="font-semibold text-foreground text-sm">Cleanup Operations Pipeline</h3>
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-1.5 bg-muted rounded-md px-3 py-3 min-w-[100px]">
              <div className="rounded-full bg-primary/10 p-2">
                <stage.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground text-center whitespace-nowrap">{stage.label}</span>
              <span className="text-[10px] text-muted-foreground text-center">{stage.desc}</span>
            </div>
            {i < stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-8" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataFlowDiagram() {
  const flows = [
    { from: "Drone Sensors", to: "Data Ingestion", color: "#0ea5e9" },
    { from: "Data Ingestion", to: "AI Processing", color: "#22c55e" },
    { from: "AI Processing", to: "Kelp Classification", color: "#22c55e" },
    { from: "AI Processing", to: "Trash Detection", color: "#ef4444" },
    { from: "Kelp Classification", to: "Health Rating", color: "#22c55e" },
    { from: "Trash Detection", to: "Cleanup Queue", color: "#ef4444" },
    { from: "Health Rating", to: "City Dashboard", color: "#0ea5e9" },
    { from: "Cleanup Queue", to: "Dispatch System", color: "#eab308" },
  ];

  return (
    <div className="space-y-3" data-testid="section-data-flow">
      <h3 className="font-semibold text-foreground text-sm">Data Flow Architecture</h3>
      <div className="space-y-1.5">
        {flows.map((flow, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="bg-muted rounded px-2.5 py-1.5 min-w-[120px]">
              <span className="text-xs font-medium text-foreground">{flow.from}</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="h-0.5 flex-1" style={{ backgroundColor: flow.color, opacity: 0.5 }} />
              <ArrowRight className="h-3 w-3 shrink-0" style={{ color: flow.color }} />
            </div>
            <div className="bg-muted rounded px-2.5 py-1.5 min-w-[120px]">
              <span className="text-xs font-medium text-foreground">{flow.to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherSection({ cityId }: { cityId: string }) {
  const { data: weatherData, isLoading } = useQuery<any>({
    queryKey: ["/api/weather", cityId],
    enabled: !!cityId,
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!weatherData?.forecast) return null;

  const forecast = weatherData.forecast.slice(0, 5);
  const conditionIcons: Record<string, any> = {
    "Sunny": Sun,
    "Clear": Sun,
    "Partly Cloudy": Cloud,
    "Cloudy": Cloud,
    "Light Rain": Droplets,
  };

  return (
    <div className="space-y-3" data-testid="section-weather">
      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
        <ThermometerSun className="h-4 w-4 text-primary" />
        5-Day Weather &amp; Marine Forecast — {weatherData.city}
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {forecast.map((day: any, i: number) => {
          const Icon = conditionIcons[day.condition] || Cloud;
          const dayName = i === 0 ? "Today" : new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div key={day.date} className="bg-muted rounded-md p-3 text-center" data-testid={`weather-day-${i}`}>
              <p className="text-xs font-medium text-foreground mb-1">{dayName}</p>
              <Icon className="h-5 w-5 mx-auto text-chart-3 mb-1" />
              <p className="text-sm font-bold text-foreground">{day.airTemp}°C</p>
              <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                <p>Water: {day.waterTemp}°C</p>
                <p>Wind: {day.windSpeed} km/h {day.windDir}</p>
                <p>Waves: {day.waveHeight}m</p>
                <p>UV: {day.uvIndex}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-border space-y-1 text-[10px]">
                <p className="text-muted-foreground">Kelp: <span className="text-foreground font-medium">{day.expectedKelp}%</span></p>
                <p className="text-muted-foreground">Algae: <span className="text-foreground font-medium">{day.expectedAlgae}%</span></p>
                <p className="text-muted-foreground">Plankton: <span className="text-foreground font-medium">{day.expectedPlankton}%</span></p>
              </div>
              <Badge variant={day.cleanupSuitability === "Good" ? "default" : day.cleanupSuitability === "Fair" ? "outline" : "destructive"} className="mt-2 text-[9px]">
                {day.cleanupSuitability}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SolanaDonationSection() {
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [purpose, setPurpose] = useState("Trash Bags & Supplies");
  const [walletAddress, setWalletAddress] = useState("");

  const { data: allDonations } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
  });

  const donationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/donations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
      setDonationAmount("");
      setDonorName("");
      setWalletAddress("");
    },
  });

  const supplyOptions = [
    { label: "Trash Bags & Supplies", icon: Package, amount: 0.1 },
    { label: "Safety Equipment", icon: Shield, amount: 0.25 },
    { label: "Drone Fuel & Maintenance", icon: Navigation, amount: 0.5 },
    { label: "Marine Research Fund", icon: Activity, amount: 1.0 },
  ];

  const totalDonated = (allDonations || []).reduce((s, d) => s + d.amount, 0);
  const completedDonations = (allDonations || []).filter(d => d.status === "completed").length;

  const handleDonate = () => {
    const amt = parseFloat(donationAmount) || 0.1;
    donationMutation.mutate({
      amount: amt,
      purpose,
      donorName: donorName || "Anonymous",
      walletAddress: walletAddress || null,
      txSignature: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      status: "completed",
    });
  };

  return (
    <Card className="p-6" data-testid="section-solana-donation">
      <div className="flex items-center gap-2 mb-4">
        <SiSolana className="h-5 w-5 text-[#9945FF]" />
        <h3 className="font-semibold text-foreground text-sm">Solana Donation Hub</h3>
        <Badge variant="outline" className="gap-1 text-[10px]">
          Devnet
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalDonated.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total SOL Donated</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completedDonations}</p>
          <p className="text-xs text-muted-foreground">Completed Donations</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{(allDonations || []).length}</p>
          <p className="text-xs text-muted-foreground">Total Donors</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">Select Supply Category</p>
          <div className="grid grid-cols-2 gap-2">
            {supplyOptions.map(opt => (
              <div
                key={opt.label}
                className={`bg-muted rounded-md p-2.5 cursor-pointer transition-colors ${purpose === opt.label ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setPurpose(opt.label);
                  setDonationAmount(opt.amount.toString());
                }}
                data-testid={`option-supply-${opt.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <opt.icon className="h-4 w-4 text-primary mb-1" />
                <p className="text-xs font-medium text-foreground">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground">{opt.amount} SOL</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Amount (SOL)</label>
            <Input
              type="number"
              step="0.01"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="0.1"
              data-testid="input-donation-amount"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Your Name (optional)</label>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonymous"
              data-testid="input-donor-name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Wallet Address (optional)</label>
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Phantom wallet address"
              data-testid="input-wallet-address"
            />
          </div>
          <Button
            onClick={handleDonate}
            disabled={donationMutation.isPending}
            className="w-full gap-2"
            data-testid="button-donate"
          >
            {donationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SiSolana className="h-4 w-4" />
            )}
            Donate {donationAmount || "0.1"} SOL for {purpose}
          </Button>
        </div>
      </div>

      {(allDonations || []).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-foreground mb-2">Recent Donations</h4>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {(allDonations || []).slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2" data-testid={`row-donation-${d.id}`}>
                <Heart className="h-3 w-3 text-destructive shrink-0" />
                <span className="font-medium text-foreground">{d.donorName || "Anonymous"}</span>
                <span className="text-muted-foreground">{d.purpose}</span>
                <span className="ml-auto font-bold text-foreground">{d.amount.toFixed(2)} SOL</span>
                {d.txSignature && (
                  <span className="text-muted-foreground font-mono text-[10px] truncate max-w-[80px]">{d.txSignature.slice(0, 12)}...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function ExternalDataSection() {
  const [editUrl, setEditUrl] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const { data: extData, isLoading } = useQuery<any>({
    queryKey: ["/api/external-data"],
    refetchInterval: 30000,
  });

  const { data: currentSetting } = useQuery<any>({
    queryKey: ["/api/settings", "external_data_url"],
  });

  const saveMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/settings", { key: "external_data_url", value: url });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings", "external_data_url"] });
      setShowEdit(false);
    },
  });

  return (
    <Card className="p-6" data-testid="section-external-data">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">External Data Service</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setShowEdit(!showEdit); setEditUrl(currentSetting?.value || ""); }}
          data-testid="button-edit-url"
        >
          <ExternalLink className="h-3 w-3" />
          {showEdit ? "Cancel" : "Configure URL"}
        </Button>
      </div>

      {showEdit && (
        <div className="flex gap-2 mb-3">
          <Input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://api.example.com/ocean-data"
            className="flex-1"
            data-testid="input-external-url"
          />
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(editUrl)}
            disabled={saveMutation.isPending || !editUrl.trim()}
            data-testid="button-save-url"
          >
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}

      {isLoading && <Skeleton className="h-20 w-full" />}

      {extData && !extData.configured && (
        <p className="text-xs text-muted-foreground">No external data URL configured. Click "Configure URL" to set up a data source.</p>
      )}

      {extData?.configured && extData?.error && (
        <div className="bg-destructive/10 rounded-md p-3 text-xs text-destructive">
          Error fetching: {extData.error}
        </div>
      )}

      {extData?.configured && extData?.data && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Source: {extData.url} &middot; Fetched: {new Date(extData.fetchedAt).toLocaleTimeString()}</p>
          <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
              {JSON.stringify(extData.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Cleanup() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const { data: ops, isLoading: opsLoading } = useQuery<CleanupOperation[]>({
    queryKey: ["/api/cleanup"],
    refetchInterval: 10000,
  });

  const { data: cities } = useQuery<CityMonitor[]>({
    queryKey: ["/api/cities"],
  });

  if (opsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="p-6"><Skeleton className="h-20" /></Card>)}
        </div>
      </div>
    );
  }

  const operations = ops || [];
  const cityMap = new Map((cities || []).map(c => [c.id, c]));
  const sortedCities = [...(cities || [])].sort((a, b) => b.trashLevel - a.trashLevel);

  const completedOps = operations.filter(o => o.status === "completed");
  const totalTrashCollected = operations.reduce((s, o) => s + (o.trashCollected || 0), 0);
  const totalAreaCleaned = operations.reduce((s, o) => s + (o.areaCleanedKm2 || 0), 0);
  const totalDrones = operations.reduce((s, o) => s + (o.dronesDeployed || 0), 0);

  const statusData = [
    { name: "Completed", value: completedOps.length, color: "#22c55e" },
    { name: "In Progress", value: operations.filter(o => o.status === "in-progress").length, color: "#0ea5e9" },
    { name: "Planned", value: operations.filter(o => o.status === "planned").length, color: "#eab308" },
    { name: "On Hold", value: operations.filter(o => o.status === "on-hold").length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const cityCleanupsMap = new Map<string, number>();
  operations.forEach(op => {
    if (op.cityId) cityCleanupsMap.set(op.cityId, (cityCleanupsMap.get(op.cityId) || 0) + 1);
  });

  const cityCleanupData = Array.from(cityCleanupsMap.entries())
    .map(([cityId, count]) => ({
      city: cityMap.get(cityId)?.cityName || "Unknown",
      trash: operations.filter(o => o.cityId === cityId).reduce((s, o) => s + (o.trashCollected || 0), 0),
    }))
    .sort((a, b) => b.trash - a.trash)
    .slice(0, 8);

  const urgentSpots = sortedCities.slice(0, 5);

  const upcomingCleanups = operations
    .filter(o => o.status === "planned" || o.status === "in-progress")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const weatherCityId = selectedCityId || urgentSpots[0]?.id || null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-cleanup-title">Cleanup Dashboard</h1>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              {operations.length} Operations
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage marine debris cleanup operations with real-time tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-2/10 p-2.5 shrink-0"><Trash2 className="h-5 w-5 text-chart-2" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Trash Collected</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-trash">{totalTrashCollected.toFixed(0)} kg</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-1/10 p-2.5 shrink-0"><Waves className="h-5 w-5 text-chart-1" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Area Cleaned</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-area">{totalAreaCleaned.toFixed(1)} km2</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-4/10 p-2.5 shrink-0"><Navigation className="h-5 w-5 text-chart-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Drones Deployed</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-drones">{totalDrones}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2.5 shrink-0"><CheckCircle className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-completion-rate">
                {operations.length > 0 ? ((completedOps.length / operations.length) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6" data-testid="section-urgent-spots">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-foreground text-sm">Most Urgent Cleanup Spots</h3>
          </div>
          <div className="space-y-3">
            {urgentSpots.map((city, idx) => (
              <div
                key={city.id}
                className={`flex items-center gap-3 p-3 bg-muted/50 rounded-md cursor-pointer ${selectedCityId === city.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedCityId(city.id)}
                data-testid={`urgent-spot-${idx}`}
              >
                <span className="text-sm font-bold text-destructive w-5">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{city.cityName}, {city.country}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive" className="text-[10px]">Trash: {city.trashLevel.toFixed(1)}%</Badge>
                    <Badge variant={getRatingBadgeVariant(city.kelpHealthRating)} className="text-[10px]">Kelp: {city.kelpHealthRating}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{city.overallScore.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" data-testid="section-upcoming-cleanups">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Upcoming Cleanup Days</h3>
          </div>
          {upcomingCleanups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No upcoming cleanup operations scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingCleanups.map((op) => {
                const city = op.cityId ? cityMap.get(op.cityId) : null;
                return (
                  <div key={op.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md" data-testid={`upcoming-cleanup-${op.id}`}>
                    <div className="text-center bg-primary/10 rounded-md px-3 py-2 shrink-0">
                      <p className="text-xs font-bold text-primary">{new Date(op.startDate).toLocaleDateString("en-US", { month: "short" })}</p>
                      <p className="text-lg font-bold text-foreground">{new Date(op.startDate).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{op.operationName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{city.cityName}</span>}
                        <span>{op.dronesDeployed || 0} drones</span>
                      </div>
                    </div>
                    <StatusBadge status={op.status} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {weatherCityId && (
        <Card className="p-6">
          <WeatherSection cityId={weatherCityId} />
        </Card>
      )}

      <Card className="p-6" data-testid="section-call-to-action">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Call to Action: Join the Ocean Cleanup</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Our oceans need your help. With {urgentSpots.length} cities at critical trash levels and {operations.filter(o => o.status === "in-progress").length} active cleanup operations,
          every contribution makes a difference. Donate via Solana below to fund cleanup supplies, volunteer for upcoming events, or spread the word.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-muted rounded-md p-4">
            <Trash2 className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">{totalTrashCollected.toFixed(0)} kg</p>
            <p className="text-xs text-muted-foreground">Trash Removed So Far</p>
          </div>
          <div className="bg-muted rounded-md p-4">
            <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">{(cities || []).length}</p>
            <p className="text-xs text-muted-foreground">Cities Monitored</p>
          </div>
          <div className="bg-muted rounded-md p-4">
            <TrendingUp className="h-6 w-6 text-chart-2 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">{totalAreaCleaned.toFixed(1)} km2</p>
            <p className="text-xs text-muted-foreground">Ocean Area Cleaned</p>
          </div>
        </div>
      </Card>

      <SolanaDonationSection />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Cleanup by City (Trash Collected)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityCleanupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
              <XAxis dataKey="city" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(210, 15%, 96%)", border: "1px solid hsl(210, 12%, 90%)", borderRadius: "6px", fontSize: "12px" }} />
              <Bar dataKey="trash" name="Trash (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Operations Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ExternalDataSection />

      <Card className="p-6"><FlowDiagram /></Card>
      <Card className="p-6"><DataFlowDiagram /></Card>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 text-sm">All Operations</h3>
        <div className="space-y-3">
          {operations.length === 0 ? (
            <div className="p-8 text-center">
              <Trash2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No cleanup operations scheduled yet.</p>
            </div>
          ) : (
            operations.map((op) => {
              const city = op.cityId ? cityMap.get(op.cityId) : null;
              return (
                <div key={op.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md" data-testid={`row-operation-${op.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-foreground text-sm">{op.operationName}</span>
                      <StatusBadge status={op.status} />
                      <PriorityBadge priority={op.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{city.cityName}</span>}
                      <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" />{(op.trashCollected || 0).toFixed(0)} kg</span>
                      <span className="flex items-center gap-1"><Waves className="h-3 w-3" />{(op.areaCleanedKm2 || 0).toFixed(1)} km2</span>
                      <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{op.dronesDeployed || 0} drones</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(op.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
