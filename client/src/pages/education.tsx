import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Ship,
  Anchor,
  Fish,
  Microscope,
  TreePine,
  Compass,
  Cpu,
  Database,
  TrendingUp,
  Shield,
  Presentation,
  ClipboardCheck,
} from "lucide-react";

interface WeekModule {
  week: number;
  title: string;
  theme: string;
  description: string;
  learningObjectives: string[];
  keyTopics: string[];
  classroomActivity: string;
  activityDetails: string;
  deliverable: string;
  sustainabilityConnection: string;
  standards: string[];
  readingMaterials: string[];
  estimatedHours: number;
}

const COURSE_WEEKS: WeekModule[] = [
  {
    week: 1,
    title: "Introduction to Ocean Ecosystems & Sustainability",
    theme: "Foundations",
    description: "Establish a baseline understanding of why ocean health matters. Students explore the interconnected roles oceans play in climate regulation, food security, and biodiversity. Introduction to OceanGuard as a real-world monitoring platform.",
    learningObjectives: [
      "Explain the role of oceans in global carbon cycling and climate regulation",
      "Identify the 5 major threats to ocean health: pollution, overfishing, acidification, warming, habitat loss",
      "Navigate the OceanGuard dashboard and interpret real-time ocean health scores",
      "Define sustainability in the context of marine resource management",
    ],
    keyTopics: ["Ocean carbon sink capacity", "Marine biodiversity hotspots", "OceanGuard platform overview", "UN SDG 14: Life Below Water"],
    classroomActivity: "OceanGuard Dashboard Walkthrough",
    activityDetails: "Students access the OceanGuard live dashboard, identify the 3 healthiest and 3 most polluted cities from the 20 monitored locations, and write a 1-page reflection on what factors might explain the differences in ocean health scores.",
    deliverable: "Written reflection comparing ocean health across monitored cities (500 words)",
    sustainabilityConnection: "Understanding baseline ocean conditions is the first step toward meaningful conservation. Without data, we cannot measure improvement.",
    standards: ["NGSS HS-ESS3-6", "UN SDG 14.1"],
    readingMaterials: ["NOAA Ocean Acidification Overview", "IPCC Ocean and Cryosphere Report (Summary)"],
    estimatedHours: 4,
  },
  {
    week: 2,
    title: "Marine Pollution: Sources, Types & Measurement",
    theme: "Pollution Science",
    description: "Deep analysis of ocean pollution categories. Students learn to distinguish microplastics, chemical runoff, oil contamination, and biological pollutants. Using OceanGuard trash tracking data, students quantify pollution levels across global cities.",
    learningObjectives: [
      "Classify the 4 major categories of marine pollution and their primary sources",
      "Interpret trash level data from OceanGuard's global monitoring network",
      "Calculate pollution density per square kilometer using real tracking data",
      "Explain how land-based activities contribute to 80% of ocean pollution",
    ],
    keyTopics: ["Microplastic contamination pathways", "Agricultural runoff & dead zones", "Trash density measurement methods", "Point vs non-point source pollution"],
    classroomActivity: "Pollution Source Mapping",
    activityDetails: "Using OceanGuard's /api/tracks endpoint, students download trash tracking data for 5 cities. They map pollution density, identify movement patterns, and trace likely land-based sources using geographic analysis. Results are presented as annotated maps.",
    deliverable: "Annotated pollution source map for 5 cities with density calculations",
    sustainabilityConnection: "Reducing waste at its source is more effective than cleanup. By tracing pollution pathways, students understand where intervention has the greatest impact.",
    standards: ["NGSS HS-ESS3-4", "CCSS.MATH.S-ID.1"],
    readingMaterials: ["EPA Marine Debris Tracker Methodology", "Ocean Conservancy Trash Report 2025"],
    estimatedHours: 5,
  },
  {
    week: 3,
    title: "Kelp Forests: The Ocean's Carbon Warriors",
    theme: "Marine Biology",
    description: "Focused study on kelp ecosystems as critical carbon sinks. Students analyze real kelp density data from OceanGuard to understand how these underwater forests absorb CO2, support biodiversity, and indicate overall ecosystem health.",
    learningObjectives: [
      "Describe the structure and ecological role of kelp forest ecosystems",
      "Explain how kelp absorbs 20x more CO2 per acre than terrestrial forests",
      "Analyze kelp density trends across OceanGuard's 20 monitored cities",
      "Correlate water temperature with kelp health using real sensor data",
    ],
    keyTopics: ["Kelp photosynthesis & carbon sequestration", "Kelp as habitat for 800+ marine species", "Temperature sensitivity & kelp die-offs", "Kelp restoration techniques"],
    classroomActivity: "Kelp Density vs Temperature Correlation Study",
    activityDetails: "Students use OceanGuard's city data API to extract kelp density and water temperature readings for all 20 monitored cities. They create scatter plots, calculate correlation coefficients, and write hypotheses about which temperature ranges support the healthiest kelp growth.",
    deliverable: "Statistical analysis report with scatter plots and correlation findings",
    sustainabilityConnection: "Protecting kelp forests is one of the most cost-effective climate strategies. Each square meter of healthy kelp absorbs significant CO2 while supporting marine food webs.",
    standards: ["NGSS HS-LS2-6", "CCSS.MATH.S-ID.6"],
    readingMaterials: ["Kelp Forest Alliance Research Summary", "Nature: Global Kelp Forest Decline Study"],
    estimatedHours: 5,
  },
  {
    week: 4,
    title: "Water Quality Monitoring & Sensor Technology",
    theme: "Environmental Science",
    description: "Hands-on exploration of how water quality is measured. Students study the 7 sensor types used by OceanGuard drones (temperature, pH, dissolved oxygen, turbidity, algae level, greenery index, water quality score) and learn what each metric reveals about ecosystem health.",
    learningObjectives: [
      "Explain what each of OceanGuard's 7 sensor readings measures and why it matters",
      "Identify dangerous thresholds for dissolved oxygen (<4.5 mg/L) and pH (<7.2 or >8.6)",
      "Interpret multi-variable sensor data to assess overall water quality",
      "Design a basic water quality monitoring protocol using available instruments",
    ],
    keyTopics: ["Dissolved oxygen & hypoxic zones", "pH levels & ocean acidification", "Turbidity & light penetration", "Algae blooms as ecosystem stress indicators"],
    classroomActivity: "Sensor Data Detective",
    activityDetails: "Students analyze the latest 50 drone scans from OceanGuard's API. For each scan, they classify the water quality as 'healthy', 'at risk', or 'critical' based on sensor thresholds. Students identify which sensor readings are most predictive of poor water quality scores.",
    deliverable: "Classification spreadsheet with written analysis of the most predictive sensor readings",
    sustainabilityConnection: "Consistent water quality monitoring enables early detection of pollution events, allowing communities to respond before ecosystems are permanently damaged.",
    standards: ["NGSS HS-ESS2-5", "AP Environmental Science Unit 8"],
    readingMaterials: ["USGS Water Quality Monitoring Guide", "EPA Water Quality Criteria Reference"],
    estimatedHours: 5,
  },
  {
    week: 5,
    title: "Data-Driven Conservation: Analytics & Visualization",
    theme: "Data Science",
    description: "Students transition from data consumers to data analysts. Using OceanGuard's live data, they learn to create meaningful visualizations, identify trends over time, and build data narratives that communicate environmental urgency to non-technical audiences.",
    learningObjectives: [
      "Create effective data visualizations from raw environmental datasets",
      "Identify temporal trends and seasonal patterns in ocean health data",
      "Calculate moving averages and trend lines from sensor time series",
      "Communicate data findings to non-technical audiences through visual storytelling",
    ],
    keyTopics: ["Data visualization best practices", "Time-series analysis fundamentals", "Statistical significance in environmental data", "Communicating science to the public"],
    classroomActivity: "Ocean Health Dashboard Design",
    activityDetails: "Teams of 3-4 students query OceanGuard's API to download scan data, city health scores, and tracking data. Each team designs a one-page infographic or interactive dashboard that tells a compelling story about one aspect of ocean health (kelp decline, pollution trends, or regional comparisons).",
    deliverable: "One-page data infographic or interactive visualization with narrative summary",
    sustainabilityConnection: "Data without communication is ineffective. Teaching students to translate environmental data into compelling narratives empowers them to advocate for sustainability.",
    standards: ["CCSS.MATH.S-IC.6", "NGSS Science & Engineering Practice 4"],
    readingMaterials: ["Edward Tufte: Visual Display of Quantitative Information (Ch. 1-2)", "Data Visualization for Environmental Science Guide"],
    estimatedHours: 6,
  },
  {
    week: 6,
    title: "AI & Machine Learning for Environmental Prediction",
    theme: "Technology",
    description: "Introduction to how artificial intelligence is applied to ocean monitoring. Students explore OceanGuard's AI models: Gemini for report generation, on-device classifiers for water quality, and predictive algorithms for kelp/trash movement forecasting.",
    learningObjectives: [
      "Explain how machine learning models are trained on environmental sensor data",
      "Understand the difference between cloud AI and edge AI (ExecuTorch) for monitoring",
      "Interpret AI-generated predictions for kelp and trash movement (6h/12h/24h/48h)",
      "Evaluate the accuracy and limitations of AI environmental predictions",
    ],
    keyTopics: ["Supervised learning with sensor data", "Edge AI deployment on drones (ExecuTorch)", "Prediction accuracy evaluation", "AI bias in environmental monitoring"],
    classroomActivity: "AI Prediction Accuracy Audit",
    activityDetails: "Students use OceanGuard's /api/predictions/:cityId endpoint to retrieve movement predictions for 5 cities. They compare the 6-hour predictions against what actually occurs in the tracking data 6 hours later, calculating prediction accuracy rates and identifying factors that cause the AI to make errors.",
    deliverable: "Prediction accuracy report with error analysis and improvement recommendations",
    sustainabilityConnection: "AI can process environmental data millions of times faster than humans, enabling early warnings for pollution events, algae blooms, and ecosystem collapse.",
    standards: ["NGSS HS-ETS1-4", "CS Principles: Data Analysis"],
    readingMaterials: ["MIT: AI for Environmental Monitoring Overview", "ExecuTorch On-Device AI Documentation"],
    estimatedHours: 5,
  },
  {
    week: 7,
    title: "Marine Debris Cleanup: Planning & Resource Optimization",
    theme: "Operations & Logistics",
    description: "Students study how cleanup operations are planned, prioritized, and executed. Using OceanGuard's cleanup dashboard data, they learn to rank sites by urgency, estimate resource needs, and optimize volunteer deployment for maximum environmental impact.",
    learningObjectives: [
      "Apply urgency ranking algorithms to prioritize cleanup sites based on trash levels",
      "Calculate resource requirements (volunteers, equipment, budget) for cleanup operations",
      "Design a cleanup logistics plan accounting for weather, tides, and site accessibility",
      "Evaluate the cost-effectiveness of different cleanup strategies",
    ],
    keyTopics: ["Trash level urgency scoring", "Resource allocation optimization", "Weather & tide considerations", "Volunteer coordination logistics"],
    classroomActivity: "Cleanup Operation Planning Challenge",
    activityDetails: "Using OceanGuard's /api/cleanup and /api/weather/:cityId endpoints, each team selects a high-urgency city and designs a complete cleanup operation plan. Plans must include budget estimates, equipment lists (trash bags, safety gear, drones), volunteer schedules, and weather contingencies.",
    deliverable: "Complete cleanup operation plan with budget, timeline, and resource allocation",
    sustainabilityConnection: "Efficient resource use in cleanups means more coastline cleaned per dollar spent. Optimization directly reduces waste in the cleanup process itself.",
    standards: ["CCSS.MATH.7.RP", "NGSS MS-ESS3-3"],
    readingMaterials: ["Ocean Conservancy Cleanup Operations Handbook", "NOAA Marine Debris Removal Best Practices"],
    estimatedHours: 6,
  },
  {
    week: 8,
    title: "Climate Change & Ocean Acidification",
    theme: "Climate Science",
    description: "Comprehensive study of how rising CO2 levels affect ocean chemistry. Students analyze pH data from OceanGuard sensors to understand acidification trends, examine impacts on shell-forming organisms, and model future scenarios based on current emission trajectories.",
    learningObjectives: [
      "Explain the chemical process by which CO2 dissolves in seawater and lowers pH",
      "Analyze pH trends from OceanGuard sensor data across different ocean regions",
      "Predict impacts of continued acidification on coral reefs and shellfish populations",
      "Evaluate the effectiveness of carbon reduction strategies on ocean pH stabilization",
    ],
    keyTopics: ["Ocean CO2 absorption chemistry", "pH monitoring & acidification trends", "Impact on calcifying organisms", "Carbon reduction pathways"],
    classroomActivity: "Acidification Impact Modeling",
    activityDetails: "Students extract pH readings from OceanGuard's scan data and map regional variations. They research the pH tolerance ranges of 5 commercially important shellfish species, then create models predicting which species and regions are most at risk under projected acidification scenarios.",
    deliverable: "Species vulnerability assessment with regional pH mapping and projections",
    sustainabilityConnection: "Ocean acidification is the 'other CO2 problem' alongside climate change. Reducing emissions protects both atmospheric and marine chemistry simultaneously.",
    standards: ["NGSS HS-ESS2-6", "AP Environmental Science Unit 9"],
    readingMaterials: ["NOAA Ocean Acidification Program Research", "Royal Society: Ocean Acidification Briefing"],
    estimatedHours: 5,
  },
  {
    week: 9,
    title: "Sustainable Funding & Environmental Economics",
    theme: "Economics & Policy",
    description: "Students explore how ocean conservation is funded. Using OceanGuard's donation and carbon credit systems as case studies, they analyze crowdfunding models, carbon markets, and how economic incentives drive sustainability outcomes.",
    learningObjectives: [
      "Explain how carbon credit markets create financial incentives for emission reduction",
      "Analyze the effectiveness of crowdfunding for environmental cleanup operations",
      "Calculate the economic value of ecosystem services provided by healthy oceans",
      "Design a sustainable funding model for a marine conservation project",
    ],
    keyTopics: ["Carbon credit tokenization & blockchain verification", "Crowdfunding for conservation", "Ecosystem services valuation", "Green bonds & environmental finance"],
    classroomActivity: "Conservation Funding Proposal",
    activityDetails: "Students study OceanGuard's Solana-based donation system and carbon credit ledger. Each team designs a funding proposal for a hypothetical cleanup operation, including crowdfunding targets, carbon credit projections, and sustainability impact metrics. Teams present to a panel of peers acting as grant reviewers.",
    deliverable: "Funding proposal with budget justification, impact metrics, and fundraising strategy",
    sustainabilityConnection: "Conservation without sustainable funding fails. Teaching students to connect economic models to environmental outcomes creates advocates who can sustain long-term change.",
    standards: ["CCSS.MATH.S-MD.5", "AP Environmental Science Unit 5"],
    readingMaterials: ["World Bank: Blue Economy Report", "Environmental Finance: Carbon Market Overview 2025"],
    estimatedHours: 5,
  },
  {
    week: 10,
    title: "Community Engagement & Environmental Advocacy",
    theme: "Social Impact",
    description: "Transitioning from analysis to action. Students learn how to mobilize communities for ocean conservation, design public awareness campaigns using OceanGuard data, and understand the psychology of environmental behavior change.",
    learningObjectives: [
      "Design a community engagement strategy for a local waterway cleanup campaign",
      "Create data-backed public awareness materials using OceanGuard visualizations",
      "Apply behavior change frameworks to encourage sustainable practices",
      "Evaluate the effectiveness of different advocacy approaches across demographics",
    ],
    keyTopics: ["Environmental behavior change theory", "Community organizing for conservation", "Data storytelling for advocacy", "Social media for environmental campaigns"],
    classroomActivity: "Sustainability Awareness Campaign Design",
    activityDetails: "Each team designs a complete awareness campaign for their local community focused on reducing ocean-bound plastic waste. Campaigns must include OceanGuard data visualizations, social media content plans, a measurable impact goal (e.g., 'reduce local beach trash by 30% in 6 months'), and a volunteer recruitment strategy.",
    deliverable: "Complete campaign plan with visual materials, messaging strategy, and success metrics",
    sustainabilityConnection: "Individual behavior change scales through community engagement. One student teaching 10 neighbors creates exponential impact on waste reduction.",
    standards: ["NGSS Science & Engineering Practice 8", "CCSS.ELA-LITERACY.W.11-12.1"],
    readingMaterials: ["The Psychology of Sustainable Behavior", "EPA Community Engagement Guide"],
    estimatedHours: 6,
  },
  {
    week: 11,
    title: "Drone Technology & Remote Environmental Monitoring",
    theme: "Technology & Engineering",
    description: "Study of how autonomous drone technology enables large-scale ocean monitoring. Students explore OceanGuard's drone scanning system, sensor integration, flight path optimization, and how remote sensing technology scales conservation efforts.",
    learningObjectives: [
      "Explain how autonomous drones collect multi-sensor environmental data over water",
      "Design an efficient drone scan pattern that maximizes coverage per battery charge",
      "Evaluate the advantages and limitations of remote sensing vs in-situ sampling",
      "Propose improvements to drone-based monitoring using emerging sensor technologies",
    ],
    keyTopics: ["Autonomous drone navigation over water", "Multi-sensor payload integration", "Flight path optimization algorithms", "Remote sensing accuracy vs ground truth"],
    classroomActivity: "Drone Scan Route Optimization",
    activityDetails: "Using OceanGuard's scan location data, students map all 15 San Francisco Bay monitoring points. They calculate optimal drone routes that minimize flight distance while ensuring complete coverage, factoring in battery life constraints (30 minutes) and wind conditions. Students compare their routes against the actual scan patterns in the data.",
    deliverable: "Optimized drone route map with distance calculations and efficiency analysis",
    sustainabilityConnection: "Efficient drone routes reduce energy consumption per scan, making monitoring more sustainable. Battery-optimized flights mean fewer charge cycles and longer equipment lifespan.",
    standards: ["NGSS HS-ETS1-3", "CCSS.MATH.G-MG.3"],
    readingMaterials: ["DJI Maritime Drone Operations Guide", "IEEE: Autonomous Environmental Monitoring Systems"],
    estimatedHours: 5,
  },
  {
    week: 12,
    title: "International Maritime Policy & Ocean Governance",
    theme: "Policy & Law",
    description: "Students examine international frameworks governing ocean use and protection. Using OceanGuard's global city data spanning 20 countries, they compare how different national policies correlate with ocean health outcomes.",
    learningObjectives: [
      "Identify key international agreements governing ocean conservation (UNCLOS, Paris Agreement marine provisions)",
      "Compare ocean health metrics across countries with different regulatory approaches",
      "Analyze correlation between policy stringency and measurable ocean health scores",
      "Draft a policy recommendation based on data-driven findings from OceanGuard cities",
    ],
    keyTopics: ["UNCLOS & exclusive economic zones", "Marine Protected Areas effectiveness", "National pollution regulations comparison", "International cooperation challenges"],
    classroomActivity: "Cross-National Policy Effectiveness Study",
    activityDetails: "Students select 6 OceanGuard cities from different countries (e.g., Oslo, Lagos, Mumbai, Tokyo, Sydney, Rio de Janeiro). They research each country's marine protection policies, then compare those policies against the actual ocean health scores, kelp density, and trash levels measured by OceanGuard. Students identify which policy approaches correlate with better outcomes.",
    deliverable: "Comparative policy brief with data tables, policy analysis, and recommendations (1500 words)",
    sustainabilityConnection: "Oceans don't respect borders. Effective conservation requires international cooperation, and data-driven policy comparisons identify what actually works.",
    standards: ["AP Environmental Science Unit 5", "CCSS.ELA-LITERACY.RI.11-12.7"],
    readingMaterials: ["UN Ocean Conference Policy Briefs", "IUCN Marine Protected Areas Report"],
    estimatedHours: 6,
  },
  {
    week: 13,
    title: "Waste Reduction Strategies for Schools & Communities",
    theme: "Applied Sustainability",
    description: "Students shift from studying ocean pollution to implementing local solutions. They audit waste in their own schools, identify the largest sources of ocean-bound waste, and design actionable reduction plans that can be implemented immediately.",
    learningObjectives: [
      "Conduct a waste audit quantifying types and volumes of waste generated in their school",
      "Identify which school waste categories are most likely to reach waterways and oceans",
      "Design a waste reduction plan with measurable targets and implementation timeline",
      "Calculate the projected impact of their reduction plan on local waterway health",
    ],
    keyTopics: ["Waste audit methodology", "Single-use plastic alternatives", "Composting & organic waste diversion", "Microplastic prevention at source"],
    classroomActivity: "School Waste Audit & Reduction Plan",
    activityDetails: "Teams conduct a 3-day waste audit of their school cafeteria and common areas, categorizing waste by type (plastic, paper, organic, other). Using their data, they calculate how much of that waste could reach local waterways. Each team designs a reduction plan targeting the highest-impact waste category with specific actions, costs, and projected waste reduction percentages.",
    deliverable: "Waste audit report with reduction plan, implementation timeline, and projected impact metrics",
    sustainabilityConnection: "The most impactful sustainability work starts locally. Reducing waste at a single school can prevent hundreds of kilograms of debris from entering waterways annually.",
    standards: ["NGSS HS-ESS3-4", "NGSS Science & Engineering Practice 3"],
    readingMaterials: ["EPA School Waste Reduction Guide", "Zero Waste International Alliance Standards"],
    estimatedHours: 7,
  },
  {
    week: 14,
    title: "Capstone Project: Comprehensive Ocean Health Assessment",
    theme: "Capstone",
    description: "Students integrate everything learned across the course into a comprehensive assessment of one OceanGuard city. This is the primary deliverable of the certification program, demonstrating mastery of ocean science, data analysis, sustainability planning, and communication.",
    learningObjectives: [
      "Synthesize multi-source environmental data into a comprehensive health assessment",
      "Apply all analytical techniques learned throughout the course to a real-world case",
      "Develop actionable recommendations backed by data evidence and policy research",
      "Present complex environmental findings to a mixed audience of technical and non-technical stakeholders",
    ],
    keyTopics: ["Multi-factor environmental assessment", "Data synthesis & cross-referencing", "Evidence-based recommendation development", "Professional scientific communication"],
    classroomActivity: "Capstone City Assessment",
    activityDetails: "Each student selects one of OceanGuard's 20 monitored cities and produces a comprehensive ocean health assessment. The assessment must include: water quality analysis using all 7 sensor metrics, kelp density trend analysis, pollution source identification, AI prediction evaluation, comparison against international peers, a cleanup priority recommendation, a funding proposal, and a public awareness summary. Students use every OceanGuard API endpoint studied throughout the course.",
    deliverable: "Comprehensive Ocean Health Assessment Report (3000+ words with data visualizations, maps, and recommendations)",
    sustainabilityConnection: "The capstone demonstrates that students can independently analyze environmental conditions and propose evidence-based sustainability solutions — the core skill needed for real-world conservation work.",
    standards: ["NGSS HS-ESS3-6", "AP Environmental Science (all units)", "CCSS.ELA-LITERACY.W.11-12.2"],
    readingMaterials: ["UNEP State of the Ocean Report", "Scientific Report Writing Guidelines"],
    estimatedHours: 10,
  },
  {
    week: 15,
    title: "Presentations, Peer Review & Certification",
    theme: "Certification",
    description: "The final week is dedicated to capstone presentations, structured peer review, and course certification. Students present their city assessments, receive feedback from peers and instructors, and earn the OceanGuard Sustainability Certification upon successful completion.",
    learningObjectives: [
      "Present complex environmental research clearly and persuasively to an audience",
      "Provide constructive, evidence-based feedback on peers' research methodology and conclusions",
      "Reflect on personal growth in sustainability knowledge and analytical skills over 15 weeks",
      "Commit to specific post-course sustainability actions in their community",
    ],
    keyTopics: ["Scientific presentation skills", "Peer review methodology", "Reflective practice in environmental science", "Post-course sustainability commitment planning"],
    classroomActivity: "Capstone Presentations & Peer Review",
    activityDetails: "Each student delivers a 10-minute presentation of their city assessment followed by 5 minutes of Q&A. Peers complete structured evaluation rubrics assessing data quality, analysis depth, recommendation feasibility, and communication clarity. After all presentations, students write a personal reflection on their sustainability journey and commit to 3 specific actions they will take in their community.",
    deliverable: "Presentation slides, completed peer review rubrics, and personal sustainability commitment letter",
    sustainabilityConnection: "Certification is not the end — it's the beginning. Students leave with the knowledge, skills, and commitment to be lifelong advocates for ocean sustainability.",
    standards: ["NGSS Science & Engineering Practice 7 & 8", "CCSS.ELA-LITERACY.SL.11-12.4"],
    readingMaterials: ["How to Give Effective Scientific Presentations", "Sustainability Leadership Framework"],
    estimatedHours: 4,
  },
];

const THEME_ICONS: Record<string, typeof BookOpen> = {
  "Foundations": Globe,
  "Pollution Science": Droplets,
  "Marine Biology": Fish,
  "Environmental Science": Beaker,
  "Data Science": BarChart3,
  "Technology": Cpu,
  "Operations & Logistics": ClipboardCheck,
  "Climate Science": TrendingUp,
  "Economics & Policy": Target,
  "Social Impact": Users,
  "Technology & Engineering": Compass,
  "Policy & Law": Shield,
  "Applied Sustainability": Recycle,
  "Capstone": Presentation,
  "Certification": Award,
};

const PHASE_MAP: { label: string; weeks: string; color: string }[] = [
  { label: "Phase 1: Foundations", weeks: "Weeks 1-4", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { label: "Phase 2: Analysis & Technology", weeks: "Weeks 5-8", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { label: "Phase 3: Action & Policy", weeks: "Weeks 9-12", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { label: "Phase 4: Capstone & Certification", weeks: "Weeks 13-15", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
];

function getPhaseForWeek(week: number): number {
  if (week <= 4) return 0;
  if (week <= 8) return 1;
  if (week <= 12) return 2;
  return 3;
}

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
        <h4 className="text-xs font-semibold text-foreground mb-2">API Endpoints for Course Projects</h4>
        <p className="text-xs text-muted-foreground mb-2">Use these endpoints in your weekly assignments and capstone project:</p>
        <div className="bg-muted rounded-md p-3 font-mono text-xs text-foreground space-y-1">
          <p>GET /api/cities - All 20 monitored cities with health scores</p>
          <p>GET /api/scans - Drone scan data with 7 sensor readings</p>
          <p>GET /api/tracks - Kelp & trash movement tracking points</p>
          <p>GET /api/predictions/:cityId - AI movement predictions (6h/12h/24h/48h)</p>
          <p>GET /api/weather/:cityId - 7-day marine weather forecast</p>
          <p>GET /api/cleanup - All cleanup operations with urgency rankings</p>
        </div>
      </Card>
    </div>
  );
}

function WeekCard({ week, isExpanded, onToggle }: { week: WeekModule; isExpanded: boolean; onToggle: () => void }) {
  const phaseIdx = getPhaseForWeek(week.week);
  const phase = PHASE_MAP[phaseIdx];
  const ThemeIcon = THEME_ICONS[week.theme] || BookOpen;

  return (
    <Card
      className={`cursor-pointer transition-colors ${isExpanded ? "ring-1 ring-primary/50" : ""}`}
      onClick={onToggle}
      data-testid={`card-week-${week.week}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
              <ThemeIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] shrink-0">Week {week.week}</Badge>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${phase.color}`}>{week.theme}</Badge>
              </div>
              <h3 className="font-semibold text-foreground text-sm">{week.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{week.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Clock className="h-2.5 w-2.5" />
              {week.estimatedHours}h
            </Badge>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Learning Objectives</p>
              <div className="space-y-1.5">
                {week.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-chart-2 shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Key Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {week.keyTopics.map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{topic}</Badge>
                ))}
              </div>
            </div>

            <div className="bg-muted rounded-md p-3">
              <p className="text-xs font-semibold text-foreground mb-1">Classroom Activity: {week.classroomActivity}</p>
              <p className="text-xs text-muted-foreground">{week.activityDetails}</p>
            </div>

            <div className="bg-primary/5 rounded-md p-3">
              <p className="text-xs font-semibold text-foreground mb-1">Weekly Deliverable</p>
              <p className="text-xs text-muted-foreground">{week.deliverable}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Sustainability Connection</p>
              <p className="text-xs text-muted-foreground italic">{week.sustainabilityConnection}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Standards</p>
                <div className="flex flex-wrap gap-1">
                  {week.standards.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Reading Materials</p>
                <div className="space-y-0.5">
                  {week.readingMaterials.map((r, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <FileText className="h-2.5 w-2.5 shrink-0" />{r}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Education() {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"syllabus" | "data" | "certification">("syllabus");

  const totalHours = COURSE_WEEKS.reduce((sum, w) => sum + w.estimatedHours, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-education-title">
            OceanGuard Sustainability Certification
          </h1>
          <Badge variant="secondary" className="gap-1">
            <Award className="h-3 w-3" />
            15-Week Course
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          A structured certification program promoting sustainability in classroom settings. Complete all 15 weeks to earn your OceanGuard Sustainability Certificate.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground">{totalHours}</p>
          <p className="text-[10px] text-muted-foreground">Total Course Hours</p>
        </Card>
        <Card className="p-4 text-center">
          <BookOpen className="h-5 w-5 text-chart-2 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground">15</p>
          <p className="text-[10px] text-muted-foreground">Weekly Modules</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="h-5 w-5 text-chart-3 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground">60</p>
          <p className="text-[10px] text-muted-foreground">Learning Objectives</p>
        </Card>
        <Card className="p-4 text-center">
          <Award className="h-5 w-5 text-chart-4 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground">1</p>
          <p className="text-[10px] text-muted-foreground">Certification Earned</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Course Roadmap</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {PHASE_MAP.map((phase, idx) => (
            <div key={idx} className={`rounded-md p-3 ${phase.color.split(" ")[0]}`}>
              <p className="text-xs font-semibold text-foreground">{phase.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{phase.weeks}</p>
              <div className="mt-2 space-y-0.5">
                {COURSE_WEEKS.filter(w => getPhaseForWeek(w.week) === idx).map(w => (
                  <p key={w.week} className="text-[10px] text-muted-foreground truncate">
                    W{w.week}: {w.title}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeTab === "syllabus" ? "default" : "outline"}
          onClick={() => setActiveTab("syllabus")}
          data-testid="tab-syllabus"
        >
          <BookOpen className="h-3.5 w-3.5 mr-1.5" />
          Weekly Syllabus
        </Button>
        <Button
          variant={activeTab === "data" ? "default" : "outline"}
          onClick={() => setActiveTab("data")}
          data-testid="tab-live-data"
        >
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
          Live Data Explorer
        </Button>
        <Button
          variant={activeTab === "certification" ? "default" : "outline"}
          onClick={() => setActiveTab("certification")}
          data-testid="tab-certification"
        >
          <Award className="h-3.5 w-3.5 mr-1.5" />
          Certification Requirements
        </Button>
      </div>

      {activeTab === "syllabus" && (
        <div className="space-y-3" data-testid="section-syllabus">
          {PHASE_MAP.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`h-1 w-8 rounded-sm ${phase.color.split(" ")[0]}`} />
                <h2 className="text-sm font-semibold text-foreground">{phase.label}</h2>
                <span className="text-xs text-muted-foreground">({phase.weeks})</span>
              </div>
              {COURSE_WEEKS.filter(w => getPhaseForWeek(w.week) === phaseIdx).map(week => (
                <WeekCard
                  key={week.week}
                  week={week}
                  isExpanded={expandedWeek === week.week}
                  onToggle={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === "data" && (
        <div data-testid="section-live-data">
          <LiveDataExplorer />
        </div>
      )}

      {activeTab === "certification" && (
        <div className="space-y-4" data-testid="section-certification">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-chart-4" />
              <h2 className="font-semibold text-foreground">OceanGuard Sustainability Certificate</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Upon successful completion of all 15 weeks, students earn the OceanGuard Sustainability Certificate, demonstrating proficiency in ocean science, data analysis, sustainability planning, and environmental advocacy. This certification is applicable for K-12 and college-level programs.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Completion Requirements</p>
                <div className="space-y-2">
                  {[
                    { req: "Complete all 15 weekly modules with submitted deliverables", pct: "40%" },
                    { req: "Capstone Ocean Health Assessment (Week 14) - minimum 3000 words with data visualizations", pct: "30%" },
                    { req: "Capstone Presentation (Week 15) - 10 minutes with Q&A and peer review", pct: "15%" },
                    { req: "Personal Sustainability Commitment Letter with 3 specific community actions", pct: "10%" },
                    { req: "Participation in peer review of at least 3 classmates' capstone projects", pct: "5%" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-muted rounded-md p-3">
                      <CheckCircle className="h-4 w-4 text-chart-2 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground">{item.req}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{item.pct}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Grading Rubric</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { grade: "Certified with Distinction", range: "90-100%", desc: "Exceptional mastery of all course competencies with outstanding capstone" },
                    { grade: "Certified with Merit", range: "80-89%", desc: "Strong understanding with thorough, well-researched deliverables" },
                    { grade: "Certified", range: "70-79%", desc: "Satisfactory completion of all requirements with adequate analysis" },
                    { grade: "Not Yet Certified", range: "Below 70%", desc: "May resubmit deliverables for re-evaluation within 4 weeks" },
                  ].map((g) => (
                    <div key={g.grade} className="bg-muted rounded-md p-3">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <p className="text-xs font-semibold text-foreground">{g.grade}</p>
                        <Badge variant="secondary" className="text-[10px]">{g.range}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Skills Demonstrated Upon Certification</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { skill: "Marine Ecosystem Analysis", desc: "Assess ocean health using multi-sensor environmental data" },
                    { skill: "Environmental Data Science", desc: "Analyze, visualize, and communicate complex environmental datasets" },
                    { skill: "Pollution Source Tracking", desc: "Identify and map marine pollution sources using tracking data" },
                    { skill: "AI-Assisted Monitoring", desc: "Apply and evaluate machine learning predictions for conservation" },
                    { skill: "Conservation Planning", desc: "Design resource-optimized cleanup operations with measurable goals" },
                    { skill: "Sustainability Advocacy", desc: "Create data-driven campaigns that change community behavior" },
                    { skill: "Environmental Policy Analysis", desc: "Compare and recommend evidence-based marine protection policies" },
                    { skill: "Waste Reduction Strategy", desc: "Audit and reduce waste in schools and communities with measurable impact" },
                  ].map((s) => (
                    <div key={s.skill} className="flex items-start gap-2 p-2">
                      <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{s.skill}</p>
                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Standards Alignment</p>
                <div className="space-y-2">
                  {[
                    { standard: "NGSS", desc: "Next Generation Science Standards - Earth Sciences, Life Sciences, Engineering Design" },
                    { standard: "CCSS Math", desc: "Statistics, data analysis, measurement, and mathematical modeling practices" },
                    { standard: "AP Environmental Science", desc: "All 9 units covered across the 15-week curriculum" },
                    { standard: "UN SDG 14", desc: "Life Below Water - Conservation and sustainable use of oceans, seas, and marine resources" },
                    { standard: "CS Principles", desc: "Data analysis, computational thinking, and AI/ML applied to environmental problems" },
                    { standard: "CCSS ELA", desc: "Argumentative writing, scientific communication, and evidence-based reasoning" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Badge variant="outline" className="text-[10px] shrink-0">{s.standard}</Badge>
                      <span className="text-xs text-muted-foreground">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">For Educators: Implementation Guide</p>
                <div className="space-y-2">
                  {[
                    { step: "1", title: "Adapt to Grade Level", desc: "K-8 instructors may simplify data analysis tasks and extend timelines. High school and college instructors can add depth to capstone requirements." },
                    { step: "2", title: "Assign OceanGuard Accounts", desc: "Students access OceanGuard's live dashboard and API endpoints throughout the course for hands-on data work." },
                    { step: "3", title: "Weekly Deliverable Reviews", desc: "Provide feedback on weekly deliverables to ensure students build toward a strong capstone project." },
                    { step: "4", title: "Capstone Evaluation Panel", desc: "Invite community members, local environmental organizations, or other educators to join the Week 15 presentation panel." },
                    { step: "5", title: "Issue Certificates", desc: "Students meeting the 70% threshold receive the OceanGuard Sustainability Certificate, signed by the instructor and OceanGuard." },
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
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
