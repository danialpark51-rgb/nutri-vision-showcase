import { motion } from "framer-motion";
import { Camera, TrendingUp, Trophy, Flame, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import MacroBar from "@/components/MacroBar";
import { demoMeals, demoGoals, demoHealthScoreHistory } from "@/lib/demo-data";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const totals = demoMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const pieData = [
    { name: "Protein", value: totals.protein * 4, color: "hsl(160, 84%, 39%)" },
    { name: "Carbs", value: totals.carbs * 4, color: "hsl(210, 80%, 55%)" },
    { name: "Fat", value: totals.fat * 9, color: "hsl(35, 90%, 55%)" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pb-24 pt-4 space-y-4"
    >
      {/* Greeting */}
      <motion.div variants={item}>
        <p className="text-muted-foreground text-sm">Good morning 👋</p>
        <h2 className="font-heading font-bold text-2xl text-foreground">Your Dashboard</h2>
      </motion.div>

      {/* Quick Scan CTA */}
      <motion.button
        variants={item}
        onClick={() => navigate("/analyze")}
        className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 group hover:glow-primary transition-shadow"
      >
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Camera className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-left flex-1">
          <p className="font-heading font-semibold text-foreground">Scan Your Food</p>
          <p className="text-xs text-muted-foreground">Take a photo and get instant AI nutrition analysis</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center">
          <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">{totals.calories}</p>
          <p className="text-xs text-muted-foreground">/ {demoGoals.calories} kcal</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-heading font-bold text-foreground">7</p>
          <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
        </div>
      </motion.div>

      {/* Health Score + Pie */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
          <HealthScoreGauge score={85} />
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-2 mt-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Macros Progress */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Today's Macros
        </h3>
        <MacroBar label="Calories" current={totals.calories} goal={demoGoals.calories} color="hsl(160, 84%, 39%)" unit="kcal" />
        <MacroBar label="Protein" current={totals.protein} goal={demoGoals.protein} color="hsl(210, 80%, 55%)" />
        <MacroBar label="Carbs" current={totals.carbs} goal={demoGoals.carbs} color="hsl(35, 90%, 55%)" />
        <MacroBar label="Fat" current={totals.fat} goal={demoGoals.fat} color="hsl(0, 70%, 55%)" />
      </motion.div>

      {/* Rank Preview */}
      <motion.button
        variants={item}
        onClick={() => navigate("/leaderboard")}
        className="w-full glass-card rounded-2xl p-4 flex items-center gap-4 group"
      >
        <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Trophy className="h-6 w-6 text-accent-foreground" />
        </div>
        <div className="text-left flex-1">
          <p className="font-heading font-semibold text-foreground">Rank #6 · Top 8%</p>
          <p className="text-xs text-muted-foreground">View global leaderboard</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>
    </motion.div>
  );
}
