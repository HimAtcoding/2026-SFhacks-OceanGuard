import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  AlertTriangle,
  TrendingDown,
  Wind,
  Thermometer,
  X,
  ChevronRight,
  Droplets,
  Leaf,
  Info,
} from "lucide-react";

interface Organism {
  id: string;
  name: string;
  trophicLevel: number;
  levelLabel: string;
  populationTrend: "declining" | "increasing" | "disrupted" | "stable";
  populationChange: string;
  description: string;
  climateImpact: string;
  foodChainRole: string;
  oxygenConnection: string;
  eats: string[];
  eatenBy: string[];
  facts: string[];
}

const organisms: Organism[] = [
  {
    id: "sharks",
    name: "Sharks & Apex Predators",
    trophicLevel: 5,
    levelLabel: "Apex Predators",
    populationTrend: "declining",
    populationChange: "-71% since 1970",
    description:
      "Sharks are apex predators that have maintained ocean ecosystems for over 400 million years. They regulate populations of species below them, preventing any single species from dominating and destabilizing the food web.",
    climateImpact:
      "Rising ocean temperatures are shifting shark habitats poleward, disrupting established predator-prey dynamics. Ocean acidification weakens their ability to detect prey. Warming waters reduce oxygen levels in deep hunting grounds, shrinking their viable habitat by up to 30%.",
    foodChainRole:
      "As apex predators, sharks enforce a 'trophic cascade' — controlling populations of large fish and marine mammals. Without sharks, mesopredator populations explode unchecked, creating a devastating chain reaction through every level of the ocean food web.",
    oxygenConnection:
      "When shark populations decline, the cascade effect ultimately disrupts phytoplankton — the organisms responsible for producing 50-80% of Earth's oxygen. Sharks are the guardians at the top that keep the entire oxygen-producing system in balance.",
    eats: ["Large Fish", "Sea Turtles", "Marine Mammals", "Rays"],
    eatenBy: [],
    facts: [
      "Oceanic shark populations have declined by 71% since 1970",
      "Over 100 million sharks are killed annually",
      "Sharks predate dinosaurs by 200 million years",
      "A healthy ocean needs approximately 1 shark per square kilometer of reef",
    ],
  },
  {
    id: "large-fish",
    name: "Large Predatory Fish",
    trophicLevel: 4,
    levelLabel: "Tertiary Consumers",
    populationTrend: "declining",
    populationChange: "-50% of large predatory fish lost",
    description:
      "Tuna, swordfish, grouper, and other large predatory fish occupy the tertiary consumer level. They control populations of smaller fish and invertebrates, maintaining mid-level balance in the food web.",
    climateImpact:
      "Warming waters are forcing large fish to migrate to cooler depths and higher latitudes. This displacement breaks established predation patterns. Species like bluefin tuna are losing up to 20% of suitable habitat per decade. Coral bleaching destroys critical nursery habitats.",
    foodChainRole:
      "When shark populations drop, large predatory fish populations can initially boom without predation pressure. But this is unsustainable — they overgraze on smaller fish populations, causing mid-level collapses. Eventually their own populations crash from food scarcity.",
    oxygenConnection:
      "The boom-and-bust cycle of large fish without shark regulation creates instability that ripples down to zooplankton grazers. Stable, shark-regulated fish populations maintain the steady grazing pressure needed to keep phytoplankton ecosystems healthy and productive.",
    eats: ["Small Fish", "Squid", "Crustaceans"],
    eatenBy: ["Sharks", "Marine Mammals"],
    facts: [
      "90% of large predatory fish have been removed from the oceans",
      "Tuna can regulate body temperature — rare among fish",
      "Many large fish species take 5-15 years to reach reproductive maturity",
      "Overfishing and climate change create a compounding threat",
    ],
  },
  {
    id: "small-fish",
    name: "Small Fish & Forage Species",
    trophicLevel: 3,
    levelLabel: "Secondary Consumers",
    populationTrend: "disrupted",
    populationChange: "Boom-bust cycles intensifying",
    description:
      "Sardines, anchovies, herring, and other forage fish are the critical middle link of the ocean food web. They convert energy from tiny plankton into food for larger predators. These small fish exist in massive schools numbering in the billions.",
    climateImpact:
      "Warming seas shift plankton blooms earlier in the season, creating a 'mismatch' — small fish hatch expecting food that has already peaked. Ocean acidification weakens their skeletons. Deoxygenation squeezes their habitat into thinner layers of viable ocean.",
    foodChainRole:
      "Without regulation from above (sharks controlling large fish), forage fish populations swing wildly. In boom phases, they overgraze on zooplankton. In bust phases, everything above them starves. This instability is the critical transmission point for food chain collapse.",
    oxygenConnection:
      "Small fish are the bridge between zooplankton and the rest of the food web. When their populations are destabilized, they either overgraze zooplankton (removing the organisms that graze on phytoplankton) or undergraze (allowing zooplankton to overconsume phytoplankton). Both scenarios harm oxygen production.",
    eats: ["Zooplankton", "Fish Larvae", "Small Crustaceans"],
    eatenBy: ["Large Fish", "Seabirds", "Marine Mammals"],
    facts: [
      "Forage fish make up roughly 30% of global fish catch by weight",
      "A single school of herring can contain over 4 billion individuals",
      "They convert 10-15% of plankton energy to available food for predators",
      "Their population swings can shift entire marine ecosystem states",
    ],
  },
  {
    id: "zooplankton",
    name: "Zooplankton",
    trophicLevel: 2,
    levelLabel: "Primary Consumers",
    populationTrend: "disrupted",
    populationChange: "Distribution shifting poleward",
    description:
      "Zooplankton are tiny animals (0.2mm to 20mm) that drift in ocean currents. Copepods, krill, and larval organisms graze on phytoplankton, forming the essential link between microscopic plant life and the animal food web. Krill alone have a total biomass exceeding that of all humans on Earth.",
    climateImpact:
      "Warming oceans are pushing zooplankton toward the poles at 10-15 km per decade. Ocean acidification dissolves the calcium carbonate shells of pteropods (sea butterflies). Krill populations in the Antarctic have declined by 80% since the 1970s as sea ice — their nursery habitat — shrinks.",
    foodChainRole:
      "Zooplankton are nature's regulators of phytoplankton. They graze on microscopic algae, preventing overgrowth that would block sunlight and create dead zones. Without proper zooplankton regulation, phytoplankton blooms and crashes become extreme — toxic algal blooms surge while overall productivity drops.",
    oxygenConnection:
      "This is the critical link: zooplankton regulate phytoplankton through grazing. When the food chain above is disrupted, zooplankton populations become unstable. Too many zooplankton = phytoplankton gets overgrazed, reducing oxygen output. Too few zooplankton = unchecked algal blooms that die, decompose, and consume oxygen, creating dead zones.",
    eats: ["Phytoplankton", "Bacteria", "Detritus"],
    eatenBy: ["Small Fish", "Whale Sharks", "Baleen Whales"],
    facts: [
      "Antarctic krill populations have declined ~80% since the 1970s",
      "Zooplankton perform the largest daily migration on Earth — rising at night, sinking by day",
      "Copepods are the most abundant multicellular animals on the planet",
      "Their fecal pellets transport carbon to the deep ocean (biological pump)",
    ],
  },
  {
    id: "phytoplankton",
    name: "Phytoplankton & Kelp",
    trophicLevel: 1,
    levelLabel: "Primary Producers",
    populationTrend: "declining",
    populationChange: "-40% since 1950",
    description:
      "Phytoplankton are microscopic marine plants and algae that form the foundation of ALL ocean life. Along with kelp forests and seagrasses, they are the primary producers of the marine world. Despite being invisible to the naked eye, phytoplankton produce more oxygen than every forest on Earth combined.",
    climateImpact:
      "Global phytoplankton levels have declined by approximately 40% since 1950. Warming surface waters create a 'cap' that prevents nutrient-rich deep water from mixing up — starving phytoplankton of iron and nitrogen. At the same time, ocean acidification (30% more acidic since pre-industrial times) impairs their ability to form shells and photosynthesize efficiently.",
    foodChainRole:
      "Phytoplankton are the base of the entire marine food web. Every marine animal — from the smallest zooplankton to the largest whale — depends on phytoplankton either directly or indirectly. Without them, the ocean becomes a desert.",
    oxygenConnection:
      "Phytoplankton produce between 50-80% of all oxygen on Earth through photosynthesis — far more than all terrestrial forests combined. Every second breath you take comes from these microscopic ocean organisms. Their decline directly threatens the breathable atmosphere. A 40% decline in phytoplankton means billions of tons less oxygen produced annually.",
    eats: ["Sunlight", "CO2", "Dissolved Nutrients"],
    eatenBy: ["Zooplankton", "Filter Feeders", "Small Fish Larvae"],
    facts: [
      "Produce 50-80% of Earth's oxygen — more than all forests combined",
      "Global populations have declined ~40% since 1950",
      "They absorb as much CO2 as all terrestrial plants combined",
      "The biological carbon pump sequesters 10 billion tons of carbon annually",
      "A single liter of seawater contains millions of phytoplankton cells",
    ],
  },
];

const trophicLevelColors: Record<number, string> = {
  5: "hsl(var(--destructive))",
  4: "hsl(var(--chart-1))",
  3: "hsl(var(--chart-4))",
  2: "hsl(var(--chart-2))",
  1: "hsl(var(--chart-3))",
};

const trophicBgClasses: Record<number, string> = {
  5: "bg-destructive/10",
  4: "bg-chart-1/10",
  3: "bg-chart-4/10",
  2: "bg-chart-2/10",
  1: "bg-chart-3/10",
};

const trophicBorderClasses: Record<number, string> = {
  5: "border-destructive/30",
  4: "border-chart-1/30",
  3: "border-chart-4/30",
  2: "border-chart-2/30",
  1: "border-chart-3/30",
};

function OrganismIcon({ id, size = 40 }: { id: string; size?: number }) {
  if (id === "sharks") {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className="fill-current">
        <path d="M4 32c0 0 8-12 20-12c4 0 7 1 10 3l8-15l-2 16c3 3 5 6 6 8h14l-10 4c0 4-2 8-6 12l2 12l-8-10c-3 2-6 2-10 2c-12 0-24-8-24-20z" />
        <circle cx="38" cy="28" r="2" className="fill-background" />
      </svg>
    );
  }
  if (id === "large-fish") {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className="fill-current">
        <path d="M6 32c0-8 10-18 26-18c8 0 14 4 18 8l8-6v24l-8-6c-4 4-10 8-18 8C16 42 6 40 6 32z" />
        <circle cx="42" cy="29" r="2.5" className="fill-background" />
        <path d="M18 26c2 4 2 8 0 12" className="stroke-background fill-none" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === "small-fish") {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className="fill-current">
        <ellipse cx="28" cy="24" rx="14" ry="8" />
        <polygon points="42,24 54,16 54,32" />
        <circle cx="20" cy="22" r="2" className="fill-background" />
        <ellipse cx="30" cy="40" rx="10" ry="6" opacity="0.6" />
        <polygon points="40,40 50,34 50,46" opacity="0.6" />
        <circle cx="24" cy="38" r="1.5" className="fill-background" opacity="0.6" />
      </svg>
    );
  }
  if (id === "zooplankton") {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className="fill-current">
        <ellipse cx="32" cy="28" rx="8" ry="12" />
        <circle cx="29" cy="24" r="2" className="fill-background" />
        <circle cx="35" cy="24" r="2" className="fill-background" />
        <path d="M24 20c-4-6-8-8-10-6" className="stroke-current fill-none" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 20c4-6 8-8 10-6" className="stroke-current fill-none" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 40c-2 4-4 8-2 10" className="stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M36 40c2 4 4 8 2 10" className="stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M32 40c0 4 0 10 0 12" className="stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="44" r="3" opacity="0.4" />
        <circle cx="50" cy="38" r="4" opacity="0.3" />
        <circle cx="48" cy="50" r="2" opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className="fill-current">
      <circle cx="32" cy="32" r="10" opacity="0.7" />
      <circle cx="20" cy="20" r="5" opacity="0.5" />
      <circle cx="46" cy="22" r="6" opacity="0.4" />
      <circle cx="18" cy="44" r="4" opacity="0.3" />
      <circle cx="48" cy="46" r="5" opacity="0.35" />
      <circle cx="36" cy="14" r="3" opacity="0.25" />
      <circle cx="32" cy="52" r="4" opacity="0.3" />
      <path d="M32 22v20M22 32h20" className="stroke-current fill-none" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function CascadeArrow({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowDown className="h-4 w-4 text-destructive animate-pulse" />
        <span className="text-[10px]">disrupts</span>
        <ArrowDown className="h-4 w-4 text-destructive animate-pulse" />
      </div>
    </div>
  );
}

function OrganismDetail({ organism, onClose }: { organism: Organism; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-md p-2.5 ${trophicBgClasses[organism.trophicLevel]}`}
              style={{ color: trophicLevelColors[organism.trophicLevel] }}
            >
              <OrganismIcon id={organism.id} size={36} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground" data-testid={`text-organism-name-${organism.id}`}>
                {organism.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" data-testid={`badge-level-${organism.id}`}>
                  Level {organism.trophicLevel}: {organism.levelLabel}
                </Badge>
                <Badge
                  variant={organism.populationTrend === "declining" ? "destructive" : "outline"}
                  data-testid={`badge-trend-${organism.id}`}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {organism.populationChange}
                </Badge>
              </div>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-detail">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{organism.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`p-3 space-y-2 rounded-md border ${trophicBorderClasses[organism.trophicLevel]} bg-muted/30`} data-testid={`section-climate-${organism.id}`}>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-destructive shrink-0" />
              <h4 className="text-sm font-semibold text-foreground">Climate Change Impact</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{organism.climateImpact}</p>
          </div>

          <div className={`p-3 space-y-2 rounded-md border ${trophicBorderClasses[organism.trophicLevel]} bg-muted/30`} data-testid={`section-role-${organism.id}`}>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" style={{ color: trophicLevelColors[organism.trophicLevel] }} />
              <h4 className="text-sm font-semibold text-foreground">Role in the Food Chain</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{organism.foodChainRole}</p>
          </div>

          <div className={`p-3 space-y-2 rounded-md border ${trophicBorderClasses[organism.trophicLevel]} bg-muted/30 md:col-span-2`} data-testid={`section-oxygen-${organism.id}`}>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-chart-2 shrink-0" />
              <h4 className="text-sm font-semibold text-foreground">Connection to Oxygen Production</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{organism.oxygenConnection}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {organism.eats.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feeds On</h4>
              <div className="flex flex-wrap gap-1">
                {organism.eats.map((prey, i) => (
                  <Badge key={prey} variant="outline" className="text-[10px]" data-testid={`badge-prey-${organism.id}-${i}`}>
                    {prey}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {organism.eatenBy.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preyed Upon By</h4>
              <div className="flex flex-wrap gap-1">
                {organism.eatenBy.map((pred, i) => (
                  <Badge key={pred} variant="outline" className="text-[10px]" data-testid={`badge-predator-${organism.id}-${i}`}>
                    {pred}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Facts</h4>
          <ul className="space-y-1">
            {organism.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: trophicLevelColors[organism.trophicLevel] }} />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}

function FoodChainNode({
  organism,
  isSelected,
  onClick,
}: {
  organism: Organism;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`p-3 cursor-pointer hover-elevate transition-all ${
          isSelected ? `border-2 ${trophicBorderClasses[organism.trophicLevel].replace("/30", "/80")} ${trophicBgClasses[organism.trophicLevel]}` : ""
        }`}
        onClick={onClick}
        data-testid={`card-organism-${organism.id}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`rounded-md p-2 shrink-0 ${trophicBgClasses[organism.trophicLevel]}`}
            style={{ color: trophicLevelColors[organism.trophicLevel] }}
          >
            <OrganismIcon id={organism.id} size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">{organism.name}</h3>
              <Badge
                variant={organism.populationTrend === "declining" ? "destructive" : "outline"}
                className="text-[9px] shrink-0"
              >
                <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                {organism.populationTrend === "declining" ? "Declining" : organism.populationTrend === "disrupted" ? "Disrupted" : "Shifting"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Level {organism.trophicLevel}: {organism.levelLabel}
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground shrink-0 transition-transform"
            style={{ transform: isSelected ? "rotate(90deg)" : undefined }}
          />
        </div>
      </Card>
    </motion.div>
  );
}

function CascadeVisualization() {
  const steps = [
    {
      label: "Climate Change",
      detail: "Rising temperatures, ocean acidification, habitat loss",
      icon: Thermometer,
      color: "text-destructive",
    },
    {
      label: "Shark Populations Collapse",
      detail: "71% decline removes top-down regulation",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "Mesopredator Release",
      detail: "Large fish populations boom unchecked, then crash",
      icon: TrendingDown,
      color: "text-chart-1",
    },
    {
      label: "Forage Fish Destabilized",
      detail: "Boom-bust cycles disrupt mid-level energy transfer",
      icon: TrendingDown,
      color: "text-chart-4",
    },
    {
      label: "Zooplankton Imbalance",
      detail: "Grazing pressure on phytoplankton becomes erratic",
      icon: TrendingDown,
      color: "text-chart-2",
    },
    {
      label: "Phytoplankton Decline",
      detail: "40% loss since 1950 — oxygen production drops",
      icon: Droplets,
      color: "text-chart-3",
    },
    {
      label: "Earth's Oxygen at Risk",
      detail: "50-80% of our oxygen comes from these organisms",
      icon: Wind,
      color: "text-foreground",
    },
  ];

  return (
    <Card className="p-4 space-y-3" data-testid="section-cascade">
      <h3 className="text-sm font-semibold text-foreground">The Trophic Cascade: How It All Connects</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A trophic cascade is a chain reaction through the food web. When apex predators are removed,
        every level below is affected — ultimately threatening the phytoplankton that produce most of our oxygen.
      </p>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-center gap-3 py-2" data-testid={`cascade-step-${i}`}>
              <div className={`shrink-0 ${step.color}`}>
                <step.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground" data-testid={`text-cascade-label-${i}`}>{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.detail}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center pl-2 py-0.5">
                <ArrowDown className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function OxygenSection() {
  return (
    <Card className="p-4 space-y-3 border-chart-3/30" data-testid="section-oxygen">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-chart-3" />
        <h3 className="text-sm font-semibold text-foreground">Why This Matters: Earth's Oxygen</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1 text-center">
          <p className="text-2xl font-bold text-chart-3">50-80%</p>
          <p className="text-[10px] text-muted-foreground">of Earth's oxygen comes from marine phytoplankton</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-2xl font-bold text-destructive">-40%</p>
          <p className="text-[10px] text-muted-foreground">decline in phytoplankton since 1950</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-2xl font-bold text-chart-1">10B tons</p>
          <p className="text-[10px] text-muted-foreground">of CO2 absorbed by ocean plants annually</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Every second breath you take comes from phytoplankton. These microscopic organisms
          are more important to our atmosphere than all the world's forests combined. When the
          ocean food chain collapses from the top down — starting with sharks — the cascade
          ultimately threatens the very base that produces our oxygen.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">The connection is clear:</span> Healthy shark
          populations maintain balanced predator-prey dynamics at every level, which stabilizes
          zooplankton grazing, which allows phytoplankton to thrive and produce oxygen. Remove
          the sharks, and you begin dismantling the system that lets us breathe.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Additionally, kelp forests — which OceanGuard monitors globally — absorb 20 times
          more CO2 per acre than terrestrial forests. They provide nursery habitat for thousands
          of species and protect coastlines from storm surges. Climate change and urchin
          overgrazing (another consequence of predator loss) have destroyed over 90% of kelp
          forests in some regions.
        </p>
      </div>
    </Card>
  );
}

export default function FoodChainPage() {
  const [selectedOrganism, setSelectedOrganism] = useState<string | null>(null);

  const selected = organisms.find((o) => o.id === selectedOrganism);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto" data-testid="page-food-chain">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
          Ocean Food Chain & Climate Impact
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          The ocean food chain is a delicate balance — from microscopic phytoplankton that
          produce most of Earth's oxygen to apex predators like sharks that keep everything
          in check. Climate change is unraveling this system from both ends. Click on any
          organism below to understand its role and why it matters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-1.5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Interactive Food Chain — Click to Explore
          </h2>
          {organisms.map((org, i) => (
            <div key={org.id}>
              <FoodChainNode
                organism={org}
                isSelected={selectedOrganism === org.id}
                onClick={() =>
                  setSelectedOrganism(selectedOrganism === org.id ? null : org.id)
                }
              />
              {i < organisms.length - 1 && (
                <CascadeArrow from={org.id} to={organisms[i + 1].id} />
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {selected ? (
              <OrganismDetail
                key={selected.id}
                organism={selected}
                onClose={() => setSelectedOrganism(null)}
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Card className="p-5 space-y-3 border-dashed">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Select an organism from the food chain to explore its role, climate impact,
                      and connection to oxygen production.
                    </p>
                  </div>
                </Card>
                <OxygenSection />
              </motion.div>
            )}
          </AnimatePresence>

          <CascadeVisualization />
        </div>
      </div>
    </div>
  );
}
