// Original vector-style avatars across themed collections.
// The first 10 collections are free "starter" packs; the seasonal packs are
// unlocked with coins in the Shop (pack or per-avatar purchases).
// Each avatar is rendered procedurally by AvatarSvg.jsx from this config.

export const COLLECTIONS = [
  { id: "cosmic", name: "Cosmic Creatures", color: "#9d00ff", glow: "glow-violet", price: 0 },
  { id: "cyber", name: "Cyber Characters", color: "#00f5ff", glow: "glow-cyan", price: 0 },
  { id: "elemental", name: "Elemental Beasts", color: "#ff8c00", glow: "glow-cyan", price: 0 },
  { id: "wild", name: "Wild Adventurers", color: "#39ff14", glow: "glow-lime", price: 0 },
  { id: "spooky", name: "Spooky Squad", color: "#b400ff", glow: "glow-violet", price: 0 },
  { id: "snack", name: "Snack Attack", color: "#ff007f", glow: "glow-pink", price: 0 },
  { id: "monster", name: "Monster Mayhem", color: "#ff3b3b", glow: "glow-pink", price: 0 },
  { id: "royal", name: "Royal Collectibles", color: "#ffd700", glow: "glow-gold", price: 0 },
  { id: "speed", name: "Speed Racers", color: "#3b9bff", glow: "glow-cyan", price: 0 },
  { id: "mythic", name: "Mythic Legends", color: "#ff00d4", glow: "glow-pink", price: 0 },
  // ── coin packs ──
  { id: "winter", name: "Winter Wonderland", color: "#7dd3fc", glow: "glow-cyan", price: 250 },
  { id: "autumn", name: "Autumn Grove", color: "#f97316", glow: "glow-gold", price: 200 },
  { id: "spring", name: "Spring Blossom", color: "#4ade80", glow: "glow-lime", price: 200 },
  { id: "summer", name: "Summer Splash", color: "#fbbf24", glow: "glow-gold", price: 200 },
  { id: "halloween", name: "Halloween Haunt", color: "#ff6a00", glow: "glow-violet", price: 300 },
  { id: "ocean", name: "Ocean Depths", color: "#22d3ee", glow: "glow-cyan", price: 250 },
  { id: "dino", name: "Dino Discovery", color: "#84cc16", glow: "glow-lime", price: 250 },
  { id: "music", name: "Music Makers", color: "#f472b6", glow: "glow-pink", price: 250 },
];

export const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

export const RARITY_COLORS = {
  Common: "#9ca3af",
  Uncommon: "#39ff14",
  Rare: "#00f5ff",
  Epic: "#ff007f",
  Legendary: "#ffd700",
  Mythic: "#ff00d4",
};

// ── coin economy ──
export const COINS_PER_CORRECT = 10;
export const STARTING_COINS = 100;

export const RARITY_PRICE = {
  Common: 40,
  Uncommon: 60,
  Rare: 100,
  Epic: 180,
  Legendary: 300,
  Mythic: 500,
};

export function avatarPrice(rarity) {
  return RARITY_PRICE[rarity] ?? 100;
}

export const PAID_COLLECTIONS = COLLECTIONS.filter((c) => c.price > 0);

// Compact definitions: name + visual DNA per avatar.
const RAW = {
  cosmic: [
    ["Nova", "#7c3aed", "#e9d5ff", "star", "smile", "antenna", "blob", "Rare"],
    ["Comet", "#4338ca", "#a5b4fc", "wink", "open", "none", "round", "Common"],
    ["Nebula", "#9333ea", "#f0abfc", "happy", "smile", "halo", "blob", "Uncommon"],
    ["Pulsar", "#6d28d9", "#c4b5fd", "cool", "neutral", "antenna", "star", "Rare"],
    ["Quasar", "#5b21b6", "#ddd6fe", "star", "open", "none", "diamond", "Epic"],
    ["Orbit", "#7e22ce", "#e9d5ff", "round", "smile", "antenna", "round", "Common"],
    ["Meteor", "#6366f1", "#c7d2fe", "happy", "fang", "none", "blob", "Uncommon"],
    ["Stardust", "#8b5cf6", "#ede9fe", "wink", "smile", "halo", "star", "Common"],
    ["Galaxy", "#7c3aed", "#f3e8ff", "cool", "open", "antenna", "blob", "Legendary"],
    ["Eclipse", "#4c1d95", "#a78bfa", "star", "neutral", "none", "round", "Mythic"],
  ],
  cyber: [
    ["Pixel", "#0891b2", "#67e8f9", "square", "neutral", "antenna", "square", "Common"],
    ["Glitch", "#0e7490", "#a5f3fc", "cool", "open", "none", "square", "Uncommon"],
    ["Volt", "#155e75", "#cffafe", "star", "fang", "antenna", "diamond", "Rare"],
    ["Circuit", "#0d9488", "#5eead4", "round", "smile", "none", "square", "Common"],
    ["Byte", "#0c4a6e", "#bae6fd", "happy", "neutral", "antenna", "round", "Uncommon"],
    ["Bot", "#0e7490", "#a5f3fc", "square", "smile", "antenna", "square", "Common"],
    ["Neon", "#06b6d4", "#67e8f9", "cool", "open", "none", "diamond", "Rare"],
    ["Spark", "#0891b2", "#cffafe", "wink", "fang", "none", "blob", "Common"],
    ["Matrix", "#0c7377", "#7dd3fc", "star", "neutral", "antenna", "square", "Epic"],
    ["Echo", "#155e75", "#a5f3fc", "happy", "smile", "none", "round", "Legendary"],
  ],
  elemental: [
    ["Blaze", "#dc2626", "#fecaca", "happy", "fang", "flames", "blob", "Rare"],
    ["Ember", "#ea580c", "#fed7aa", "wink", "open", "none", "round", "Common"],
    ["Frost", "#0284c7", "#bae6fd", "cool", "neutral", "none", "diamond", "Uncommon"],
    ["Tide", "#0369a1", "#bae6fd", "round", "smile", "none", "blob", "Common"],
    ["Quake", "#a16207", "#fde68a", "happy", "fang", "none", "square", "Uncommon"],
    ["Gust", "#0ea5e9", "#e0f2fe", "star", "open", "none", "blob", "Rare"],
    ["Magma", "#b91c1c", "#fecaca", "cool", "fang", "flames", "blob", "Epic"],
    ["Glacier", "#0c4a6e", "#e0f2fe", "happy", "neutral", "none", "diamond", "Common"],
    ["Storm", "#1d4ed8", "#bfdbfe", "star", "open", "none", "round", "Legendary"],
    ["Cinder", "#c2410c", "#fed7aa", "wink", "smile", "flames", "blob", "Common"],
  ],
  wild: [
    ["Safari", "#65a30d", "#d9f99d", "happy", "smile", "hat", "round", "Common"],
    ["Ranger", "#4d7c0f", "#bef264", "cool", "neutral", "hat", "blob", "Uncommon"],
    ["Trail", "#15803d", "#bbf7d0", "round", "open", "none", "blob", "Common"],
    ["Compass", "#16a34a", "#dcfce7", "star", "smile", "hat", "diamond", "Rare"],
    ["Boots", "#3f6212", "#d9f99d", "wink", "fang", "none", "round", "Common"],
    ["Map", "#65a30d", "#ecfccb", "happy", "neutral", "hat", "blob", "Uncommon"],
    ["Forest", "#15803d", "#bbf7d0", "cool", "smile", "none", "round", "Common"],
    ["Peak", "#4d7c0f", "#d9f99d", "star", "open", "hat", "diamond", "Rare"],
    ["River", "#16a34a", "#dcfce7", "round", "smile", "none", "blob", "Epic"],
    ["Scout", "#3f6212", "#bef264", "happy", "fang", "hat", "round", "Legendary"],
  ],
  spooky: [
    ["Boo", "#6b21a8", "#e9d5ff", "happy", "open", "none", "ghost", "Common"],
    ["Spook", "#7e22ce", "#f3e8ff", "wink", "smile", "none", "ghost", "Uncommon"],
    ["Wraith", "#581c87", "#ddd6fe", "cool", "neutral", "none", "ghost", "Rare"],
    ["Hex", "#7c3aed", "#ede9fe", "star", "fang", "hat", "ghost", "Uncommon"],
    ["Vex", "#6d28d9", "#e9d5ff", "round", "open", "none", "ghost", "Common"],
    ["Shade", "#5b21b6", "#c4b5fd", "happy", "smile", "none", "ghost", "Common"],
    ["Bones", "#7e22ce", "#f3e8ff", "cool", "neutral", "none", "ghost", "Uncommon"],
    ["Phantom", "#4c1d95", "#ddd6fe", "star", "open", "halo", "ghost", "Epic"],
    ["Mist", "#6b21a8", "#e9d5ff", "wink", "smile", "none", "ghost", "Rare"],
    ["Gloom", "#581c87", "#c4b5fd", "happy", "fang", "none", "ghost", "Legendary"],
  ],
  snack: [
    ["Pickle", "#65a30d", "#bef264", "happy", "smile", "none", "blob", "Common"],
    ["Bao", "#f8fafc", "#fde68a", "round", "open", "none", "round", "Uncommon"],
    ["Pretzel", "#a16207", "#fde68a", "cool", "neutral", "none", "diamond", "Common"],
    ["Boba", "#92400e", "#fde68a", "star", "smile", "none", "round", "Rare"],
    ["Waffle", "#d97706", "#fef3c7", "happy", "open", "none", "square", "Common"],
    ["Taco", "#ca8a04", "#fef9c3", "wink", "fang", "none", "blob", "Uncommon"],
    ["Mochi", "#f9a8d4", "#fce7f3", "round", "smile", "none", "round", "Common"],
    ["Pudding", "#fbbf24", "#fef9c3", "happy", "neutral", "none", "round", "Uncommon"],
    ["Noodle", "#f59e0b", "#fef3c7", "star", "open", "none", "blob", "Epic"],
    ["Cookie", "#b45309", "#fde68a", "cool", "smile", "none", "round", "Legendary"],
  ],
  monster: [
    ["Chomp", "#be123c", "#fecdd3", "happy", "fang", "horns", "blob", "Common"],
    ["Gnash", "#9f1239", "#fda4af", "cool", "fang", "horns", "round", "Uncommon"],
    ["Snarl", "#b91c1c", "#fecaca", "star", "open", "horns", "blob", "Rare"],
    ["Chatter", "#be185d", "#fbcfe8", "round", "smile", "none", "blob", "Common"],
    ["Gobble", "#a21caf", "#f5d0fe", "happy", "fang", "horns", "round", "Uncommon"],
    ["Munch", "#c026d3", "#fae8ff", "wink", "open", "none", "blob", "Common"],
    ["Crunch", "#9d174d", "#fbcfe8", "cool", "fang", "horns", "diamond", "Rare"],
    ["Slurp", "#be123c", "#fecdd3", "star", "smile", "none", "round", "Epic"],
    ["Growl", "#86198f", "#f5d0fe", "happy", "fang", "horns", "blob", "Uncommon"],
    ["Bellow", "#701a75", "#fae8ff", "star", "open", "horns", "blob", "Legendary"],
  ],
  royal: [
    ["Rex", "#b45309", "#fde68a", "cool", "smile", "crown", "round", "Rare"],
    ["Duchess", "#a16207", "#fef3c7", "happy", "neutral", "crown", "blob", "Uncommon"],
    ["Baron", "#92400e", "#fde68a", "star", "open", "crown", "round", "Common"],
    ["Crown", "#ca8a04", "#fef9c3", "round", "smile", "crown", "diamond", "Rare"],
    ["Jewel", "#b45309", "#fef3c7", "wink", "neutral", "crown", "blob", "Uncommon"],
    ["Scepter", "#a16207", "#fde68a", "happy", "smile", "crown", "round", "Common"],
    ["Throne", "#92400e", "#fef3c7", "cool", "open", "crown", "square", "Epic"],
    ["Velvet", "#ca8a04", "#fde68a", "star", "smile", "crown", "blob", "Uncommon"],
    ["Regal", "#b45309", "#fef3c7", "happy", "neutral", "crown", "round", "Legendary"],
    ["Noble", "#a16207", "#fde68a", "round", "open", "crown", "diamond", "Mythic"],
  ],
  speed: [
    ["Turbo", "#1d4ed8", "#bfdbfe", "cool", "smile", "hat", "diamond", "Common"],
    ["Dash", "#1e40af", "#dbeafe", "happy", "open", "none", "blob", "Uncommon"],
    ["Zoom", "#2563eb", "#bfdbfe", "star", "smile", "hat", "diamond", "Rare"],
    ["Bolt", "#1e3a8a", "#e0f2fe", "wink", "fang", "none", "round", "Common"],
    ["Nitro", "#1d4ed8", "#dbeafe", "cool", "neutral", "hat", "blob", "Uncommon"],
    ["Rev", "#2563eb", "#bfdbfe", "round", "open", "none", "diamond", "Common"],
    ["Swift", "#1e40af", "#e0f2fe", "happy", "smile", "hat", "blob", "Rare"],
    ["Velocity", "#1d4ed8", "#dbeafe", "star", "neutral", "none", "round", "Epic"],
    ["Mach", "#1e3a8a", "#bfdbfe", "cool", "open", "hat", "diamond", "Uncommon"],
    ["Sonic", "#2563eb", "#e0f2fe", "happy", "fang", "none", "blob", "Legendary"],
  ],
  mythic: [
    ["Phoenix", "#ea580c", "#fed7aa", "star", "open", "flames", "blob", "Epic"],
    ["Dragon", "#16a34a", "#bbf7d0", "cool", "fang", "horns", "blob", "Rare"],
    ["Griffin", "#a16207", "#fde68a", "happy", "smile", "none", "diamond", "Uncommon"],
    ["Hydra", "#15803d", "#bbf7d0", "star", "fang", "horns", "blob", "Rare"],
    ["Pegasus", "#f8fafc", "#e0f2fe", "round", "smile", "none", "diamond", "Uncommon"],
    ["Kraken", "#0c4a6e", "#bae6fd", "cool", "open", "none", "blob", "Epic"],
    ["Sphinx", "#ca8a04", "#fef3c7", "happy", "neutral", "none", "round", "Rare"],
    ["Valkyrie", "#dbeafe", "#bfdbfe", "star", "smile", "halo", "diamond", "Legendary"],
    ["Titan", "#7c2d12", "#fed7aa", "cool", "fang", "horns", "square", "Mythic"],
    ["Oracle", "#9333ea", "#f3e8ff", "star", "open", "halo", "blob", "Mythic"],
  ],
  // ── coin packs ──
  winter: [
    ["Snowball", "#0ea5e9", "#e0f2fe", "happy", "smile", "hat", "round", "Common"],
    ["Frostbite", "#0369a1", "#bae6fd", "cool", "fang", "none", "blob", "Uncommon"],
    ["Icicle", "#0284c7", "#e0f2fe", "wink", "neutral", "none", "diamond", "Common"],
    ["Blizzard", "#1d4ed8", "#dbeafe", "star", "open", "none", "star", "Rare"],
    ["Waddles", "#0c4a6e", "#f8fafc", "happy", "smile", "none", "round", "Uncommon"],
    ["Aurora", "#7c3aed", "#e9d5ff", "star", "smile", "halo", "blob", "Epic"],
    ["Mitten", "#be123c", "#fecdd3", "happy", "open", "hat", "square", "Common"],
    ["Sled", "#475569", "#e2e8f0", "cool", "neutral", "hat", "round", "Common"],
    ["Pine", "#166534", "#bbf7d0", "wink", "smile", "hat", "blob", "Rare"],
    ["Yeti", "#f8fafc", "#e0f2fe", "happy", "fang", "none", "blob", "Legendary"],
  ],
  autumn: [
    ["Acorn", "#92400e", "#fde68a", "happy", "smile", "hat", "round", "Common"],
    ["Maple", "#dc2626", "#fecaca", "wink", "open", "none", "diamond", "Uncommon"],
    ["Gourd", "#ea580c", "#fed7aa", "happy", "open", "hat", "round", "Common"],
    ["Cider", "#b45309", "#fef3c7", "cool", "smile", "none", "blob", "Uncommon"],
    ["Hayride", "#a16207", "#fde68a", "star", "neutral", "hat", "square", "Rare"],
    ["Scarecrow", "#65a30d", "#d9f99d", "happy", "smile", "hat", "blob", "Rare"],
    ["Falling", "#b91c1c", "#fecaca", "wink", "fang", "none", "round", "Common"],
    ["Harvest", "#ca8a04", "#fef9c3", "round", "smile", "hat", "blob", "Uncommon"],
    ["Walnut", "#78350f", "#fde68a", "cool", "neutral", "none", "round", "Common"],
    ["Cornucopia", "#d97706", "#fef3c7", "star", "open", "crown", "diamond", "Legendary"],
  ],
  spring: [
    ["Blossom", "#f9a8d4", "#fce7f3", "happy", "smile", "antenna", "round", "Common"],
    ["Petal", "#f472b6", "#fbcfe8", "wink", "open", "antenna", "blob", "Uncommon"],
    ["Sprout", "#22c55e", "#dcfce7", "happy", "smile", "antenna", "blob", "Common"],
    ["Daisy", "#f8fafc", "#fce7f3", "star", "neutral", "halo", "diamond", "Rare"],
    ["Bumble", "#facc15", "#fef9c3", "cool", "fang", "antenna", "round", "Uncommon"],
    ["Tulip", "#e11d48", "#fecdd3", "happy", "open", "antenna", "round", "Common"],
    ["Dewdrop", "#38bdf8", "#e0f2fe", "wink", "smile", "none", "round", "Common"],
    ["Willow", "#4d7c0f", "#d9f99d", "cool", "neutral", "antenna", "blob", "Uncommon"],
    ["Cherry", "#fb7185", "#fecdd3", "star", "smile", "halo", "blob", "Epic"],
    ["Rainbow", "#8b5cf6", "#ede9fe", "star", "open", "halo", "diamond", "Legendary"],
  ],
  summer: [
    ["Sunny", "#fbbf24", "#fef9c3", "happy", "smile", "none", "round", "Common"],
    ["Beachy", "#0ea5e9", "#e0f2fe", "wink", "open", "hat", "blob", "Uncommon"],
    ["Surf", "#2563eb", "#bfdbfe", "cool", "smile", "hat", "round", "Common"],
    ["Sorbet", "#fb7185", "#fecdd3", "happy", "open", "none", "blob", "Common"],
    ["Palm", "#16a34a", "#dcfce7", "star", "smile", "hat", "diamond", "Rare"],
    ["Sailor", "#1d4ed8", "#dbeafe", "cool", "neutral", "hat", "round", "Uncommon"],
    ["Melon", "#f97316", "#fed7aa", "happy", "fang", "none", "blob", "Uncommon"],
    ["Wave", "#06b6d4", "#cffafe", "wink", "neutral", "none", "diamond", "Common"],
    ["Sunburn", "#dc2626", "#fecaca", "cool", "open", "hat", "round", "Rare"],
    ["Firework", "#9333ea", "#f3e8ff", "star", "open", "none", "star", "Legendary"],
  ],
  halloween: [
    ["Jack", "#ea580c", "#fed7aa", "happy", "fang", "hat", "round", "Rare"],
    ["Witchy", "#7e22ce", "#e9d5ff", "wink", "smile", "hat", "blob", "Uncommon"],
    ["Candy", "#ff007f", "#fce7f3", "happy", "open", "crown", "round", "Common"],
    ["Reaper", "#334155", "#cbd5e1", "cool", "neutral", "hat", "ghost", "Epic"],
    ["Bat", "#4c1d95", "#c4b5fd", "star", "fang", "none", "blob", "Uncommon"],
    ["Cobweb", "#64748b", "#e2e8f0", "round", "smile", "none", "round", "Common"],
    ["Gourdling", "#ca8a04", "#fef3c7", "happy", "open", "hat", "diamond", "Common"],
    ["Fang", "#7f1d1d", "#fecaca", "cool", "fang", "crown", "blob", "Rare"],
    ["Potion", "#a855f7", "#f3e8ff", "star", "smile", "none", "blob", "Rare"],
    ["Fullmoon", "#fbbf24", "#fef9c3", "star", "open", "halo", "round", "Legendary"],
  ],
  ocean: [
    ["Bubbles", "#0ea5e9", "#e0f2fe", "happy", "open", "none", "round", "Common"],
    ["Coral", "#fb7185", "#fecdd3", "wink", "smile", "antenna", "blob", "Uncommon"],
    ["Pearl", "#f8fafc", "#e0f2fe", "happy", "neutral", "halo", "round", "Rare"],
    ["Inky", "#312e81", "#c7d2fe", "cool", "open", "none", "blob", "Uncommon"],
    ["Kelp", "#15803d", "#bbf7d0", "happy", "smile", "none", "blob", "Common"],
    ["Finn", "#2563eb", "#bfdbfe", "cool", "fang", "none", "diamond", "Rare"],
    ["Shellby", "#fbbf24", "#fef9c3", "wink", "smile", "none", "round", "Common"],
    ["Tidepool", "#0891b2", "#cffafe", "star", "open", "antenna", "blob", "Epic"],
    ["Angler", "#1e3a8a", "#dbeafe", "star", "fang", "antenna", "round", "Legendary"],
    ["Marina", "#22d3ee", "#cffafe", "happy", "smile", "none", "round", "Uncommon"],
  ],
  dino: [
    ["Scales", "#16a34a", "#bbf7d0", "happy", "fang", "none", "blob", "Common"],
    ["Stompy", "#65a30d", "#d9f99d", "cool", "open", "none", "square", "Uncommon"],
    ["Tricey", "#0d9488", "#99f6e4", "happy", "smile", "horns", "round", "Rare"],
    ["Raptor", "#4d7c0f", "#bef264", "star", "fang", "none", "blob", "Uncommon"],
    ["Bronto", "#2563eb", "#bfdbfe", "happy", "neutral", "none", "blob", "Common"],
    ["Wings", "#7c3aed", "#e9d5ff", "wink", "open", "horns", "diamond", "Rare"],
    ["Eggy", "#ca8a04", "#fef9c3", "happy", "smile", "none", "round", "Common"],
    ["Chomper", "#b91c1c", "#fecaca", "cool", "fang", "horns", "blob", "Epic"],
    ["Fossil", "#78716c", "#e7e5e4", "cool", "neutral", "none", "square", "Uncommon"],
    ["Tyrant", "#7c2d12", "#fed7aa", "star", "fang", "crown", "blob", "Legendary"],
  ],
  music: [
    ["Melody", "#f472b6", "#fbcfe8", "happy", "smile", "none", "round", "Common"],
    ["Tempo", "#8b5cf6", "#ede9fe", "cool", "neutral", "crown", "blob", "Uncommon"],
    ["Bassline", "#1e40af", "#dbeafe", "star", "fang", "none", "square", "Rare"],
    ["Lyric", "#fb7185", "#fecdd3", "wink", "smile", "halo", "round", "Common"],
    ["Riff", "#ea580c", "#fed7aa", "cool", "open", "crown", "diamond", "Uncommon"],
    ["Chord", "#22c55e", "#dcfce7", "happy", "open", "none", "blob", "Common"],
    ["Aria", "#9333ea", "#f3e8ff", "star", "smile", "crown", "blob", "Epic"],
    ["Drummer", "#78716c", "#e7e5e4", "happy", "fang", "hat", "round", "Uncommon"],
    ["Vinyl", "#0f172a", "#e2e8f0", "cool", "smile", "none", "round", "Rare"],
    ["Maestro", "#a16207", "#fde68a", "star", "open", "crown", "diamond", "Legendary"],
  ],
};

export const AVATARS = [];
let counter = 1;
for (const col of COLLECTIONS) {
  for (const def of RAW[col.id]) {
    const [name, body, accent, eye, mouth, accessory, shape, rarity] = def;
    AVATARS.push({
      id: `av${String(counter).padStart(3, "0")}`,
      num: counter,
      name,
      collection: col.id,
      collectionName: col.name,
      color: col.color,
      body,
      accent,
      eye,
      mouth,
      accessory,
      shape,
      rarity,
      pack_price: col.price || 0,
      price: col.price ? avatarPrice(rarity) : 0,
    });
    counter += 1;
  }
}

export function getAvatar(id) {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}

export function collectionById(id) {
  return COLLECTIONS.find((c) => c.id === id);
}