import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CleanupOperation, CityMonitor, Donation, CallLog, CleanupJob } from "@shared/schema";
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
  Phone,
  PhoneCall,
  DollarSign,
  Briefcase,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Send,
  User,
  Mail,
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

function FundingBar({ goal, raised }: { goal: number; raised: number }) {
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="text-muted-foreground">
          <DollarSign className="h-3 w-3 inline" />${raised.toFixed(0)} raised
        </span>
        <span className="text-muted-foreground">Goal: ${goal.toFixed(0)}</span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-[10px] text-muted-foreground text-right">{pct.toFixed(0)}% funded</p>
    </div>
  );
}

function LiveTranscript({ callLogId }: { callLogId: string }) {
  const [entries, setEntries] = useState<Array<{ role: string; text: string; timestamp: number }>>([]);
  const [callStatus, setCallStatus] = useState<string>("connecting");
  const [outcome, setOutcome] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/call-logs/${callLogId}/transcript-stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcript") {
          setEntries(prev => [...prev, { role: data.role, text: data.text, timestamp: data.timestamp }]);
          setCallStatus("in_progress");
        } else if (data.type === "status") {
          setCallStatus(data.status);
        } else if (data.type === "completed") {
          setOutcome(data.outcome);
          setDuration(data.duration);
          setCallStatus("completed");
          eventSource.close();
        }
      } catch {}
    };

    eventSource.onerror = () => {
      setCallStatus("disconnected");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [callLogId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const outcomeBadge = outcome === "accepted" ? "default" : outcome === "declined" ? "destructive" : "outline";

  return (
    <div className="space-y-2 mt-2" data-testid={`live-transcript-${callLogId}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          {(callStatus === "in_progress" || callStatus === "connected") && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-2" />
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground">
            {callStatus === "connecting" ? "Connecting..." : callStatus === "connected" ? "Connected" : callStatus === "in_progress" ? "Live Call" : callStatus === "completed" ? "Call Ended" : "Waiting..."}
          </span>
        </div>
        {duration !== null && (
          <span className="text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5 inline mr-0.5" />{duration}s
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <div ref={scrollRef} className="max-h-36 overflow-y-auto space-y-1.5 bg-muted rounded-md p-2">
          {entries.map((entry, i) => (
            <div key={i} className={`text-[11px] leading-relaxed ${entry.role === "agent" ? "text-primary" : "text-foreground"}`}>
              <span className="font-semibold">{entry.role === "agent" ? "OceanGuard" : "Recipient"}:</span>{" "}
              {entry.text}
            </div>
          ))}
          {callStatus === "in_progress" && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Listening...
            </div>
          )}
        </div>
      )}

      {outcome && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={outcomeBadge as any} className="text-[10px]" data-testid={`badge-outcome-${callLogId}`}>
            {outcome === "accepted" ? "Site Available" : outcome === "declined" ? "Not Available" : outcome === "inconclusive" ? "Needs Follow-up" : "No Response"}
          </Badge>
        </div>
      )}
    </div>
  );
}

function CallButton({ cleanupId, operationName }: { cleanupId: string; operationName: string }) {
  const [calling, setCalling] = useState(false);
  const [callResult, setCallResult] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("19255491150");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [activeCallLogId, setActiveCallLogId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: callLogs } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs", cleanupId],
    queryFn: async () => {
      const res = await fetch(`/api/call-logs?cleanupId=${cleanupId}`);
      return res.json();
    },
    refetchInterval: activeCallLogId ? 3000 : false,
  });

  const callMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/cleanup/${cleanupId}/call`, {
        phoneNumber,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCallResult(data.message);
      setShowPhoneInput(false);
      if (data.callLogId && data.status !== "demo_mode") {
        setActiveCallLogId(data.callLogId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/call-logs", cleanupId] });
    },
    onError: (err: any) => {
      setCallResult("Call failed: " + err.message);
    },
  });

  const isValidPhone = /^\+?\d{10,15}$/.test(phoneNumber);

  const handleCall = async () => {
    if (!showPhoneInput) {
      setShowPhoneInput(true);
      return;
    }
    if (!isValidPhone) {
      setCallResult("Invalid phone number. Use digits with country code (e.g. 19255491150).");
      return;
    }
    setCalling(true);
    setCallResult(null);
    setActiveCallLogId(null);
    await callMutation.mutateAsync();
    setCalling(false);
  };

  const recentLogs = (callLogs || []).slice(0, 5);

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="h-2.5 w-2.5 text-chart-2 shrink-0" />;
    if (status === "ringing" || status === "in-progress") return <PhoneCall className="h-2.5 w-2.5 text-primary shrink-0 animate-pulse" />;
    if (status === "failed") return <AlertTriangle className="h-2.5 w-2.5 text-destructive shrink-0" />;
    return <Phone className="h-2.5 w-2.5 shrink-0" />;
  };

  const getStatusLabel = (log: CallLog) => {
    if (log.status === "completed" && log.result) {
      const r = log.result.toLowerCase();
      if (r.startsWith("accepted")) return "Verified Available";
      if (r.startsWith("declined")) return "Not Available";
      if (r.startsWith("inconclusive")) return "Needs Follow-up";
      if (r.startsWith("no_response")) return "No Response";
    }
    if (log.status === "demo_completed") return "Verified (demo)";
    if (log.status === "ringing") return "Ringing...";
    if (log.status === "initiating") return "Initiating...";
    return log.status;
  };

  return (
    <div className="space-y-2">
      {showPhoneInput && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">Phone number to call (with country code)</label>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="19255491150"
            className="text-xs"
            data-testid={`input-phone-${cleanupId}`}
          />
        </div>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleCall}
        disabled={calling || callMutation.isPending}
        className="gap-1.5 w-full"
        data-testid={`button-call-${cleanupId}`}
      >
        {calling || callMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <PhoneCall className="h-3 w-3" />
        )}
        {calling ? "Calling..." : showPhoneInput ? "Place Call" : "Verify Availability"}
      </Button>
      {showPhoneInput && !calling && (
        <p className="text-[9px] text-muted-foreground text-center" data-testid="text-call-tech">
          Powered by Snowflake Cortex AI + ElevenLabs Voice
        </p>
      )}
      {showPhoneInput && !calling && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPhoneInput(false)}
          className="w-full text-xs"
          data-testid={`button-cancel-call-${cleanupId}`}
        >
          Cancel
        </Button>
      )}
      {callResult && (
        <p className={`text-[10px] ${callResult.includes("failed") ? "text-destructive" : "text-chart-2"}`}>
          {callResult}
        </p>
      )}

      {activeCallLogId && (
        <LiveTranscript callLogId={activeCallLogId} />
      )}

      {recentLogs.length > 0 && (
        <div className="space-y-1">
          {recentLogs.map(log => (
            <div key={log.id}>
              <div
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer"
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                data-testid={`call-log-${log.id}`}
              >
                {getStatusIcon(log.status)}
                <span className="truncate">{getStatusLabel(log)}</span>
                {log.duration && <span className="shrink-0">({log.duration}s)</span>}
                <span className="ml-auto shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
              {expandedLogId === log.id && log.transcript && (
                <div className="mt-1 mb-1 bg-muted rounded-md p-2 max-h-32 overflow-y-auto">
                  {log.transcript.split("\n").map((line, i) => (
                    <p key={i} className={`text-[10px] leading-relaxed ${line.startsWith("OceanGuard:") ? "text-primary" : "text-foreground"}`}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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

const RECEIVER_WALLET = "GDwaNk7VnHi3HopFGEBsGPbqMcZzFC81eT91GtLSisan";

function SolanaDonationSection({ cleanupId }: { cleanupId?: string }) {
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [purpose, setPurpose] = useState("Trash Bags & Supplies");
  const [walletKey, setWalletKey] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [airdropPending, setAirdropPending] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup"] });
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

  const generateWallet = async () => {
    const { Keypair } = await import("@solana/web3.js");
    const keypair = Keypair.generate();
    const secretKeyJson = JSON.stringify(Array.from(keypair.secretKey));
    setWalletKey(secretKeyJson);
    setWalletAddress(keypair.publicKey.toBase58());
    setBalance(0);
    setTxStatus(null);
    setLastTxSig(null);
  };

  const requestAirdrop = async () => {
    if (!walletAddress) return;
    setAirdropPending(true);
    setTxStatus("Requesting devnet airdrop...");
    try {
      const res = await fetch("/api/solana/airdrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await res.json();
      if (data.success) {
        setTxStatus("Airdrop successful! Received 1 SOL");
        refreshBalance();
      } else {
        setTxStatus("Airdrop failed: " + (data.error || "try again"));
      }
    } catch (err: any) {
      setTxStatus("Airdrop error: " + err.message);
    }
    setAirdropPending(false);
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch(`/api/solana/balance/${walletAddress}`);
      const data = await res.json();
      if (data.balance !== undefined) setBalance(data.balance);
    } catch {}
  };

  const handleDonate = async () => {
    if (!walletKey || !walletAddress) {
      setTxStatus("Generate a wallet first");
      return;
    }
    const amt = parseFloat(donationAmount) || 0.1;
    if (balance !== null && balance < amt) {
      setTxStatus("Insufficient balance. Request an airdrop first.");
      return;
    }
    setIsProcessing(true);
    setTxStatus("Submitting transaction to Solana devnet...");
    try {
      const res = await fetch("/api/solana/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSecretKey: walletKey,
          toAddress: RECEIVER_WALLET,
          amountSol: amt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastTxSig(data.signature);
        setTxStatus("Transaction confirmed on-chain!");
        donationMutation.mutate({
          amount: amt,
          purpose,
          donorName: donorName || "Anonymous",
          walletAddress: walletAddress,
          txSignature: data.signature,
          status: "completed",
          cleanupId: cleanupId || null,
        });
        refreshBalance();
        setDonationAmount("");
        setDonorName("");
      } else {
        setTxStatus("Transaction failed: " + (data.error || "unknown error"));
      }
    } catch (err: any) {
      setTxStatus("Error: " + err.message);
    }
    setIsProcessing(false);
  };

  return (
    <Card className="p-6" data-testid="section-solana-donation">
      <div className="flex items-center gap-2 mb-4">
        <SiSolana className="h-5 w-5 text-[#9945FF]" />
        <h3 className="font-semibold text-foreground text-sm">Solana Donation Hub</h3>
        <Badge variant="outline" className="gap-1 text-[10px]">Devnet</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground" data-testid="text-total-sol">{totalDonated.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total SOL Donated</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completedDonations}</p>
          <p className="text-xs text-muted-foreground">On-Chain Transactions</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{(allDonations || []).length}</p>
          <p className="text-xs text-muted-foreground">Total Donors</p>
        </div>
      </div>

      <div className="border border-border rounded-md p-4 mb-4 space-y-3" data-testid="section-wallet">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-semibold text-foreground">Your Devnet Wallet</h4>
          {!walletAddress ? (
            <Button size="sm" onClick={generateWallet} data-testid="button-generate-wallet">
              Generate Wallet
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={requestAirdrop} disabled={airdropPending} data-testid="button-airdrop">
                {airdropPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Request Airdrop (1 SOL)
              </Button>
              <Button size="sm" variant="outline" onClick={refreshBalance} data-testid="button-refresh-balance">
                Balance: {balance !== null ? balance.toFixed(4) : "..."} SOL
              </Button>
            </div>
          )}
        </div>
        {walletAddress && (
          <div className="bg-muted rounded-md p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Wallet Address</p>
            <p className="text-xs font-mono text-foreground break-all" data-testid="text-wallet-address">{walletAddress}</p>
          </div>
        )}
        {txStatus && (
          <p className={`text-xs ${txStatus.includes("confirmed") || txStatus.includes("successful") ? "text-chart-2" : txStatus.includes("failed") || txStatus.includes("Error") || txStatus.includes("Insufficient") ? "text-destructive" : "text-muted-foreground"}`} data-testid="text-tx-status">
            {txStatus}
          </p>
        )}
        {lastTxSig && (
          <a
            href={`https://explorer.solana.com/tx/${lastTxSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline inline-flex items-center gap-1"
            data-testid="link-explorer"
          >
            <ExternalLink className="h-3 w-3" />
            View on Solana Explorer
          </a>
        )}
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
          <Button
            onClick={handleDonate}
            disabled={isProcessing || donationMutation.isPending || !walletAddress}
            className="w-full gap-2"
            data-testid="button-donate"
          >
            {isProcessing || donationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SiSolana className="h-4 w-4" />
            )}
            {!walletAddress ? "Generate wallet to donate" : `Send ${donationAmount || "0.1"} SOL for ${purpose}`}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Transactions are processed on Solana devnet. Receiver: {RECEIVER_WALLET.slice(0, 8)}...{RECEIVER_WALLET.slice(-4)}
          </p>
        </div>
      </div>

      {(allDonations || []).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-foreground mb-2">On-Chain Transaction Ledger</h4>
          <div className="space-y-2 max-h-[200px] overflow-auto">
            {(allDonations || []).slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2" data-testid={`row-donation-${d.id}`}>
                <Heart className="h-3 w-3 text-destructive shrink-0" />
                <span className="font-medium text-foreground">{d.donorName || "Anonymous"}</span>
                <span className="text-muted-foreground">{d.purpose}</span>
                <span className="ml-auto font-bold text-foreground">{d.amount.toFixed(2)} SOL</span>
                {d.txSignature && !d.txSignature.startsWith("sim_") && (
                  <a href={`https://explorer.solana.com/tx/${d.txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-primary">
                    <ExternalLink className="h-3 w-3" />
                  </a>
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

const roleTypeIcons: Record<string, any> = {
  safety: Shield,
  organizer: Users,
  technical: Navigation,
  scientific: Activity,
  logistics: Package,
  outreach: Megaphone,
};

const roleTypeColors: Record<string, string> = {
  safety: "text-destructive",
  organizer: "text-primary",
  technical: "text-chart-1",
  scientific: "text-chart-2",
  logistics: "text-chart-4",
  outreach: "text-chart-3",
};

function JobCard({ job, onApply }: { job: CleanupJob; onApply: (job: CleanupJob) => void }) {
  const Icon = roleTypeIcons[job.roleType] || Briefcase;
  const colorClass = roleTypeColors[job.roleType] || "text-primary";
  const spotsLeft = job.shiftsAvailable - (job.shiftsFilled || 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className={`p-4 rounded-md border border-border space-y-3 ${isFull ? "opacity-60" : ""}`} data-testid={`job-card-${job.id}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-md p-2 bg-muted shrink-0 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-foreground" data-testid={`job-title-${job.id}`}>{job.title}</h4>
            <Badge variant={isFull ? "secondary" : "default"} className="text-[10px]">
              {isFull ? "Filled" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{job.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded-md p-2 text-center">
          <p className="text-sm font-bold text-chart-2" data-testid={`job-rate-${job.id}`}>${job.hourlyRate.toFixed(2)}/hr</p>
          <p className="text-[9px] text-muted-foreground">Hourly Rate</p>
        </div>
        <div className="bg-muted rounded-md p-2 text-center">
          <p className="text-sm font-bold text-foreground">{job.hoursPerShift}h</p>
          <p className="text-[9px] text-muted-foreground">Per Shift</p>
        </div>
        <div className="bg-muted rounded-md p-2 text-center">
          <p className="text-sm font-bold text-foreground">${(job.hourlyRate * job.hoursPerShift).toFixed(0)}</p>
          <p className="text-[9px] text-muted-foreground">Per Shift Pay</p>
        </div>
      </div>

      {job.certifications && job.certifications.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            Required Certifications
          </p>
          <div className="flex flex-wrap gap-1">
            {job.certifications.map((cert, i) => (
              <Badge key={i} variant="outline" className="text-[10px] gap-1" data-testid={`cert-${job.id}-${i}`}>
                <BadgeCheck className="h-2.5 w-2.5" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Requirements</p>
          <ul className="space-y-0.5">
            {job.requirements.map((req, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <CheckCircle className="h-2.5 w-2.5 mt-0.5 shrink-0 text-chart-2" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        size="sm"
        disabled={isFull}
        onClick={() => onApply(job)}
        className="w-full gap-1.5"
        data-testid={`button-apply-${job.id}`}
      >
        <Send className="h-3 w-3" />
        {isFull ? "All Shifts Filled" : "Apply for This Shift"}
      </Button>
    </div>
  );
}

function ApplyModal({ job, onClose, cleanupName }: { job: CleanupJob; onClose: () => void; cleanupName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/job-applications", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cleanup-jobs"] });
    },
  });

  if (submitted) {
    return (
      <div className="p-4 rounded-md border border-chart-2/30 bg-chart-2/5 space-y-2" data-testid="application-success">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-chart-2" />
          <p className="text-sm font-semibold text-foreground">Application Submitted</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your application for <span className="font-medium text-foreground">{job.title}</span> at {cleanupName} has been submitted.
          We'll review your qualifications and get back to you within 24-48 hours.
        </p>
        <Button size="sm" variant="outline" onClick={onClose} data-testid="button-close-apply">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-md border border-border space-y-3" data-testid="application-form">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-foreground">Apply: {job.title}</p>
          <p className="text-[10px] text-muted-foreground">${job.hourlyRate.toFixed(2)}/hr &middot; {job.hoursPerShift}h shifts &middot; {cleanupName}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-cancel-apply">
          <AlertTriangle className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Full Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" data-testid="input-applicant-name" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Email *</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" data-testid="input-applicant-email" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Phone (optional)</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" data-testid="input-applicant-phone" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Relevant Experience</label>
          <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="2 years cleanup volunteering..." data-testid="input-applicant-experience" />
        </div>
      </div>
      <Button
        onClick={() => {
          if (!name.trim() || !email.trim()) return;
          applyMutation.mutate({
            jobId: job.id,
            applicantName: name,
            applicantEmail: email,
            applicantPhone: phone || null,
            experience: experience || null,
            status: "pending",
          });
        }}
        disabled={!name.trim() || !email.trim() || applyMutation.isPending}
        className="w-full gap-1.5"
        data-testid="button-submit-application"
      >
        {applyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        Submit Application
      </Button>
    </div>
  );
}

function JobListingsSection({ cleanupId, cleanupName }: { cleanupId: string; cleanupName: string }) {
  const [applyingJob, setApplyingJob] = useState<CleanupJob | null>(null);

  const { data: jobs, isLoading } = useQuery<CleanupJob[]>({
    queryKey: ["/api/cleanup-jobs", cleanupId],
    queryFn: async () => {
      const res = await fetch(`/api/cleanup-jobs?cleanupId=${cleanupId}`);
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const jobList = jobs || [];
  const totalSpots = jobList.reduce((s, j) => s + j.shiftsAvailable, 0);
  const filledSpots = jobList.reduce((s, j) => s + (j.shiftsFilled || 0), 0);
  const avgRate = jobList.length > 0 ? jobList.reduce((s, j) => s + j.hourlyRate, 0) / jobList.length : 0;

  return (
    <div className="space-y-4 pt-3 border-t border-border" data-testid={`jobs-section-${cleanupId}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Paid Positions & Shifts</h4>
          <Badge variant="secondary" className="text-[10px]">{jobList.length} roles</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{filledSpots}/{totalSpots} shifts filled</span>
          <span>Avg ${avgRate.toFixed(2)}/hr</span>
        </div>
      </div>

      {jobList.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No paid positions available for this operation yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobList.map(job => (
            <JobCard key={job.id} job={job} onApply={(j) => setApplyingJob(j)} />
          ))}
        </div>
      )}

      {applyingJob && (
        <ApplyModal job={applyingJob} onClose={() => setApplyingJob(null)} cleanupName={cleanupName} />
      )}
    </div>
  );
}

export default function Cleanup() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedCleanupForDonation, setSelectedCleanupForDonation] = useState<string | undefined>(undefined);
  const [expandedOpId, setExpandedOpId] = useState<string | null>(null);

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
  const totalFundingGoal = operations.reduce((s, o) => s + (o.fundingGoal || 0), 0);
  const totalFundingRaised = operations.reduce((s, o) => s + (o.fundingRaised || 0), 0);

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
            Manage marine debris cleanup operations with real-time tracking, AI verification calls, and crowdfunded goals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-chart-3/10 p-2.5 shrink-0"><DollarSign className="h-5 w-5 text-chart-3" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Funding Progress</p>
              <p className="text-lg font-bold text-foreground" data-testid="text-funding-progress">
                {totalFundingGoal > 0 ? ((totalFundingRaised / totalFundingGoal) * 100).toFixed(0) : 0}%
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

      <Card className="p-6" data-testid="section-all-operations">
        <h3 className="font-semibold text-foreground mb-4 text-sm">All Operations — Jobs, Funding & Verification</h3>
        <p className="text-xs text-muted-foreground mb-4">Click any operation to view available paid positions and shifts. All positions pay minimum wage or above.</p>
        <div className="space-y-4">
          {operations.length === 0 ? (
            <div className="p-8 text-center">
              <Trash2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No cleanup operations scheduled yet.</p>
            </div>
          ) : (
            operations.map((op) => {
              const city = op.cityId ? cityMap.get(op.cityId) : null;
              const isExpanded = expandedOpId === op.id;
              return (
                <div key={op.id} className={`p-4 bg-muted/50 rounded-md space-y-3 ${isExpanded ? "ring-1 ring-primary/30" : ""}`} data-testid={`row-operation-${op.id}`}>
                  <div
                    className="flex items-start gap-3 flex-wrap cursor-pointer"
                    onClick={() => setExpandedOpId(isExpanded ? null : op.id)}
                    data-testid={`button-expand-${op.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-foreground text-sm">{op.operationName}</span>
                        <StatusBadge status={op.status} />
                        <PriorityBadge priority={op.priority} />
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Briefcase className="h-2.5 w-2.5" />
                          View Jobs
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{city.cityName}</span>}
                        <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" />{(op.trashCollected || 0).toFixed(0)} kg</span>
                        <span className="flex items-center gap-1"><Waves className="h-3 w-3" />{(op.areaCleanedKm2 || 0).toFixed(1)} km2</span>
                        <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{op.dronesDeployed || 0} drones</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(op.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
                  </div>

                  {isExpanded && (
                    <JobListingsSection cleanupId={op.id} cleanupName={op.operationName} />
                  )}

                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <FundingBar goal={op.fundingGoal || 0} raised={op.fundingRaised || 0} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 gap-1.5"
                        onClick={(e) => { e.stopPropagation(); setSelectedCleanupForDonation(selectedCleanupForDonation === op.id ? undefined : op.id); }}
                        data-testid={`button-fund-${op.id}`}
                      >
                        <Heart className="h-3 w-3" />
                        Fund This Cleanup
                      </Button>
                    </div>
                    <div>
                      <CallButton cleanupId={op.id} operationName={op.operationName} />
                    </div>
                  </div>
                  {selectedCleanupForDonation === op.id && (
                    <div className="pt-3 border-t border-border">
                      <SolanaDonationSection cleanupId={op.id} />
                    </div>
                  )}
                </div>
              );
            })
          )}
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
    </div>
  );
}
