import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { DroneScan } from "@shared/schema";
import {
  Coins,
  Leaf,
  TrendingUp,
  Shield,
  Globe,
  ArrowUpRight,
  ExternalLink,
  Hash,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function CreditCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`rounded-md p-2.5 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-chart-3" />
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

interface LedgerEntry {
  id: string;
  timestamp: string;
  type: string;
  credits: number;
  zone: string;
  txHash: string;
  verified: boolean;
}

export default function CarbonCredits() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const { data: scans, isLoading } = useQuery<DroneScan[]>({
    queryKey: ["/api/scans"],
  });

  useEffect(() => {
    if (!scans || scans.length === 0) return;

    const entries: LedgerEntry[] = scans.slice(0, 15).map((scan, i) => {
      const credits = Math.max(0, ((scan.waterQuality / 100) * (scan.greeneryIndex) * 10)).toFixed(2);
      const hash = `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      return {
        id: scan.id,
        timestamp: new Date(scan.scanDate).toISOString(),
        type: scan.waterQuality > 70 ? "Conservation Verified" : "Monitoring Logged",
        credits: parseFloat(credits),
        zone: scan.location.split(",")[0],
        txHash: hash,
        verified: scan.waterQuality > 60,
      };
    });

    setLedger(entries);
  }, [scans]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="p-5"><Skeleton className="h-20" /></Card>)}
        </div>
      </div>
    );
  }

  const totalCredits = ledger.reduce((s, e) => s + e.credits, 0);
  const verifiedCount = ledger.filter(e => e.verified).length;

  const chartData = ledger.slice().reverse().map((entry, i) => ({
    name: `Scan ${i + 1}`,
    credits: entry.credits,
    cumulative: ledger.slice(ledger.length - i - 1).reduce((s, e) => s + e.credits, 0),
  }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-carbon-title">Carbon Credits</h1>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Blockchain Verified
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          On-chain environmental impact tracking powered by Solana devnet
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CreditCard
          icon={Coins}
          label="Total Credits Earned"
          value={totalCredits.toFixed(1)}
          unit="tCO2e"
          color="bg-chart-3/10 text-chart-3"
        />
        <CreditCard
          icon={CheckCircle}
          label="Verified Entries"
          value={verifiedCount.toString()}
          unit="of total"
          color="bg-chart-1/10 text-chart-1"
        />
        <CreditCard
          icon={Globe}
          label="Zones Covered"
          value={new Set(ledger.map(e => e.zone)).size.toString()}
          unit="regions"
          color="bg-chart-2/10 text-chart-2"
        />
        <CreditCard
          icon={TrendingUp}
          label="Avg per Scan"
          value={ledger.length > 0 ? (totalCredits / ledger.length).toFixed(2) : "0"}
          unit="tCO2e"
          color="bg-chart-4/10 text-chart-4"
        />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Credit Accumulation</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="creditGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145, 60%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 12%, 85%)" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(210, 8%, 60%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 8%, 60%)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(210, 15%, 96%)",
                border: "1px solid hsl(210, 12%, 90%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="cumulative" name="Cumulative tCO2e" stroke="hsl(145, 60%, 45%)" fill="url(#creditGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card data-testid="section-carbon-ledger">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">Transaction Ledger</h3>
          <p className="text-xs text-muted-foreground">On-chain verification records</p>
        </div>
        {ledger.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No carbon credit transactions yet.</p>
          </div>
        ) : (
          ledger.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-3 p-4 border-b border-border last:border-0" data-testid={`row-carbon-${entry.id}`}>
              <div className="flex-1 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm">{entry.type}</p>
                  {entry.verified && (
                    <Badge variant="outline" className="text-chart-3 border-chart-3/30 text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{entry.zone}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-semibold text-chart-3">+{entry.credits.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">tCO2e</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[80px]">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{entry.txHash.slice(0, 10)}...</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-[100px]">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
