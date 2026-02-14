import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Waves,
  Radar,
  Leaf,
  BarChart3,
  ArrowRight,
  Globe,
  Droplets,
  Wind,
  Thermometer,
  Activity,
  Scan,
  Target,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <Icon className="h-6 w-6 text-primary" />
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Card className="p-6 hover-elevate">
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-primary/10 p-3 shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-ocean.png"
            alt="Ocean aerial view"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-6 border-white/30 text-white/90 bg-white/10 backdrop-blur-sm no-default-hover-elevate no-default-active-elevate">
              SF Hacks 2026
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Hack For a{" "}
              <span className="text-primary">Greener</span>{" "}
              Tomorrow
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              AI-powered drone surveillance that scans ocean environments, detects algae blooms,
              and monitors water quality in real-time to protect our marine ecosystems.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button data-testid="button-view-dashboard" className="gap-2">
                  View Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pitch">
                <Button data-testid="button-pitch-deck" variant="outline" className="gap-2 backdrop-blur-sm">
                  Pitch Deck <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <section className="py-16 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <motion.div variants={fadeIn}>
              <StatCard icon={Scan} value="500+" label="Scans Completed" />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard icon={Globe} value="12" label="Coastal Zones Monitored" />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard icon={Droplets} value="98%" label="Detection Accuracy" />
            </motion.div>
            <motion.div variants={fadeIn}>
              <StatCard icon={Leaf} value="3x" label="Faster Than Manual" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our system combines drone technology with AI to provide comprehensive ocean health monitoring.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Radar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">1. Deploy Drone</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our autonomous drones fly over coastal and ocean areas, equipped with multispectral cameras and environmental sensors.
                </p>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">2. Analyze Data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI algorithms process captured imagery and sensor readings to detect algae concentration, water quality, and vegetation health.
                </p>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">3. Take Action</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time alerts and detailed reports enable rapid response to harmful algae blooms and environmental threats.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">Core Capabilities</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comprehensive environmental monitoring powered by cutting-edge technology.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-4"
          >
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Waves}
                title="Algae Bloom Detection"
                description="Real-time identification of harmful algal blooms using multispectral imaging and machine learning classification."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Droplets}
                title="Water Quality Analysis"
                description="Measure pH levels, dissolved oxygen, turbidity, and temperature across large water bodies simultaneously."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Leaf}
                title="Greenery Index Mapping"
                description="Calculate normalized difference vegetation indices to assess coastal vegetation and marine plant health."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Thermometer}
                title="Thermal Monitoring"
                description="Track water temperature anomalies that may indicate pollution discharge or ecosystem stress."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Wind}
                title="Environmental Alerts"
                description="Automated alert system triggers notifications when readings exceed safe thresholds for aquatic life."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={BarChart3}
                title="Historical Analytics"
                description="Track environmental trends over time with comprehensive dashboards and exportable data reports."
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="/images/drone-scanner.png"
                alt="Environmental monitoring drone"
                className="rounded-md w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Built for Impact
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our solution addresses multiple critical environmental challenges. By combining
                hardware innovation with AI-powered analytics, we provide actionable insights that
                help researchers, municipalities, and environmental agencies protect marine ecosystems.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Climate Action</Badge>
                <Badge variant="secondary">Hardware Innovation</Badge>
                <Badge variant="secondary">AI/ML</Badge>
                <Badge variant="secondary">Sustainability</Badge>
                <Badge variant="secondary">Open Data</Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Hack For Greener Tomorrow &mdash; SF Hacks 2026
          </p>
        </div>
      </section>
    </div>
  );
}
