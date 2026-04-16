import { motion } from "framer-motion";
import { User, Target, MapPin, Edit, Award, TrendingUp } from "lucide-react";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { demoHealthScoreHistory } from "@/lib/demo-data";

export default function Profile() {
  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3"
      >
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <Edit className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-heading font-bold text-xl text-foreground">Alex Johnson</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
            <MapPin className="h-3 w-3" /> New York, USA
          </p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Age</p>
            <p className="font-semibold text-foreground">28</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Height</p>
            <p className="font-semibold text-foreground">178 cm</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p className="font-semibold text-foreground">75 kg</p>
          </div>
        </div>
      </motion.div>

      {/* Goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Target className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Fitness Goal</p>
          <p className="font-semibold text-foreground">Muscle Gain</p>
        </div>
      </motion.div>

      {/* Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3"
      >
        <HealthScoreGauge score={85} />
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Rank #6 · Top 8%</span>
        </div>
      </motion.div>

      {/* Score History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-4"
      >
        <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" /> Score History
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={demoHealthScoreHistory}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} hide />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2.5}
              dot={{ fill: "hsl(160, 84%, 39%)", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Placeholder sections for Phase 2 */}
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">🚀 Talent Showcase & Portfolio coming in Phase 2</p>
      </div>
    </div>
  );
}
