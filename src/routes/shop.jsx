import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buyPack, getWallet } from "@/lib/server-fns";
import { getOwnerKey, getSession } from "@/lib/wallet";
import { AVATARS, COINS_PER_CORRECT, PAID_COLLECTIONS, getAvatar } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import { ArrowLeft, Check, Coins, ShoppingBag, Sparkles, LayoutGrid, Lock } from "lucide-react";
import { RARITY_COLORS } from "@/lib/avatars";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({
  ssr: false,
  head: () => ({ meta: [{ title: "Avatar Shop — BREATH LIVE QUIZ" }] }),
  component: ShopComponent,
});

function ShopComponent() {
  const [wallet, setWallet] = useState(null);
  const [ownerKey, setOwnerKey] = useState("");
  const [busy, setBusy] = useState("");
  const [won, setWon] = useState(null); // avatar just unlocked

  useEffect(() => {
    const key = getOwnerKey();
    setOwnerKey(key);
    const s = getSession();
    getWallet({ data: { owner_key: key, token: s?.token } }).then(setWallet).catch(() => {});
  }, []);

  const refresh = async () => {
    const s = getSession();
    try {
      setWallet(await getWallet({ data: { owner_key: ownerKey, token: s?.token } }));
    } catch { /* keep old wallet on screen */ }
  };

  const owned = wallet?.owned_avatars || [];

  const doBuyPack = async (col) => {
    setBusy(col.id);
    try {
      const s = getSession();
      const w = await buyPack({ data: { owner_key: ownerKey, token: s?.token, collection_id: col.id } });
      setWallet(w);
      setWon(w.won);
    } catch (e) {
      if (e.code === "NOT_ENOUGH_COINS") toast.error("Not enough coins — answer questions to earn more!");
      else if (e.code === "COLLECTION_COMPLETE") toast.error("You've collected this whole pack!");
      else toast.error(e.message || "Purchase failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <div className="flex items-center gap-2">
            <Link to="/my-avatars" className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><LayoutGrid className="w-4 h-4" /> My Avatars</Link>
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <Coins className="w-4 h-4 text-neon-gold" />
              <span className="text-neon-gold font-heading font-bold">{wallet ? wallet.coins : "…"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold gradient-text">Unlock Random Avatars</h1>
          <p className="text-white/60 mt-2 max-w-lg mx-auto text-sm">
            Earn <span className="text-neon-gold font-bold">{COINS_PER_CORRECT} coins</span> for every correct answer in a live game.
            Each pack unlock draws <span className="text-white font-semibold">one random avatar</span> from that pack — and the
            <span className="text-neon-gold font-semibold"> more coins you're holding</span>, the luckier your odds for Epic, Legendary &amp; Mythic.
          </p>
        </div>

        {/* coin packs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAID_COLLECTIONS.map((col) => {
            const members = AVATARS.filter((a) => a.collection === col.id);
            const ownedCount = members.filter((a) => owned.includes(a.id)).length;
            const complete = ownedCount >= members.length;
            return (
              <div key={col.id} className="panel p-4 flex flex-col" style={{ borderColor: col.color + "55" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-heading font-bold text-white">{col.name}</div>
                    <div className="text-xs text-white/50">{members.length} avatars · up to Mythic</div>
                  </div>
                  <ShoppingBag className="w-5 h-5" style={{ color: col.color }} />
                </div>
                <div className="flex justify-center gap-2 mb-3">
                  {members.slice(0, 3).map((a) => (
                    <div key={a.id} className="rounded-2xl bg-white/5 p-1.5">
                      <AvatarSvg avatar={a} size={52} />
                    </div>
                  ))}
                  {ownedCount > 0 && (
                    <div className="rounded-2xl bg-neon-lime/10 border border-neon-lime/30 px-2 flex flex-col items-center justify-center">
                      <span className="text-neon-lime font-heading font-bold text-lg leading-none">{ownedCount}</span>
                      <span className="text-[9px] text-neon-lime/70">collected</span>
                    </div>
                  )}
                </div>
                {/* collection progress */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-lime transition-all" style={{ width: `${(ownedCount / members.length) * 100}%` }} />
                </div>
                {complete ? (
                  <div className="w-full btn-glow px-4 py-2.5 text-sm bg-neon-lime/15 text-neon-lime border border-neon-lime/40 justify-center">
                    <Check className="w-4 h-4" /> Collection complete
                  </div>
                ) : (
                  <button onClick={() => doBuyPack(col)} disabled={busy === col.id} className="w-full btn-glow px-4 py-2.5 text-sm text-white bg-gradient-to-r from-neon-gold to-orange-500 hover:scale-[1.02]">
                    {busy === col.id ? "Drawing…" : <><Sparkles className="w-4 h-4" /> Unlock random — {col.price}</>}
                  </button>
                )}
                <p className="mt-2 text-[10px] text-white/40 text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Low coins = duplicate risk · stack coins for new pulls
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* reveal modal */}
      {won && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setWon(null)}>
          <div className="panel p-8 text-center max-w-xs w-full animate-pop glow-gold" style={{ borderColor: RARITY_COLORS[won.rarity] + "88" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">You unlocked</div>
            <div className="flex justify-center">
              <div className="animate-pop">
                <AvatarSvg avatar={getAvatar(won.id)} size={140} glow />
              </div>
            </div>
            <div className="mt-3 text-2xl font-heading font-bold text-white">{won.name}</div>
            <div className="font-heading font-bold text-lg" style={{ color: RARITY_COLORS[won.rarity] }}>{won.rarity}</div>
            {won.duplicate && <div className="mt-2 inline-block text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full px-3 py-1">DUPLICATE — more coins means better pulls</div>}
            <button onClick={() => setWon(null)} className="mt-5 w-full btn-glow px-6 py-2.5 text-white bg-white/10 border border-white/10">Nice!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopComponent;