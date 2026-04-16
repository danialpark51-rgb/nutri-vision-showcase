import { useState, useEffect } from "react";
import { Globe, MapPin, Flag, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ProfileOption {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  health_score: number | null;
  country: string | null;
  state: string | null;
}

export default function CreateChallengeSheet({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"world" | "country" | "state">("world");
  const [deadline, setDeadline] = useState("");
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<ProfileOption | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !search.trim()) { setProfiles([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, health_score, country, state")
        .neq("user_id", user?.id || "")
        .ilike("display_name", `%${search}%`)
        .limit(10);
      setProfiles(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, user]);

  const handleCreate = async () => {
    if (!user || !selectedOpponent || !title.trim()) {
      toast({ title: "Missing info", description: "Add a title and select an opponent", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("challenges").insert({
      challenger_id: user.id,
      opponent_id: selectedOpponent.user_id,
      title: title.trim(),
      description: description.trim() || null,
      scope,
      deadline: deadline || null,
    });
    setCreating(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Challenge Sent! 🔥", description: `Waiting for ${selectedOpponent.display_name || "opponent"} to accept` });
    setTitle(""); setDescription(""); setSearch(""); setSelectedOpponent(null); setDeadline("");
    onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl p-4 pb-8 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
        <div className="flex justify-between items-center">
          <h3 className="font-heading font-bold text-lg text-foreground">New Challenge</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Challenge title (e.g. 30-Day Push-up Challenge)"
            className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none"
            maxLength={100}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none resize-none"
            maxLength={500}
          />

          {/* Scope */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Scope</label>
            <div className="flex gap-2">
              {([
                { key: "world", icon: Globe, label: "World" },
                { key: "country", icon: Flag, label: "Country" },
                { key: "state", icon: MapPin, label: "State" },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScope(s.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scope === s.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none"
            />
          </div>

          {/* Opponent Search */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Invite Opponent</label>
            {selectedOpponent ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                    {selectedOpponent.avatar_url ? (
                      <img src={selectedOpponent.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (selectedOpponent.display_name || "?")[0]
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedOpponent.display_name}</p>
                    <p className="text-[10px] text-muted-foreground">Score: {selectedOpponent.health_score || 0}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOpponent(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none"
                  />
                </div>
                {profiles.length > 0 && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {profiles.map((p) => (
                      <button
                        key={p.user_id}
                        onClick={() => { setSelectedOpponent(p); setSearch(""); setProfiles([]); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary text-left"
                      >
                        <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold overflow-hidden">
                          {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : (p.display_name || "?")[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.display_name || "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground">{p.country} {p.state ? `· ${p.state}` : ""} · Score: {p.health_score || 0}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || !selectedOpponent}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {creating ? "Sending..." : "Send Challenge Invite"}
        </button>
      </div>
    </div>
  );
}
