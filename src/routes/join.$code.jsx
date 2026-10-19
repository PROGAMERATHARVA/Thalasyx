import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { joinGame, getLobby, reserveAvatar } from "@/lib/server-fns";
import { getOwnerKey } from "@/lib/wallet";
import { base44 } from "@/api/base44Client";
import { AVATARS, COLLECTIONS, RARITIES, RARITY_COLORS, getAvatar } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import { Search, Check, Lock, ArrowRight, Sparkles, Coins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$code")({
  ssr: false,
  head: () => ({ meta: [{ title: "Join Game — BREATH LIVE QUIZ" }] }),
  component: JoinComponent,
});

function JoinComponent() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState("name"); // name | avatar | done
  const [name, setName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerKey, setPlayerKey] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // avatar selection state
  const [search, setSearch] = useState("");
  const [activeCol, setActiveCol] = useState("all");
  const [selected, setSelected] = useState(null);
  const [reservedIds, setReservedIds] = useState([]);
  const [reserving, setReserving] = useState(false);
  const [myReservedId, setMyReservedId] = useState(null);
  const [uniqueAvatars, setUniqueAvatars] = useState(true);
  const [wallet, setWallet] = useState(null);

  const submitName = async () => {
    if (name.trim().length < 1) return setError("Enter your name");
    setLoading(true); setError("");
    try {
      const storedKey = typeof window !== "undefined" ? localStorage.getItem(`pk_${code}`) : null;
      const res = await joinGame({ data: { code, name: name.trim(), player_key: storedKey || undefined, wallet_key: getOwnerKey() } });
      setWallet(res.wallet || null);
      setGameId(res.game_id);
      setPlayerId(res.player_id);
      setPlayerKey(res.player_key);
      if (typeof window !== "undefined") localStorage.setItem(`pk_${code}`, res.player_key);
      // load lobby + reservations
      const lobby = await getLobby({ data: { game_session_id: res.game_id } });
      setReservedIds(lobby.reserved_avatar_ids || []);
      // determine unique setting from quiz
      const quiz = await base44.entities.Quiz.get(res.quiz_id);
      setUniqueAvatars(quiz.settings?.unique_avatars !== false);
      // if reconnecting and already has avatar, preselect
      const me = lobby.players.find((p) => p.id === res.player_id);
      if (me?.avatar_id) { setMyReservedId(me.avatar_id); setSelected(getAvatar(me.avatar_id)); }
      setStep("avatar");
    } catch (e) {
      setError(e.message || "Could not join game");
    } finally { setLoading(false); }
  };

  // live reservation updates + lobby→game transition (while picking AND while waiting)
  useEffect(() => {
    if (step === "name" || !gameId) return;
    let alive = true;
    const load = async () => {
      const lobby = await getLobby({ data: { game_session_id: gameId } });
      if (!alive) return;
      setReservedIds(lobby.reserved_avatar_ids || []);
      if (lobby.session.status !== "lobby") {
        // host started — go to play, no refresh needed
        navigate({ to: "/play/$gameId", params: { gameId } });
      }
    };
    load();
    const unsub = base44.entities.AvatarReservation.subscribe(() => load());
    const unsub2 = base44.entities.GameSession.subscribe(() => load());
    // polling fallback guarantees the transition even if a live event is missed
    const poll = setInterval(load, 2500);
    return () => { alive = false; unsub && unsub(); unsub2 && unsub2(); clearInterval(poll); };
  }, [step, gameId]);

  const filtered = AVATARS.filter((a) => {
    if (activeCol !== "all" && a.collection !== activeCol) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.collectionName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isTaken = (a) => uniqueAvatars && reservedIds.includes(a.id) && a.id !== myReservedId;
  const isLocked = (a) => a.pack_price > 0 && !(wallet?.owned_avatars || []).includes(a.id);

  const confirmAvatar = async () => {
    if (!selected) return toast.error("Pick an avatar");
    setReserving(true);
    try {
      await reserveAvatar({ data: { game_session_id: gameId, avatar_id: selected.id, player_id: playerId, player_key: playerKey } });
      setMyReservedId(selected.id);
      toast.success(`${selected.name} is yours!`);
      setStep("done");
    } catch (e) {
      if (e.code === "AVATAR_TAKEN") { toast.error("That avatar was just taken — pick another!"); setReservedIds([...reservedIds, selected.id]); setSelected(null); }
      else if (e.code === "LOCKED") { toast.error("Game already started!"); navigate({ to: "/play/$gameId", params: { gameId } }); }
      else toast.error(e.message || "Could not reserve avatar");
    } finally { setReserving(false); }
  };

  if (step === "name") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <div className="panel p-7 max-w-md w-full glow-cyan animate-rise">
          <div className="text-center mb-6">
            <div className="text-xs text-white/40 uppercase tracking-widest">Game Code</div>
            <div className="text-3xl font-heading font-bold gradient-text tracking-[0.3em]">{code}</div>
          </div>
          <label className="block text-xs text-white/50 mb-2 uppercase tracking-wider">Your display name</label>
          <input autoFocus value={name} onChange={(e) => { setName(e.target.value.slice(0, 24)); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submitName()} placeholder="e.g. Alex" className="w-full bg-background/60 border border-white/15 rounded-2xl px-4 py-3 text-white text-lg placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-neon-cyan/60" />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button onClick={submitName} disabled={loading} className="mt-4 w-full btn-glow px-5 py-3 text-white bg-gradient-to-r from-neon-cyan to-blue-500 glow-cyan hover:scale-[1.02]">
            {loading ? "Joining…" : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  if (step === "avatar") {
    return (
      <div className="min-h-screen pb-28">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-heading font-bold text-white">Choose your avatar</span>
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-sm">
              <Coins className="w-4 h-4 text-neon-gold" />
              <span className="text-neon-gold font-bold">{wallet ? wallet.coins : "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 w-40" />
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
            <button onClick={() => setActiveCol("all")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeCol === "all" ? "bg-white text-black" : "bg-white/5 text-white/60"}`}>All</button>
            {COLLECTIONS.map((c) => (
              <button key={c.id} onClick={() => setActiveCol(c.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${activeCol === c.id ? "text-white" : "text-white/50 border-transparent"}`} style={activeCol === c.id ? { background: c.color, borderColor: c.color } : {}}>{c.name}</button>
            ))}
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {filtered.map((a) => {
            const taken = isTaken(a);
            const locked = isLocked(a);
            const isSel = selected?.id === a.id;
            return (
              <button
                key={a.id}
                disabled={taken || locked}
                onClick={() => setSelected(a)}
                className={`relative rounded-2xl p-2 border transition-all ${isSel ? "border-neon-cyan scale-105 glow-cyan" : taken ? "border-white/5 opacity-40" : "border-white/10 hover:border-white/30 hover:scale-105"}`}
                style={{ background: isSel ? `${a.color}22` : "rgba(255,255,255,0.03)" }}
              >
                <div className="aspect-square flex items-center justify-center">
                  <AvatarSvg avatar={a} size={64} glow={isSel} />
                </div>
                <div className="text-[10px] text-white/80 truncate text-center mt-1">{a.name}</div>
                <div className="text-[9px] text-center font-bold" style={{ color: RARITY_COLORS[a.rarity] }}>{a.rarity}</div>
                {taken && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl"><span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5"><Lock className="w-3 h-3" /> TAKEN</span></div>}
                {locked && !taken && <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl"><Lock className="w-4 h-4 text-neon-gold" /></div>}
                {isSel && <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neon-cyan text-black flex items-center justify-center"><Check className="w-4 h-4" /></div>}
              </button>
            );
          })}
        </div>

        {/* confirm bar */}
        <div className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-background/80 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {selected ? <AvatarSvg avatar={selected} size={48} glow /> : <div className="w-12 h-12 rounded-2xl bg-white/5" />}
              <div className="min-w-0">
                <div className="text-white font-semibold truncate">{selected ? selected.name : "No avatar selected"}</div>
                <div className="text-xs text-white/50 truncate">{selected ? `${selected.collectionName} · ${selected.rarity}` : "Pick one from the grid"}</div>
              </div>
            </div>
            <button onClick={confirmAvatar} disabled={!selected || reserving} className="btn-glow px-6 py-3 text-white bg-gradient-to-r from-neon-lime to-emerald-500 hover:scale-105">
              {reserving ? "Reserving…" : <><Check className="w-4 h-4" /> Confirm Avatar</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // done — waiting in lobby
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <div className="animate-pop"><AvatarSvg avatar={selected} size={120} glow /></div>
      <h2 className="mt-4 text-2xl font-heading font-bold text-white">You're in, {name}!</h2>
      <p className="text-white/60 mt-1">Waiting for the host to start the game…</p>
      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
      <p className="text-white/30 text-xs mt-6">Keep this tab open. The game starts automatically.</p>
    </div>
  );
}

export default JoinComponent;