import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { submitAnswer, getQuestionState } from "@/lib/server-fns";
import { getAvatar } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import { Check, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/play/$gameId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Play — BREATH LIVE QUIZ" }] }),
  component: PlayComponent,
});

function PlayComponent() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null); // answer for current question
  const [selected, setSelected] = useState(null); // local selection for current question
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const curQidRef = useRef("");
  const timerRef = useRef(null);

  // resolve player from localStorage
  useEffect(() => {
    if (!gameId) return;
    // find player_key by scanning codes — stored as pk_<code>; we don't know code here, so fetch session to get code
    base44.entities.GameSession.get(gameId).then(async (s) => {
      const code = s.game_code;
      const key = localStorage.getItem(`pk_${code}`);
      if (!key) { toast.error("Session lost — rejoin with your code"); navigate({ to: "/" }); return; }
      // find player by key
      const ps = await base44.entities.Player.filter({ game_session_id: gameId, player_key: key }, { limit: 1 });
      if (ps.items.length === 0) { toast.error("Player not found — rejoin"); navigate({ to: "/" }); return; }
      setPlayer(ps.items[0]);
    }).catch(() => navigate({ to: "/" }));
  }, [gameId]);

  // subscribe to game session
  useEffect(() => {
    let alive = true;
    const loadState = async (playerId) => {
      try {
        const st = await getQuestionState({ data: { game_session_id: gameId, player_id: playerId } });
        if (!alive) return;
        setSession(st.session);
        setQuestion(st.question);
        setMyAnswer(st.myAnswer);
        if (st.session.status === "ended") { navigate({ to: "/results/$gameId", params: { gameId } }); return; }
      } catch (e) { /* ignore */ }
    };
    // wait until player known
    const tryLoad = () => { if (player) loadState(player.id); };
    tryLoad();
    const unsub = base44.entities.GameSession.subscribe((ev) => {
      if (ev.type === "update" && ev.data?.id === gameId) {
        // session changed — reload full state
        if (player) loadState(player.id);
      }
    });
    // Fallback polling: guarantees question changes and the results transition
    // even if a realtime event is missed (that was the "results only after refresh" bug)
    const poll = setInterval(() => { if (player) loadState(player.id); }, 2500);
    return () => { alive = false; unsub && unsub(); clearInterval(poll); };
  }, [gameId, player?.id]);

  // CRITICAL: when current question changes, reset per-question selection + submission state
  useEffect(() => {
    const qid = session?.current_question_id;
    if (!qid) return;
    if (qid !== curQidRef.current) {
      curQidRef.current = qid;
      setSelected(null);          // clear previous selection
      setSubmitting(false);        // reset submission UI
      // fetch whether this player already answered THIS question (reconnect safety)
      if (player) {
        base44.entities.Answer.filter({ game_session_id: gameId, player_id: player.id, question_id: qid }, { limit: 1 }).then((res) => {
          setMyAnswer(res.items.length > 0 ? res.items[0] : null);
        });
      }
    }
  }, [session?.current_question_id, player?.id]);

  // timer countdown
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!session || session.status !== "playing" || !question) { setTimeLeft(null); return; }
    const total = question.timer_seconds || 20;
    const started = new Date(session.question_started_at).getTime();
    const tick = () => {
      const left = Math.max(0, total - (Date.now() - started) / 1000);
      setTimeLeft(left);
      if (left <= 0 && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
    tick();
    timerRef.current = setInterval(tick, 250);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.current_question_id, session?.question_started_at, session?.status]);

  const alreadySubmitted = !!myAnswer;
  const isRevealed = session?.status === "revealed";
  const isPlaying = session?.status === "playing";

  const submit = async (optionIdx) => {
    if (alreadySubmitted || submitting || !isPlaying || !player || !question) return;
    setSelected(optionIdx);
    setSubmitting(true);
    try {
      const res = await submitAnswer({ data: {
        game_session_id: gameId,
        player_id: player.id,
        player_key: player.player_key,
        question_id: question.id,
        question_index: session.current_question_index,
        selected_option: optionIdx,
      } });
      setMyAnswer({ selected_option: optionIdx, is_correct: res.is_correct, points_awarded: res.points_awarded });
      toast.success(res.is_correct ? `Correct! +${res.points_awarded} pts${res.coins_awarded ? ` · +${res.coins_awarded} coins` : ""}` : "Answer locked in");
    } catch (e) {
      if (e.code === "ALREADY_ANSWERED") {
        // already answered — sync state
        const a = await base44.entities.Answer.filter({ game_session_id: gameId, player_id: player.id, question_id: question.id }, { limit: 1 });
        if (a.items.length) setMyAnswer(a.items[0]);
      } else if (e.code === "STALE_QUESTION" || e.code === "NOT_OPEN") {
        toast.error("Question closed");
      } else {
        toast.error(e.message || "Could not submit");
        setSelected(null);
      }
    } finally { setSubmitting(false); }
  };

  if (!session || !player) return <div className="min-h-screen flex items-center justify-center text-white/60">Connecting to game…</div>;

  const av = player.avatar_id ? getAvatar(player.avatar_id) : null;

  // LOBBY waiting
  if (session.status === "lobby") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        {av && <AvatarSvg avatar={av} size={110} glow />}
        <h2 className="mt-4 text-2xl font-heading font-bold text-white">Hi {player.name}!</h2>
        <p className="text-white/60 mt-1">Waiting for the host to start the game…</p>
        <div className="mt-6 flex gap-2">{[0,1,2].map((i)=><div key={i} className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
      </div>
    );
  }

  const correctIdx = isRevealed ? question?.correct_option : -1;
  const myPick = myAnswer?.selected_option;
  const timePct = timeLeft != null && question ? Math.max(0, (timeLeft / (question.timer_seconds || 20)) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          {av && <AvatarSvg avatar={av} size={32} />}
          <span className="text-white font-semibold text-sm">{player.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neon-gold font-bold">{player.score || 0} pts</span>
        </div>
      </header>

      {/* question */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 flex flex-col">
        <div className="text-center mb-3">
          <span className="text-white/50 text-sm">Question {(session.current_question_index ?? 0) + 1} of {session.total_questions}</span>
        </div>

        {/* timer */}
        {isPlaying && timeLeft != null && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className={`w-4 h-4 ${timeLeft < 5 ? "text-red-400" : "text-neon-cyan"}`} />
              <span className={`font-heading font-bold ${timeLeft < 5 ? "text-red-400" : "text-white"}`}>{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full transition-all duration-300 ${timeLeft < 5 ? "bg-red-500" : "bg-gradient-to-r from-neon-cyan to-neon-lime"}`} style={{ width: `${timePct}%` }} />
            </div>
          </div>
        )}

        <div className="panel p-5 mb-5 text-center">
          {question?.emoji && <div className="text-5xl mb-2">{question.emoji}</div>}
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">{question?.text}</h2>
        </div>

        {/* answers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {(question?.options || []).map((opt, oi) => {
            const isMyPick = myPick === oi;
            const isCorrect = oi === correctIdx;
            const isWrongPick = isRevealed && isMyPick && !isCorrect;
            let cls = "border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10";
            if (selected === oi && !alreadySubmitted && isPlaying) cls = "border-neon-cyan bg-neon-cyan/15 glow-cyan scale-[1.02]";
            if (isRevealed && isCorrect) cls = "border-neon-lime bg-neon-lime/15 glow-lime";
            if (isWrongPick) cls = "border-red-500/60 bg-red-500/10";
            const disabled = alreadySubmitted || !isPlaying || submitting;
            return (
              <button key={oi} disabled={disabled} onClick={() => submit(oi)} className={`rounded-2xl border p-4 sm:p-5 flex items-center gap-3 transition-all text-left ${cls} ${disabled ? "cursor-default" : "cursor-pointer"}`}>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${isRevealed && isCorrect ? "bg-neon-lime text-black" : isWrongPick ? "bg-red-500 text-white" : "bg-white/10 text-white/70"}`}>{String.fromCharCode(65 + oi)}</span>
                <span className="text-white font-medium flex-1">{opt}</span>
                {isRevealed && isCorrect && <Check className="w-5 h-5 text-neon-lime" />}
                {isWrongPick && <span className="text-xs text-red-400">Your pick</span>}
              </button>
            );
          })}
        </div>

        {/* status */}
        <div className="mt-5 text-center min-h-[28px]">
          {isPlaying && alreadySubmitted && (
            <p className="text-white/60 text-sm flex items-center justify-center gap-1.5"><Check className="w-4 h-4 text-neon-lime" /> Answer locked — waiting for the host</p>
          )}
          {isPlaying && !alreadySubmitted && (
            <p className="text-white/50 text-sm">Tap an answer to lock it in</p>
          )}
          {isRevealed && (
            <div className="animate-pop">
              {myAnswer?.is_correct ? (
                <p className="text-neon-lime font-heading font-bold text-lg flex items-center justify-center gap-2"><Zap className="w-5 h-5" /> Correct! +{myAnswer?.points_awarded || 0} points</p>
              ) : (
                <p className="text-red-400 font-heading font-bold text-lg">{myAnswer ? "Not quite!" : "Time's up — no answer"}</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PlayComponent;