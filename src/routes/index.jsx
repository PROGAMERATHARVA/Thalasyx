import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Sparkles, Gamepad2, Crown, Zap, ArrowRight, Copy, Check, Coins, LayoutGrid } from "lucide-react";
import { AVATARS, COLLECTIONS } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BREATH LIVE QUIZ — Play & Create Live Multiplayer Quizzes" },
      { name: "description", content: "A vibrant real-time multiplayer quiz platform. Create quizzes, collect 100 original avatars, and play live with your class." },
    ],
  }),
  component: HomeComponent,
});

function BLogo({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="drop-shadow-[0_0_30px_rgba(0,245,255,0.5)]">
      <defs>
        <linearGradient id="bgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="50%" stopColor="#ff007f" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
        <linearGradient id="bfill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1030" />
          <stop offset="100%" stopColor="#0b0b1a" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bfill)" stroke="url(#bgrad)" strokeWidth="4" />
      <path d="M44 32 h28 a16 16 0 0 1 0 32 h-28 z M44 64 h30 a17 17 0 0 1 0 34 h-30 z"
        fill="url(#bgrad)" stroke="#0b0b1a" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="86" cy="34" r="4" fill="#fff" />
      <circle cx="88" cy="70" r="4" fill="#fff" />
    </svg>
  );
}

function HomeComponent() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const joinGame = () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    navigate({ to: "/join/$code", params: { code: c } });
  };

  const previewAvatars = [AVATARS[0], AVATARS[11], AVATARS[24], AVATARS[37], AVATARS[50], AVATARS[63], AVATARS[74], AVATARS[87]];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* floating decorative avatars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {previewAvatars.map((a, i) => (
          <div
            key={a.id}
            className="absolute opacity-20 animate-float"
            style={{
              left: `${[8, 22, 78, 88, 15, 70, 40, 85][i]}%`,
              top: `${[18, 70, 25, 65, 45, 12, 80, 40][i]}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            <AvatarSvg avatar={a} size={[70, 56, 64, 80, 60, 72, 58, 66][i]} />
          </div>
        ))}
      </div>

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-10 py-5">
        <div className="flex items-center gap-3">
          <BLogo size={44} />
          <span className="font-heading font-bold text-lg tracking-tight gradient-text">BREATH LIVE QUIZ</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/shop" className="btn-glow px-4 sm:px-5 py-3 text-sm sm:text-base text-white bg-white/10 hover:bg-white/20 border border-white/10"><Coins className="w-4 h-4 text-neon-gold" /> Shop</Link>
          <Link to="/my-avatars" className="btn-glow px-4 sm:px-5 py-3 text-sm sm:text-base text-white bg-white/10 hover:bg-white/20 border border-white/10"><LayoutGrid className="w-4 h-4 text-neon-cyan" /> My Avatars</Link>
          <button
            onClick={() => navigate({ to: "/create" })}
            className="btn-glow px-5 sm:px-6 py-3 text-sm sm:text-base text-white bg-gradient-to-r from-neon-pink to-neon-violet glow-pink hover:scale-105"
          >
            <Sparkles className="w-4 h-4" /> Make a Quiz
          </button>
        </div>
      </header>

      {/* hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-6 sm:pt-14 pb-20 text-center">
        <div className="flex justify-center mb-6 animate-pop">
          <BLogo size={150} />
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight">
          <span className="gradient-text">BREATH</span>
          <span className="block text-white text-glow-cyan">LIVE QUIZ</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl mx-auto">
          Create dazzling live quizzes, collect 100 original avatars, and play in real time with your whole class. Inspired by the fun of Quizizz & Blooket — with its own spark.
        </p>

        {/* join card */}
        <div className="mt-9 mx-auto max-w-md panel p-5 sm:p-6 glow-cyan animate-rise">
          <label className="block text-left text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Game Code</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && joinGame()}
              placeholder="ABC123"
              className="flex-1 bg-background/60 border border-white/15 rounded-2xl px-4 py-3 text-center text-2xl font-heading font-bold tracking-[0.3em] text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-neon-cyan/60"
            />
            <button
              onClick={joinGame}
              disabled={code.trim().length < 4}
              className="btn-glow px-5 py-3 text-white bg-gradient-to-r from-neon-cyan to-blue-500 hover:scale-105 glow-cyan"
            >
              <Gamepad2 className="w-5 h-5" /> Join
            </button>
          </div>
          <p className="mt-3 text-xs text-white/40">Enter the 6-character code from your host, or use a shared link.</p>
        </div>
        <div className="mt-4">
          <Link to="/quizzes" className="text-sm text-neon-cyan hover:text-white inline-flex items-center gap-1">Browse published quizzes <ArrowRight className="w-4 h-4" /></Link>
        </div>

        {/* feature pills */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Zap, title: "Real-time Multiplayer", desc: "Live sync between host & students", color: "text-neon-cyan" },
            { icon: Crown, title: "100 Original Avatars", desc: "10 collectible themed collections", color: "text-neon-gold" },
            { icon: Sparkles, title: "Custom Quiz Builder", desc: "Your questions, your rules", color: "text-neon-pink" },
          ].map((f) => (
            <div key={f.title} className="panel p-5 hover:scale-[1.03] transition-transform">
              <f.icon className={`w-7 h-7 mx-auto mb-2 ${f.color}`} />
              <div className="font-heading font-semibold text-white">{f.title}</div>
              <div className="text-xs text-white/55 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* avatar preview strip */}
        <div className="mt-12">
          <div className="flex items-center justify-center gap-2 text-white/50 text-xs uppercase tracking-widest mb-4">
            <span>✦</span> Collect ✦ Explore ✦ Be Unique <span>✦</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {previewAvatars.map((a) => (
              <Link
                key={a.id}
                to="/avatars"
                className="panel p-2 hover:scale-110 transition-transform"
                style={{ borderColor: a.color + "55" }}
              >
                <AvatarSvg avatar={a} size={56} glow />
              </Link>
            ))}
          </div>
          <Link to="/avatars" className="inline-flex items-center gap-1 mt-5 text-sm text-neon-cyan hover:text-white transition-colors">
            Browse all 100 avatars <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="relative z-10 text-center text-white/30 text-xs pb-8">
        BREATH LIVE QUIZ — an original multiplayer quiz experience
      </footer>
    </div>
  );
}

export default HomeComponent;