import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AVATARS, COLLECTIONS, RARITIES, RARITY_COLORS, getAvatar } from "@/lib/avatars";
import { AvatarSvg } from "@/components/AvatarSvg";
import { ArrowLeft, Search, X, Check, Crown } from "lucide-react";

export const Route = createFileRoute("/avatars")({
  head: () => ({ meta: [{ title: "Avatar Collection — BREATH LIVE QUIZ" }] }),
  component: AvatarsComponent,
});

function AvatarsComponent() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCol, setActiveCol] = useState("all");
  const [activeRarity, setActiveRarity] = useState("all");
  const [preview, setPreview] = useState(null);

  const filtered = AVATARS.filter((a) => {
    if (activeCol !== "all" && a.collection !== activeCol) return false;
    if (activeRarity !== "all" && a.rarity !== activeRarity) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate({ to: "/" })} className="text-white/60 hover:text-white flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Home</button>
          <span className="font-heading font-bold text-white">100 Avatar Collection</span>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search avatars…" className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 w-36 sm:w-48" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
          <button onClick={() => setActiveCol("all")} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${activeCol === "all" ? "bg-white text-black" : "bg-white/5 text-white/60"}`}>All</button>
          {COLLECTIONS.map((c) => (
            <button key={c.id} onClick={() => setActiveCol(c.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${activeCol === c.id ? "text-white" : "text-white/50 border-transparent"}`} style={activeCol === c.id ? { background: c.color, borderColor: c.color } : {}}>{c.name}</button>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-1.5 overflow-x-auto">
          <button onClick={() => setActiveRarity("all")} className={`px-2.5 py-0.5 rounded-full text-[11px] ${activeRarity === "all" ? "bg-white/20 text-white" : "text-white/40"}`}>All rarities</button>
          {RARITIES.map((r) => (
            <button key={r} onClick={() => setActiveRarity(r)} className={`px-2.5 py-0.5 rounded-full text-[11px] border ${activeRarity === r ? "text-white" : "text-white/40 border-transparent"}`} style={activeRarity === r ? { background: RARITY_COLORS[r], borderColor: RARITY_COLORS[r], color: "#0b0b1a" } : {}}>{r}</button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="text-white/50 text-sm mb-3">{filtered.length} avatars</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => setPreview(a)} className="group relative rounded-2xl p-2 border border-white/10 hover:border-white/30 hover:scale-105 transition-all" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="aspect-square flex items-center justify-center"><AvatarSvg avatar={a} size={64} /></div>
              <div className="text-[10px] text-white/80 truncate text-center mt-1">{a.name}</div>
              <div className="text-[9px] text-center font-bold" style={{ color: RARITY_COLORS[a.rarity] }}>{a.rarity}</div>
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="panel p-6 max-w-sm w-full text-center animate-pop" onClick={(e) => e.stopPropagation()} style={{ borderColor: preview.color + "66" }}>
            <button onClick={() => setPreview(null)} className="absolute top-3 right-3 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex justify-center mb-3"><AvatarSvg avatar={preview} size={140} glow /></div>
            <h3 className="text-xl font-heading font-bold text-white">{preview.name}</h3>
            <p className="text-white/50 text-sm">{preview.collectionName}</p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: RARITY_COLORS[preview.rarity] + "22", color: RARITY_COLORS[preview.rarity] }}>{preview.rarity}</div>
            <div className="text-white/40 text-xs mt-3">ID: {preview.id} · #{preview.num}</div>
            <button onClick={() => navigate({ to: "/" })} className="mt-5 w-full btn-glow px-5 py-3 text-white bg-gradient-to-r from-neon-cyan to-blue-500">Back to Home</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarsComponent;