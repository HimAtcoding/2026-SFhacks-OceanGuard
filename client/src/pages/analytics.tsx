import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { DroneScan, Alert } from "@shared/schema";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  MapPin,
  Droplets,
  Thermometer,
  Waves,
  Leaf,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

function InsightCard({
  icon: Icon,
  title,
  value,
  trend,
  description,
}: {
  icon: any;
  title: string;
  value: string;
  trend: "up" | "down" | "stable";
  description: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="rounded-md bg-primary/10 p-2 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend === "up" && <TrendingUp className="h-4 w-4 text-chart-3" />}
        {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
        {trend === "stable" && <Activity className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-xl font-bold text-foreground mb-0.5">{value}</p>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
}

export default function Analytics() {
  const { data: scans, isLoading: scansLoading } = useQuery<DroneScan[]>({
    queryKey: ["/api/scans"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  if (scansLoading || alertsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="p-5"><Skeleton className="h-24" /></Card>)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6"><Skeleton className="h-64" /></Card>
          <Card className="p-6"><Skeleton className="h-64" /></Card>
        </div>
      </div>
    );
  }

  const allScans = scans || [];
  const allAlerts = alerts || [];
  const activeAlerts = allAlerts.filter(a => !a.resolved);

  const zones = [...new Set(allScans.map(s => s.location.split(",")[0].trim()))];

  const zoneStats = zones.map(zone => {
    const zoneScans = allScans.filter(s => s.location.split(",")[0].trim() === zone);
    return {
      zone,
      avgQuality: zoneScans.reduce((s, sc) => s + sc.waterQuality, 0) / zoneScans.length,
      avgAlgae: zoneScans.reduce((s, sc) => s + sc.algaeLevel, 0) / zoneScans.length,
      avgNDVI: zoneScans.reduce((s, sc) => s + sc.greeneryIndex, 0) / zoneScans.length,
      count: zoneScans.length,
      avgPh: zoneScans.filter(s => s.phLevel).reduce((s, sc) => s + (sc.phLevel || 0), 0) / (zoneScans.filter(s => s.phLevel).length || 1),
    };
  });

  const timeSeriesData = allScans.slice(0, 20).reverse().map((s, i) => ({
    index: i + 1,
    pH: s.phLevel || 7,
    DO: s.dissolvedOxygen || 6,
    temp: s.temperature || 20,
    turbidity: s.turbidity || 3,
  }));

  const correlationData = allScans.slice(0, 30).map(s => ({
    algae: s.algaeLevel,
    quality: s.waterQuality,
    ndvi: s.greeneryIndex * 100,
    temp: s.temperature || 20,
  }));

  const radarData = [
    { metric: "Water Quality", value: allScans.length > 0 ? allScans.reduce((s, sc) => s + sc.waterQuality, 0) / allScans.length : 0 },
    { metric: "NDVI", value: allScans.length > 0 ? (allScans.reduce((s, sc) => s + sc.greeneryIndex, 0) / allScans.length) * 100 : 0 },
    { metric: "pH Balance", value: allScans.length > 0 ? (allScans.filter(s => s.phLevel).reduce((s, sc) => s + (sc.phLevel || 0), 0) / (allScans.filter(s => s.phLevel).length || 1)) * 10 : 70 },
    { metric: "Low Algae", value: allScans.length > 0 ? 100 - allScans.reduce((s, sc) => s + sc.algaeLevel, 0) / allScans.length : 50 },
    { metric: "Dissolved O2", value: allScans.length > 0 ? (allScans.filter(s => s.dissolvedOxygen).reduce((s, sc) => s + (sc.dissolvedOxygen || 0), 0) / (allScans.filter(s => s.dissolvedOxygen).length || 1)) * 10 : 60 },
    { metric: "Temp Stability", value: 70 },
  ];

  const overallHealth = allScans.length > 0
    ? allScans.reduce((s, sc) => s + sc.waterQuality, 0) / allScans.length
    : 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-analytics-title">Analytics</h1>
          <Badge variant="secondary" className="gap-1">
            <BarChart3 className="h-3 w-3" />
            {allScans.length} Data Points
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Deep data analysis across {zones.length} monitoring zones &middot; Cloud analytics warehouse
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InsightCard
          icon={Droplets}
          title="Overall Health"
          value={`${overallHealth.toFixed(0)}%`}
          trend={overallHealth > 65 ? "up" : "down"}
          description="Aggregate water quality index"
        />
        <InsightCard
          icon={Waves}
          title="Bloom Risk"
          value={allScans.length > 0 ? `${(allScans.reduce((s, sc) => s + sc.algaeLevel, 0) / allScans.length).toFixed(0)}%` : "0%"}
          trend={allScans.length > 0 && allScans.reduce((s, sc) => s + sc.algaeLevel, 0) / allScans.length > 40 ? "up" : "stable"}
          description="Average algae concentration"
        />
        <InsightCard
          icon={AlertTriangle}
          title="Active Alerts"
          value={activeAlerts.length.toString()}
          trend={activeAlerts.length > 3 ? "up" : "stable"}
          description="Unresolved environmental alerts"
        />
        <InsightCard
          icon={MapPin}
          title="Coverage"
          value={zones.length.toString()}
          trend="stable"
          description="Active monitoring zones"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Sensor Data Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(195, 82%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(195, 82%, 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
              <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(210, 15%, 96%)",
                  border: "1px solid hsl(210, 12%, 90%)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="pH" name="pH" stroke="hsl(195, 82%, 48%)" fill="url(#phGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="DO" name="Dissolved O2" stroke="hsl(145, 60%, 45%)" fill="url(#doGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Ocean Health Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(210, 12%, 85%)" strokeOpacity={0.5} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
              <PolarRadiusAxis tick={{ fontSize: 9 }} stroke="hsl(210, 8%, 60%)" domain={[0, 100]} />
              <Radar name="Health Score" dataKey="value" stroke="hsl(195, 82%, 48%)" fill="hsl(195, 82%, 48%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4 text-sm">Zone Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={zoneStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
            <XAxis dataKey="zone" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(210, 15%, 96%)",
                border: "1px solid hsl(210, 12%, 90%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="avgQuality" name="Water Quality %" fill="hsl(195, 82%, 48%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avgAlgae" name="Algae Level %" fill="hsl(145, 60%, 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6" data-testid="section-zone-details">
        <h3 className="font-semibold text-foreground mb-4 text-sm">Zone Details</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {zoneStats.map(z => (
            <Card key={z.zone} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm text-foreground">{z.zone}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{z.count} scans</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Quality</p>
                  <p className="text-sm font-semibold text-foreground">{z.avgQuality.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Algae</p>
                  <p className="text-sm font-semibold text-foreground">{z.avgAlgae.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NDVI</p>
                  <p className="text-sm font-semibold text-foreground">{z.avgNDVI.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
