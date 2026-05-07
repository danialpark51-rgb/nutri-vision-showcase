import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup";

// Map username -> synthetic email so Supabase auth (which requires email) works
// while users only ever type a username + password.
const USERNAME_DOMAIN = "nutrivision.local";
const toEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")}@${USERNAME_DOMAIN}`;

export default function Auth() {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isSignUp = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUser.length < 3) {
      toast({ title: "Username too short", description: "Use at least 3 letters or numbers.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Please enter your name");
        const ageNum = parseInt(age, 10);
        if (!ageNum || ageNum < 5 || ageNum > 120) throw new Error("Please enter a valid age");

        const { data, error } = await supabase.auth.signUp({
          email: toEmail(cleanUser),
          password,
          options: {
            data: { full_name: name.trim(), username: cleanUser, age: ageNum, gender },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Update profile with extra fields (handle_new_user trigger creates the row)
        if (data.user) {
          await supabase
            .from("profiles")
            .update({
              display_name: name.trim(),
              username: cleanUser,
              age: ageNum,
              gender,
            })
            .eq("user_id", data.user.id);
        }

        // Auto-confirm is on, so try sign-in immediately
        if (!data.session) {
          await supabase.auth.signInWithPassword({ email: toEmail(cleanUser), password });
        }

        toast({ title: "Account created", description: `Welcome, ${name.trim()}!` });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: toEmail(cleanUser),
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            throw new Error("Wrong username or password.");
          }
          throw error;
        }
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center glow-primary mx-auto mb-4">
            <span className="text-primary-foreground font-heading font-bold text-xl">N</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-foreground">NutriVision AI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Create your account" : "Welcome back — sign in"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-secondary">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              isSignUp ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              !isSignUp ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={5}
                  max={120}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                      gender === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={3}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder={isSignUp ? "Create password (min 6 chars)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-primary font-medium">
                Sign In
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button onClick={() => setMode("signup")} className="text-primary font-medium">
                Create an account
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
