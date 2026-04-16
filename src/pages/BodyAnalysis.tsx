import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Sparkles, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BodyAnalysis {
  body_fat_percentage: { estimate: number; range: [number, number]; category: string };
  bmi_estimate: { estimate: number; category: string };
  muscle_mass: string;
  body_type: string;
  fitness_level: string;
  recommendations: string[];
  calories_maintenance: number;
  macros_suggestion: { protein_g: number; carbs_g: number; fat_g: number };
  disclaimer: string;
}

const categoryColor = (cat: string) => {
  const c = cat.toLowerCase();
  if (["athletes", "fitness", "normal", "high", "very high", "advanced", "athlete"].includes(c))
    return "text-primary";
  if (["average", "moderate", "intermediate", "overweight"].includes(c))
    return "text-yellow-500";
  return "text-red-400";
};

export default function BodyAnalysisPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<BodyAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setResults(null);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const base64 = image.split(",")[1];
      const { data, error } = await supabase.functions.invoke("analyze-body", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data as BodyAnalysis);
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setImage(null); setResults(null); };

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Body Analysis</h2>
        <p className="text-sm text-muted-foreground">Upload a body photo for AI-powered composition estimates</p>
      </div>

      {!image ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 border-2 border-dashed border-border"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center">
            <Camera className="h-8 w-8 text-accent-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">Upload a full-body photo for analysis</p>
          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm">
              <Upload className="h-4 w-4" /> Upload Photo
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file"; input.accept = "image/*"; input.capture = "environment";
                input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); };
                input.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm"
            >
              <Camera className="h-4 w-4" /> Camera
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden">
            <img src={image} alt="Body" className="w-full h-56 object-cover" />
          </div>
          {!results && (
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm">
                <RotateCcw className="h-4 w-4" /> Change Photo
              </button>
              <button onClick={analyze} disabled={analyzing} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60">
                {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4" /> Analyze</>}
              </button>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Body Fat */}
            <div className="glass-card rounded-xl p-4 space-y-2">
              <h3 className="font-heading font-semibold text-foreground">Body Fat Percentage</h3>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{results.body_fat_percentage.estimate}%</span>
                <span className="text-sm text-muted-foreground mb-1">({results.body_fat_percentage.range[0]}–{results.body_fat_percentage.range[1]}%)</span>
              </div>
              <span className={`text-sm font-medium ${categoryColor(results.body_fat_percentage.category)}`}>
                {results.body_fat_percentage.category}
              </span>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(results.body_fat_percentage.estimate / 40 * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
            </div>

            {/* BMI */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="font-heading font-semibold text-foreground mb-1">BMI Estimate</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-foreground">{results.bmi_estimate.estimate}</span>
                <span className={`text-sm font-medium mb-1 ${categoryColor(results.bmi_estimate.category)}`}>
                  {results.bmi_estimate.category}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Muscle</p>
                <p className={`font-semibold text-sm capitalize ${categoryColor(results.muscle_mass)}`}>{results.muscle_mass}</p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Body Type</p>
                <p className="font-semibold text-sm text-foreground capitalize">{results.body_type}</p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fitness</p>
                <p className={`font-semibold text-sm capitalize ${categoryColor(results.fitness_level)}`}>{results.fitness_level}</p>
              </div>
            </div>

            {/* Calories & Macros */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="font-heading font-semibold text-foreground">Daily Nutrition Estimate</h3>
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">{results.calories_maintenance}</span>
                <span className="text-sm text-muted-foreground ml-1">kcal/day</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Protein", val: results.macros_suggestion.protein_g, color: "bg-blue-500" },
                  { label: "Carbs", val: results.macros_suggestion.carbs_g, color: "bg-amber-500" },
                  { label: "Fat", val: results.macros_suggestion.fat_g, color: "bg-red-400" },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className={`h-1.5 rounded-full ${m.color} mb-1`} />
                    <p className="text-lg font-bold text-foreground">{m.val}g</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass-card rounded-xl p-4 space-y-2">
              <h3 className="font-heading font-semibold text-foreground">Recommendations</h3>
              <ul className="space-y-1.5">
                {results.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-600 dark:text-yellow-400">{results.disclaimer}</p>
            </div>

            <button onClick={reset} className="w-full px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm">
              <RotateCcw className="h-4 w-4 inline mr-1" /> New Analysis
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
