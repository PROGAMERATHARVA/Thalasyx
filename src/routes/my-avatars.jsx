import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getWallet } from "@/lib/server-fns";
import { getOwnerKey, getSession } from "@/lib/wallet";
import { AVATARS, PAID_COLLECTIONS, RARITY_COLORS } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import { ArrowLeft, Coins, Sparkles, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/my-avatars")({
  ssr: false,
  head: () => ({ meta: [{ title: "My Avatars — BREATH LIVE QUIZ" }] }),
  component: MyAvatarsComponent,
});

function MyAvatarsComponent() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getOwnerKey();
    const s = getSession();
    getWallet({ data: { owner_key: key, token: s?.token } })
      .then(setWallet)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const owned = wallet?.owned_avatars || [];
  const groups = PAID_COLLECTIONS.map((col) => {
    const mine = AVATARS.filter((a) => a.collection === col.id && owned.includes(a.id));
    return { col, mine };
  }).filter((g) => g.mine.length > 0);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white hidden sm:block">My Avatars</span>
            <Link to="/shop" className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><Sparkles className="w-4 h-4" /> Shop</Link>
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <Coins className="w-4 h-4 text-neon-gold" />
              <span className="text-neon-gold font-heading font-bold">{wallet ? wallet.coins : "…"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-extrabold gradient-text">My Collection</h1>
          <p className="text-white/60 mt-2 text-sm">
            {loading ? "Loading…" : <><span className="text-neon-cyan font-bold">{owned.length}</span> avatars unlocked</>}
          </p>
        </div>

        {!loading && owned.length === 0 && (
          <div className="panel p-10 text-center max-w-md mx-auto">
            <LayoutGrid className="w-8 h-8 mx-auto text-white/30 mb-3" />
            <p className="text-white/70 font-heading font-semibold">No avatars unlocked yet</p>
            <p className="text-white/50 text-sm mt-1">Earn coins in live games, then unlock random avatars from packs in the Shop.</p>
            <Link to="/shop" className="mt-5 inline-flex btn-glow px-6 py-2.5 text-white bg-gradient-to-r from-neon-gold to-orange-500"><Sparkles className="w-4 h-4" /> Visit the Shop</Link>
          </div>
        )}

        <div className="space-y-8">
          {groups.map(({ col, mine }) => {
            const members = AVATARS.filter((a) => a.collection === col.id);
            return (
              <section key={col.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: col.color }} />
                    <h2 className="font-heading font-bold text-white">{col.name}</h2>
                  </div>
                  <span className="text-sm text-white/50 font-heading font-semibold">{mine.length}/{members.length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                  {mine.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-white/10 p-2 bg-white/[0.03] hover:scale-105 transition-transform">
                      <div className="aspect-square flex items-center justify-center">
                        <AvatarSvg avatar={a} size={64} glow={a.rarity === "Legendary" || a.rarity === "Mythic"} />
                      </div>
                      <div className="text-[10px] text-white/80 truncate text-center mt-1">{a.name}</div>
                      <div className="text-[9px] text-center font-bold" style={{ color: RARITY_COLORS[a.rarity] }}>{a.rarity}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default MyAvatarsComponent;