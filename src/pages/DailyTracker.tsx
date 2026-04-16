import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Utensils } from "lucide-react";
import MacroBar from "@/components/MacroBar";
import { demoMeals, demoGoals } from "@/lib/demo-data";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

export default function DailyTracker() {
  const [meals, setMeals] = useState<Meal[]>(demoMeals);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const removeMeal = (id: string) => setMeals((m) => m.filter((x) => x.id !== id));

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-2xl text-foreground">Daily Tracker</h2>
        <p className="text-sm text-muted-foreground">Track and manage today's nutrition</p>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 space-y-3"
      >
        <h3 className="font-heading font-semibold text-sm text-foreground">Daily Progress</h3>
        <MacroBar label="Calories" current={totals.calories} goal={demoGoals.calories} color="hsl(160, 84%, 39%)" unit="kcal" />
        <MacroBar label="Protein" current={totals.protein} goal={demoGoals.protein} color="hsl(210, 80%, 55%)" />
        <MacroBar label="Carbs" current={totals.carbs} goal={demoGoals.carbs} color="hsl(35, 90%, 55%)" />
        <MacroBar label="Fat" current={totals.fat} goal={demoGoals.fat} color="hsl(0, 70%, 55%)" />
      </motion.div>

      {/* Meals List */}
      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" /> Today's Meals
        </h3>
        {meals.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No meals logged yet. Scan food to get started!</p>
          </div>
        ) : (
          meals.map((meal, i) => (
            <motion.div
              key={meal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-3 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Utensils className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{meal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {meal.calories} kcal · {meal.time}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>P{meal.protein}</span>
                <span>C{meal.carbs}</span>
                <span>F{meal.fat}</span>
              </div>
              <button
                onClick={() => removeMeal(meal.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Manual Add (placeholder) */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground font-medium text-sm hover:border-primary hover:text-primary transition-colors">
        <Plus className="h-4 w-4" /> Add Meal Manually
      </button>
    </div>
  );
}
