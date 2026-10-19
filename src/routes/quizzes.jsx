import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getPublishedQuizzes, startGame } from "@/lib/server-fns";
import { getOwnerKey } from "@/lib/wallet";
import { ArrowLeft, Play, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Published Quizzes — BREATH LIVE QUIZ" }] }),
  component: QuizzesComponent,
});

function QuizzesComponent() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [starting, setStarting] = useState("");

  useEffect(() => {
    getPublishedQuizzes({ data: {} }).then(setQuizzes).catch(() => setQuizzes([]));
  }, []);

  const host = async (qz) => {
    setStarting(qz.id);
    try {
      const r = await startGame({ data: { quiz_id: qz.id, host_key: getOwnerKey(), host_name: "Host" } });
      toast.success(`Game ${r.game_code} created!`);
      navigate({ to: "/host/$gameId", params: { gameId: r.game_id } });
    } catch (e) {
      toast.error(e.message || "Could not start game");
    } finally {
      setStarting("");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <span className="font-heading font-bold text-white hidden sm:block">Published Quizzes</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold gradient-text">Community Quizzes</h1>
          <p className="text-white/60 mt-2 text-sm">Quizzes published by creators — anyone can host a live game with them.</p>
        </div>

        {quizzes === null && <p className="text-center text-white/40 py-16">Loading…</p>}

        {quizzes !== null && quizzes.length === 0 && (
          <div className="panel p-10 text-center max-w-md mx-auto">
            <Globe className="w-8 h-8 mx-auto text-white/30 mb-3" />
            <p className="text-white/70 font-heading font-semibold">Nothing published yet</p>
            <p className="text-white/50 text-sm mt-1">Create a quiz and hit Publish in your quiz library to share it here.</p>
            <Link to="/create" className="mt-5 inline-flex btn-glow px-6 py-2.5 text-white bg-gradient-to-r from-neon-pink to-neon-violet"><Sparkles className="w-4 h-4" /> Make a Quiz</Link>
          </div>
        )}

        {quizzes !== null && quizzes.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((qz) => (
              <div key={qz.id} className="panel p-5 flex flex-col">
                <div className="text-4xl mb-2">{qz.cover_emoji || "🎮"}</div>
                <div className="font-heading font-bold text-white text-lg">{qz.title}</div>
                {qz.description && <p className="text-white/50 text-sm mt-1 flex-1">{qz.description}</p>}
                <div className="text-white/40 text-xs mt-2">{qz.question_count} questions</div>
                <button onClick={() => host(qz)} disabled={starting === qz.id} className="mt-4 w-full btn-glow px-4 py-2.5 text-sm text-white bg-gradient-to-r from-neon-lime to-emerald-500 hover:scale-[1.02]">
                  {starting === qz.id ? "Starting…" : <><Play className="w-4 h-4" /> Host this quiz</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizzesComponent;