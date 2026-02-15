import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CityMonitor } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Trophy,
  School,
  Medal,
  Star,
  TrendingUp,
  MapPin,
  ArrowLeft,
  Clock,
  Target,
  Trash2,
  DollarSign,
  Users,
  Leaf,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  BookOpen,
  Megaphone,
  Filter,
  ChevronRight,
  Shield,
} from "lucide-react";

interface LeaderboardEntry {
  school: {
    id: string;
    name: string;
    type: string;
    location: string | null;
    adoptedCityId: string | null;
    createdAt: string;
  };
  totalPoints: number;
  weeklyPoints: number;
  actionCount: number;
  badges: Array<{ id: string; label: string }>;
}

interface SchoolProfile {
  school: LeaderboardEntry["school"];
  adoptedCity: CityMonitor | null;
  totalPoints: number;
  weeklyPoints: number;
  actionCount: number;
  kgRemoved: number;
  fundsRaised: number;
  co2Equivalent: number;
  volunteerEstimate: number;
  pointsByCategory: Record<string, number>;
  recentActions: Array<{
    id: string;
    actionType: string;
    description: string;
    pointsAwarded: number;
    status: string;
    createdAt: string;
    kgTrashRemoved: number | null;
    donationUsd: number | null;
  }>;
}

interface PendingAction {
  id: string;
  schoolId: string;
  schoolName: string;
  actionType: string;
  description: string;
  status: string;
  kgTrashRemoved: number | null;
  donationUsd: number | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, typeof BookOpen> = {
  CLASSROOM_MISSION: BookOpen,
  CLEANUP_EVENT: Trash2,
  DONATION_RAISED: DollarSign,
  AWARENESS_ACTIVITY: Megaphone,
};

const ACTION_LABELS: Record<string, string> = {
  CLASSROOM_MISSION: "Classroom Mission",
  CLEANUP_EVENT: "Cleanup Event",
  DONATION_RAISED: "Donation Raised",
  AWARENESS_ACTIVITY: "Awareness Activity",
};

const BADGE_ICONS: Record<string, typeof Star> = {
  first_action: Star,
  "500_points": Medal,
  "1000_points": Trophy,
  "100_raised": DollarSign,
  "100kg_removed": Trash2,
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0"><Trophy className="h-3.5 w-3.5 text-amber-500" /></div>;
  if (rank === 2) return <div className="w-7 h-7 rounded-full bg-slate-400/20 flex items-center justify-center shrink-0"><Medal className="h-3.5 w-3.5 text-slate-400" /></div>;
  if (rank === 3) return <div className="w-7 h-7 rounded-full bg-amber-700/20 flex items-center justify-center shrink-0"><Medal className="h-3.5 w-3.5 text-amber-700" /></div>;
  return <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"><span className="text-xs font-semibold text-muted-foreground">{rank}</span></div>;
}

function LeaderboardView({ onSelectSchool }: { onSelectSchool: (id: string) => void }) {
  const [period, setPeriod] = useState<"alltime" | "weekly">("alltime");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: cities } = useQuery<CityMonitor[]>({ queryKey: ["/api/cities"] });

  const queryParams = new URLSearchParams({ period });
  if (cityFilter !== "all") queryParams.set("city_id", cityFilter);
  if (typeFilter !== "all") queryParams.set("type", typeFilter);

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/scoreboard/leaderboard", period, cityFilter, typeFilter],
    queryFn: () => fetch(`/api/scoreboard/leaderboard?${queryParams.toString()}`).then(r => r.json()),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-scoreboard-title">
            School Scoreboard
          </h1>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            Live Rankings
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Schools compete by adopting cities, completing sustainability missions, and logging real-world ocean conservation actions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <School className="h-5 w-5 text-primary mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground" data-testid="text-total-schools">{leaderboard?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Competing Schools</p>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground" data-testid="text-total-points">
            {leaderboard?.reduce((s, e) => s + e.totalPoints, 0)?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Points Earned</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="h-5 w-5 text-chart-2 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground" data-testid="text-total-actions">
            {leaderboard?.reduce((s, e) => s + e.actionCount, 0) || 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Actions Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <Award className="h-5 w-5 text-chart-4 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-foreground" data-testid="text-total-badges">
            {leaderboard?.reduce((s, e) => s + e.badges.length, 0) || 0}
          </p>
          <p className="text-[10px] text-muted-foreground">Badges Earned</p>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={period === "alltime" ? "default" : "outline"}
            onClick={() => setPeriod("alltime")}
            data-testid="button-period-alltime"
          >
            All-Time
          </Button>
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            onClick={() => setPeriod("weekly")}
            data-testid="button-period-weekly"
          >
            This Week
          </Button>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]" data-testid="select-type-filter">
            <SelectValue placeholder="School Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="K12">K-12</SelectItem>
            <SelectItem value="COLLEGE">College</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-city-filter">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.cityName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-10 bg-muted rounded-md" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard?.map((entry, idx) => (
            <motion.div
              key={entry.school.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className="p-4 cursor-pointer hover-elevate"
                onClick={() => onSelectSchool(entry.school.id)}
                data-testid={`card-school-${entry.school.id}`}
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={idx + 1} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate" data-testid={`text-school-name-${entry.school.id}`}>
                        {entry.school.name}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {entry.school.type === "K12" ? "K-12" : "College"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {entry.school.location && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {entry.school.location}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {entry.actionCount} action{entry.actionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex gap-1 flex-wrap">
                      {entry.badges.slice(0, 3).map(b => {
                        const Icon = BADGE_ICONS[b.id] || Star;
                        return (
                          <div key={b.id} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center" title={b.label}>
                            <Icon className="h-3 w-3 text-primary" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground" data-testid={`text-points-${entry.school.id}`}>
                        {period === "weekly" ? entry.weeklyPoints.toLocaleString() : entry.totalPoints.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {leaderboard?.length === 0 && (
            <Card className="p-8 text-center">
              <School className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No schools found matching your filters.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SchoolProfileView({ schoolId, onBack }: { schoolId: string; onBack: () => void }) {
  const { data: profile, isLoading } = useQuery<SchoolProfile>({
    queryKey: ["/api/scoreboard/schools", schoolId],
    queryFn: () => fetch(`/api/scoreboard/schools/${schoolId}`).then(r => r.json()),
  });

  if (isLoading || !profile) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leaderboard
        </Button>
        <Card className="p-8 mt-4 animate-pulse"><div className="h-40 bg-muted rounded-md" /></Card>
      </div>
    );
  }

  const chartData = Object.entries(profile.pointsByCategory).map(([key, value]) => ({
    category: ACTION_LABELS[key] || key,
    points: value,
  }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" onClick={onBack} data-testid="button-back">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leaderboard
      </Button>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-foreground" data-testid="text-profile-name">{profile.school.name}</h1>
              <Badge variant="outline">{profile.school.type === "K12" ? "K-12" : "College"}</Badge>
            </div>
            {profile.school.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {profile.school.location}
              </p>
            )}
            {profile.adoptedCity && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Leaf className="h-3 w-3 text-chart-2" /> Adopted City: <span className="font-medium text-foreground">{profile.adoptedCity.cityName}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground" data-testid="text-profile-total-points">{profile.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">total points</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <Trash2 className="h-4 w-4 text-chart-1 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground" data-testid="text-kg-removed">{Math.round(profile.kgRemoved)} kg</p>
          <p className="text-[10px] text-muted-foreground">Trash Removed</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground" data-testid="text-volunteers">{profile.volunteerEstimate}</p>
          <p className="text-[10px] text-muted-foreground">Est. Volunteers</p>
        </Card>
        <Card className="p-3 text-center">
          <DollarSign className="h-4 w-4 text-chart-2 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground" data-testid="text-funds-raised">${Math.round(profile.fundsRaised)}</p>
          <p className="text-[10px] text-muted-foreground">Funds Raised</p>
        </Card>
        <Card className="p-3 text-center">
          <Leaf className="h-4 w-4 text-chart-3 mx-auto mb-1" />
          <p className="text-sm font-bold text-foreground" data-testid="text-co2">{profile.co2Equivalent} kg</p>
          <p className="text-[10px] text-muted-foreground">CO2 Equivalent</p>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Points by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "6px" }} />
              <Bar dataKey="points" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Actions</h3>
        <div className="space-y-2">
          {profile.recentActions.map((action) => {
            const Icon = ACTION_ICONS[action.actionType] || Target;
            return (
              <div key={action.id} className="flex items-start gap-3 p-3 bg-muted rounded-md" data-testid={`action-${action.id}`}>
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-foreground">{ACTION_LABELS[action.actionType]}</p>
                    <Badge
                      variant={action.status === "APPROVED" ? "secondary" : action.status === "PENDING" ? "outline" : "destructive"}
                      className="text-[9px]"
                    >
                      {action.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {action.pointsAwarded > 0 && <span className="text-[10px] text-chart-2 font-medium">+{action.pointsAwarded} pts</span>}
                    {action.kgTrashRemoved && <span className="text-[10px] text-muted-foreground">{action.kgTrashRemoved} kg removed</span>}
                    {action.donationUsd && <span className="text-[10px] text-muted-foreground">${action.donationUsd} raised</span>}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(action.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function AdminReviewView() {
  const { toast } = useToast();
  const { data: pendingActions, isLoading } = useQuery<PendingAction[]>({
    queryKey: ["/api/scoreboard/actions", "PENDING"],
    queryFn: () => fetch("/api/scoreboard/actions?status=PENDING").then(r => r.json()),
    refetchInterval: 15000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ actionId, status }: { actionId: string; status: "APPROVED" | "REJECTED" }) => {
      const res = await apiRequest("POST", `/api/scoreboard/actions/${actionId}/review`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scoreboard/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scoreboard/leaderboard"] });
      toast({
        title: variables.status === "APPROVED" ? "Action Approved" : "Action Rejected",
        description: `Points ${variables.status === "APPROVED" ? "awarded" : "not awarded"}.`,
      });
    },
    onError: () => {
      toast({ title: "Review failed", description: "Could not process the review.", variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-admin-title">Admin Review</h1>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Pending Actions
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Review and approve or reject pending school actions. Approved actions award points to the school.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse"><div className="h-16 bg-muted rounded-md" /></Card>
          ))}
        </div>
      ) : pendingActions && pendingActions.length > 0 ? (
        <div className="space-y-3">
          {pendingActions.map((action) => {
            const Icon = ACTION_ICONS[action.actionType] || Target;
            return (
              <Card key={action.id} className="p-4" data-testid={`admin-action-${action.id}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{ACTION_LABELS[action.actionType]}</p>
                        <Badge variant="outline" className="text-[9px]">
                          <AlertCircle className="h-2.5 w-2.5 mr-0.5" /> Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] font-medium text-foreground">{action.schoolName}</span>
                        {action.kgTrashRemoved && <span className="text-[10px] text-muted-foreground">{action.kgTrashRemoved} kg trash</span>}
                        {action.donationUsd && <span className="text-[10px] text-muted-foreground">${action.donationUsd} donation</span>}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(action.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="default"
                      onClick={() => reviewMutation.mutate({ actionId: action.id, status: "APPROVED" })}
                      disabled={reviewMutation.isPending}
                      data-testid={`button-approve-${action.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => reviewMutation.mutate({ actionId: action.id, status: "REJECTED" })}
                      disabled={reviewMutation.isPending}
                      data-testid={`button-reject-${action.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <CheckCircle className="h-8 w-8 text-chart-2 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending actions to review. All caught up!</p>
        </Card>
      )}
    </div>
  );
}

export default function Scoreboard() {
  const [view, setView] = useState<"leaderboard" | "profile" | "admin">("leaderboard");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  return (
    <>
      {view === "leaderboard" && (
        <LeaderboardView
          onSelectSchool={(id) => {
            setSelectedSchoolId(id);
            setView("profile");
          }}
        />
      )}
      {view === "profile" && selectedSchoolId && (
        <SchoolProfileView
          schoolId={selectedSchoolId}
          onBack={() => setView("leaderboard")}
        />
      )}
      {view === "admin" && <AdminReviewView />}
    </>
  );
}

export function ScoreboardAdmin() {
  return <AdminReviewView />;
}
