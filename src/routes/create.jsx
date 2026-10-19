import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createQuiz, getMyQuizzes, publishQuiz, startGame } from "@/lib/server-fns";
import { useAccount } from "@/lib/useAccount";
import { getOwnerKey } from "@/lib/wallet";
import AccountModal from "@/components/AccountModal";
import { ArrowLeft, Plus, Trash2, Copy, GripVertical, Eye, Play, Save, Sparkles, Check, X, ChevronUp, ChevronDown, Coins, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({
  ssr: false,
  head: () => ({ meta: [{ title: "Create a Quiz — BREATH LIVE QUIZ" }] }),
  component: CreateComponent,
});

const EMOJIS = ["🎮", "🚀", "🐉", "⚡", "🎯", "🧠", "🔥", "✨", "👾", "🏆", "📚", "🧪", "🌍", "🎨", "🎵"];

function blankQuestion(i) {
  return {
    temp_id: `q_${Date.now()}_${i}`,
    text: "",
    question_type: "multiple_choice",
    options: ["", "", "", ""],
    correct_option: 0,
    timer_seconds: 20,
    points: 1000,
    emoji: "",
  };
}

function CreateComponent() {
  const { wallet, refreshWallet, session } = useAccount();
  const [showAccount, setShowAccount] = useState(false);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("🎮");
  const [questions, setQuestions] = useState([blankQuestion(0)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [settings, setSettings] = useState({
    sound: true,
    reveal_answers: true,
    progression: "manual",
    player_limit: 60,
    random_questions: false,
    random_answers: false,
    unique_avatars: true,
  });
  const [saving, setSaving] = useState(false);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);

  const q = questions[activeIdx];

  const addQuestion = () => {
    const nq = blankQuestion(questions.length);
    setQuestions([...questions, nq]);
    setActiveIdx(questions.length);
  };
  const deleteQuestion = (idx) => {
    if (questions.length === 1) return toast.error("Keep at least one question");
    const next = questions.filter((_, i) => i !== idx).map((qq, i) => ({ ...qq, temp_id: qq.temp_id }));
    setQuestions(next);
    setActiveIdx(Math.max(0, idx - 1));
  };
  const duplicateQuestion = (idx) => {
    const copy = { ...questions[idx], temp_id: `q_${Date.now()}_dup`, text: questions[idx].text, options: [...questions[idx].options] };
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
    setActiveIdx(idx + 1);
  };
  const move = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= questions.length) return;
    const next = [...questions];
    [next[idx], next[ni]] = [next[ni], next[idx]];
    setQuestions(next);
    setActiveIdx(ni);
  };
  const updateQ = (patch) => setQuestions(questions.map((qq, i) => (i === activeIdx ? { ...qq, ...patch } : qq)));
  const setOption = (oi, val) => updateQ({ options: q.options.map((o, i) => (i === oi ? val : o)) });
  const addOption = () => { if (q.options.length < 6) updateQ({ options: [...q.options, ""] }); };
  const removeOption = (oi) => { if (q.options.length <= 2) return; updateQ({ options: q.options.filter((_, i) => i !== oi), correct_option: q.correct_option >= oi && q.correct_option > 0 ? q.correct_option - 1 : q.correct_option }); };
  const setType = (type) => updateQ({ question_type: type, options: type === "true_false" ? ["True", "False"] : ["", "", "", ""], correct_option: 0 });

  const valid = () => {
    if (!title.trim()) return "Add a quiz title";
    for (let i = 0; i < questions.length; i++) {
      const qq = questions[i];
      if (!qq.text.trim()) return `Question ${i + 1} is empty`;
      if (qq.question_type !== "true_false") {
        if (qq.options.some((o) => !o.trim())) return `Question ${i + 1} has a blank option`;
        if (qq.options.length < 2) return `Question ${i + 1} needs at least 2 options`;
      }
    }
    return null;
  };

  const save = async () => {
    const err = valid();
    if (err) return toast.error(err);
    setSaving(true);
    try {
      const payload = {
        title, description, cover_emoji: coverEmoji, settings,
        creator_key: getOwnerKey(),
        questions: questions.map(({ temp_id, ...rest }) => rest),
      };
      const res = await createQuiz({ data: payload });
      toast.success("Quiz saved!");
      return res;
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveAndStart = async () => {
    const saved = await save();
    if (!saved) return;
    try {
      const res = await startGame({ data: { quiz_id: saved.id, host_key: getOwnerKey(), host_name: session?.username || "Host" } });
      toast.success(`Game ${res.game_code} created!`);
      navigate({ to: "/host/$gameId", params: { gameId: res.game_id } });
    } catch (e) {
      toast.error(e.message || "Could not start game");
    }
  };

  const loadLibrary = async () => {
    try { setMyQuizzes(await getMyQuizzes({ data: { creator_key: getOwnerKey() } })); setShowLibrary(true); } catch (e) { toast.error("Could not load quizzes"); }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate({ to: "/" })} className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Home</button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAccount(true)} className="btn-glow px-3 sm:px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/20 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-neon-gold" />
              <span className="text-neon-gold font-bold">{wallet ? wallet.coins : "…"}</span>
              <span className="text-white/70 hidden sm:inline">· {session ? session.username : "Account"}</span>
            </button>
            <button onClick={loadLibrary} className="btn-glow px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/20">My Quizzes</button>
            <button onClick={save} disabled={saving} className="btn-glow px-4 py-2 text-sm text-white bg-white/10 hover:bg-white/20"><Save className="w-4 h-4" /> Save</button>
            <button onClick={saveAndStart} disabled={saving} className="btn-glow px-5 py-2 text-sm text-white bg-gradient-to-r from-neon-lime to-emerald-500 hover:scale-105"><Play className="w-4 h-4" /> Start Quiz</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* sidebar: question list */}
        <aside className="panel p-3 h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-heading font-semibold text-white text-sm">Questions ({questions.length})</span>
            <button onClick={addQuestion} className="text-neon-cyan hover:text-white"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((qq, i) => (
              <button key={qq.temp_id} onClick={() => setActiveIdx(i)} className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors flex items-center gap-2 ${i === activeIdx ? "bg-neon-cyan/20 text-white border border-neon-cyan/40" : "text-white/60 hover:bg-white/5"}`}>
                <span className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="truncate flex-1">{qq.text || "Untitled"}</span>
              </button>
            ))}
          </div>
          <button onClick={addQuestion} className="mt-2 w-full btn-glow px-3 py-2 text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10"><Plus className="w-4 h-4" /> Add Question</button>
        </aside>

        {/* main editor */}
        <main className="space-y-5">
          {/* quiz meta */}
          <section className="panel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">{coverEmoji}</div>
              </div>
              <div className="flex-1">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" className="w-full bg-transparent text-xl font-heading font-bold text-white placeholder-white/30 focus:outline-none" />
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a short description…" className="w-full bg-transparent text-sm text-white/60 placeholder-white/30 focus:outline-none mt-1" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button key={em} onClick={() => setCoverEmoji(em)} className={`w-9 h-9 rounded-lg text-lg transition-all ${coverEmoji === em ? "bg-neon-cyan/30 scale-110" : "bg-white/5 hover:bg-white/10"}`}>{em}</button>
              ))}
            </div>
          </section>

          {/* question editor */}
          <section className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-heading font-semibold text-white">Question {activeIdx + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(activeIdx, -1)} disabled={activeIdx === 0} className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(activeIdx, 1)} disabled={activeIdx === questions.length - 1} className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => duplicateQuestion(activeIdx)} className="p-1.5 rounded-lg text-white/60 hover:bg-white/10"><Copy className="w-4 h-4" /></button>
                <button onClick={() => deleteQuestion(activeIdx)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input value={q.emoji} onChange={(e) => updateQ({ emoji: e.target.value.slice(0, 4) })} placeholder="😀" className="w-14 text-center text-2xl bg-white/5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40" />
              <input value={q.text} onChange={(e) => updateQ({ text: e.target.value })} placeholder="Type your question…" className="flex-1 bg-white/5 rounded-xl border border-white/10 px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40" />
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setType("multiple_choice")} className={`px-3 py-1.5 rounded-lg text-sm ${q.question_type === "multiple_choice" ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40" : "bg-white/5 text-white/60"}`}>Multiple Choice</button>
              <button onClick={() => setType("true_false")} className={`px-3 py-1.5 rounded-lg text-sm ${q.question_type === "true_false" ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/40" : "bg-white/5 text-white/60"}`}>True / False</button>
            </div>

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${q.correct_option === oi ? "border-neon-lime/60 bg-neon-lime/10" : "border-white/10 bg-white/5"}`}>
                  <button onClick={() => updateQ({ correct_option: oi })} className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${q.correct_option === oi ? "bg-neon-lime text-black" : "bg-white/10 text-white/50"}`}>
                    {q.correct_option === oi ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                  </button>
                  <input value={opt} onChange={(e) => setOption(oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 bg-transparent text-white placeholder-white/30 focus:outline-none" />
                  {q.question_type !== "true_false" && <button onClick={() => removeOption(oi)} className="text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              {q.question_type !== "true_false" && q.options.length < 6 && (
                <button onClick={addOption} className="text-sm text-neon-cyan hover:text-white flex items-center gap-1 px-2"><Plus className="w-4 h-4" /> Add option</button>
              )}
            </div>
            <p className="text-xs text-white/40 mt-2">Tap the circle to mark the correct answer.</p>

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">Timer (seconds)</label>
                <input type="number" value={q.timer_seconds} onChange={(e) => updateQ({ timer_seconds: Math.max(5, +e.target.value || 20) })} className="w-full bg-white/5 rounded-xl border border-white/10 px-3 py-2 text-white mt-1 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40" />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider">Points</label>
                <input type="number" value={q.points} onChange={(e) => updateQ({ points: Math.max(100, +e.target.value || 1000) })} className="w-full bg-white/5 rounded-xl border border-white/10 px-3 py-2 text-white mt-1 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40" />
              </div>
            </div>
          </section>

          {/* settings */}
          <section className="panel p-5">
            <span className="font-heading font-semibold text-white block mb-3">Game Settings</span>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { k: "unique_avatars", label: "Unique avatars (one per player)" },
                { k: "reveal_answers", label: "Reveal correct answers" },
                { k: "random_questions", label: "Shuffle question order" },
                { k: "random_answers", label: "Shuffle answer order" },
                { k: "sound", label: "Sound effects" },
              ].map((s) => (
                <label key={s.k} className="flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10">
                  <input type="checkbox" checked={!!settings[s.k]} onChange={(e) => setSettings({ ...settings, [s.k]: e.target.checked })} className="accent-neon-cyan w-4 h-4" />
                  <span className="text-white/80">{s.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white/5">
                <span className="text-white/80">Progression</span>
                <select value={settings.progression} onChange={(e) => setSettings({ ...settings, progression: e.target.value })} className="ml-auto bg-background border border-white/10 rounded-lg px-2 py-1 text-white text-xs">
                  <option value="manual">Manual (host advances)</option>
                  <option value="auto">Auto (after timer)</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white/5">
                <span className="text-white/80">Player limit</span>
                <input type="number" value={settings.player_limit} onChange={(e) => setSettings({ ...settings, player_limit: Math.max(1, +e.target.value || 60) })} className="ml-auto w-20 bg-background border border-white/10 rounded-lg px-2 py-1 text-white text-xs" />
              </label>
            </div>
          </section>
        </main>
      </div>

      {showAccount && <AccountModal onClose={() => setShowAccount(false)} onChanged={refreshWallet} />}

      {showLibrary && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLibrary(false)}>
          <div className="panel p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-white mb-3">My Saved Quizzes</h3>
            {myQuizzes.length === 0 ? <p className="text-white/50 text-sm">No quizzes yet. Create one above!</p> : (
              <div className="space-y-2">
                {myQuizzes.map((mq) => (
                  <div key={mq.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                    <span className="text-2xl">{mq.cover_emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{mq.title}</div>
                      <div className="text-white/40 text-xs flex items-center gap-1.5">{mq.question_count} questions {mq.published && <span className="text-[10px] text-neon-lime font-bold bg-neon-lime/10 border border-neon-lime/30 rounded-full px-2 py-0.5">Published</span>}</div>
                    </div>
                    <button onClick={async () => { try { const r = await publishQuiz({ data: { id: mq.id, creator_key: getOwnerKey() } }); setMyQuizzes(myQuizzes.map((x) => (x.id === mq.id ? { ...x, published: r.published } : x))); toast.success(r.published ? "Published — anyone can host it now!" : "Quiz unpublished"); } catch (e) { toast.error(e.message); } }} className={`btn-glow px-3 py-1.5 text-sm ${mq.published ? "text-white bg-white/10 border border-white/10" : "text-white bg-gradient-to-r from-neon-cyan to-blue-500"}`}>{mq.published ? "Unpublish" : "Publish"}</button>
                    <button onClick={async () => { try { const r = await startGame({ data: { quiz_id: mq.id, host_key: getOwnerKey(), host_name: session?.username || "Host" } }); setShowLibrary(false); navigate({ to: "/host/$gameId", params: { gameId: r.game_id } }); } catch (e) { toast.error(e.message); } }} className="btn-glow px-3 py-1.5 text-sm text-white bg-gradient-to-r from-neon-lime to-emerald-500"><Play className="w-3.5 h-3.5" /> Start</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateComponent;