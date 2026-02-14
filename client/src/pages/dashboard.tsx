import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { DroneScan, Alert } from "@shared/schema";
import {
  Waves,
  Leaf,
  Droplets,
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`rounded-md p-2.5 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-chart-3 dark:text-chart-3" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
            {trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
            <span className={trend === "up" ? "text-chart-3 dark:text-chart-3" : trend === "down" ? "text-destructive" : "text-muted-foreground"}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-foreground">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function ScanRow({ scan }: { scan: DroneScan }) {
  const algaeColor = scan.algaeLevel > 60 ? "text-destructive" : scan.algaeLevel > 30 ? "text-muted-foreground" : "text-primary";
  const statusVariant = scan.status === "completed" ? "secondary" : "default";

  return (
    <div data-testid={`row-scan-${scan.id}`} className="flex flex-wrap items-center gap-3 p-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-[140px]">
        <p className="font-medium text-foreground text-sm">{scan.scanName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{scan.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-center min-w-[60px]">
          <p className={`text-sm font-semibold ${algaeColor}`}>{scan.algaeLevel.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Algae</p>
        </div>
        <div className="text-center min-w-[60px]">
          <p className="text-sm font-semibold text-foreground">{scan.greeneryIndex.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">NDVI</p>
        </div>
        <div className="text-center min-w-[60px]">
          <p className="text-sm font-semibold text-foreground">{scan.waterQuality.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Quality</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[100px]">
          <Clock className="h-3 w-3" />
          {new Date(scan.scanDate).toLocaleDateString()}
        </div>
        <Badge variant={statusVariant} className="text-xs">
          {scan.status}
        </Badge>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const severityColor =
    alert.severity === "critical"
      ? "bg-destructive/10 text-destructive"
      : alert.severity === "warning"
        ? "bg-chart-4/10 text-chart-4"
        : "bg-primary/10 text-primary";

  return (
    <div data-testid={`row-alert-${alert.id}`} className="flex items-start gap-3 p-4 border-b border-border last:border-0">
      <div className={`rounded-md p-2 ${severityColor} shrink-0`}>
        {alert.resolved ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm">{alert.type}</p>
          <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
          {alert.resolved && <Badge variant="secondary" className="text-xs">Resolved</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-md mb-3" />
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
        <Card className="p-6"><Skeleton className="h-64 w-full" /></Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: scans, isLoading: scansLoading } = useQuery<DroneScan[]>({
    queryKey: ["/api/scans"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  if (scansLoading || alertsLoading) return <LoadingSkeleton />;

  const latestScans = scans || [];
  const latestAlerts = alerts || [];
  const activeAlerts = latestAlerts.filter((a) => !a.resolved);

  const avgAlgae = latestScans.length > 0
    ? latestScans.reduce((sum, s) => sum + s.algaeLevel, 0) / latestScans.length
    : 0;
  const avgQuality = latestScans.length > 0
    ? latestScans.reduce((sum, s) => sum + s.waterQuality, 0) / latestScans.length
    : 0;
  const avgGreenery = latestScans.length > 0
    ? latestScans.reduce((sum, s) => sum + s.greeneryIndex, 0) / latestScans.length
    : 0;
  const avgTemp = latestScans.length > 0
    ? latestScans.filter(s => s.temperature).reduce((sum, s) => sum + (s.temperature || 0), 0) / latestScans.filter(s => s.temperature).length
    : 0;

  const chartData = latestScans.map((s) => ({
    name: s.scanName.length > 12 ? s.scanName.slice(0, 12) + "..." : s.scanName,
    algae: s.algaeLevel,
    quality: s.waterQuality,
    greenery: s.greeneryIndex * 100,
  }));

  const qualityDistribution = [
    { name: "Excellent", value: latestScans.filter(s => s.waterQuality >= 80).length, color: "hsl(145, 60%, 45%)" },
    { name: "Good", value: latestScans.filter(s => s.waterQuality >= 60 && s.waterQuality < 80).length, color: "hsl(195, 82%, 48%)" },
    { name: "Fair", value: latestScans.filter(s => s.waterQuality >= 40 && s.waterQuality < 60).length, color: "hsl(45, 80%, 50%)" },
    { name: "Poor", value: latestScans.filter(s => s.waterQuality < 40).length, color: "hsl(0, 72%, 50%)" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap" data-testid="section-dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">Ocean Health Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time environmental monitoring from drone scans
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Activity className="h-3 w-3" />
            {latestScans.length} Scans
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Waves}
          label="Avg Algae Level"
          value={avgAlgae.toFixed(1)}
          unit="%"
          trend={avgAlgae > 40 ? "up" : "down"}
          trendValue={avgAlgae > 40 ? "High" : "Normal"}
          color="bg-chart-3/10 text-chart-3"
        />
        <MetricCard
          icon={Droplets}
          label="Water Quality"
          value={avgQuality.toFixed(0)}
          unit="%"
          trend={avgQuality > 70 ? "up" : "down"}
          trendValue={avgQuality > 70 ? "Good" : "Low"}
          color="bg-chart-1/10 text-chart-1"
        />
        <MetricCard
          icon={Leaf}
          label="Greenery Index"
          value={avgGreenery.toFixed(2)}
          unit="NDVI"
          trend="stable"
          trendValue="Stable"
          color="bg-chart-2/10 text-chart-2"
        />
        <MetricCard
          icon={Thermometer}
          label="Avg Temperature"
          value={avgTemp.toFixed(1)}
          unit="°C"
          trend="stable"
          trendValue="Normal"
          color="bg-chart-4/10 text-chart-4"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-foreground mb-4">Environmental Metrics Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="algaeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(195, 82%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(195, 82%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(210, 15%, 96%)",
                  border: "1px solid hsl(210, 12%, 90%)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="algae" name="Algae %" stroke="hsl(145, 60%, 45%)" fill="url(#algaeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="quality" name="Water Quality %" stroke="hsl(195, 82%, 48%)" fill="url(#qualityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Water Quality Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={qualityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {qualityDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {qualityDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="scans">
        <TabsList>
          <TabsTrigger value="scans" data-testid="tab-scans">Recent Scans</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            Alerts {activeAlerts.length > 0 && `(${activeAlerts.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scans">
          <Card>
            {latestScans.length === 0 ? (
              <div className="p-12 text-center">
                <Waves className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No scan data yet. Deploy a drone to start monitoring.</p>
              </div>
            ) : (
              latestScans.map((scan) => <ScanRow key={scan.id} scan={scan} />)
            )}
          </Card>
        </TabsContent>
        <TabsContent value="alerts">
          <Card>
            {latestAlerts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="h-10 w-10 text-chart-3 mx-auto mb-3" />
                <p className="text-muted-foreground">No alerts. All environmental readings are within safe limits.</p>
              </div>
            ) : (
              latestAlerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
