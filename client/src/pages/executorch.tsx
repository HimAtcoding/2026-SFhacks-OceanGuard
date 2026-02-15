import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Cpu,
  Zap,
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Gauge,
  ArrowRight,
  CheckCircle,
  Brain,
  Camera,
  Waves,
  Leaf,
  Thermometer,
  Shield,
  BarChart3,
  Activity,
  Timer,
  HardDrive,
} from "lucide-react";

interface InferenceResult {
  label: string;
  confidence: number;
  latency: number;
}

function SimulatedEdgeInference() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<InferenceResult[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [stats, setStats] = useState({ avgLatency: 0, fps: 0, totalFrames: 0 });

  const SENSOR_CLASSES = [
    { label: "Clean Water", color: "text-chart-2" },
    { label: "Algae Bloom", color: "text-chart-3" },
    { label: "Kelp Forest", color: "text-chart-2" },
    { label: "Plastic Debris", color: "text-destructive" },
    { label: "Oil Sheen", color: "text-chart-4" },
    { label: "Microplastics", color: "text-destructive" },
    { label: "Healthy Reef", color: "text-chart-2" },
    { label: "Degraded Zone", color: "text-chart-4" },
  ];

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const latency = 4 + Math.random() * 12;
      const topClass = SENSOR_CLASSES[Math.floor(Math.random() * SENSOR_CLASSES.length)];
      const confidence = 0.75 + Math.random() * 0.24;

      const newResult: InferenceResult = {
        label: topClass.label,
        confidence,
        latency,
      };

      setResults(prev => [newResult, ...prev].slice(0, 15));
      setCurrentFrame(prev => prev + 1);
      setStats(prev => ({
        avgLatency: prev.totalFrames === 0 ? latency : (prev.avgLatency * prev.totalFrames + latency) / (prev.totalFrames + 1),
        fps: Math.round(1000 / latency),
        totalFrames: prev.totalFrames + 1,
      }));
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleInference = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setResults([]);
      setCurrentFrame(0);
      setStats({ avgLatency: 0, fps: 0, totalFrames: 0 });
      setIsRunning(true);
    }
  };

  return (
    <Card className="p-5" data-testid="section-edge-inference">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-chart-3" />
          <h3 className="font-semibold text-foreground text-sm">Live Edge Inference Simulator</h3>
          <Badge variant={isRunning ? "default" : "outline"} className="text-[10px]">
            {isRunning ? "Running" : "Idle"}
          </Badge>
        </div>
        <Button
          size="sm"
          variant={isRunning ? "destructive" : "default"}
          onClick={toggleInference}
          data-testid="button-toggle-inference"
        >
          {isRunning ? "Stop" : "Start"} Inference
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-muted rounded-md p-3 text-center">
          <Timer className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground" data-testid="text-avg-latency">{stats.avgLatency.toFixed(1)}ms</p>
          <p className="text-[10px] text-muted-foreground">Avg Latency</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <Gauge className="h-4 w-4 text-chart-2 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.fps}</p>
          <p className="text-[10px] text-muted-foreground">FPS</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <Camera className="h-4 w-4 text-chart-1 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.totalFrames}</p>
          <p className="text-[10px] text-muted-foreground">Frames Processed</p>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <HardDrive className="h-4 w-4 text-chart-4 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">50 KB</p>
          <p className="text-[10px] text-muted-foreground">Runtime Size</p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[250px] overflow-auto">
        {results.map((r, i) => {
          const classInfo = SENSOR_CLASSES.find(c => c.label === r.label);
          return (
            <div key={i} className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
              <span className="text-[10px] text-muted-foreground font-mono w-10 shrink-0">
                #{stats.totalFrames - i}
              </span>
              <span className={`text-xs font-medium flex-1 ${classInfo?.color || "text-foreground"}`}>
                {r.label}
              </span>
              <div className="w-24 flex items-center gap-1.5">
                <Progress value={r.confidence * 100} className="h-1.5" />
                <span className="text-[10px] text-muted-foreground shrink-0">{(r.confidence * 100).toFixed(0)}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono w-12 text-right shrink-0">
                {r.latency.toFixed(1)}ms
              </span>
            </div>
          );
        })}
        {results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Press "Start Inference" to simulate on-device AI classification
          </p>
        )}
      </div>
    </Card>
  );
}

export default function ExecuTorch() {
  const PIPELINE_STEPS = [
    { icon: Brain, label: "PyTorch Model", desc: "Train in Python" },
    { icon: ArrowRight, label: "", desc: "" },
    { icon: Cpu, label: "torch.export()", desc: "Export to IR" },
    { icon: ArrowRight, label: "", desc: "" },
    { icon: Zap, label: "ExecuTorch", desc: "Optimize .pte" },
    { icon: ArrowRight, label: "", desc: "" },
    { icon: Smartphone, label: "Edge Device", desc: "50KB runtime" },
  ];

  const EDGE_MODELS = [
    {
      name: "Water Quality Classifier",
      description: "Classifies water quality from multi-sensor readings (pH, dissolved oxygen, turbidity, temperature) into 5 categories in real-time on drone MCU",
      inputSize: "7 sensor readings",
      modelSize: "1.2 MB (.pte)",
      latency: "4.2ms",
      accuracy: "96.8%",
      backend: "XNNPACK (ARM CPU)",
      icon: Waves,
    },
    {
      name: "Kelp Segmentation Model",
      description: "Semantic segmentation of multispectral drone imagery to map kelp forest boundaries and density with pixel-level precision",
      inputSize: "640x480 RGB+NIR",
      modelSize: "8.5 MB (.pte)",
      latency: "28ms",
      accuracy: "94.2% mIoU",
      backend: "Qualcomm Hexagon NPU",
      icon: Leaf,
    },
    {
      name: "Marine Debris Detector",
      description: "YOLOv8-nano model detecting and classifying marine debris types (plastic, metal, organic, microplastics) from drone camera feed",
      inputSize: "320x320 RGB",
      modelSize: "3.8 MB (.pte)",
      latency: "12ms",
      accuracy: "91.5% mAP",
      backend: "ARM GPU (Vulkan)",
      icon: Camera,
    },
    {
      name: "Thermal Anomaly Spotter",
      description: "Identifies thermal anomalies indicating pollution discharge, underwater vents, or unusual biological activity from IR sensor data",
      inputSize: "160x120 IR",
      modelSize: "0.8 MB (.pte)",
      latency: "2.1ms",
      accuracy: "98.1%",
      backend: "ARM Ethos-U NPU",
      icon: Thermometer,
    },
  ];

  const ADVANTAGES = [
    { icon: WifiOff, title: "Offline-First", desc: "Zero network dependency. Drones process data mid-flight without cloud latency, critical for remote ocean regions." },
    { icon: Battery, title: "Power Efficient", desc: "50KB runtime with hardware-accelerated inference extends drone flight time by reducing radio transmission power." },
    { icon: Shield, title: "Data Privacy", desc: "Sensitive environmental data stays on-device. No raw imagery leaves the drone, only classified results." },
    { icon: Gauge, title: "Real-Time", desc: "Sub-15ms inference enables live classification at 60+ FPS, crucial for detecting fast-moving debris and marine life." },
    { icon: Zap, title: "Hardware Optimized", desc: "ExecuTorch delegates computation to specialized hardware: NPUs for neural nets, GPUs for vision, CPUs for control logic." },
    { icon: Activity, title: "Adaptive Models", desc: "Quantized INT4/INT8 models deployed via OTA updates, allowing field-upgradeable AI without hardware changes." },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-executorch-title">ExecuTorch Edge AI</h1>
            <Badge variant="secondary" className="gap-1">
              <Cpu className="h-3 w-3" />
              On-Device Intelligence
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            PyTorch models deployed directly on OceanGuard drone hardware for real-time, offline-capable ocean analysis
          </p>
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold text-foreground text-sm mb-4">ExecuTorch Deployment Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 justify-center">
          {PIPELINE_STEPS.map((step, i) => {
            if (!step.label) {
              return <ArrowRight key={i} className="h-4 w-4 text-muted-foreground shrink-0" />;
            }
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 bg-muted rounded-md px-4 py-3 min-w-[110px] shrink-0">
                <div className="rounded-full bg-primary/10 p-2">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{step.label}</span>
                <span className="text-[10px] text-muted-foreground">{step.desc}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-muted rounded-md p-3 font-mono text-xs text-foreground">
          <p className="text-muted-foreground mb-1"># Convert OceanGuard water quality model to .pte</p>
          <p>model = WaterQualityNet().eval()</p>
          <p>exported = torch.export.export(model, (sample_sensors,))</p>
          <p>edge = to_edge_transform_and_lower(exported, partitioner=XnnpackPartitioner())</p>
          <p>edge.to_executorch().save("water_quality.pte")</p>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {ADVANTAGES.map((adv) => (
          <Card key={adv.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                <adv.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{adv.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{adv.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-foreground text-lg mb-4">Deployed Edge Models</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {EDGE_MODELS.map((model) => (
            <Card key={model.name} className="p-5" data-testid={`card-model-${model.name.toLowerCase().replace(/\s+/g, "-")}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <model.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{model.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{model.backend}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{model.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground">Input</p>
                  <p className="text-xs font-medium text-foreground">{model.inputSize}</p>
                </div>
                <div className="bg-muted rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground">Model Size</p>
                  <p className="text-xs font-medium text-foreground">{model.modelSize}</p>
                </div>
                <div className="bg-muted rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground">Latency</p>
                  <p className="text-xs font-medium text-chart-2">{model.latency}</p>
                </div>
                <div className="bg-muted rounded-md p-2">
                  <p className="text-[10px] text-muted-foreground">Accuracy</p>
                  <p className="text-xs font-medium text-chart-2">{model.accuracy}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <SimulatedEdgeInference />

      <Card className="p-5">
        <h3 className="font-semibold text-foreground text-sm mb-3">Hardware Compatibility Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium text-foreground">Hardware</th>
                <th className="text-left p-2 font-medium text-foreground">Backend</th>
                <th className="text-left p-2 font-medium text-foreground">Models</th>
                <th className="text-left p-2 font-medium text-foreground">Use Case</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-2">ARM Cortex-M7 MCU</td>
                <td className="p-2"><Badge variant="outline" className="text-[9px]">Ethos-U</Badge></td>
                <td className="p-2">Thermal, Water Quality</td>
                <td className="p-2">Sensor pod classification</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2">Snapdragon 8 Gen 3</td>
                <td className="p-2"><Badge variant="outline" className="text-[9px]">QNN Hexagon</Badge></td>
                <td className="p-2">All models</td>
                <td className="p-2">Primary drone compute</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2">ARM Mali GPU</td>
                <td className="p-2"><Badge variant="outline" className="text-[9px]">Vulkan</Badge></td>
                <td className="p-2">Kelp Seg, Debris</td>
                <td className="p-2">Vision processing</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-2">Apple Neural Engine</td>
                <td className="p-2"><Badge variant="outline" className="text-[9px]">Core ML</Badge></td>
                <td className="p-2">All models</td>
                <td className="p-2">iOS companion app</td>
              </tr>
              <tr>
                <td className="p-2">XNNPACK (Any CPU)</td>
                <td className="p-2"><Badge variant="outline" className="text-[9px]">CPU</Badge></td>
                <td className="p-2">All models</td>
                <td className="p-2">Fallback / testing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
