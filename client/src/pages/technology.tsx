import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Cpu,
  Radar,
  Wifi,
  Database,
  BarChart3,
  Camera,
  Thermometer,
  Droplets,
  Leaf,
  Layers,
  Code,
  Server,
  ArrowRight,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

function TechStackItem({ icon: Icon, name, description }: { icon: any; name: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="rounded-md bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function Technology() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-tech-title">Technology Stack</h1>
        <p className="text-sm text-muted-foreground">
          The hardware, software, and AI systems powering our ocean monitoring platform.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-md overflow-hidden"
      >
        <img
          src="/images/data-viz.png"
          alt="Data visualization"
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h2 className="text-xl font-bold text-white mb-1">End-to-End Pipeline</h2>
          <p className="text-sm text-white/70">From drone sensor to actionable insight in minutes</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          { step: "1", icon: Radar, title: "Capture", desc: "Drone collects multispectral imagery and sensor data" },
          { step: "2", icon: Wifi, title: "Transmit", desc: "Data uploaded via cellular or satellite link in real-time" },
          { step: "3", icon: Cpu, title: "Process", desc: "AI models classify algae, measure water quality metrics" },
          { step: "4", icon: BarChart3, title: "Visualize", desc: "Dashboard displays results with alerts and trends" },
        ].map((s) => (
          <Card key={s.step} className="p-4 text-center">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold mx-auto mb-3">
              {s.step}
            </div>
            <s.icon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-semibold text-foreground text-sm mb-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="hardware">
        <TabsList>
          <TabsTrigger value="hardware" data-testid="tab-hardware">Hardware</TabsTrigger>
          <TabsTrigger value="software" data-testid="tab-software">Software</TabsTrigger>
          <TabsTrigger value="ai" data-testid="tab-ai">AI / ML</TabsTrigger>
        </TabsList>

        <TabsContent value="hardware">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Drone Platform</h3>
              <div className="space-y-0.5">
                <TechStackItem icon={Radar} name="DJI Matrice 350 RTK" description="Enterprise-grade drone with 55-min flight time and RTK precision positioning" />
                <TechStackItem icon={Camera} name="MicaSense RedEdge-P" description="5-band multispectral camera for vegetation and water analysis (Blue, Green, Red, RedEdge, NIR)" />
                <TechStackItem icon={Wifi} name="4G/LTE Module" description="Real-time data transmission during flight for live monitoring" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Sensor Suite</h3>
              <div className="space-y-0.5">
                <TechStackItem icon={Thermometer} name="Water Temperature Sensor" description="Infrared thermal imaging for surface temperature mapping (0.1°C accuracy)" />
                <TechStackItem icon={Droplets} name="pH & DO Sensors" description="Drop-probe sensors for pH level and dissolved oxygen readings at survey points" />
                <TechStackItem icon={Leaf} name="Chlorophyll-a Fluorometer" description="Specialized sensor to directly measure chlorophyll concentration in water" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="software">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Frontend</h3>
              <div className="space-y-0.5">
                <TechStackItem icon={Code} name="React + TypeScript" description="Type-safe component architecture with Vite for fast builds" />
                <TechStackItem icon={BarChart3} name="Recharts" description="Interactive data visualization for environmental metrics and trends" />
                <TechStackItem icon={Layers} name="Tailwind CSS + Shadcn/UI" description="Responsive design system with dark/light mode support" />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Backend</h3>
              <div className="space-y-0.5">
                <TechStackItem icon={Server} name="Node.js + Express" description="RESTful API serving drone scan data and alert notifications" />
                <TechStackItem icon={Database} name="PostgreSQL + Drizzle ORM" description="Persistent storage for scan records, alerts, and historical data" />
                <TechStackItem icon={Wifi} name="IBM webMethods Integration" description="Workflow automation for alert routing via API Connect" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Detection Models</h3>
              <div className="space-y-0.5">
                <TechStackItem icon={Cpu} name="Algae Classifier (CNN)" description="ResNet-50 fine-tuned on 50,000+ labeled algae images. Classifies HAB species with 98% accuracy." />
                <TechStackItem icon={Leaf} name="NDVI Calculator" description="Normalized Difference Vegetation Index from multispectral bands: (NIR - Red) / (NIR + Red)" />
                <TechStackItem icon={BarChart3} name="Bloom Predictor (LSTM)" description="Time-series model predicting algae bloom probability 72 hours ahead based on historical patterns." />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Data Pipeline</h3>
              <div className="space-y-3">
                {[
                  "Raw multispectral images ingested from drone",
                  "Preprocessing: Radiometric calibration & georeferencing",
                  "Feature extraction: Band ratios, texture, chlorophyll-a",
                  "CNN classification: Algae type & severity scoring",
                  "NDVI mapping: Per-pixel vegetation health index",
                  "LSTM prediction: 72-hour bloom forecast",
                  "Alert generation: Threshold-based notification triggers",
                  "Dashboard update: Real-time visualization refresh",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">IBM Integration Architecture</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We leverage IBM webMethods Hybrid Integration to automate the alert pipeline from drone data to stakeholder notifications.
        </p>
        <div className="grid md:grid-cols-4 gap-3">
          {[
            { label: "Drone API", desc: "HTTP trigger receives processed scan data" },
            { label: "webMethods Workflow", desc: "No-code logic evaluates thresholds" },
            { label: "API Connect", desc: "Published API with key-based security" },
            { label: "Notifications", desc: "Slack, email, and SMS alert delivery" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex items-center gap-1 shrink-0 mt-1">
                <div className="w-5 h-5 rounded-sm bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
