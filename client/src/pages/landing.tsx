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
  Shield,
  Zap,
  Brain,
  Coins,
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
              AI-Powered Ocean Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Protect Marine{" "}
              <span className="text-primary">Ecosystems</span>{" "}
              With Real-Time Data
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
              Autonomous drone surveillance that continuously monitors ocean environments,
              detects harmful algae blooms, tracks water quality, and generates
              AI-powered environmental impact reports.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button data-testid="button-view-dashboard" className="gap-2">
                  Live Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/reports">
                <Button data-testid="button-ai-reports" variant="outline" className="gap-2 backdrop-blur-sm">
                  AI Reports <Brain className="h-4 w-4" />
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
              <StatCard icon={Globe} value="12" label="Coastal Zones" />
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
              End-to-end pipeline from drone deployment to actionable environmental intelligence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Radar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">1. Deploy Drone Fleet</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Autonomous drones equipped with multispectral cameras and environmental sensors
                  scan coastal and open-ocean areas on scheduled routes.
                </p>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">2. AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gemini AI and custom ML models process imagery and sensor data to detect
                  algae concentration, water quality anomalies, and vegetation health in real time.
                </p>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn} initial="initial" whileInView="animate" viewport={{ once: true }}>
              <Card className="p-6 text-center h-full">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">3. Act on Intelligence</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time alerts, AI-generated reports, and carbon credit tracking
                  enable rapid response to environmental threats and verified impact measurement.
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
            <h2 className="text-3xl font-bold text-foreground mb-3">Platform Capabilities</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Comprehensive environmental monitoring powered by cutting-edge AI, distributed data systems, and blockchain verification.
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
                description="Real-time identification of harmful algal blooms using multispectral imaging and deep learning classification with 98% accuracy."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Droplets}
                title="Water Quality Monitoring"
                description="Continuous measurement of pH, dissolved oxygen, turbidity, and temperature across large water bodies with distributed sensor streams."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Brain}
                title="AI Environmental Reports"
                description="Gemini-powered analysis generates comprehensive environmental impact assessments with trend detection and predictive modeling."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Coins}
                title="Carbon Credit Verification"
                description="Blockchain-backed carbon offset tracking with transparent, on-chain verification of environmental impact and conservation efforts."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Shield}
                title="Automated Alert System"
                description="Intelligent threshold monitoring triggers instant notifications when environmental readings exceed safe limits for aquatic life."
              />
            </motion.div>
            <motion.div variants={fadeIn}>
              <FeatureCard
                icon={Zap}
                title="Real-Time Data Pipeline"
                description="Scalable data ingestion processes thousands of sensor readings per minute with cloud-native analytics and historical trend analysis."
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
                Built for Real Impact
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                OceanGuard combines autonomous drone hardware with AI-powered analytics
                and blockchain verification to deliver actionable intelligence for researchers,
                municipalities, and environmental agencies protecting marine ecosystems worldwide.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>Climate Action</Badge>
                <Badge variant="secondary">AI Intelligence</Badge>
                <Badge variant="secondary">Real-Time Data</Badge>
                <Badge variant="secondary">Carbon Tracking</Badge>
                <Badge variant="secondary">Open Platform</Badge>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            OceanGuard &mdash; AI-Powered Ocean Health Intelligence
          </p>
        </div>
      </section>
    </div>
  );
}
