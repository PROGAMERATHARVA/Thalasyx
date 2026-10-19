import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { startPlay, revealAnswer, nextQuestion, endGame, getLobby } from "@/lib/server-fns";
import { getOwnerKey } from "@/lib/wallet";
import { AvatarSvg } from "@/components/AvatarSvg";
import { getAvatar } from "@/lib/avatars";
import { Copy, Check, Play, Eye, ArrowRight, Square, Users, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/host/$gameId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Host — BREATH LIVE QUIZ" }] }),
  component: HostComponent,
});

function HostComponent() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const answersRef = useRef(new Map()); // question_id -> Set(player_id)

  // initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const lobby = await getLobby({ data: { game_session_id: gameId } });
        if (!alive) return;
        setSession(lobby.session);
        setPlayers(lobby.players);
        if (lobby.session.current_question_id) {
          const q = await base44.entities.Question.get(lobby.session.current_question_id);
          if (alive) setQuestion(q);
          // count existing answers for current question
          const ans = await base44.entities.Answer.filter({ game_session_id: gameId, question_id: lobby.session.current_question_id }, { limit: 500 });
          if (alive) {
            const set = new Set(ans.items.map((a) => a.player_id));
            answersRef.current.set(lobby.session.current_question_id, set);
            setAnsweredCount(set.size);
          }
        }
      } catch (e) { toast.error("Could not load game"); }
    })();
    // subscriptions
    const unsubSession = base44.entities.GameSession.subscribe((ev) => {
      if (ev.type === "update" && ev.data?.id === gameId) {
        setSession(ev.data);
        if (ev.data.status === "ended") navigate({ to: "/results/$gameId", params: { gameId } });
      }
    });
    const unsubPlayers = base44.entities.Player.subscribe((ev) => {
      getLobby({ data: { game_session_id: gameId } }).then((l) => { if (alive) setPlayers(l.players); });
    });
    const unsubAnswers = base44.entities.Answer.subscribe((ev) => {
      if (ev.type !== "create") return;
      const a = ev.data;
      if (a.game_session_id !== gameId) return;
      const cur = sessionRef.current?.current_question_id;
      if (cur && a.question_id === cur) {
        const set = answersRef.current.get(cur) || new Set();
        if (!set.has(a.player_id)) { set.add(a.player_id); answersRef.current.set(cur, set); setAnsweredCount(set.size); }
      }
    });
    return () => { alive = false; unsubSession && unsubSession(); unsubPlayers && unsubPlayers(); unsubAnswers && unsubAnswers(); };
  }, []);

  const sessionRef = useRef(null);
  sessionRef.current = session;

  // when current question changes, reset answered count + load question
  useEffect(() => {
    if (!session?.current_question_id) { setAnsweredCount(0); return; }
    if (session.current_question_id !== question?.id) {
      base44.entities.Question.get(session.current_question_id).then(setQuestion).catch(() => {});
    }
    // recompute answered for this question from server (handles late events / reconnect)
    base44.entities.Answer.filter({ game_session_id: gameId, question_id: session.current_question_id }, { limit: 500 }).then((res) => {
      const set = new Set(res.items.map((a) => a.player_id));
      answersRef.current.set(session.current_question_id, set);
      setAnsweredCount(set.size);
    });
  }, [session?.current_question_id]);

  const copyCode = () => { navigator.clipboard?.writeText(session.game_code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const copyLink = () => { const url = `${window.location.origin}/join/${session.game_code}`; navigator.clipboard?.writeText(url); toast.success("Join link copied!"); };

  const start = async () => { setBusy(true); try { await startPlay({ data: { game_session_id: gameId, host_key: getOwnerKey() } }); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const reveal = async () => { setBusy(true); try { await revealAnswer({ data: { game_session_id: gameId, host_key: getOwnerKey() } }); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const next = async () => { setBusy(true); try { const r = await nextQuestion({ data: { game_session_id: gameId, host_key: getOwnerKey() } }); if (r.ended) navigate({ to: "/results/$gameId", params: { gameId } }); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const end = async () => { if (!confirm("End the game now?")) return; setBusy(true); try { await endGame({ data: { game_session_id: gameId, host_key: getOwnerKey() } }); navigate({ to: "/results/$gameId", params: { gameId } }); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };

  if (!session) return <div className="min-h-screen flex items-center justify-center text-white/60">Loading game…</div>;

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${session.game_code}`;

  // LOBBY
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="text-center mb-6">
            <h1 className="font-heading font-extrabold text-3xl gradient-text">{session.quiz_title}</h1>
            <p className="text-white/50 text-sm">Waiting for players to join</p>
          </div>

          <div className="panel p-6 glow-cyan mb-5">
            <div className="text-xs text-white/40 uppercase tracking-widest text-center mb-2">Game Code</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl sm:text-5xl font-heading font-bold tracking-[0.3em] text-white text-glow-cyan">{session.game_code}</span>
              <button onClick={copyCode} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">{copied ? <Check className="w-5 h-5 text-neon-lime" /> : <Copy className="w-5 h-5" />}</button>
            </div>
            <button onClick={copyLink} className="mt-3 w-full btn-glow px-4 py-2 text-sm text-white bg-white/5 border border-white/10 hover:bg-white/10">Copy join link</button>
            <p className="text-xs text-white/40 mt-2 text-center break-all">{joinUrl}</p>
          </div>

          <div className="panel p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-neon-cyan" /> Players</span>
              <span className="text-2xl font-heading font-bold text-neon-cyan">{players.length}</span>
            </div>
            {players.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">No one has joined yet. Share the code!</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto">
                {players.map((p, i) => {
                  const av = p.avatar_id ? getAvatar(p.avatar_id) : null;
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 animate-pop">
                      <span className="w-6 text-center text-white/40 text-sm font-bold">{i + 1}</span>
                      {av ? <AvatarSvg avatar={av} size={36} /> : <div className="w-9 h-9 rounded-xl bg-white/10" />}
                      <span className="text-white font-medium truncate">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={start} disabled={busy || players.length === 0} className="w-full btn-glow px-6 py-4 text-lg text-white bg-gradient-to-r from-neon-lime to-emerald-500 hover:scale-[1.01] glow-lime">
            <Play className="w-5 h-5" /> Start Game
          </button>
          {players.length === 0 && <p className="text-center text-white/40 text-xs mt-2">Need at least one player to start</p>}
        </div>
      </div>
    );
  }

  // PLAYING / REVEALED
  const total = players.length;
  const waiting = total - answeredCount;
  const isRevealed = session.status === "revealed";

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* progress bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-sm">Question {(session.current_question_index ?? 0) + 1} / {session.total_questions}</span>
          <button onClick={end} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Square className="w-3.5 h-3.5" /> End Game</button>
        </div>
        <div className="h-2 rounded-full bg-white/10 mb-5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink transition-all" style={{ width: `${((session.current_question_index ?? 0) + 1) / session.total_questions * 100}%` }} />
        </div>

        {/* question card */}
        <div className="panel p-6 mb-5">
          {question?.emoji && <div className="text-4xl mb-2">{question.emoji}</div>}
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">{question?.text || "Loading question…"}</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {(question?.options || []).map((opt, oi) => {
              const correct = isRevealed && oi === question.correct_option;
              return (
                <div key={oi} className={`rounded-2xl border p-4 flex items-center gap-3 transition-all ${correct ? "border-neon-lime bg-neon-lime/15 glow-lime" : "border-white/10 bg-white/5"}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${correct ? "bg-neon-lime text-black" : "bg-white/10 text-white/60"}`}>{String.fromCharCode(65 + oi)}</span>
                  <span className="text-white">{opt}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* answered progress */}
        <div className="panel p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-neon-cyan" /> Answered</span>
            <span className="text-2xl font-heading font-bold text-neon-cyan">{answeredCount}/{total}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-lime transition-all duration-500" style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
          </div>
          <p className="text-white/50 text-xs mt-2">{waiting} still waiting · {answeredCount} answered</p>
        </div>

        {/* controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={reveal} disabled={busy || isRevealed} className="btn-glow px-4 py-4 text-white bg-gradient-to-r from-neon-violet to-neon-pink hover:scale-[1.02] disabled:opacity-50">
            <Eye className="w-5 h-5" /> {isRevealed ? "Revealed" : "Reveal Answer"}
          </button>
          <button onClick={next} disabled={busy} className="btn-glow px-4 py-4 text-white bg-gradient-to-r from-neon-cyan to-blue-500 hover:scale-[1.02]">
            <ArrowRight className="w-5 h-5" /> Next Question
          </button>
          <button onClick={end} disabled={busy} className="btn-glow px-4 py-4 text-white bg-white/10 hover:bg-white/20 border border-white/10">
            <Square className="w-5 h-5" /> End Game
          </button>
        </div>

        {/* mini leaderboard */}
        <div className="panel p-4 mt-5">
          <span className="font-heading font-semibold text-white flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-neon-gold" /> Live Scores</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...players].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8).map((p, i) => {
              const av = p.avatar_id ? getAvatar(p.avatar_id) : null;
              return (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-white/40">{i + 1}</span>
                  {av ? <AvatarSvg avatar={av} size={26} /> : <div className="w-7 h-7 rounded-lg bg-white/10" />}
                  <span className="text-white/80 flex-1 truncate">{p.name}</span>
                  <span className="text-neon-gold font-bold">{p.score || 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostComponent;