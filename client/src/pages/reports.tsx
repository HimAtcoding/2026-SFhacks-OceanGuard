import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import type { DroneScan } from "@shared/schema";
import {
  FileText,
  Brain,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Leaf,
  RefreshCw,
  Trash2,
  Globe,
  Calendar,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Reports() {
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const { data: scans, isLoading } = useQuery<DroneScan[]>({
    queryKey: ["/api/scans"],
  });

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    setReport(null);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, customPrompt: customPrompt || undefined }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.content) {
              fullContent += event.content;
              setReport(fullContent);
            }
          } catch {}
        }
      }
    } catch (error) {
      setReport("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="p-6"><Skeleton className="h-32" /></Card>)}
        </div>
      </div>
    );
  }

  const totalScans = scans?.length || 0;
  const avgQuality = totalScans > 0
    ? (scans!.reduce((s, sc) => s + sc.waterQuality, 0) / totalScans).toFixed(0)
    : "0";

  const reportTypes = [
    {
      id: "environmental-impact",
      icon: TrendingUp,
      title: "Environmental Impact Assessment",
      description: "Comprehensive analysis of ocean health trends, ecological risk factors, and conservation recommendations across 20+ cities.",
    },
    {
      id: "water-quality",
      icon: Droplets,
      title: "Water Quality Report",
      description: "Detailed breakdown of pH, dissolved oxygen, turbidity, and temperature patterns across monitored zones.",
    },
    {
      id: "algae-risk",
      icon: AlertTriangle,
      title: "Algae Bloom Risk Analysis",
      description: "Predictive assessment of harmful algal bloom probability with contributing factor analysis.",
    },
    {
      id: "vegetation-health",
      icon: Leaf,
      title: "Vegetation & Kelp Health Report",
      description: "NDVI-based assessment plus global kelp density analysis with city-by-city health ratings.",
    },
    {
      id: "kelp-trash-analysis",
      icon: Globe,
      title: "Global Kelp & Trash Analysis",
      description: "Worldwide kelp density vs trash level analysis across all monitored coastal cities with cleanup impact assessment.",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-reports-title">AI Reports</h1>
            <Badge variant="secondary" className="gap-1">
              <Brain className="h-3 w-3" />
              Gemini AI
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate AI-powered environmental analysis reports from {totalScans} drone scans &middot; Avg water quality: {avgQuality}%
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Historical data range: Feb 14, 2025 &ndash; Present</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reportTypes.map((rt) => (
          <Card key={rt.id} className="p-5 hover-elevate" data-testid={`card-report-${rt.id}`}>
            <div className="flex items-start gap-4">
              <div className="rounded-md bg-primary/10 p-3 shrink-0">
                <rt.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1 text-sm">{rt.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{rt.description}</p>
                <Button
                  size="sm"
                  onClick={() => generateReport(rt.id)}
                  disabled={isGenerating}
                  className="gap-1"
                  data-testid={`button-generate-${rt.id}`}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Generate
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Custom Analysis Prompt
        </h3>
        <div className="flex gap-3">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter a custom analysis prompt, e.g. 'Compare water quality trends in the last 24 hours across all zones'"
            className="resize-none text-sm min-h-[60px]"
            rows={2}
            data-testid="input-custom-prompt"
          />
          <Button
            onClick={() => generateReport("custom")}
            disabled={isGenerating || !customPrompt.trim()}
            className="shrink-0 gap-1"
            data-testid="button-generate-custom"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
      </Card>

      {(report || isGenerating) && (
        <Card className="p-6" data-testid="section-report-output">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Generated Report
            </h3>
            {isGenerating && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating...
              </Badge>
            )}
            {!isGenerating && report && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReport(null)}
                className="gap-1"
                data-testid="button-clear-report"
              >
                <RefreshCw className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
          {report ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" data-testid="text-report-content">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analyzing scan data with AI...</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
