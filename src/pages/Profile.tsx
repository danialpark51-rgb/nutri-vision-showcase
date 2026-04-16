import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Target, MapPin, Edit, Award, TrendingUp, Camera, Save, Briefcase, Link, Plus, Trash2, LogOut, Video } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HealthScoreGauge from "@/components/HealthScoreGauge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { demoHealthScoreHistory } from "@/lib/demo-data";

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

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [newSkill, setNewSkill] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // New portfolio item state
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({ title: "", description: "", category: "general" });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setProfile(data as Profile);
      setEditData(data as Profile);
    }
    const { data: items } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (items) setPortfolio(items as PortfolioItem[]);
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return null; }
    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "avatar");
    if (url) setEditData((d) => ({ ...d, avatar_url: url }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "video");
    if (url) setEditData((d) => ({ ...d, video_url: url }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: editData.display_name,
        bio: editData.bio,
        avatar_url: editData.avatar_url,
        video_url: editData.video_url,
        age: editData.age,
        height_cm: editData.height_cm,
        weight_kg: editData.weight_kg,
        location: editData.location,
        state: editData.state,
        country: editData.country,
        fitness_goal: editData.fitness_goal,
        job_title: editData.job_title,
        job_description: editData.job_description,
        hourly_rate: editData.hourly_rate,
        skills: editData.skills,
        linkedin_url: editData.linkedin_url,
        available_for_hire: editData.available_for_hire,
      })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile(editData as Profile);
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setEditData((d) => ({ ...d, skills: [...(d.skills || []), newSkill.trim()] }));
    setNewSkill("");
  };

  const removeSkill = (idx: number) => {
    setEditData((d) => ({ ...d, skills: (d.skills || []).filter((_, i) => i !== idx) }));
  };

  const addPortfolioItem = async () => {
    if (!user || !newPortfolio.title.trim()) return;
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({ user_id: user.id, title: newPortfolio.title, description: newPortfolio.description, category: newPortfolio.category })
      .select()
      .single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setPortfolio((p) => [data as PortfolioItem, ...p]);
    setNewPortfolio({ title: "", description: "", category: "general" });
    setShowAddPortfolio(false);
  };

  const deletePortfolioItem = async (id: string) => {
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (!error) setPortfolio((p) => p.filter((i) => i.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  const displayProfile = editing ? editData : profile;

  return (
    <div className="px-4 pb-24 pt-4 space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3">
        <div className="relative">
          {displayProfile?.avatar_url ? (
            <img src={displayProfile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>
          )}
          {editing && (
            <>
              <button onClick={() => avatarRef.current?.click()} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </>
          )}
          {!editing && (
            <button onClick={() => setEditing(true)} className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center">
              <Edit className="h-3.5 w-3.5 text-primary-foreground" />
            </button>
          )}
        </div>

        {editing ? (
          <input
            value={editData.display_name || ""}
            onChange={(e) => setEditData((d) => ({ ...d, display_name: e.target.value }))}
            className="text-center font-heading font-bold text-xl bg-secondary rounded-lg px-3 py-1 text-foreground"
            placeholder="Your name"
          />
        ) : (
          <h2 className="font-heading font-bold text-xl text-foreground">{profile?.display_name || "Your Name"}</h2>
        )}

        {editing ? (
          <div className="flex gap-2 w-full">
            <input value={editData.location || ""} onChange={(e) => setEditData((d) => ({ ...d, location: e.target.value }))} placeholder="City" className="flex-1 text-sm bg-secondary rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground" />
            <input value={editData.state || ""} onChange={(e) => setEditData((d) => ({ ...d, state: e.target.value }))} placeholder="State" className="w-20 text-sm bg-secondary rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground" />
            <input value={editData.country || ""} onChange={(e) => setEditData((d) => ({ ...d, country: e.target.value }))} placeholder="🇺🇸" className="w-14 text-sm bg-secondary rounded-lg px-2 py-1 text-center text-foreground placeholder:text-muted-foreground" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
            <MapPin className="h-3 w-3" /> {profile?.location || "Location"}{profile?.state ? `, ${profile.state}` : ""} {profile?.country}
          </p>
        )}

        {editing ? (
          <div className="flex gap-4 w-full">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Age</p>
              <input type="number" value={editData.age || ""} onChange={(e) => setEditData((d) => ({ ...d, age: Number(e.target.value) || null }))} className="w-full text-center font-semibold bg-secondary rounded-lg py-1 text-foreground" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Height (cm)</p>
              <input type="number" value={editData.height_cm || ""} onChange={(e) => setEditData((d) => ({ ...d, height_cm: Number(e.target.value) || null }))} className="w-full text-center font-semibold bg-secondary rounded-lg py-1 text-foreground" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Weight (kg)</p>
              <input type="number" value={editData.weight_kg || ""} onChange={(e) => setEditData((d) => ({ ...d, weight_kg: Number(e.target.value) || null }))} className="w-full text-center font-semibold bg-secondary rounded-lg py-1 text-foreground" />
            </div>
          </div>
        ) : (
          <div className="flex gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Age</p><p className="font-semibold text-foreground">{profile?.age || "—"}</p></div>
            <div className="w-px bg-border" />
            <div><p className="text-xs text-muted-foreground">Height</p><p className="font-semibold text-foreground">{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</p></div>
            <div className="w-px bg-border" />
            <div><p className="text-xs text-muted-foreground">Weight</p><p className="font-semibold text-foreground">{profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</p></div>
          </div>
        )}
      </motion.div>

      {/* Bio */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-2xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">About Me</h3>
        {editing ? (
          <textarea value={editData.bio || ""} onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))} placeholder="Tell people about yourself..." className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-foreground">{profile?.bio || "No bio yet"}</p>
        )}
      </motion.div>

      {/* Video Introduction */}
      {(editing || displayProfile?.video_url) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Video className="h-3 w-3" /> Video Introduction</h3>
          {displayProfile?.video_url && (
            <video src={displayProfile.video_url} controls className="w-full rounded-lg max-h-48" />
          )}
          {editing && (
            <>
              <button onClick={() => videoRef.current?.click()} className="mt-2 text-xs text-primary font-medium">Upload Video</button>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
            </>
          )}
        </motion.div>
      )}

      {/* Job / Career Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Part-Time Job & Career</h3>
        {editing ? (
          <>
            <input value={editData.job_title || ""} onChange={(e) => setEditData((d) => ({ ...d, job_title: e.target.value }))} placeholder="Job title (e.g., Personal Trainer)" className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            <textarea value={editData.job_description || ""} onChange={(e) => setEditData((d) => ({ ...d, job_description: e.target.value }))} placeholder="Describe what jobs you can do..." className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground min-h-[60px] resize-none" />
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">$/hr</span>
              <input type="number" value={editData.hourly_rate || ""} onChange={(e) => setEditData((d) => ({ ...d, hourly_rate: Number(e.target.value) || null }))} placeholder="Rate" className="w-24 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground" />
              <label className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                <input type="checkbox" checked={editData.available_for_hire || false} onChange={(e) => setEditData((d) => ({ ...d, available_for_hire: e.target.checked }))} className="accent-primary" />
                Available for hire
              </label>
            </div>
            <input value={editData.linkedin_url || ""} onChange={(e) => setEditData((d) => ({ ...d, linkedin_url: e.target.value }))} placeholder="LinkedIn URL" className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            {/* Skills */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Skills</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {(editData.skills || []).map((s, i) => (
                  <span key={i} className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {s} <button onClick={() => removeSkill(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add skill" className="flex-1 bg-secondary rounded-lg px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground" />
                <button onClick={addSkill} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Add</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {profile?.job_title && <p className="font-semibold text-foreground">{profile.job_title}</p>}
            {profile?.job_description && <p className="text-sm text-muted-foreground">{profile.job_description}</p>}
            {profile?.hourly_rate && <p className="text-sm text-primary font-medium">${profile.hourly_rate}/hr</p>}
            {profile?.available_for_hire && <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">✅ Available for hire</span>}
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1"><Link className="h-3 w-3" /> LinkedIn</a>
            )}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((s, i) => <span key={i} className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">{s}</span>)}
              </div>
            )}
            {!profile?.job_title && <p className="text-sm text-muted-foreground">No job info added yet</p>}
          </>
        )}
      </motion.div>

      {/* Fitness Goal */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
          <Target className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Fitness Goal</p>
          {editing ? (
            <select value={editData.fitness_goal || ""} onChange={(e) => setEditData((d) => ({ ...d, fitness_goal: e.target.value }))} className="bg-secondary rounded-lg px-2 py-1 text-sm font-semibold text-foreground">
              <option>General Health</option><option>Muscle Gain</option><option>Weight Loss</option><option>Endurance</option><option>Flexibility</option>
            </select>
          ) : (
            <p className="font-semibold text-foreground">{profile?.fitness_goal || "General Health"}</p>
          )}
        </div>
      </motion.div>

      {/* Health Score */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3">
        <HealthScoreGauge score={profile?.health_score || 0} />
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Health Score</span>
        </div>
      </motion.div>

      {/* Score History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" /> Score History
        </h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={demoHealthScoreHistory}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} hide />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
            <Line type="monotone" dataKey="score" stroke="hsl(160, 84%, 39%)" strokeWidth={2.5} dot={{ fill: "hsl(160, 84%, 39%)", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Portfolio / Talent Showcase */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-foreground">🚀 Talent Showcase & Portfolio</h3>
          <button onClick={() => setShowAddPortfolio(!showAddPortfolio)} className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        {showAddPortfolio && (
          <div className="space-y-2 p-3 bg-secondary rounded-xl">
            <input value={newPortfolio.title} onChange={(e) => setNewPortfolio((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground" />
            <textarea value={newPortfolio.description} onChange={(e) => setNewPortfolio((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full bg-background rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground min-h-[40px] resize-none" />
            <div className="flex gap-2">
              <select value={newPortfolio.category} onChange={(e) => setNewPortfolio((p) => ({ ...p, category: e.target.value }))} className="bg-background rounded-lg px-2 py-1 text-sm text-foreground">
                <option value="general">General</option><option value="fitness">Fitness</option><option value="nutrition">Nutrition</option><option value="coaching">Coaching</option>
              </select>
              <button onClick={addPortfolioItem} className="ml-auto px-4 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Add</button>
            </div>
          </div>
        )}

        {portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No portfolio items yet. Add your first showcase!</p>
        ) : (
          <div className="space-y-2">
            {portfolio.map((item) => (
              <div key={item.id} className="bg-secondary rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full mt-1 inline-block">{item.category}</span>
                </div>
                <button onClick={() => deletePortfolioItem(item.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Save / Cancel / Sign Out */}
      <div className="flex gap-2">
        {editing ? (
          <>
            <button onClick={() => { setEditing(false); setEditData(profile || {}); }} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
          </>
        ) : (
          <button onClick={signOut} className="w-full py-3 rounded-xl bg-secondary text-destructive font-semibold text-sm flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
