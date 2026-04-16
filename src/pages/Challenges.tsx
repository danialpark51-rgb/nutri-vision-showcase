import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Globe, MapPin, Flag, Filter, MessageCircle, Video, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CreateChallengeSheet from "@/components/challenges/CreateChallengeSheet";

type ChallengeScope = "world" | "country" | "state";
type ChallengeStatus = "pending" | "accepted" | "active" | "completed" | "declined" | "cancelled";

interface Challenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  title: string;
  description: string | null;
  scope: ChallengeScope;
  status: ChallengeStatus;
  deadline: string | null;
  winner_id: string | null;
  created_at: string;
  challenger_profile?: { display_name: string | null; avatar_url: string | null; country: string | null; state: string | null };
  opponent_profile?: { display_name: string | null; avatar_url: string | null; country: string | null; state: string | null };
}

const scopeIcons: Record<ChallengeScope, typeof Globe> = { world: Globe, country: Flag, state: MapPin };
const statusColors: Record<ChallengeStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  accepted: "bg-blue-500/20 text-blue-500",
  active: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-500",
  declined: "bg-red-500/20 text-red-500",
  cancelled: "bg-muted text-muted-foreground",
};

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "pending">("all");
  const [showCreate, setShowCreate] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    let query = supabase.from("challenges").select("*").order("created_at", { ascending: false });

    if (filter === "my" && user) {
      query = query.or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`);
    } else if (filter === "pending" && user) {
      query = query.eq("opponent_id", user.id).eq("status", "pending");
    }

    const { data, error } = await query;
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setLoading(false); return; }

    // Fetch profiles for all participants
    const userIds = new Set<string>();
    (data || []).forEach((c: any) => { userIds.add(c.challenger_id); userIds.add(c.opponent_id); });

    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, country, state").in("user_id", Array.from(userIds));
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const enriched = (data || []).map((c: any) => ({
      ...c,
      challenger_profile: profileMap.get(c.challenger_id),
      opponent_profile: profileMap.get(c.opponent_id),
    }));

    setChallenges(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchChallenges(); }, [filter, user]);

  const respondToChallenge = async (id: string, accept: boolean) => {
    const { error } = await supabase.from("challenges").update({ status: accept ? "accepted" : "declined" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: accept ? "Challenge Accepted! 🔥" : "Challenge Declined" });
    fetchChallenges();
  };

  const pendingCount = challenges.filter((c) => c.opponent_id === user?.id && c.status === "pending").length;

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-foreground">Challenges</h2>
          <p className="text-sm text-muted-foreground">Compete for rankings worldwide</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {([
          { key: "all", label: "All" },
          { key: "my", label: "My Challenges" },
          { key: "pending", label: `Invites${pendingCount ? ` (${pendingCount})` : ""}` },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Challenge List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-2">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No challenges yet</p>
          <button onClick={() => setShowCreate(true)} className="text-primary font-medium text-sm">Create your first challenge →</button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {challenges.map((c, i) => {
              const ScopeIcon = scopeIcons[c.scope];
              const isParticipant = user && (c.challenger_id === user.id || c.opponent_id === user.id);
              const isPendingForMe = c.opponent_id === user?.id && c.status === "pending";

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{c.title}</h3>
                      {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ScopeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                        {c.challenger_profile?.avatar_url ? (
                          <img src={c.challenger_profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (c.challenger_profile?.display_name || "?")[0]
                        )}
                      </div>
                      <span className="text-foreground font-medium truncate max-w-[80px]">
                        {c.challenger_profile?.display_name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">vs</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-accent-foreground overflow-hidden">
                        {c.opponent_profile?.avatar_url ? (
                          <img src={c.opponent_profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (c.opponent_profile?.display_name || "?")[0]
                        )}
                      </div>
                      <span className="text-foreground font-medium truncate max-w-[80px]">
                        {c.opponent_profile?.display_name || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {c.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Deadline: {new Date(c.deadline).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isPendingForMe && (
                      <>
                        <button onClick={() => respondToChallenge(c.id, true)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button onClick={() => respondToChallenge(c.id, false)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </button>
                      </>
                    )}
                    {isParticipant && c.status !== "pending" && c.status !== "declined" && c.status !== "cancelled" && (
                      <>
                        <button onClick={() => navigate(`/challenges/${c.id}`)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          <MessageCircle className="h-3.5 w-3.5" /> Chat
                        </button>
                        <button onClick={() => navigate(`/challenges/${c.id}?tab=videos`)} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                          <Video className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {!isParticipant && (
                      <button onClick={() => navigate(`/challenges/${c.id}`)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                        View Details
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <CreateChallengeSheet open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchChallenges} />
    </div>
  );
}
