import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import AnalyzeFood from "@/pages/AnalyzeFood";
import DailyTracker from "@/pages/DailyTracker";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="max-w-lg mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzeFood />} />
            <Route path="/track" element={<DailyTracker />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
