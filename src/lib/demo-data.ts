// Demo data for Phase 1 (before backend wiring)
export const demoMeals = [
  { id: "1", name: "Grilled Chicken Salad", calories: 380, protein: 35, carbs: 18, fat: 16, time: "8:30 AM" },
  { id: "2", name: "Oatmeal with Berries", calories: 290, protein: 8, carbs: 52, fat: 6, time: "12:15 PM" },
  { id: "3", name: "Salmon & Rice Bowl", calories: 520, protein: 38, carbs: 48, fat: 18, time: "6:45 PM" },
];

export const demoGoals = {
  calories: 2200,
  protein: 150,
  carbs: 250,
  fat: 70,
};

export const demoHealthScoreHistory = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 78 },
  { day: "Wed", score: 65 },
  { day: "Thu", score: 82 },
  { day: "Fri", score: 88 },
  { day: "Sat", score: 74 },
  { day: "Sun", score: 85 },
];

export const demoLeaderboard = [
  { rank: 1, name: "FitnessPro", score: 96, country: "🇺🇸", percentile: "Top 1%" },
  { rank: 2, name: "HealthGuru", score: 94, country: "🇬🇧", percentile: "Top 1%" },
  { rank: 3, name: "NutriKing", score: 92, country: "🇨🇦", percentile: "Top 2%" },
  { rank: 4, name: "WellnessJo", score: 89, country: "🇦🇺", percentile: "Top 5%" },
  { rank: 5, name: "CleanEater", score: 87, country: "🇩🇪", percentile: "Top 5%" },
  { rank: 6, name: "You", score: 85, country: "🇺🇸", percentile: "Top 8%", isUser: true },
  { rank: 7, name: "MealMaster", score: 83, country: "🇫🇷", percentile: "Top 10%" },
  { rank: 8, name: "ProteinPal", score: 80, country: "🇯🇵", percentile: "Top 12%" },
];
