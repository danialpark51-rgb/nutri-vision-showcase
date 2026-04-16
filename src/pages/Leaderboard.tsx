import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Globe, MapPin, Medal } from "lucide-react";
import { demoLeaderboard } from "@/lib/demo-data";

const tabs = [
  { id: "global", label: "Global", icon: Globe },
  { id: "country", label: "Country", icon: MapPin },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global");

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
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="flex items-end justify-center gap-3 pt-4">
        {[1, 0, 2].map((idx) => {
          const user = demoLeaderboard[idx];
          const heights = ["h-24", "h-32", "h-20"];
          const medals = ["🥈", "🥇", "🥉"];
          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">{medals[idx]}</span>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                {user.country}
              </div>
              <span className="text-xs font-semibold text-foreground">{user.name}</span>
              <div className={`w-16 ${heights[idx]} rounded-t-xl bg-gradient-to-t from-primary/20 to-primary/5 flex items-center justify-center`}>
                <span className="text-lg font-heading font-bold text-primary">{user.score}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full List */}
      <div className="space-y-2">
        {demoLeaderboard.slice(3).map((user, i) => (
          <motion.div
            key={user.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className={`glass-card rounded-xl p-3 flex items-center gap-3 ${
              user.isUser ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="w-8 text-center font-heading font-bold text-muted-foreground">
              {user.rank}
            </span>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm">
              {user.country}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${user.isUser ? "text-primary" : "text-foreground"}`}>
                {user.name} {user.isUser && "⭐"}
              </p>
              <p className="text-xs text-muted-foreground">{user.percentile}</p>
            </div>
            <span className="font-heading font-bold text-foreground">{user.score}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
