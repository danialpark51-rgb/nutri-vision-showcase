import { motion } from "framer-motion";

export default function HealthScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(160, 84%, 39%)";
    if (s >= 60) return "hsl(45, 90%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        <circle cx="64" cy="64" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <motion.circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-heading font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">Health Score</span>
      </div>
    </div>
  );
}
