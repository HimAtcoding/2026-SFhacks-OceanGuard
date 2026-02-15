import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { CleanupOperation, CityMonitor } from "@shared/schema";
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
  Zap,
  Target,
  TrendingUp,
  Navigation,
  Satellite,
  Brain,
  BarChart3,
  Leaf,
  Globe,
} from "lucide-react";

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
    { icon: Satellite, label: "Satellite Detection", desc: "Identify debris clusters" },
    { icon: Brain, label: "AI Analysis", desc: "Classify & prioritize" },
    { icon: Target, label: "Mission Planning", desc: "Route optimization" },
    { icon: Navigation, label: "Drone Dispatch", desc: "Deploy cleanup fleet" },
    { icon: Trash2, label: "Collection", desc: "Autonomous cleanup" },
    { icon: BarChart3, label: "Reporting", desc: "Impact assessment" },
  ];

  return (
    <div className="space-y-3" data-testid="section-flow-diagram">
      <h3 className="font-semibold text-foreground text-sm">Cleanup Operations Pipeline</h3>
      <div className="flex items-start gap-1 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-1.5 bg-muted rounded-md px-3 py-3 min-w-[110px]">
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
    { from: "Drone Sensors", to: "Data Ingestion", color: "hsl(195, 82%, 48%)" },
    { from: "Data Ingestion", to: "AI Processing", color: "hsl(145, 60%, 45%)" },
    { from: "AI Processing", to: "Kelp Classification", color: "hsl(145, 60%, 45%)" },
    { from: "AI Processing", to: "Trash Detection", color: "hsl(0, 72%, 50%)" },
    { from: "Kelp Classification", to: "Health Rating", color: "hsl(145, 60%, 45%)" },
    { from: "Trash Detection", to: "Cleanup Queue", color: "hsl(0, 72%, 50%)" },
    { from: "Health Rating", to: "City Dashboard", color: "hsl(195, 82%, 48%)" },
    { from: "Cleanup Queue", to: "Dispatch System", color: "hsl(45, 80%, 50%)" },
  ];

  return (
    <div className="space-y-3" data-testid="section-data-flow">
      <h3 className="font-semibold text-foreground text-sm">Data Flow Architecture</h3>
      <div className="space-y-1.5">
        {flows.map((flow, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="bg-muted rounded px-2.5 py-1.5 min-w-[130px]">
              <span className="text-xs font-medium text-foreground">{flow.from}</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="h-0.5 flex-1" style={{ backgroundColor: flow.color, opacity: 0.5 }} />
              <ArrowRight className="h-3 w-3 shrink-0" style={{ color: flow.color }} />
            </div>
            <div className="bg-muted rounded px-2.5 py-1.5 min-w-[130px]">
              <span className="text-xs font-medium text-foreground">{flow.to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Cleanup() {
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

  const completedOps = operations.filter(o => o.status === "completed");
  const inProgressOps = operations.filter(o => o.status === "in-progress");
  const plannedOps = operations.filter(o => o.status === "planned");
  const onHoldOps = operations.filter(o => o.status === "on-hold");

  const totalTrashCollected = operations.reduce((s, o) => s + (o.trashCollected || 0), 0);
  const totalAreaCleaned = operations.reduce((s, o) => s + (o.areaCleanedKm2 || 0), 0);
  const totalDrones = operations.reduce((s, o) => s + (o.dronesDeployed || 0), 0);

  const statusData = [
    { name: "Completed", value: completedOps.length, color: "hsl(145, 60%, 45%)" },
    { name: "In Progress", value: inProgressOps.length, color: "hsl(195, 82%, 48%)" },
    { name: "Planned", value: plannedOps.length, color: "hsl(45, 80%, 50%)" },
    { name: "On Hold", value: onHoldOps.length, color: "hsl(0, 72%, 50%)" },
  ].filter(d => d.value > 0);

  const cityCleanupsMap = new Map<string, number>();
  operations.forEach(op => {
    if (op.cityId) {
      cityCleanupsMap.set(op.cityId, (cityCleanupsMap.get(op.cityId) || 0) + 1);
    }
  });

  const cityCleanupData = Array.from(cityCleanupsMap.entries())
    .map(([cityId, count]) => ({
      city: cityMap.get(cityId)?.cityName || "Unknown",
      operations: count,
      trash: operations.filter(o => o.cityId === cityId).reduce((s, o) => s + (o.trashCollected || 0), 0),
    }))
    .sort((a, b) => b.trash - a.trash)
    .slice(0, 8);

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
            Manage marine debris cleanup operations across all monitoring zones &middot; Real-time tracking since Feb 14, 2025
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-2/10 p-2.5 shrink-0">
              <Trash2 className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trash Collected</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-trash">{totalTrashCollected.toFixed(0)} kg</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-1/10 p-2.5 shrink-0">
              <Waves className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Area Cleaned</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-area">{totalAreaCleaned.toFixed(1)} km2</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-4/10 p-2.5 shrink-0">
              <Navigation className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drones Deployed</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-total-drones">{totalDrones}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-completion-rate">
                {operations.length > 0 ? ((completedOps.length / operations.length) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Cleanup by City (Trash Collected)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityCleanupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
              <XAxis dataKey="city" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(210, 15%, 96%)",
                  border: "1px solid hsl(210, 12%, 90%)",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="trash" name="Trash (kg)" fill="hsl(195, 82%, 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Operations Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
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

      <Card className="p-6">
        <FlowDiagram />
      </Card>

      <Card className="p-6">
        <DataFlowDiagram />
      </Card>

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
                      {city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {city.cityName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        {(op.trashCollected || 0).toFixed(0)} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <Waves className="h-3 w-3" />
                        {(op.areaCleanedKm2 || 0).toFixed(1)} km2
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {op.dronesDeployed || 0} drones
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(op.startDate).toLocaleDateString()}
                      </span>
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
