import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardUser {
  user_id: string;
  display_name: string | null;
  health_score: number | null;
  country: string | null;
  state: string | null;
  avatar_url: string | null;
}

const tabs = [
  { id: "global", label: "Global", icon: Globe },
  { id: "country", label: "Country", icon: MapPin },
  { id: "state", label: "State", icon: Map },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global");
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<LeaderboardUser | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("user_id, display_name, health_score, country, state, avatar_url")
      .order("health_score", { ascending: false })
      .limit(50);

    // If filtering by country/state, first get the user's profile
    if (user && (activeTab === "country" || activeTab === "state")) {
      const { data: me } = await supabase
        .from("profiles")
        .select("country, state")
        .eq("user_id", user.id)
        .single();

      if (me) {
        if (activeTab === "country" && me.country) {
          query = query.eq("country", me.country);
        } else if (activeTab === "state" && me.state) {
          query = query.eq("state", me.state);
        }
      }
    }

    const { data } = await query;
    if (data) {
      setUsers(data as LeaderboardUser[]);
      if (user) {
        const me = data.find((u: any) => u.user_id === user.id);
        if (me) setMyProfile(me as LeaderboardUser);
      }
    }
    setLoading(false);
  };

  const getRank = (userId: string) => users.findIndex((u) => u.user_id === userId) + 1;
  const isMe = (userId: string) => user?.id === userId;

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">See how you stack up</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="leaderboard-tab-bg"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No users found. Be the first!</div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-3 pt-4">
              {[1, 0, 2].map((idx) => {
                const u = top3[idx];
                if (!u) return null;
                const heights = ["h-24", "h-32", "h-20"];
                const medals = ["🥈", "🥇", "🥉"];
                return (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                    onClick={() => navigate(`/user/${u.user_id}`)}
                  >
                    <span className="text-2xl">{medals[idx]}</span>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        {u.country || "👤"}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground max-w-[60px] truncate">
                      {isMe(u.user_id) ? "You ⭐" : u.display_name || "User"}
                    </span>
                    <div className={`w-16 ${heights[idx]} rounded-t-xl bg-gradient-to-t from-primary/20 to-primary/5 flex items-center justify-center`}>
                      <span className="text-lg font-heading font-bold text-primary">{u.health_score || 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="space-y-2">
            {rest.map((u, i) => (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => navigate(`/user/${u.user_id}`)}
                className={`glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${
                  isMe(u.user_id) ? "ring-2 ring-primary" : ""
                }`}
              >
                <span className="w-8 text-center font-heading font-bold text-muted-foreground">
                  {i + 4}
                </span>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                    {u.country || "👤"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe(u.user_id) ? "text-primary" : "text-foreground"}`}>
                    {isMe(u.user_id) ? "You ⭐" : u.display_name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.state ? `${u.state}, ` : ""}{u.country || ""}
                  </p>
                </div>
                <span className="font-heading font-bold text-foreground">{u.health_score || 0}</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
