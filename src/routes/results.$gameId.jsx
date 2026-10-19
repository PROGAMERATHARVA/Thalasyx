import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getResults } from "@/lib/server-fns";
import { getAvatar } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import confetti from "canvas-confetti";
import { Trophy, Home, RotateCcw, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/results/$gameId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Results — BREATH LIVE QUIZ" }] }),
  component: ResultsComponent,
});

function fireConfetti() {
  try {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#00f5ff", "#ff007f", "#ffd700", "#39ff14", "#9d00ff"] });
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, angle: 60 }), 300);
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, angle: 120 }), 500);
  } catch (e) {}
}

function ResultsComponent() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getResults({ data: { game_session_id: gameId } });
        if (alive) { setData(r); fireConfetti(); }
      } catch (e) { toast.error("Could not load results"); }
    })();
    return () => { alive = false; };
  }, [gameId]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/60">Calculating final scores…</div>;

  const board = data.leaderboard || [];
  const podium = board.slice(0, 3);
  const order = [1, 0, 2]; // visual: 2nd, 1st, 3rd
  const heights = ["h-28", "h-40", "h-20"];
  const colors = ["from-gray-400 to-gray-500", "from-neon-gold to-amber-500", "from-amber-600 to-orange-700"];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="text-center mb-8">
        <Trophy className="w-14 h-14 text-neon-gold mx-auto mb-2 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold gradient-text">Game Over!</h1>
        <p className="text-white/60 mt-1">{data.session?.quiz_title}</p>
      </div>

      {/* podium */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-10">
          {order.map((idx) => {
            const p = podium[idx];
            if (!p) return <div key={idx} className="w-24" />;
            const av = p.avatar_id ? getAvatar(p.avatar_id) : null;
            const place = idx + 1;
            return (
              <div key={p.id} className="flex flex-col items-center" style={{ animationDelay: `${idx * 0.1}s` }}>
                {place === 1 && <Crown className="w-7 h-7 text-neon-gold mb-1 animate-bounce" />}
                {av && <AvatarSvg avatar={av} size={place === 1 ? 80 : 60} glow={place === 1} />}
                <div className="mt-2 text-white font-semibold text-sm max-w-[80px] truncate text-center">{p.name}</div>
                <div className="text-neon-gold font-bold text-sm">{p.score || 0}</div>
                <div className={`w-20 sm:w-24 ${heights[idx]} rounded-t-2xl bg-gradient-to-b ${colors[idx]} flex items-center justify-center font-heading font-extrabold text-2xl text-white border-t-2 border-white/20`}>
                  {place}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* full leaderboard */}
      <div className="panel p-4 max-w-md w-full mb-8">
        <span className="font-heading font-semibold text-white px-1">Final Leaderboard</span>
        <div className="mt-2 space-y-1.5 max-h-[40vh] overflow-y-auto">
          {board.map((p, i) => {
            const av = p.avatar_id ? getAvatar(p.avatar_id) : null;
            return (
              <div key={p.id} className={`flex items-center gap-3 rounded-xl p-2.5 ${i < 3 ? "bg-white/10" : "bg-white/5"}`}>
                <span className="w-6 text-center font-bold text-white/50">{i + 1}</span>
                {av ? <AvatarSvg avatar={av} size={32} /> : <div className="w-8 h-8 rounded-lg bg-white/10" />}
                <span className="text-white flex-1 truncate">{p.name}</span>
                <span className="text-xs text-white/50">{p.correct_count || 0} correct</span>
                <span className="text-neon-gold font-bold w-16 text-right">{p.score || 0}</span>
              </div>
            );
          })}
          {board.length === 0 && <p className="text-white/40 text-sm text-center py-6">No players</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate({ to: "/" })} className="btn-glow px-6 py-3 text-white bg-white/10 hover:bg-white/20 border border-white/10"><Home className="w-4 h-4" /> Back to Home</button>
        <button onClick={() => navigate({ to: "/create" })} className="btn-glow px-6 py-3 text-white bg-gradient-to-r from-neon-pink to-neon-violet hover:scale-105"><RotateCcw className="w-4 h-4" /> Make a New Quiz</button>
      </div>
    </div>
  );
}

export default ResultsComponent;