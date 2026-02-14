import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Trophy,
  Cpu,
  Palette,
  GraduationCap,
  Globe,
  Briefcase,
  Bot,
  Award,
  Zap,
  ExternalLink,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { SiIbm } from "react-icons/si";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface TrackProps {
  icon: any;
  title: string;
  prize?: string;
  description: string;
  relevance: string;
  tags: string[];
  links?: { label: string; url: string }[];
  highlighted?: boolean;
}

function TrackCard({ icon: Icon, title, prize, description, relevance, tags, links, highlighted }: TrackProps) {
  return (
    <Card className={`p-6 ${highlighted ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-start gap-4 mb-3">
        <div className={`rounded-md p-2.5 shrink-0 ${highlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {highlighted && <Badge>Targeting</Badge>}
          </div>
          {prize && (
            <p className="text-sm font-medium text-primary mt-0.5">{prize}</p>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
      <div className="rounded-md bg-muted/50 p-3 mb-3">
        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-primary" /> How We Qualify
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{relevance}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
      </div>
      {links && links.length > 0 && (
        <div className="space-y-1">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              data-testid={`link-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <ExternalLink className="h-3 w-3" />
              {link.label}
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

const tracks: TrackProps[] = [
  {
    icon: Globe,
    title: "Best Hack for Climate Action",
    prize: "Climate-focused prize",
    description: "Project that prioritizes reducing the impact of climate change or providing a solution to help mitigate a common problem that affects the climate.",
    relevance: "Our drone-based ocean monitoring directly addresses climate change by detecting harmful algal blooms caused by rising temperatures and pollution, enabling faster response to protect marine ecosystems.",
    tags: ["Climate", "Environment", "Ocean Health"],
    highlighted: true,
  },
  {
    icon: Cpu,
    title: "Best Hardware Hack",
    prize: "Hardware innovation prize",
    description: "Best project that involves the heavy use or integration of hardware (Arduinos, Raspberry PIs, etc.)",
    relevance: "We integrate drone hardware with multispectral cameras, environmental sensors (pH, dissolved oxygen, turbidity, temperature), and autonomous flight controllers for ocean scanning.",
    tags: ["Drone", "Sensors", "IoT"],
    highlighted: true,
  },
  {
    icon: Briefcase,
    title: "SFSU I&E Entrepreneurship Track",
    prize: "$500 Cash + PS5",
    description: "Lam Family of College Business-Entrepreneurship track. Requires a pitch deck and a business major on the team.",
    relevance: "We have a comprehensive pitch deck with market analysis, business model (SaaS + DaaS), TAM/SAM/SOM, growth roadmap, and revenue projections. Our team includes a business major.",
    tags: ["Entrepreneurship", "Pitch Deck", "Business"],
    highlighted: true,
    links: [
      { label: "View Our Pitch Deck", url: "/pitch" },
    ],
  },
  {
    icon: Palette,
    title: "Best Design Hack",
    prize: "Design excellence prize",
    description: "Project that has the best design in terms of aesthetic appeal, usability, simplicity and overall user experience.",
    relevance: "Our dashboard features a polished, responsive UI with real-time data visualization, dark/light mode, intuitive navigation, and beautiful chart components built with professional design standards.",
    tags: ["UI/UX", "Design", "Responsive"],
    highlighted: true,
  },
  {
    icon: GraduationCap,
    title: "Best Hack for Sustainability in Education",
    prize: "Education sustainability prize",
    description: "Project that prioritizes the promotion of sustainability in classroom settings, K-12 or college.",
    relevance: "Our open-source ocean monitoring data can be integrated into environmental science curricula, teaching students about water quality, ecosystems, and climate change with real-time data.",
    tags: ["Education", "Sustainability", "Open Data"],
  },
  {
    icon: Trophy,
    title: "Best Beginner Hack",
    prize: "Beginner-friendly prize",
    description: "Best project created by beginners to hackathons. Teams must have one participant that is a first-time hacker.",
    relevance: "Our team includes first-time hackers, making us eligible for this track while still delivering a technically impressive, production-quality solution.",
    tags: ["Beginner", "First Hackathon"],
  },
  {
    icon: Bot,
    title: "Broxi AI - Best Use of Broxi AI",
    prize: "Top 3 winners - Broxi AI prizes",
    description: "Best use of Broxi AI platform. Register and create a team to get 100 free credits.",
    relevance: "We can integrate Broxi AI for enhanced natural language analysis of environmental reports and automated summarization of drone scan data.",
    tags: ["AI", "NLP", "Broxi"],
    links: [
      { label: "Broxi AI Platform", url: "https://broxi.ai/" },
    ],
  },
  {
    icon: Award,
    title: "IBM - Best Use of API for AI",
    prize: "IBM Merch/Swag, Career Coaching, IBM SV Labs Tour",
    description: "Best use of IBM webMethods Hybrid Integration and API Connect for AI-powered applications.",
    relevance: "We can integrate IBM webMethods for workflow automation - connecting drone scan data processing to alert notifications via API Connect, Slack, and email connectors.",
    tags: ["IBM", "API", "Integration"],
    links: [
      { label: "IBM Getting Started", url: "https://www.ibm.com/docs/en/hybrid-integration/saas?topic=getting-started" },
      { label: "webMethods Integration", url: "https://www.ibm.com/docs/en/wm-integration-ipaas?topic=overview" },
      { label: "Tutorials", url: "https://community.ibm.com/community/user/blogs/webmethods-community-member/2024/02/23/webmethodsio-integration-super-ipaas-step-by-step-tutorials" },
    ],
  },
  {
    icon: Zap,
    title: "Best Hack for the Future of Work",
    prize: "Mars Rover Lego Set + Meeting with JFFVentures Investment Team",
    description: "JFFVentures is an impact-first VC fund. Build technology that creates economic mobility and helps workers gain quality jobs.",
    relevance: "Our platform creates new green jobs in environmental monitoring, drone operations, and data analysis. It provides tools that upskill environmental workers and makes monitoring accessible to smaller agencies.",
    tags: ["Future of Work", "Green Jobs", "Impact"],
    links: [
      { label: "Learn about JFFVentures", url: "https://www.jffventures.org/" },
    ],
  },
];

export default function Tracks() {
  const targeted = tracks.filter(t => t.highlighted);
  const additional = tracks.filter(t => !t.highlighted);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-tracks-title">Hackathon Tracks</h1>
        <p className="text-sm text-muted-foreground">
          All SF Hacks 2026 tracks we're targeting and how our project qualifies for each.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Primary Targets</h2>
          <Badge variant="secondary" className="text-xs">{targeted.length} tracks</Badge>
        </div>
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="grid md:grid-cols-2 gap-4"
        >
          {targeted.map((track) => (
            <motion.div key={track.title} variants={fadeIn}>
              <TrackCard {...track} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Additional Tracks</h2>
          <Badge variant="secondary" className="text-xs">{additional.length} tracks</Badge>
        </div>
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          className="grid md:grid-cols-2 gap-4"
        >
          {additional.map((track) => (
            <motion.div key={track.title} variants={fadeIn}>
              <TrackCard {...track} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
