import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Video, Upload, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChallengeVideo {
  id: string;
  user_id: string;
  video_url: string;
  title: string | null;
  created_at: string;
}

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"chat" | "videos">(searchParams.get("tab") === "videos" ? "videos" : "chat");
  const [challenge, setChallenge] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [videos, setVideos] = useState<ChallengeVideo[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchChallenge();
    fetchMessages();
    fetchVideos();

    // Realtime subscription for chat
    const channel = supabase
      .channel(`challenge-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "challenge_messages", filter: `challenge_id=eq.${id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Message]); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchChallenge = async () => {
    const { data } = await supabase.from("challenges").select("*").eq("id", id!).single();
    if (data) {
      setChallenge(data);
      const userIds = [data.challenger_id, data.opponent_id];
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      setProfiles(new Map((profs || []).map((p) => [p.user_id, p])));
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase.from("challenge_messages").select("*").eq("challenge_id", id!).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const fetchVideos = async () => {
    const { data } = await supabase.from("challenge_videos").select("*").eq("challenge_id", id!).order("created_at", { ascending: false });
    setVideos(data || []);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !id) return;
    setSending(true);
    const { error } = await supabase.from("challenge_messages").insert({
      challenge_id: id,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    setSending(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewMsg("");
  };

  const uploadVideo = async (file: File) => {
    if (!user || !id) return;
    if (!file.type.startsWith("video/")) { toast({ title: "Please select a video file", variant: "destructive" }); return; }
    if (file.size > 100 * 1024 * 1024) { toast({ title: "Video must be under 100MB", variant: "destructive" }); return; }

    setUploading(true);
    const path = `${user.id}/${id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("challenge-videos").upload(path, file);
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("challenge-videos").getPublicUrl(path);

    const { error } = await supabase.from("challenge_videos").insert({
      challenge_id: id,
      user_id: user.id,
      video_url: urlData.publicUrl,
      title: file.name,
    });
    setUploading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Video uploaded! 🎬" });
    fetchVideos();
  };

  const isParticipant = user && challenge && (challenge.challenger_id === user.id || challenge.opponent_id === user.id);
  const opponent = challenge && user ? profiles.get(challenge.challenger_id === user.id ? challenge.opponent_id : challenge.challenger_id) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border glass-card">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/challenges")} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{challenge?.title || "Challenge"}</h3>
            {opponent && <p className="text-xs text-muted-foreground">vs {opponent.display_name || "Unknown"}</p>}
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {(["chat", "videos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {t === "chat" ? "💬 Chat" : "🎬 Videos"}
            </button>
          ))}
        </div>
      </div>

      {tab === "chat" ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const sender = profiles.get(msg.sender_id);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                    isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-secondary-foreground rounded-bl-sm"
                  }`}>
                    {!isMe && <p className="text-[10px] font-medium opacity-70 mb-0.5">{sender?.display_name || "Unknown"}</p>}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[9px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {isParticipant && (
            <div className="px-4 py-3 border-t border-border glass-card">
              <div className="flex gap-2">
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground outline-none"
                  maxLength={1000}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMsg.trim()}
                  className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Videos Tab */
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {isParticipant && (
            <div>
              <button
                onClick={() => videoRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload Challenge Video</>}
              </button>
              <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(f); }} />
            </div>
          )}

          {videos.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <Video className="h-10 w-10 mx-auto mb-2 opacity-50" />
              No videos uploaded yet
            </div>
          ) : (
            videos.map((v) => {
              const uploader = profiles.get(v.user_id);
              return (
                <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
                  <video src={v.video_url} controls className="w-full aspect-video bg-black" />
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        {uploader?.avatar_url ? <img src={uploader.avatar_url} alt="" className="h-full w-full object-cover" /> : (uploader?.display_name || "?")[0]}
                      </div>
                      <span className="text-sm font-medium text-foreground">{uploader?.display_name || "Unknown"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
