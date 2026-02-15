import { useState, useEffect, useRef, useCallback } from "react";
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
  TreePine,
  Waves,
  Gauge,
} from "lucide-react";

type ClimateScenario = "current" | "optimistic" | "pessimistic";

interface ScenarioModifiers {
  label: string;
  description: string;
  tempChange: string;
  phytoChange: number;
  kelpChange: number;
  oxygenImpact: string;
  co2Absorbed: string;
  cascadeIntensity: number;
}

const SCENARIOS: Record<ClimateScenario, ScenarioModifiers> = {
  current: {
    label: "Current Trajectory",
    description: "Business as usual: moderate warming continues, no major policy changes",
    tempChange: "+1.1\u00b0C",
    phytoChange: -40,
    kelpChange: -50,
    oxygenImpact: "50-80% of Earth's oxygen at slow decline",
    co2Absorbed: "10B tons/yr",
    cascadeIntensity: 50,
  },
  optimistic: {
    label: "Strong Action (RCP 2.6)",
    description: "Global emissions halved by 2030, carbon removal at scale, marine protected areas expanded",
    tempChange: "+1.5\u00b0C by 2100",
    phytoChange: -15,
    kelpChange: -10,
    oxygenImpact: "Recovery possible with intervention",
    co2Absorbed: "12B tons/yr (with kelp restoration)",
    cascadeIntensity: 20,
  },
  pessimistic: {
    label: "Worst Case (RCP 8.5)",
    description: "Emissions continue rising, ocean temperatures increase 3-5\u00b0C, mass acidification",
    tempChange: "+4.5\u00b0C by 2100",
    phytoChange: -70,
    kelpChange: -90,
    oxygenImpact: "Severe oxygen production loss, dead zones expand 10x",
    co2Absorbed: "4B tons/yr (ecosystem collapse)",
    cascadeIntensity: 95,
  },
};

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
  depthZone: string;
  depthY: number;
}

const organisms: Organism[] = [
  {
    id: "sharks",
    name: "Sharks & Apex Predators",
    trophicLevel: 5,
    levelLabel: "Apex Predators",
    populationTrend: "declining",
    populationChange: "-71% since 1970",
    description: "Sharks are apex predators that have maintained ocean ecosystems for over 400 million years. They regulate populations of species below them, preventing any single species from dominating.",
    climateImpact: "Rising ocean temperatures are shifting shark habitats poleward, disrupting established predator-prey dynamics. Ocean acidification weakens their ability to detect prey. Warming waters reduce oxygen levels in deep hunting grounds.",
    foodChainRole: "As apex predators, sharks enforce a 'trophic cascade' — controlling populations of large fish and marine mammals. Without sharks, mesopredator populations explode unchecked.",
    oxygenConnection: "When shark populations decline, the cascade effect ultimately disrupts phytoplankton — the organisms responsible for producing 50-80% of Earth's oxygen.",
    eats: ["Large Fish", "Sea Turtles", "Marine Mammals", "Rays"],
    eatenBy: [],
    facts: [
      "Oceanic shark populations have declined by 71% since 1970",
      "Over 100 million sharks are killed annually",
      "Sharks predate dinosaurs by 200 million years",
      "A healthy ocean needs ~1 shark per km\u00b2 of reef",
    ],
    depthZone: "Pelagic Zone",
    depthY: 8,
  },
  {
    id: "large-fish",
    name: "Large Predatory Fish",
    trophicLevel: 4,
    levelLabel: "Tertiary Consumers",
    populationTrend: "declining",
    populationChange: "-50% of large predatory fish lost",
    description: "Tuna, swordfish, grouper, and other large predatory fish occupy the tertiary consumer level. They control populations of smaller fish and invertebrates.",
    climateImpact: "Warming waters are forcing large fish to migrate to cooler depths and higher latitudes. Species like bluefin tuna are losing up to 20% of suitable habitat per decade.",
    foodChainRole: "When shark populations drop, large predatory fish populations can initially boom without predation pressure. But this is unsustainable — they overgraze on smaller fish populations.",
    oxygenConnection: "The boom-and-bust cycle of large fish without shark regulation creates instability that ripples down to zooplankton grazers.",
    eats: ["Small Fish", "Squid", "Crustaceans"],
    eatenBy: ["Sharks", "Marine Mammals"],
    facts: [
      "90% of large predatory fish have been removed from the oceans",
      "Tuna can regulate body temperature — rare among fish",
      "Many large fish species take 5-15 years to reach reproductive maturity",
    ],
    depthZone: "Mesopelagic",
    depthY: 25,
  },
  {
    id: "small-fish",
    name: "Small Fish & Forage Species",
    trophicLevel: 3,
    levelLabel: "Secondary Consumers",
    populationTrend: "disrupted",
    populationChange: "Boom-bust cycles intensifying",
    description: "Sardines, anchovies, herring, and other forage fish are the critical middle link. They convert energy from tiny plankton into food for larger predators.",
    climateImpact: "Warming seas shift plankton blooms earlier in the season, creating a 'mismatch.' Ocean acidification weakens their skeletons.",
    foodChainRole: "Without regulation from above, forage fish populations swing wildly. In boom phases, they overgraze on zooplankton. In bust phases, everything above them starves.",
    oxygenConnection: "Small fish are the bridge between zooplankton and the rest of the food web. Their destabilization harms oxygen production.",
    eats: ["Zooplankton", "Fish Larvae", "Small Crustaceans"],
    eatenBy: ["Large Fish", "Seabirds", "Marine Mammals"],
    facts: [
      "Forage fish make up ~30% of global fish catch by weight",
      "A single school of herring can contain 4 billion individuals",
      "They convert 10-15% of plankton energy to available food for predators",
    ],
    depthZone: "Epipelagic",
    depthY: 42,
  },
  {
    id: "zooplankton",
    name: "Zooplankton",
    trophicLevel: 2,
    levelLabel: "Primary Consumers",
    populationTrend: "disrupted",
    populationChange: "Distribution shifting poleward",
    description: "Zooplankton are tiny animals (0.2mm to 20mm) that drift in ocean currents. Copepods, krill, and larval organisms graze on phytoplankton.",
    climateImpact: "Warming oceans push zooplankton toward the poles. Krill populations in the Antarctic have declined by 80% since the 1970s.",
    foodChainRole: "Zooplankton regulate phytoplankton through grazing, preventing overgrowth that would block sunlight and create dead zones.",
    oxygenConnection: "This is the critical link: zooplankton regulate phytoplankton. Too many = phytoplankton overgrazed. Too few = unchecked algal blooms that create dead zones.",
    eats: ["Phytoplankton", "Bacteria", "Detritus"],
    eatenBy: ["Small Fish", "Whale Sharks", "Baleen Whales"],
    facts: [
      "Antarctic krill populations have declined ~80% since the 1970s",
      "Zooplankton perform the largest daily migration on Earth",
      "Copepods are the most abundant multicellular animals on the planet",
    ],
    depthZone: "Twilight Zone",
    depthY: 60,
  },
  {
    id: "phytoplankton",
    name: "Phytoplankton & Kelp",
    trophicLevel: 1,
    levelLabel: "Primary Producers",
    populationTrend: "declining",
    populationChange: "-40% since 1950",
    description: "Phytoplankton produce more oxygen than every forest on Earth combined. They are the foundation of ALL ocean life.",
    climateImpact: "Global phytoplankton levels have declined by ~40% since 1950. Warming surface waters prevent nutrient mixing.",
    foodChainRole: "Phytoplankton are the base of the entire marine food web. Every marine animal depends on them directly or indirectly.",
    oxygenConnection: "Phytoplankton produce 50-80% of all oxygen on Earth. Every second breath you take comes from these microscopic organisms.",
    eats: ["Sunlight", "CO2", "Dissolved Nutrients"],
    eatenBy: ["Zooplankton", "Filter Feeders", "Small Fish Larvae"],
    facts: [
      "Produce 50-80% of Earth's oxygen",
      "Global populations declined ~40% since 1950",
      "Absorb as much CO2 as all terrestrial plants combined",
      "A single liter of seawater contains millions of phytoplankton",
    ],
    depthZone: "Sunlit Zone",
    depthY: 78,
  },
];

const trophicLevelColors: Record<number, string> = {
  5: "hsl(var(--destructive))",
  4: "hsl(var(--chart-1))",
  3: "hsl(var(--chart-4))",
  2: "hsl(var(--chart-2))",
  1: "hsl(var(--chart-3))",
};

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function UnderwaterScene({
  selectedOrganism,
  onSelectOrganism,
  scenario,
}: {
  selectedOrganism: string | null;
  onSelectOrganism: (id: string | null) => void;
  scenario: ClimateScenario;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  const initBubbles = useCallback((w: number, h: number) => {
    const bubbles: Bubble[] = [];
    for (let i = 0; i < 30; i++) {
      bubbles.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        size: 2 + Math.random() * 4,
        speed: 0.3 + Math.random() * 0.8,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
    bubblesRef.current = bubbles;

    const particles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: i,
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.15,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }
    particlesRef.current = particles;
  }, []);

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.max(500, Math.floor(rect.height));
        setCanvasSize({ w, h });
        initBubbles(w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [initBubbles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scenarioColors = {
      optimistic: { top: [5, 30, 60], bottom: [2, 15, 35] },
      current: { top: [3, 20, 50], bottom: [1, 8, 22] },
      pessimistic: { top: [15, 12, 30], bottom: [5, 3, 12] },
    };

    const draw = () => {
      const { w, h } = canvasSize;
      timeRef.current += 0.016;
      const t = timeRef.current;

      const colors = scenarioColors[scenario];
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `rgb(${colors.top.join(",")})`);
      gradient.addColorStop(0.5, `rgb(${Math.round((colors.top[0] + colors.bottom[0]) / 2)},${Math.round((colors.top[1] + colors.bottom[1]) / 2)},${Math.round((colors.top[2] + colors.bottom[2]) / 2)})`);
      gradient.addColorStop(1, `rgb(${colors.bottom.join(",")})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 5; i++) {
        const waveY = h * 0.15 + i * 30;
        ctx.beginPath();
        ctx.moveTo(0, waveY);
        for (let x = 0; x < w; x += 4) {
          ctx.lineTo(x, waveY + Math.sin(x * 0.005 + t * 0.5 + i) * 15 + Math.sin(x * 0.01 + t * 0.3) * 8);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = `rgba(80,160,220,${0.03 + i * 0.01})`;
        ctx.fill();
      }
      ctx.restore();

      const lightX = w * 0.5 + Math.sin(t * 0.2) * w * 0.15;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.globalAlpha = 0.015;
        ctx.beginPath();
        const rayW = 30 + i * 20;
        const offsetX = (i - 1.5) * 80 + Math.sin(t * 0.3 + i) * 20;
        ctx.moveTo(lightX + offsetX - rayW / 2, 0);
        ctx.lineTo(lightX + offsetX + rayW / 2, 0);
        ctx.lineTo(lightX + offsetX + rayW * 1.5, h * 0.6);
        ctx.lineTo(lightX + offsetX - rayW * 0.5, h * 0.6);
        ctx.closePath();
        ctx.fillStyle = "rgba(100,180,255,0.5)";
        ctx.fill();
        ctx.restore();
      }

      bubblesRef.current.forEach((b) => {
        b.y -= b.speed;
        b.x += Math.sin(t + b.id) * 0.2;
        if (b.y < -10) {
          b.y = h + 10;
          b.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,200,255,${b.opacity})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,230,255,${b.opacity * 0.5})`;
        ctx.fill();
      });

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy + Math.sin(t + p.id * 0.5) * 0.05;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.fillStyle = `rgba(180,220,255,${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      const kelps = [
        { x: w * 0.02, h: h * 0.25, count: 3 },
        { x: w * 0.08, h: h * 0.3, count: 4 },
        { x: w * 0.88, h: h * 0.28, count: 3 },
        { x: w * 0.94, h: h * 0.22, count: 2 },
      ];
      const kelpFactor = scenario === "pessimistic" ? 0.3 : scenario === "optimistic" ? 1.2 : 0.8;
      kelps.forEach((k) => {
        for (let i = 0; i < k.count; i++) {
          const baseX = k.x + i * 12;
          const kh = k.h * kelpFactor;
          ctx.beginPath();
          ctx.moveTo(baseX, h);
          for (let y = h; y > h - kh; y -= 3) {
            const progress = (h - y) / kh;
            const sway = Math.sin(t * 0.8 + i + progress * 3) * (8 + progress * 12);
            ctx.lineTo(baseX + sway, y);
          }
          ctx.strokeStyle = `rgba(30,120,60,${0.25 + i * 0.05})`;
          ctx.lineWidth = 3 - i * 0.3;
          ctx.stroke();

          for (let y = h - 20; y > h - kh + 10; y -= 25) {
            const progress = (h - y) / kh;
            const sway = Math.sin(t * 0.8 + i + progress * 3) * (8 + progress * 12);
            ctx.beginPath();
            ctx.ellipse(baseX + sway, y, 6 + Math.sin(t + y) * 2, 12, Math.sin(t * 0.5 + i) * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(25,100,50,${0.15 + Math.sin(t + y) * 0.05})`;
            ctx.fill();
          }
        }
      });

      organisms.forEach((org) => {
        const baseY = (org.depthY / 100) * h;
        const isSelected = selectedOrganism === org.id;
        drawOrganismSilhouette(ctx, org.id, w, h, baseY, t, isSelected, scenario);
      });

      ctx.save();
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      const zones = [
        { label: "Surface / Sunlit", y: 0.02, color: "rgba(100,200,255,0.3)" },
        { label: "Epipelagic", y: 0.18, color: "rgba(60,150,220,0.25)" },
        { label: "Mesopelagic", y: 0.38, color: "rgba(40,100,180,0.2)" },
        { label: "Twilight Zone", y: 0.58, color: "rgba(20,60,120,0.2)" },
        { label: "Deep Ocean", y: 0.78, color: "rgba(10,30,80,0.2)" },
      ];
      zones.forEach((z) => {
        ctx.fillStyle = z.color;
        ctx.fillText(z.label, 8, z.y * h + 14);
        ctx.strokeStyle = z.color;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(0, z.y * h);
        ctx.lineTo(w, z.y * h);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasSize, selectedOrganism, scenario]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let closest: Organism | null = null;
    let minDist = 15;
    organisms.forEach((org) => {
      const dist = Math.abs(clickY - org.depthY);
      if (dist < minDist) {
        minDist = dist;
        closest = org;
      }
    });

    if (closest) {
      onSelectOrganism(selectedOrganism === (closest as Organism).id ? null : (closest as Organism).id);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] rounded-md overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer block"
        style={{ imageRendering: "auto" }}
        data-testid="canvas-ocean-scene"
      />

      {organisms.map((org) => {
        const isSelected = selectedOrganism === org.id;
        return (
          <button
            key={org.id}
            onClick={() => onSelectOrganism(isSelected ? null : org.id)}
            className={`absolute right-3 px-2.5 py-1.5 rounded-md text-left transition-all border ${
              isSelected
                ? "bg-black/70 border-white/30 scale-105"
                : "bg-black/40 border-white/10 hover:bg-black/60 hover:border-white/20"
            }`}
            style={{
              top: `${org.depthY}%`,
              transform: `translateY(-50%)${isSelected ? " scale(1.05)" : ""}`,
            }}
            data-testid={`button-organism-${org.id}`}
          >
            <p className="text-[11px] font-semibold text-white/90 leading-tight">{org.name}</p>
            <p className="text-[9px] leading-tight" style={{ color: trophicLevelColors[org.trophicLevel] }}>
              L{org.trophicLevel} {org.levelLabel}
            </p>
          </button>
        );
      })}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        {organisms.map((org) => (
          <div
            key={org.id}
            className={`w-2.5 h-2.5 rounded-full border transition-all cursor-pointer ${
              selectedOrganism === org.id ? "scale-150 border-white/60" : "border-white/20"
            }`}
            style={{ backgroundColor: trophicLevelColors[org.trophicLevel] }}
            onClick={() => onSelectOrganism(selectedOrganism === org.id ? null : org.id)}
            data-testid={`dot-organism-${org.id}`}
          />
        ))}
      </div>
    </div>
  );
}

function drawOrganismSilhouette(
  ctx: CanvasRenderingContext2D,
  id: string,
  w: number,
  h: number,
  baseY: number,
  t: number,
  isSelected: boolean,
  scenario: ClimateScenario
) {
  const alpha = isSelected ? 0.7 : 0.35;
  const glowAlpha = isSelected ? 0.15 : 0;
  const popFactor = scenario === "pessimistic" ? 0.5 : scenario === "optimistic" ? 1.3 : 1;

  ctx.save();

  if (id === "sharks") {
    const count = Math.max(1, Math.round(2 * popFactor));
    for (let i = 0; i < count; i++) {
      const sx = (w * 0.3 + i * w * 0.35 + Math.sin(t * 0.4 + i * 2) * w * 0.12) % w;
      const sy = baseY + Math.sin(t * 0.3 + i) * 15;
      const sc = 0.7 + i * 0.15;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(sc, sc);
      if (glowAlpha > 0) {
        ctx.shadowColor = "rgba(255,80,80,0.4)";
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = `rgba(120,140,160,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.quadraticCurveTo(-20, -14, 0, -10);
      ctx.quadraticCurveTo(15, -8, 30, 0);
      ctx.quadraticCurveTo(15, 8, 0, 10);
      ctx.quadraticCurveTo(-20, 14, -35, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5, -10);
      ctx.lineTo(10, -22);
      ctx.lineTo(18, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(44, -8);
      ctx.lineTo(44, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (id === "large-fish") {
    const count = Math.max(1, Math.round(3 * popFactor));
    for (let i = 0; i < count; i++) {
      const fx = (w * 0.2 + i * w * 0.25 + t * 30 + i * 100) % (w + 60) - 30;
      const fy = baseY + Math.sin(t * 0.5 + i * 1.5) * 20;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(0.6 + i * 0.1, 0.6 + i * 0.1);
      ctx.fillStyle = `rgba(100,130,170,${alpha * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(34, -7);
      ctx.lineTo(34, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (id === "small-fish") {
    const schoolSize = Math.max(5, Math.round(15 * popFactor));
    const centerX = (w * 0.5 + Math.sin(t * 0.3) * w * 0.25);
    const centerY = baseY;
    for (let i = 0; i < schoolSize; i++) {
      const angle = (i / schoolSize) * Math.PI * 2 + t * 0.5;
      const radius = 30 + Math.sin(t + i) * 15;
      const fx = centerX + Math.cos(angle) * radius + Math.sin(t * 0.7 + i * 0.8) * 10;
      const fy = centerY + Math.sin(angle) * radius * 0.5 + Math.cos(t * 0.4 + i * 0.6) * 8;
      ctx.fillStyle = `rgba(140,170,200,${alpha * 0.7})`;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 5, 2.5, Math.atan2(Math.sin(angle), Math.cos(angle)), 0, Math.PI * 2);
      ctx.fill();
    }
    if (glowAlpha > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,180,255,${glowAlpha})`;
      ctx.fill();
    }
  } else if (id === "zooplankton") {
    const count = Math.max(8, Math.round(25 * popFactor));
    for (let i = 0; i < count; i++) {
      const zx = (i * w / count + Math.sin(t * 0.2 + i) * 30) % w;
      const zy = baseY + Math.sin(t * 0.4 + i * 0.7) * 25 + (i % 3) * 10 - 15;
      ctx.fillStyle = `rgba(160,200,180,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(zx, zy, 1.5 + Math.sin(t + i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(160,200,180,${alpha * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(zx, zy + 2);
      ctx.lineTo(zx + Math.sin(t + i) * 3, zy + 5);
      ctx.stroke();
    }
  } else if (id === "phytoplankton") {
    const count = Math.max(15, Math.round(40 * popFactor));
    for (let i = 0; i < count; i++) {
      const px = (i * w / count + Math.sin(t * 0.15 + i * 0.5) * 15) % w;
      const py = baseY + Math.sin(t * 0.3 + i * 0.4) * 20 + (i % 4) * 8 - 15;
      const glow = Math.sin(t * 1.5 + i * 0.3) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(80,200,120,${alpha * 0.4 * (0.6 + glow * 0.4)})`;
      ctx.beginPath();
      ctx.arc(px, py, 1 + glow * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (glowAlpha > 0) {
      ctx.fillStyle = `rgba(80,200,120,${glowAlpha * 0.5})`;
      ctx.fillRect(0, baseY - 25, w, 50);
    }
  }

  ctx.restore();
}

function OrganismInfoPanel({
  organism,
  onClose,
}: {
  organism: Organism;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-background/95 backdrop-blur-sm border border-border rounded-md p-4 space-y-3 shadow-lg max-h-[70vh] overflow-y-auto"
      data-testid={`panel-organism-${organism.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground" data-testid={`text-organism-name-${organism.id}`}>
            {organism.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]" data-testid={`badge-level-${organism.id}`}>
              L{organism.trophicLevel}: {organism.levelLabel}
            </Badge>
            <Badge
              variant={organism.populationTrend === "declining" ? "destructive" : "outline"}
              className="text-[10px]"
              data-testid={`badge-trend-${organism.id}`}
            >
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              {organism.populationChange}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {organism.depthZone}
            </Badge>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-detail">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{organism.description}</p>

      <div className="space-y-2">
        <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10 space-y-1" data-testid={`section-climate-${organism.id}`}>
          <div className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-destructive shrink-0" />
            <h4 className="text-xs font-semibold text-foreground">Climate Impact</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{organism.climateImpact}</p>
        </div>

        <div className="p-3 rounded-md bg-primary/5 border border-primary/10 space-y-1" data-testid={`section-role-${organism.id}`}>
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0" style={{ color: trophicLevelColors[organism.trophicLevel] }} />
            <h4 className="text-xs font-semibold text-foreground">Food Chain Role</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{organism.foodChainRole}</p>
        </div>

        <div className="p-3 rounded-md bg-chart-2/5 border border-chart-2/10 space-y-1" data-testid={`section-oxygen-${organism.id}`}>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-chart-2 shrink-0" />
            <h4 className="text-xs font-semibold text-foreground">Oxygen Connection</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{organism.oxygenConnection}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {organism.eats.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Feeds On</p>
            <div className="flex flex-wrap gap-1">
              {organism.eats.map((prey) => (
                <Badge key={prey} variant="outline" className="text-[9px]">{prey}</Badge>
              ))}
            </div>
          </div>
        )}
        {organism.eatenBy.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preyed Upon By</p>
            <div className="flex flex-wrap gap-1">
              {organism.eatenBy.map((pred) => (
                <Badge key={pred} variant="outline" className="text-[9px]">{pred}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Key Facts</p>
        <ul className="space-y-0.5">
          {organism.facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" style={{ color: trophicLevelColors[organism.trophicLevel] }} />
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function CascadeVisualization() {
  const steps = [
    { label: "Climate Change", detail: "Rising temperatures, ocean acidification, habitat loss", icon: Thermometer, color: "text-destructive" },
    { label: "Shark Populations Collapse", detail: "71% decline removes top-down regulation", icon: AlertTriangle, color: "text-destructive" },
    { label: "Mesopredator Release", detail: "Large fish populations boom unchecked, then crash", icon: TrendingDown, color: "text-chart-1" },
    { label: "Forage Fish Destabilized", detail: "Boom-bust cycles disrupt mid-level energy transfer", icon: TrendingDown, color: "text-chart-4" },
    { label: "Zooplankton Imbalance", detail: "Grazing pressure on phytoplankton becomes erratic", icon: TrendingDown, color: "text-chart-2" },
    { label: "Phytoplankton Decline", detail: "40% loss since 1950 — oxygen production drops", icon: Droplets, color: "text-chart-3" },
    { label: "Earth's Oxygen at Risk", detail: "50-80% of our oxygen comes from these organisms", icon: Wind, color: "text-foreground" },
  ];

  return (
    <Card className="p-4 space-y-3" data-testid="section-cascade">
      <h3 className="text-sm font-semibold text-foreground">The Trophic Cascade</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        A chain reaction through the food web. When apex predators are removed, every level below is affected.
      </p>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-center gap-3 py-1.5" data-testid={`cascade-step-${i}`}>
              <div className={`shrink-0 ${step.color}`}>
                <step.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.detail}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center pl-1.5 py-0">
                <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
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
        <Leaf className="h-4 w-4 text-chart-3" />
        <h3 className="text-sm font-semibold text-foreground">Why This Matters: Earth's Oxygen</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-chart-3">50-80%</p>
          <p className="text-[9px] text-muted-foreground">of Earth's O2 from phytoplankton</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-destructive">-40%</p>
          <p className="text-[9px] text-muted-foreground">decline since 1950</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-chart-1">10B tons</p>
          <p className="text-[9px] text-muted-foreground">CO2 absorbed annually</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Every second breath you take comes from phytoplankton. Healthy shark populations maintain balanced
        predator-prey dynamics, which stabilizes zooplankton grazing, allowing phytoplankton to produce oxygen.
      </p>
    </Card>
  );
}

function CarbonSinkSection() {
  return (
    <Card className="p-4 space-y-3" data-testid="section-carbon-sink">
      <div className="flex items-center gap-2">
        <TreePine className="h-4 w-4 text-chart-2" />
        <h3 className="text-sm font-semibold text-foreground">Kelp & Algae: Carbon Sink</h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-md bg-chart-2/10 text-center">
          <p className="text-sm font-bold text-foreground">20x</p>
          <p className="text-[8px] text-muted-foreground">More CO2/acre than forests</p>
        </div>
        <div className="p-2 rounded-md bg-chart-3/10 text-center">
          <p className="text-sm font-bold text-foreground">173M</p>
          <p className="text-[8px] text-muted-foreground">Tons CO2 by kelp/yr</p>
        </div>
        <div className="p-2 rounded-md bg-chart-1/10 text-center">
          <p className="text-sm font-bold text-foreground">-50%</p>
          <p className="text-[8px] text-muted-foreground">Kelp forests lost</p>
        </div>
        <div className="p-2 rounded-md bg-primary/10 text-center">
          <p className="text-sm font-bold text-foreground">800+</p>
          <p className="text-[8px] text-muted-foreground">Species depend on kelp</p>
        </div>
      </div>

      <div className="p-3 rounded-md bg-muted/50 space-y-1">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          The Urchin Barren Problem
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          When predators decline, urchin populations explode. In Northern California, 95% of bull kelp forests
          have been replaced by urchin barrens since 2014 — a trophic cascade consequence.
        </p>
      </div>
    </Card>
  );
}

function ClimateScenarioToggle({ scenario, onChange }: { scenario: ClimateScenario; onChange: (s: ClimateScenario) => void }) {
  const s = SCENARIOS[scenario];

  return (
    <Card className="p-4 space-y-3" data-testid="section-climate-scenarios">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-chart-4" />
        <h3 className="text-sm font-semibold text-foreground">Climate Scenario Explorer</h3>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={scenario === "optimistic" ? "default" : "outline"}
          onClick={() => onChange("optimistic")}
          data-testid="button-scenario-optimistic"
        >
          <Leaf className="h-3 w-3 mr-1" />
          Strong Action
        </Button>
        <Button
          size="sm"
          variant={scenario === "current" ? "default" : "outline"}
          onClick={() => onChange("current")}
          data-testid="button-scenario-current"
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          Current
        </Button>
        <Button
          size="sm"
          variant={scenario === "pessimistic" ? "default" : "outline"}
          onClick={() => onChange("pessimistic")}
          data-testid="button-scenario-pessimistic"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Worst Case
        </Button>
      </div>

      <motion.div
        key={scenario}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-2"
      >
        <div className="p-2 rounded-md bg-muted/50">
          <p className="text-xs font-semibold text-foreground">{s.label}</p>
          <p className="text-[10px] text-muted-foreground">{s.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{s.tempChange}</p>
            <p className="text-[8px] text-muted-foreground">Temperature</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: s.phytoChange < -50 ? "hsl(var(--destructive))" : s.phytoChange > -20 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))" }}>
              {s.phytoChange}%
            </p>
            <p className="text-[8px] text-muted-foreground">Phytoplankton</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: s.kelpChange < -50 ? "hsl(var(--destructive))" : s.kelpChange > -20 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))" }}>
              {s.kelpChange}%
            </p>
            <p className="text-[8px] text-muted-foreground">Kelp Forests</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground">Cascade Intensity</p>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${s.cascadeIntensity}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                backgroundColor: s.cascadeIntensity > 70 ? "hsl(var(--destructive))" : s.cascadeIntensity > 40 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))",
              }}
            />
          </div>
        </div>
      </motion.div>
    </Card>
  );
}

export default function FoodChainPage() {
  const [selectedOrganism, setSelectedOrganism] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ClimateScenario>("current");

  const selected = organisms.find((o) => o.id === selectedOrganism);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto" data-testid="page-food-chain">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">
          Ocean Food Chain & Climate Impact
        </h1>
        <p className="text-xs text-muted-foreground max-w-3xl">
          Explore the underwater food chain interactively. Click organisms in the ocean scene or the labels to learn about their role,
          climate impact, and connection to oxygen production. Toggle climate scenarios to see ecosystem changes in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[500px] lg:h-[600px]">
            <UnderwaterScene
              selectedOrganism={selectedOrganism}
              onSelectOrganism={setSelectedOrganism}
              scenario={scenario}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClimateScenarioToggle scenario={scenario} onChange={setScenario} />
            <CascadeVisualization />
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selected ? (
              <OrganismInfoPanel
                key={selected.id}
                organism={selected}
                onClose={() => setSelectedOrganism(null)}
              />
            ) : (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="p-4 border-dashed space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Click an organism in the ocean scene or its label to explore its role in the food chain.
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <OxygenSection />
          <CarbonSinkSection />
        </div>
      </div>
    </div>
  );
}
