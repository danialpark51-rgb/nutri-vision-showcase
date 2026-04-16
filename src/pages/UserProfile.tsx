import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, MapPin, Briefcase, Link, ArrowLeft, Video, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HealthScoreGauge from "@/components/HealthScoreGauge";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  video_url: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  location: string | null;
  state: string | null;
  country: string | null;
  fitness_goal: string | null;
  job_title: string | null;
  job_description: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  linkedin_url: string | null;
  available_for_hire: boolean | null;
  health_score: number | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId!)
      .single();
    if (data) setProfile(data as Profile);

    const { data: items } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });
    if (items) setPortfolio(items as PortfolioItem[]);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!profile) return <div className="text-center py-20 text-muted-foreground">Profile not found</div>;

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
        )}
        <h2 className="font-heading font-bold text-xl text-foreground">{profile.display_name || "User"}</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {profile.location || "Unknown"}{profile.state ? `, ${profile.state}` : ""} {profile.country}
        </p>
        <div className="flex gap-4 text-center">
          {profile.age && <div><p className="text-xs text-muted-foreground">Age</p><p className="font-semibold text-foreground">{profile.age}</p></div>}
          {profile.height_cm && <><div className="w-px bg-border" /><div><p className="text-xs text-muted-foreground">Height</p><p className="font-semibold text-foreground">{profile.height_cm} cm</p></div></>}
          {profile.weight_kg && <><div className="w-px bg-border" /><div><p className="text-xs text-muted-foreground">Weight</p><p className="font-semibold text-foreground">{profile.weight_kg} kg</p></div></>}
        </div>
      </motion.div>

      {/* Bio */}
      {profile.bio && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">About</h3>
          <p className="text-sm text-foreground">{profile.bio}</p>
        </motion.div>
      )}

      {/* Video */}
      {profile.video_url && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Video className="h-3 w-3" /> Video Introduction</h3>
          <video src={profile.video_url} controls className="w-full rounded-lg max-h-48" />
        </motion.div>
      )}

      {/* Health Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3">
        <HealthScoreGauge score={profile.health_score || 0} />
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Health Score</span>
        </div>
      </motion.div>

      {/* Job Info */}
      {(profile.job_title || profile.available_for_hire) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Career</h3>
          {profile.job_title && <p className="font-semibold text-foreground">{profile.job_title}</p>}
          {profile.job_description && <p className="text-sm text-muted-foreground">{profile.job_description}</p>}
          {profile.hourly_rate && <p className="text-sm text-primary font-medium">${profile.hourly_rate}/hr</p>}
          {profile.available_for_hire && <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">✅ Available for hire</span>}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1"><Link className="h-3 w-3" /> LinkedIn</a>
          )}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {profile.skills.map((s, i) => <span key={i} className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">{s}</span>)}
            </div>
          )}
        </motion.div>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-4 space-y-3">
          <h3 className="font-heading font-semibold text-sm text-foreground">🚀 Portfolio</h3>
          <div className="space-y-2">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-secondary rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
