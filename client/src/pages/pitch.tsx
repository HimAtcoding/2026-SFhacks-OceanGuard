import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  Target,
  Users,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Globe,
  Leaf,
  Waves,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Cpu,
  Radar,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function SlideSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      variants={fadeIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className={`py-12 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function PitchDeck() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-0">
      <div className="text-center mb-4">
        <Badge variant="secondary" className="mb-4">Pitch Deck</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Hack For Greener Tomorrow
        </h1>
        <p className="text-muted-foreground">
          AI-Powered Drone Ocean Health Monitoring Platform
        </p>
        <p className="text-sm text-muted-foreground mt-1">SF Hacks 2026 &mdash; Entrepreneurship Track</p>
      </div>

      <Separator />

      <SlideSection>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-md bg-red-500/10 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">The Problem</h2>
            </div>
            <ul className="space-y-3">
              {[
                "Harmful algal blooms (HABs) cause $4.6B in annual economic damage in the US alone",
                "Manual water quality testing is slow, expensive, and covers only small areas",
                "By the time dangerous blooms are detected, it's often too late to prevent damage",
                "Climate change is increasing bloom frequency by 59% over the past decade",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-red-500 mt-1 shrink-0">&#x2022;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">The Cost of Inaction</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="text-muted-foreground">Fisheries Impact</span>
                  <span className="font-medium text-foreground">$1.2B/yr</span>
                </div>
                <div className="h-2 bg-muted rounded-sm overflow-hidden">
                  <div className="h-full bg-destructive/70 rounded-sm" style={{ width: "65%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="text-muted-foreground">Tourism Loss</span>
                  <span className="font-medium text-foreground">$800M/yr</span>
                </div>
                <div className="h-2 bg-muted rounded-sm overflow-hidden">
                  <div className="h-full bg-chart-4/70 rounded-sm" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="text-muted-foreground">Healthcare Costs</span>
                  <span className="font-medium text-foreground">$2.1B/yr</span>
                </div>
                <div className="h-2 bg-muted rounded-sm overflow-hidden">
                  <div className="h-full bg-chart-5/70 rounded-sm" style={{ width: "80%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="text-muted-foreground">Water Treatment</span>
                  <span className="font-medium text-foreground">$500M/yr</span>
                </div>
                <div className="h-2 bg-muted rounded-sm overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-sm" style={{ width: "30%" }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Our Solution</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <Radar className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Drone Scanning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Autonomous drones equipped with multispectral cameras survey large ocean areas in minutes, not days.
            </p>
          </Card>
          <Card className="p-5">
            <Cpu className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">AI Analysis</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Machine learning models classify algae species, measure concentration, and predict bloom trajectories in real-time.
            </p>
          </Card>
          <Card className="p-5">
            <BarChart3 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Actionable Dashboard</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real-time web dashboard with alerts, historical trends, and exportable reports for stakeholders and researchers.
            </p>
          </Card>
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Key Differentiators</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Globe, title: "10x Coverage", desc: "Cover 50 sq km per flight vs 0.5 sq km with traditional boat sampling" },
            { icon: Zap, title: "Real-Time Alerts", desc: "Automated SMS/email alerts when algae or pollutant levels exceed safe thresholds" },
            { icon: Shield, title: "98% Accuracy", desc: "CNN-based classifier trained on 50,000+ labeled algae images from NOAA datasets" },
            { icon: DollarSign, title: "90% Cost Reduction", desc: "Reduces monitoring costs from $50,000/survey to $5,000 per equivalent area" },
          ].map((item, i) => (
            <Card key={i} className="p-5 flex items-start gap-4">
              <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-0.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Target Market</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-primary mb-1">$2.8B</p>
            <p className="text-sm font-medium text-foreground">Total Addressable Market</p>
            <p className="text-xs text-muted-foreground mt-1">Global water quality monitoring</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-primary mb-1">$450M</p>
            <p className="text-sm font-medium text-foreground">Serviceable Market</p>
            <p className="text-xs text-muted-foreground mt-1">Coastal & marine monitoring</p>
          </Card>
          <Card className="p-5 text-center">
            <p className="text-3xl font-bold text-primary mb-1">$85M</p>
            <p className="text-sm font-medium text-foreground">Initial Target</p>
            <p className="text-xs text-muted-foreground mt-1">US coastal municipalities</p>
          </Card>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold text-foreground mb-3">Key Customer Segments</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { segment: "Municipal Water Agencies", detail: "800+ coastal cities need affordable algae monitoring" },
              { segment: "Environmental Research Institutions", detail: "Universities and NOAA labs seeking scalable field data collection" },
              { segment: "Aquaculture & Fisheries", detail: "Fish farms losing $1.2B/yr to HAB-related die-offs" },
              { segment: "Tourism & Resort Operators", detail: "Beach destinations needing early warning for harmful blooms" },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{c.segment}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Business Model</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-2">SaaS Platform</h3>
            <p className="text-2xl font-bold text-primary mb-1">$499/mo</p>
            <p className="text-xs text-muted-foreground mb-3">Per monitoring zone</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Real-time dashboard access</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Automated alerts</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Historical data & reports</li>
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-2">Drone-as-a-Service</h3>
            <p className="text-2xl font-bold text-primary mb-1">$2,500</p>
            <p className="text-xs text-muted-foreground mb-3">Per survey mission</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Operated drone flights</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Full sensor suite</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Detailed analysis report</li>
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-2">Enterprise API</h3>
            <p className="text-2xl font-bold text-primary mb-1">Custom</p>
            <p className="text-xs text-muted-foreground mb-3">For large organizations</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> API integration</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Custom ML models</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-primary shrink-0" /> Dedicated support</li>
            </ul>
          </Card>
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Growth Roadmap</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-8">
            {[
              { phase: "Q1 2026", title: "MVP Launch", items: ["Launch drone scanning prototype", "Deploy dashboard v1.0", "Pilot with 3 coastal agencies in SF Bay Area"] },
              { phase: "Q3 2026", title: "Scale", items: ["Expand to 20 monitoring zones", "Add predictive bloom modeling", "Launch SaaS subscription platform"] },
              { phase: "Q1 2027", title: "Expand", items: ["Enter aquaculture market", "International pilot programs", "Raise Series A for fleet expansion"] },
              { phase: "Q4 2027", title: "Dominate", items: ["100+ enterprise customers", "Open-source dataset contribution", "Government contract bids"] },
            ].map((phase, i) => (
              <div key={i} className="flex gap-6 items-start ml-0">
                <div className="relative z-10 w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">{phase.phase}</Badge>
                  <h3 className="font-semibold text-foreground mb-2">{phase.title}</h3>
                  <ul className="space-y-1">
                    {phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SlideSection>

      <Separator />

      <SlideSection>
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-md bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">The Ask</h2>
        </div>
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            We're seeking mentorship and connections to scale our impact.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Pilot Partners</h3>
              <p className="text-sm text-muted-foreground">Coastal agencies willing to test our platform</p>
            </div>
            <div>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Advisors</h3>
              <p className="text-sm text-muted-foreground">Marine biology and drone tech experts</p>
            </div>
            <div>
              <Leaf className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">Impact Investment</h3>
              <p className="text-sm text-muted-foreground">Pre-seed funding for fleet and team growth</p>
            </div>
          </div>
        </Card>
      </SlideSection>

      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          SFSU Innovation & Entrepreneurship / Lam-Larsen Emerging Technologies Initiative
        </p>
      </div>
    </div>
  );
}
