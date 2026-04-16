import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Sparkles, Plus, Check } from "lucide-react";
import MacroBar from "@/components/MacroBar";
import { toast } from "@/hooks/use-toast";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function AnalyzeFood() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<FoodItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setResults(null);
  };

  const analyze = async () => {
    setAnalyzing(true);
    // Simulate AI analysis for now (will wire to edge function)
    await new Promise((r) => setTimeout(r, 2000));
    setResults([
      { name: "Grilled Chicken Breast", calories: 280, protein: 42, carbs: 0, fat: 12 },
      { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2 },
      { name: "Steamed Broccoli", calories: 55, protein: 4, carbs: 11, fat: 1 },
    ]);
    setAnalyzing(false);
  };

  const logMeal = () => {
    toast({ title: "Meal Logged ✅", description: "Added to today's meals." });
    setImage(null);
    setResults(null);
  };

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Analyze Food</h2>
        <p className="text-sm text-muted-foreground">Snap a photo and let AI do the rest</p>
      </div>

      {/* Upload Area */}
      {!image ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 border-2 border-dashed border-border"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center">
            <Camera className="h-8 w-8 text-accent-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Drag & drop a food photo or tap below
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Upload className="h-4 w-4" /> Upload Photo
            </button>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) handleFile(f);
                };
                input.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm"
            >
              <Camera className="h-4 w-4" /> Camera
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-2xl overflow-hidden">
            <img src={image} alt="Food" className="w-full h-56 object-cover" />
          </div>

          {!results && (
            <button
              onClick={analyze}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 transition-opacity"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze with AI
                </>
              )}
            </button>
          )}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="font-heading font-semibold text-foreground">Detected Foods</h3>
            {results.map((food, i) => (
              <motion.div
                key={food.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-4 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{food.name}</span>
                  <span className="text-sm font-semibold text-primary">{food.calories} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MacroBar label="Protein" current={food.protein} goal={food.protein} color="hsl(210, 80%, 55%)" />
                  <MacroBar label="Carbs" current={food.carbs} goal={food.carbs} color="hsl(35, 90%, 55%)" />
                  <MacroBar label="Fat" current={food.fat} goal={food.fat} color="hsl(0, 70%, 55%)" />
                </div>
              </motion.div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setImage(null); setResults(null); }}
                className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm"
              >
                <Plus className="h-4 w-4 inline mr-1" /> New Scan
              </button>
              <button
                onClick={logMeal}
                className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
              >
                <Check className="h-4 w-4 inline mr-1" /> Log Meal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
