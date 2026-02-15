import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { CityMonitor, DroneScan } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  BookOpen,
  GraduationCap,
  Leaf,
  Waves,
  Droplets,
  Recycle,
  Users,
  Target,
  Award,
  Lightbulb,
  Globe,
  Beaker,
  BarChart3,
  CheckCircle,
  ArrowRight,
  FileText,
  Download,
} from "lucide-react";

const K12_LESSONS = [
  {
    grade: "K-2",
    title: "Our Ocean Friends",
    subject: "Science / Art",
    duration: "45 min",
    description: "Students learn about kelp forests and marine life through interactive drawings and our live ocean health data. They track which cities have the healthiest oceans.",
    objectives: ["Identify marine organisms", "Understand ocean health basics", "Practice data observation"],
    activity: "Use the OceanGuard dashboard to find the 3 healthiest ocean cities and draw their marine life.",
    standard: "NGSS K-LS1-1",
  },
  {
    grade: "3-5",
    title: "Tracking Ocean Trash",
    subject: "Math / Science",
    duration: "60 min",
    description: "Students analyze real-time trash level data from 20 global cities, create bar graphs, and calculate averages to understand pollution patterns.",
    objectives: ["Read and interpret real data", "Calculate averages", "Compare data sets"],
    activity: "Download city trash level data, create comparison charts, and write a report on the dirtiest vs cleanest oceans.",
    standard: "NGSS 5-ESS3-1, CCSS.MATH.5.MD",
  },
  {
    grade: "6-8",
    title: "Kelp Forest Ecosystems",
    subject: "Life Science",
    duration: "90 min",
    description: "Deep dive into kelp ecosystems using live kelp density data from our monitoring network. Students track how kelp health varies by geography and temperature.",
    objectives: ["Analyze ecosystem health indicators", "Correlate environmental variables", "Propose conservation actions"],
    activity: "Use OceanGuard tracking data to map kelp density vs water temperature across 20 cities. Identify at-risk zones.",
    standard: "NGSS MS-LS2-4",
  },
  {
    grade: "9-12",
    title: "Marine Data Science",
    subject: "AP Environmental Science",
    duration: "2 hours",
    description: "Students use our API to pull real sensor data, analyze dissolved oxygen, pH, turbidity trends, and build predictive models for ocean health.",
    objectives: ["Work with real environmental APIs", "Perform statistical analysis", "Build predictive models"],
    activity: "Query the OceanGuard API, analyze sensor trends over time, and present findings on which factors most impact ocean health scores.",
    standard: "NGSS HS-LS2-6, AP ES Unit 8",
  },
];

const COLLEGE_MODULES = [
  {
    title: "Environmental Data Engineering",
    department: "Computer Science / Data Science",
    credits: "3 credits",
    description: "Build real-time data pipelines using OceanGuard's sensor stream architecture. Students work with PostgreSQL, MongoDB, and streaming APIs to process environmental telemetry.",
    topics: ["Stream processing", "Database mirroring (PostgreSQL to MongoDB)", "REST API design", "Real-time dashboard development"],
    project: "Design and implement a real-time environmental monitoring dashboard using OceanGuard's open API.",
  },
  {
    title: "AI for Environmental Monitoring",
    department: "Computer Science / Environmental Science",
    credits: "3 credits",
    description: "Apply machine learning to ocean health prediction. Use drone scan data to train models for algae bloom prediction, trash detection, and ecosystem scoring.",
    topics: ["CNN image classification", "Time-series forecasting", "Edge AI deployment (ExecuTorch)", "Transfer learning for environmental data"],
    project: "Train an on-device AI model that classifies water quality from sensor readings, deployable on drone hardware using ExecuTorch.",
  },
  {
    title: "Blockchain for Environmental Accountability",
    department: "Business / Computer Science",
    credits: "3 credits",
    description: "Study how blockchain technology enables transparent environmental impact tracking. Explore OceanGuard's Solana-based carbon credit and donation systems.",
    topics: ["Solana smart contracts", "Carbon credit tokenization", "Transparent donation tracking", "Environmental impact verification"],
    project: "Build a Solana program that mints carbon credits based on verified cleanup data from OceanGuard operations.",
  },
  {
    title: "Marine Conservation Policy & Data",
    department: "Environmental Policy / Marine Biology",
    credits: "3 credits",
    description: "Use OceanGuard's global monitoring data to inform conservation policy decisions. Analyze how AI-driven insights can shape environmental regulations.",
    topics: ["Data-driven policy making", "International maritime law", "Environmental impact assessment", "Community engagement strategies"],
    project: "Produce a policy brief using OceanGuard data that recommends cleanup priorities for a coastal city of your choice.",
  },
];

const SUSTAINABILITY_TIPS = [
  { icon: Recycle, title: "Reduce Single-Use Plastics", desc: "80% of ocean trash originates from land. Reducing plastic use directly improves ocean health scores." },
  { icon: Droplets, title: "Water Conservation", desc: "Conserving water reduces runoff pollution that degrades coastal water quality." },
  { icon: Leaf, title: "Support Kelp Restoration", desc: "Kelp forests absorb 20x more CO2 than land forests per acre. Protecting them fights climate change." },
  { icon: Globe, title: "Local Cleanup Impact", desc: "A single beach cleanup event can remove 200+ kg of debris, improving local ecosystem scores by 5-15%." },
];

function LiveDataExplorer() {
  const { data: cities } = useQuery<CityMonitor[]>({ queryKey: ["/api/cities"] });
  const { data: scans } = useQuery<DroneScan[]>({ queryKey: ["/api/scans"] });

  const sortedByKelp = [...(cities || [])].sort((a, b) => b.kelpDensity - a.kelpDensity).slice(0, 10);
  const chartData = sortedByKelp.map(c => ({
    city: c.cityName,
    kelp: Math.round(c.kelpDensity),
    trash: Math.round(c.trashLevel),
  }));

  const recentScans = (scans || []).slice(0, 20);
  const scanTrend = recentScans.map((s, i) => ({
    scan: i + 1,
    waterQuality: Math.round(s.waterQuality),
    algae: Math.round(s.algaeLevel),
  })).reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Live Data Explorer for Classrooms</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Real data from our global monitoring network, updated in real-time. Use these charts in your lessons and research.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-xs font-semibold text-foreground mb-3">Kelp Density vs Trash Level by City</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="city" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "6px" }} />
              <Bar dataKey="kelp" name="Kelp %" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="trash" name="Trash %" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <h4 className="text-xs font-semibold text-foreground mb-3">Recent Scan Trends (Water Quality & Algae)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scanTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="scan" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "6px" }} />
              <Line type="monotone" dataKey="waterQuality" name="Water Quality" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="algae" name="Algae Level" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">API Access for Student Projects</h4>
        <p className="text-xs text-muted-foreground mb-2">Students can query our REST API directly for data science projects:</p>
        <div className="bg-muted rounded-md p-3 font-mono text-xs text-foreground space-y-1">
          <p>GET /api/cities - All 20 monitored cities with health scores</p>
          <p>GET /api/scans - Drone scan data with sensor readings</p>
          <p>GET /api/tracks - Kelp & trash movement tracking points</p>
          <p>GET /api/predictions/:cityId - AI movement predictions</p>
          <p>GET /api/weather/:cityId - 7-day marine weather forecast</p>
        </div>
      </Card>
    </div>
  );
}

export default function Education() {
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-education-title">Sustainability Education</h1>
            <Badge variant="secondary" className="gap-1">
              <GraduationCap className="h-3 w-3" />
              K-12 & College
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Curriculum resources and live ocean data for teaching sustainability in classrooms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SUSTAINABILITY_TIPS.map((tip) => (
          <Card key={tip.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-chart-2/10 p-2.5 shrink-0">
                <tip.icon className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{tip.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="k12">
        <TabsList>
          <TabsTrigger value="k12" data-testid="tab-k12">
            <BookOpen className="h-3 w-3 mr-1.5" />
            K-12 Lesson Plans
          </TabsTrigger>
          <TabsTrigger value="college" data-testid="tab-college">
            <GraduationCap className="h-3 w-3 mr-1.5" />
            College Modules
          </TabsTrigger>
          <TabsTrigger value="data" data-testid="tab-live-data">
            <BarChart3 className="h-3 w-3 mr-1.5" />
            Live Data Explorer
          </TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">
            <FileText className="h-3 w-3 mr-1.5" />
            Teacher Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="k12" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">K-12 Ocean Sustainability Curriculum</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Standards-aligned lesson plans using real ocean monitoring data from OceanGuard. Each lesson connects directly to our live platform for hands-on learning.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {K12_LESSONS.map((lesson, idx) => (
              <Card
                key={idx}
                className={`p-5 cursor-pointer ${selectedLesson === idx ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedLesson(selectedLesson === idx ? null : idx)}
                data-testid={`card-lesson-${idx}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <div>
                    <Badge variant="outline" className="mb-2">{lesson.grade}</Badge>
                    <h3 className="font-semibold text-foreground text-sm">{lesson.title}</h3>
                    <p className="text-xs text-muted-foreground">{lesson.subject}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{lesson.duration}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{lesson.description}</p>

                {selectedLesson === idx && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Learning Objectives</p>
                      <div className="space-y-1">
                        {lesson.objectives.map((obj, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-chart-2 shrink-0" />
                            <span className="text-xs text-muted-foreground">{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Classroom Activity</p>
                      <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">{lesson.activity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{lesson.standard}</Badge>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="college" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">University Course Modules</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Interdisciplinary modules integrating OceanGuard's technology stack and data into higher education. Each module includes a capstone project using our platform.
          </p>

          <div className="space-y-4">
            {COLLEGE_MODULES.map((mod, idx) => (
              <Card key={idx} className="p-5" data-testid={`card-module-${idx}`}>
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground">{mod.department}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{mod.credits}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{mod.description}</p>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-foreground mb-1.5">Key Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.topics.map((topic, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{topic}</Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-muted rounded-md p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Capstone Project</p>
                  <p className="text-xs text-muted-foreground">{mod.project}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <LiveDataExplorer />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Teacher & Instructor Resources</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Standards Alignment</h3>
              </div>
              <div className="space-y-2">
                {[
                  { standard: "NGSS", desc: "Next Generation Science Standards - Earth and Life Sciences" },
                  { standard: "CCSS Math", desc: "Data analysis, statistics, and measurement practices" },
                  { standard: "AP Environmental", desc: "Units on aquatic ecosystems, pollution, and sustainability" },
                  { standard: "UN SDG 14", desc: "Life Below Water - Conservation and sustainable use of oceans" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.standard}</Badge>
                    <span className="text-xs text-muted-foreground">{s.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-chart-3" />
                <h3 className="font-semibold text-foreground text-sm">Implementation Guide</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { step: "1", title: "Access Live Data", desc: "Navigate to the OceanGuard dashboard to show students real-time ocean metrics" },
                  { step: "2", title: "Choose Grade Level", desc: "Select from K-12 lesson plans or college modules matching your curriculum" },
                  { step: "3", title: "Interactive Exploration", desc: "Use the 3D globe and tracking pages for visual, hands-on learning" },
                  { step: "4", title: "Student Projects", desc: "Assign data analysis tasks using our free API endpoints" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-sm bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{s.step}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-chart-1" />
                <h3 className="font-semibold text-foreground text-sm">Classroom Activities</h3>
              </div>
              <div className="space-y-2">
                {[
                  "Ocean Health Bingo - Students track metrics from different cities",
                  "Data Detective - Find correlations between temperature and kelp density",
                  "Cleanup Campaign Design - Plan a cleanup using urgency rankings",
                  "Carbon Credit Calculator - Calculate environmental impact of actions",
                  "AI Report Analysis - Review and critique AI-generated ocean reports",
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">{activity}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-chart-4" />
                <h3 className="font-semibold text-foreground text-sm">Impact Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Cities Monitored", value: "20+", icon: Globe },
                  { label: "Data Points Daily", value: "1000+", icon: BarChart3 },
                  { label: "Sensor Types", value: "7", icon: Beaker },
                  { label: "AI Models Active", value: "4", icon: Lightbulb },
                ].map((m) => (
                  <div key={m.label} className="bg-muted rounded-md p-3 text-center">
                    <m.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
