import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";

export default function TopBar({ title }: { title?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
          <span className="text-primary-foreground font-heading font-bold text-sm">N</span>
        </div>
        <h1 className="font-heading font-bold text-lg text-foreground">
          {title || "NutriVision"}
        </h1>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-secondary-foreground" />
          ) : (
            <Sun className="h-4 w-4 text-secondary-foreground" />
          )}
        </motion.div>
      </button>
    </header>
  );
}
