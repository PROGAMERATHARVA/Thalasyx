import { useEffect, useState } from "react";
import { getWallet, login, signup } from "@/lib/server-fns";
import { clearSession, ensureDeviceKey, getSession, setSession } from "@/lib/wallet";
import { Coins, LogOut, X } from "lucide-react";
import { toast } from "sonner";

export default function AccountModal({ onClose, onChanged }) {
  const session = getSession();
  const [mode, setMode] = useState("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [coins, setCoins] = useState(null);

  useEffect(() => {
    if (!session) return;
    getWallet({ data: { owner_key: `acct:${session.account_id}`, token: session.token } })
      .then((w) => setCoins(w.coins))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signup({ data: { username: username.trim(), password, device_key: ensureDeviceKey() } });
        setSession({ account_id: res.account_id, token: res.token, username: res.username });
        toast.success(`Welcome, ${res.username}! Your coins moved with you.`);
      } else {
        const res = await login({ data: { username: username.trim(), password } });
        setSession({ account_id: res.account_id, token: res.token, username: res.username });
        toast.success(`Welcome back, ${res.username}!`);
      }
      onChanged();
      onClose();
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearSession();
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="panel p-6 max-w-sm w-full glow-cyan animate-pop" onClick={(e) => e.stopPropagation()}>
        {session ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-white text-lg">My Account</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 text-center">
              <div className="text-3xl font-heading font-bold gradient-text">{session.username}</div>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-neon-gold font-bold">
                <Coins className="w-5 h-5" /> {coins ?? "…"} coins
              </div>
            </div>
            <button onClick={logout} className="mt-4 w-full btn-glow px-4 py-3 text-white bg-white/10 hover:bg-white/20 border border-white/10">
              <LogOut className="w-4 h-4" /> Log out
            </button>
            <p className="text-xs text-white/40 mt-3 text-center">Log out switches to this device's own wallet.</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-white text-lg">{mode === "signup" ? "Create Account" : "Log In"}</h3>
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setMode("signup"); setError(""); }} className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "signup" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "bg-white/5 text-white/60"}`}>Sign Up</button>
              <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 px-3 py-2 rounded-xl text-sm ${mode === "login" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "bg-white/5 text-white/60"}`}>Log In</button>
            </div>
            <label className="block text-xs text-white/50 mb-1 uppercase tracking-wider">Username</label>
            <input autoFocus value={username} onChange={(e) => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20)); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="quiz_master" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50" />
            <label className="block text-xs text-white/50 mb-1 mt-3 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50" />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button onClick={submit} disabled={busy || username.trim().length < 3 || password.length < 4} className="mt-4 w-full btn-glow px-4 py-3 text-white bg-gradient-to-r from-neon-cyan to-blue-500 glow-cyan">
              {busy ? "…" : mode === "signup" ? "Create Account" : "Log In"}
            </button>
            <p className="text-xs text-white/40 mt-3 text-center">
              {mode === "signup"
                ? "No email needed. Your coins and unlocked avatars from this device move into your account."
                : "Your quizzes, coins and avatars follow you to any device."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}