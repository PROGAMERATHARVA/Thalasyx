import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COLLECTIONS, AVATARS, COINS_PER_CORRECT, STARTING_COINS, getAvatar } from "@/lib/avatars";

// ───────────────────────── helpers ─────────────────────────

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function genKey() {
  return "pk_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const svc = (context) => context.getBase44().asServiceRole;

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`);
}

// get-or-create a wallet for an owner key ("acct:..." or "dev:...")
async function ensureWallet(b, ownerKey) {
  const w = await b.entities.Wallet.filter({ owner_key: ownerKey }, { limit: 1 });
  if (w.items.length > 0) return w.items[0];
  return b.entities.Wallet.create({ owner_key: ownerKey, coins: STARTING_COINS, owned_packs: [], owned_avatars: [] });
}

// resolve a wallet, verifying the session token for account wallets
async function resolveWallet(b, ownerKey, token) {
  if (ownerKey.startsWith("acct:")) {
    let acct = null;
    try {
      acct = await b.entities.Account.get(ownerKey.slice(5));
    } catch {
      acct = null;
    }
    if (!acct || !token || acct.token !== token) {
      throw Object.assign(new Error("Please log in again"), { status: 401, code: "BAD_SESSION" });
    }
    return ensureWallet(b, ownerKey);
  }
  return ensureWallet(b, ownerKey);
}

// ───────────────────────── accounts (lightweight username + password) ─────────────────────────

export const signup = createServerFn({ method: "POST" })
  .validator(z.object({
    username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and _ only"),
    password: z.string().min(4).max(64),
    device_key: z.string().optional(),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const uname = data.username.toLowerCase();
    const dup = await b.entities.Account.filter({ username: uname }, { limit: 1 });
    if (dup.items.length > 0) {
      throw Object.assign(new Error("That username is taken"), { status: 409, code: "USERNAME_TAKEN" });
    }
    const salt = genKey().slice(3);
    const password_hash = await hashPassword(data.password, salt);
    const token = genKey() + genKey();
    const acct = await b.entities.Account.create({ username: uname, password_hash, salt, token });
    // move this device's wallet into the new account (coins + owned packs/avatars)
    let walletData = { coins: STARTING_COINS, owned_packs: [], owned_avatars: [] };
    if (data.device_key) {
      const dev = await b.entities.Wallet.filter({ owner_key: `dev:${data.device_key}` }, { limit: 1 });
      if (dev.items.length > 0) {
        const d = dev.items[0];
        walletData = { coins: d.coins || STARTING_COINS, owned_packs: d.owned_packs || [], owned_avatars: d.owned_avatars || [] };
        await b.entities.Wallet.delete(d.id);
      }
    }
    const w = await b.entities.Wallet.create({ owner_key: `acct:${acct.id}`, ...walletData });
    return { account_id: acct.id, token, username: acct.username, coins: w.coins, owned_packs: w.owned_packs, owned_avatars: w.owned_avatars };
  });

export const login = createServerFn({ method: "POST" })
  .validator(z.object({ username: z.string().min(1).max(20), password: z.string().min(1).max(64) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const res = await b.entities.Account.filter({ username: data.username.toLowerCase() }, { limit: 1 });
    if (res.items.length === 0) {
      throw Object.assign(new Error("Wrong username or password"), { status: 401, code: "BAD_CREDENTIALS" });
    }
    const acct = res.items[0];
    const hash = await hashPassword(data.password, acct.salt || "");
    if (hash !== acct.password_hash) {
      throw Object.assign(new Error("Wrong username or password"), { status: 401, code: "BAD_CREDENTIALS" });
    }
    const token = genKey() + genKey();
    await b.entities.Account.update(acct.id, { token });
    const w = await ensureWallet(b, `acct:${acct.id}`);
    return { account_id: acct.id, token, username: acct.username, coins: w.coins, owned_packs: w.owned_packs || [], owned_avatars: w.owned_avatars || [] };
  });

export const getWallet = createServerFn({ method: "GET" })
  .validator(z.object({ owner_key: z.string().min(3), token: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const w = await resolveWallet(b, data.owner_key, data.token);
    return { coins: w.coins || 0, owned_packs: w.owned_packs || [], owned_avatars: w.owned_avatars || [] };
  });

// ── pack draw (gacha): each purchase unlocks ONE random avatar from the pack ──
// Luck scales with the buyer's coin balance: the more coins held, the higher the
// weight of Epic / Legendary / Mythic in the draw. Only avatars not yet owned
// can be drawn, so every purchase always grants a new one.
const DRAW_BASE = { Common: 55, Uncommon: 25, Rare: 12, Epic: 5, Legendary: 2.5, Mythic: 0.5 };
const DRAW_LUCK = { Common: 0, Uncommon: 0.1, Rare: 0.3, Epic: 0.6, Legendary: 1.1, Mythic: 2 };

export const buyPack = createServerFn({ method: "POST" })
  .validator(z.object({ owner_key: z.string().min(3), token: z.string().optional(), collection_id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const col = COLLECTIONS.find((c) => c.id === data.collection_id);
    if (!col || !col.price) throw Object.assign(new Error("That collection is not for sale"), { status: 400 });
    const w = await resolveWallet(b, data.owner_key, data.token);
    if ((w.coins || 0) < col.price) {
      throw Object.assign(new Error("Not enough coins"), { status: 402, code: "NOT_ENOUGH_COINS" });
    }
    const ownedAv = w.owned_avatars || [];
    const all = AVATARS.filter((a) => a.collection === col.id);
    const unowned = all.filter((a) => !ownedAv.includes(a.id));
    if (unowned.length === 0) {
      throw Object.assign(new Error("You've collected every avatar in this pack!"), { status: 409, code: "COLLECTION_COMPLETE" });
    }
    // weighted draw — coin balance boosts rare tiers (up to 4x boost at 2000+ coins)
    const boost = Math.min((w.coins || 0) / 500, 4);
    const drawFrom = (candidates) => {
      const weights = candidates.map((a) => DRAW_BASE[a.rarity] * (1 + boost * (DRAW_LUCK[a.rarity] || 0)));
      const total = weights.reduce((s, x) => s + x, 0);
      let roll = Math.random() * total;
      for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return candidates[i];
      }
      return candidates[candidates.length - 1];
    };
    // duplicate risk: the fewer coins you hold, the more likely the draw returns
    // an avatar you already own; 600+ coins = always a brand-new one
    const dupChance = Math.max(0, 600 - (w.coins || 0)) / 1000;
    const ownedInPack = all.filter((a) => ownedAv.includes(a.id));
    let won;
    let duplicate = false;
    if (ownedInPack.length > 0 && Math.random() < dupChance) {
      won = drawFrom(ownedInPack);
      duplicate = true;
    } else {
      won = drawFrom(unowned);
    }
    const newCoins = (w.coins || 0) - col.price;
    const newOwned = duplicate ? ownedAv : [...ownedAv, won.id];
    const packs = w.owned_packs || [];
    const newPacks = packs.includes(col.id) ? packs : [...packs, col.id];
    await b.entities.Wallet.update(w.id, { coins: newCoins, owned_packs: newPacks, owned_avatars: newOwned });
    return { coins: newCoins, owned_packs: newPacks, owned_avatars: newOwned, won: { id: won.id, name: won.name, rarity: won.rarity, duplicate } };
  });

// ───────────────────────── quiz CRUD (creator-key ownership, no sign-in) ─────────────────────────

export const createQuiz = createServerFn({ method: "POST" })
  .validator(z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    cover_emoji: z.string().max(20).optional(),
    creator_key: z.string().min(3),
    settings: z.object({
      sound: z.boolean().optional(),
      reveal_answers: z.boolean().optional(),
      progression: z.enum(["auto", "manual"]).optional(),
      player_limit: z.number().optional(),
      random_questions: z.boolean().optional(),
      random_answers: z.boolean().optional(),
      unique_avatars: z.boolean().optional(),
    }).optional(),
    questions: z.array(z.object({
      text: z.string().min(1).max(500),
      question_type: z.enum(["multiple_choice", "true_false"]).optional(),
      options: z.array(z.string().max(200)).max(6),
      correct_option: z.number(),
      timer_seconds: z.number().optional(),
      points: z.number().optional(),
      emoji: z.string().max(20).optional(),
    })).min(1).max(50),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const quiz = await b.entities.Quiz.create({
      title: data.title,
      description: data.description || "",
      cover_emoji: data.cover_emoji || "🎮",
      creator_key: data.creator_key,
      settings: data.settings || { progression: "manual", unique_avatars: true, reveal_answers: true, player_limit: 60 },
      question_count: data.questions.length,
    });
    const questions = await b.entities.Question.bulkCreate(
      data.questions.map((q, i) => ({
        quiz_id: quiz.id,
        question_index: i,
        text: q.text,
        question_type: q.question_type || "multiple_choice",
        options: q.question_type === "true_false" ? ["True", "False"] : q.options,
        correct_option: q.correct_option,
        timer_seconds: q.timer_seconds ?? 20,
        points: q.points ?? 1000,
        emoji: q.emoji || "",
      }))
    );
    return { id: quiz.id, question_count: questions.length };
  });

export const updateQuiz = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(),
    creator_key: z.string().min(3),
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    cover_emoji: z.string().max(20).optional(),
    settings: z.any().optional(),
    questions: z.array(z.any()).max(50),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const existing = await b.entities.Quiz.get(data.id);
    if (existing.creator_key && existing.creator_key !== data.creator_key) {
      throw Object.assign(new Error("Not your quiz"), { status: 403 });
    }
    await b.entities.Quiz.update(data.id, {
      title: data.title,
      description: data.description || "",
      cover_emoji: data.cover_emoji || "🎮",
      creator_key: data.creator_key,
      settings: data.settings,
      question_count: data.questions.length,
    });
    await b.entities.Question.deleteMany({ quiz_id: data.id });
    await b.entities.Question.bulkCreate(
      data.questions.map((q, i) => ({
        quiz_id: data.id,
        question_index: i,
        text: q.text,
        question_type: q.question_type || "multiple_choice",
        options: q.question_type === "true_false" ? ["True", "False"] : q.options,
        correct_option: q.correct_option,
        timer_seconds: q.timer_seconds ?? 20,
        points: q.points ?? 1000,
        emoji: q.emoji || "",
      }))
    );
    return { ok: true };
  });

export const getMyQuizzes = createServerFn({ method: "GET" })
  .validator(z.object({ creator_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const page = await b.entities.Quiz.filter({ creator_key: data.creator_key }, { sort: "-created_date", limit: 100 });
    return page.items;
  });

export const publishQuiz = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), creator_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const quiz = await b.entities.Quiz.get(data.id);
    if (quiz.creator_key && quiz.creator_key !== data.creator_key) {
      throw Object.assign(new Error("Not your quiz"), { status: 403 });
    }
    const published = quiz.published !== true;
    await b.entities.Quiz.update(data.id, { published });
    return { published };
  });

export const getPublishedQuizzes = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const b = svc(context);
    const page = await b.entities.Quiz.filter({ published: true }, { sort: "-created_date", limit: 100 });
    return page.items;
  });

export const getQuiz = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const quiz = await b.entities.Quiz.get(data.id);
    const page = await b.entities.Question.filter({ quiz_id: data.id }, { sort: "question_index", limit: 100 });
    return { quiz, questions: page.items };
  });

// ───────────────────────── game lifecycle ─────────────────────────

export const startGame = createServerFn({ method: "POST" })
  .validator(z.object({ quiz_id: z.string(), host_key: z.string().min(3), host_name: z.string().max(60).optional() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const quiz = await b.entities.Quiz.get(data.quiz_id);
    if (quiz.creator_key && quiz.creator_key !== data.host_key && quiz.published !== true) {
      throw Object.assign(new Error("Not your quiz"), { status: 403 });
    }
    let code = genCode();
    let tries = 0;
    while (tries++ < 10) {
      const dup = await b.entities.GameSession.filter({ game_code: code }, { limit: 1 });
      if (dup.items.length === 0) break;
      code = genCode();
    }
    const session = await b.entities.GameSession.create({
      game_code: code,
      quiz_id: data.quiz_id,
      quiz_title: quiz.title,
      host_key: data.host_key,
      host_name: data.host_name || "Host",
      status: "lobby",
      current_question_index: -1,
      current_question_id: "",
      question_started_at: "",
      reveal_shown: false,
      total_questions: quiz.question_count || 0,
    });
    return { game_id: session.id, game_code: code };
  });

export const joinGame = createServerFn({ method: "POST" })
  .validator(z.object({
    code: z.string().min(4).max(8),
    name: z.string().min(1).max(24),
    player_key: z.string().optional(),
    wallet_key: z.string().optional(),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const page = await b.entities.GameSession.filter({ game_code: data.code.toUpperCase() }, { limit: 1 });
    if (page.items.length === 0) {
      throw Object.assign(new Error("Invalid game code"), { status: 404, code: "INVALID_CODE" });
    }
    const session = page.items[0];
    if (session.status === "ended") {
      throw Object.assign(new Error("Game has ended"), { status: 410, code: "GAME_ENDED" });
    }
    // reconnection: existing player by key
    let player;
    if (data.player_key) {
      const ex = await b.entities.Player.filter({ game_session_id: session.id, player_key: data.player_key }, { limit: 1 });
      if (ex.items.length > 0) {
        player = ex.items[0];
        // update name if changed
        if (player.name !== data.name) {
          await b.entities.Player.update(player.id, { name: data.name });
          player.name = data.name;
        }
        // keep wallet fresh on reconnect
        if (data.wallet_key && player.wallet_key !== data.wallet_key) {
          await b.entities.Player.update(player.id, { wallet_key: data.wallet_key });
          player.wallet_key = data.wallet_key;
        }
      }
    }
    if (!player) {
      const players = await b.entities.Player.filter({ game_session_id: session.id }, { limit: 200 });
      const settings = (await b.entities.Quiz.get(session.quiz_id)).settings || {};
      const limit = settings.player_limit || 60;
      if (players.items.length >= limit) {
        throw Object.assign(new Error("Game is full"), { status: 409, code: "GAME_FULL" });
      }
      player = await b.entities.Player.create({
        game_session_id: session.id,
        name: data.name,
        player_key: genKey(),
        wallet_key: data.wallet_key || "",
        score: 0,
        answers_count: 0,
        correct_count: 0,
      });
    }
    // wallet info so the avatar picker can lock paid packs
    let wallet = { coins: 0, owned_packs: [], owned_avatars: [] };
    if (data.wallet_key) {
      const w = await ensureWallet(b, data.wallet_key);
      wallet = { coins: w.coins || 0, owned_packs: w.owned_packs || [], owned_avatars: w.owned_avatars || [] };
    }
    return {
      game_id: session.id,
      game_code: session.game_code,
      player_id: player.id,
      player_key: player.player_key,
      status: session.status,
      quiz_id: session.quiz_id,
      quiz_title: session.quiz_title,
      wallet,
    };
  });

export const getLobby = createServerFn({ method: "GET" })
  .validator(z.object({ game_session_id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const session = await b.entities.GameSession.get(data.game_session_id);
    const players = await b.entities.Player.filter({ game_session_id: data.game_session_id }, { sort: "created_date", limit: 200 });
    const reservations = await b.entities.AvatarReservation.filter({ game_session_id: data.game_session_id }, { limit: 200 });
    return {
      session,
      players: players.items,
      reserved_avatar_ids: reservations.items.map((r) => r.avatar_id),
    };
  });

// ───────────────────────── avatar reservations (atomic) ─────────────────────────

export const reserveAvatar = createServerFn({ method: "POST" })
  .validator(z.object({
    game_session_id: z.string(),
    avatar_id: z.string(),
    player_id: z.string(),
    player_key: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    // verify player owns this key
    const player = await b.entities.Player.get(data.player_id);
    if (!player || player.player_key !== data.player_key || player.game_session_id !== data.game_session_id) {
      throw Object.assign(new Error("Invalid player"), { status: 403, code: "INVALID_PLAYER" });
    }
    const session = await b.entities.GameSession.get(data.game_session_id);
    if (session.status !== "lobby") {
      throw Object.assign(new Error("Game has started — avatars locked"), { status: 409, code: "LOCKED" });
    }
    // economy: paid-pack avatars must be owned by this player's wallet
    const av = getAvatar(data.avatar_id);
    if (av && av.pack_price > 0 && player.wallet_key) {
      const w = await ensureWallet(b, player.wallet_key);
      const owns = (w.owned_avatars || []).includes(data.avatar_id);
      if (!owns) {
        throw Object.assign(new Error("You don't own this avatar yet — unlock it in the Shop!"), { status: 403, code: "AVATAR_LOCKED" });
      }
    }
    // check unique avatars setting
    const quiz = await b.entities.Quiz.get(session.quiz_id);
    const unique = quiz.settings?.unique_avatars !== false;
    if (!unique) {
      // no uniqueness required; just record this player's choice on the Player record
      await b.entities.Player.update(data.player_id, { avatar_id: data.avatar_id });
      return { ok: true, avatar_id: data.avatar_id };
    }
    // is it already reserved by someone else?
    const existing = await b.entities.AvatarReservation.filter({ game_session_id: data.game_session_id, avatar_id: data.avatar_id }, { limit: 5 });
    const byOthers = existing.items.filter((r) => r.player_id !== data.player_id);
    if (byOthers.length > 0) {
      throw Object.assign(new Error("Avatar taken"), { status: 409, code: "AVATAR_TAKEN" });
    }
    // release any prior reservation by this player for a different avatar
    const mine = existing.items.filter((r) => r.player_id === data.player_id);
    if (mine.length === 0) {
      // create reservation (race window handled below)
      await b.entities.AvatarReservation.create({
        game_session_id: data.game_session_id,
        avatar_id: data.avatar_id,
        avatar_name: data.avatar_id,
        player_id: data.player_id,
        player_key: data.player_key,
        reserved_at: new Date().toISOString(),
      });
      // verify no race: if another reservation for the same avatar exists from another player with earlier time, back off
      const after = await b.entities.AvatarReservation.filter({ game_session_id: data.game_session_id, avatar_id: data.avatar_id }, { limit: 10 });
      const others = after.items.filter((r) => r.player_id !== data.player_id);
      if (others.length > 0) {
        const mineRec = after.items.find((r) => r.player_id === data.player_id);
        const earliestOther = others.sort((a, b2) => (a.reserved_at || "").localeCompare(b2.reserved_at || ""))[0];
        if (mineRec && earliestOther && (mineRec.reserved_at || "") > (earliestOther.reserved_at || "")) {
          // we lost the race
          await b.entities.AvatarReservation.deleteMany({ game_session_id: data.game_session_id, avatar_id: data.avatar_id, player_id: data.player_id });
          throw Object.assign(new Error("Avatar taken"), { status: 409, code: "AVATAR_TAKEN" });
        }
      }
    }
    // remove other reservations by this player for different avatars
    const allMine = await b.entities.AvatarReservation.filter({ game_session_id: data.game_session_id, player_id: data.player_id }, { limit: 20 });
    await Promise.all(allMine.items.filter((r) => r.avatar_id !== data.avatar_id).map((r) => b.entities.AvatarReservation.delete(r.id)));
    // stamp avatar on player
    await b.entities.Player.update(data.player_id, { avatar_id: data.avatar_id });
    return { ok: true, avatar_id: data.avatar_id };
  });

export const releaseAvatar = createServerFn({ method: "POST" })
  .validator(z.object({
    game_session_id: z.string(),
    player_id: z.string(),
    player_key: z.string(),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const player = await b.entities.Player.get(data.player_id);
    if (!player || player.player_key !== data.player_key) {
      throw Object.assign(new Error("Invalid player"), { status: 403 });
    }
    await b.entities.AvatarReservation.deleteMany({ game_session_id: data.game_session_id, player_id: data.player_id });
    return { ok: true };
  });

// ───────────────────────── host controls ─────────────────────────

async function requireHost(b, sessionId, hostKey) {
  const session = await b.entities.GameSession.get(sessionId);
  if (!session) throw Object.assign(new Error("Game not found"), { status: 404 });
  if (session.host_key && session.host_key !== hostKey) {
    throw Object.assign(new Error("Not the host"), { status: 403, code: "NOT_HOST" });
  }
  return session;
}

export const startPlay = createServerFn({ method: "POST" })
  .validator(z.object({ game_session_id: z.string(), host_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const session = await requireHost(b, data.game_session_id, data.host_key);
    const players = await b.entities.Player.filter({ game_session_id: data.game_session_id }, { limit: 200 });
    if (players.items.length === 0) {
      throw Object.assign(new Error("No players yet"), { status: 400, code: "NO_PLAYERS" });
    }
    const qPage = await b.entities.Question.filter({ quiz_id: session.quiz_id }, { sort: "question_index", limit: 100 });
    const questions = qPage.items;
    if (questions.length === 0) {
      throw Object.assign(new Error("Quiz has no questions"), { status: 400 });
    }
    const first = questions[0];
    await b.entities.GameSession.update(data.game_session_id, {
      status: "playing",
      current_question_index: 0,
      current_question_id: first.id,
      question_started_at: new Date().toISOString(),
      reveal_shown: false,
      total_questions: questions.length,
    });
    return { ok: true, current_question_index: 0, current_question_id: first.id };
  });

export const revealAnswer = createServerFn({ method: "POST" })
  .validator(z.object({ game_session_id: z.string(), host_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    await requireHost(b, data.game_session_id, data.host_key);
    await b.entities.GameSession.update(data.game_session_id, { status: "revealed", reveal_shown: true });
    return { ok: true };
  });

export const nextQuestion = createServerFn({ method: "POST" })
  .validator(z.object({ game_session_id: z.string(), host_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const session = await requireHost(b, data.game_session_id, data.host_key);
    const qPage = await b.entities.Question.filter({ quiz_id: session.quiz_id }, { sort: "question_index", limit: 100 });
    const questions = qPage.items;
    const nextIdx = (session.current_question_index ?? -1) + 1;
    if (nextIdx >= questions.length) {
      // end the game
      await b.entities.GameSession.update(data.game_session_id, { status: "ended", reveal_shown: false });
      return { ok: true, ended: true };
    }
    const next = questions[nextIdx];
    // CRITICAL: reset question-specific state — new question id, new start time, reveal cleared
    await b.entities.GameSession.update(data.game_session_id, {
      status: "playing",
      current_question_index: nextIdx,
      current_question_id: next.id,
      question_started_at: new Date().toISOString(),
      reveal_shown: false,
    });
    return { ok: true, ended: false, current_question_index: nextIdx, current_question_id: next.id };
  });

export const endGame = createServerFn({ method: "POST" })
  .validator(z.object({ game_session_id: z.string(), host_key: z.string().min(3) }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    await requireHost(b, data.game_session_id, data.host_key);
    await b.entities.GameSession.update(data.game_session_id, { status: "ended" });
    // release avatar reservations
    await b.entities.AvatarReservation.deleteMany({ game_session_id: data.game_session_id });
    return { ok: true };
  });

// ───────────────────────── student answer (per-question) ─────────────────────────

export const submitAnswer = createServerFn({ method: "POST" })
  .validator(z.object({
    game_session_id: z.string(),
    player_id: z.string(),
    player_key: z.string(),
    question_id: z.string(),
    question_index: z.number(),
    selected_option: z.number(),
  }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const player = await b.entities.Player.get(data.player_id);
    if (!player || player.player_key !== data.player_key || player.game_session_id !== data.game_session_id) {
      throw Object.assign(new Error("Invalid player"), { status: 403, code: "INVALID_PLAYER" });
    }
    const session = await b.entities.GameSession.get(data.game_session_id);
    if (!session) throw Object.assign(new Error("Game not found"), { status: 404 });
    if (session.status !== "playing") {
      throw Object.assign(new Error("Not accepting answers now"), { status: 409, code: "NOT_OPEN" });
    }
    // CRITICAL: validate the answer is for the CURRENT question — prevents stale/late submissions
    if (session.current_question_id !== data.question_id) {
      throw Object.assign(new Error("Question is no longer active"), { status: 409, code: "STALE_QUESTION" });
    }
    // CRITICAL: per-question duplicate prevention — only blocks re-submitting THIS question, not future ones
    const dup = await b.entities.Answer.filter({
      game_session_id: data.game_session_id,
      player_id: data.player_id,
      question_id: data.question_id,
    }, { limit: 1 });
    if (dup.items.length > 0) {
      throw Object.assign(new Error("Already answered this question"), { status: 409, code: "ALREADY_ANSWERED" });
    }
    // score
    const question = await b.entities.Question.get(data.question_id);
    const isCorrect = data.selected_option === question.correct_option;
    let points = 0;
    if (isCorrect) {
      const total = question.timer_seconds || 20;
      const started = new Date(session.question_started_at).getTime();
      const elapsed = (Date.now() - started) / 1000;
      const frac = Math.max(0, Math.min(1, 1 - elapsed / total));
      const base = question.points || 1000;
      points = Math.round(base * (0.5 + 0.5 * frac));
    }
    await b.entities.Answer.create({
      game_session_id: data.game_session_id,
      player_id: data.player_id,
      player_key: data.player_key,
      question_id: data.question_id,
      question_index: data.question_index,
      selected_option: data.selected_option,
      is_correct: isCorrect,
      points_awarded: points,
      submitted_at: new Date().toISOString(),
    });
    const newScore = (player.score || 0) + points;
    const newAnswers = (player.answers_count || 0) + 1;
    const newCorrect = (player.correct_count || 0) + (isCorrect ? 1 : 0);
    await b.entities.Player.update(data.player_id, {
      score: newScore,
      answers_count: newAnswers,
      correct_count: newCorrect,
    });
    // coin economy: correct answers earn coins in the player's wallet
    let coinsAwarded = 0;
    if (isCorrect && player.wallet_key) {
      await ensureWallet(b, player.wallet_key);
      await b.entities.Wallet.updateMany({ owner_key: player.wallet_key }, { $inc: { coins: COINS_PER_CORRECT } });
      coinsAwarded = COINS_PER_CORRECT;
    }
    return { ok: true, is_correct: isCorrect, points_awarded: points, score: newScore, coins_awarded: coinsAwarded };
  });

// fetch this player's answer for a specific question (used on reconnect + reveal)
export const getMyAnswer = createServerFn({ method: "GET" })
  .validator(z.object({ game_session_id: z.string(), player_id: z.string(), question_id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const page = await b.entities.Answer.filter({
      game_session_id: data.game_session_id,
      player_id: data.player_id,
      question_id: data.question_id,
    }, { limit: 1 });
    return page.items.length > 0 ? page.items[0] : null;
  });

// current question + correctness (no correct answer leaked before reveal)
export const getQuestionState = createServerFn({ method: "GET" })
  .validator(z.object({ game_session_id: z.string(), player_id: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const session = await b.entities.GameSession.get(data.game_session_id);
    if (!session) throw Object.assign(new Error("Game not found"), { status: 404 });
    let question = null;
    let myAnswer = null;
    if (session.current_question_id) {
      question = await b.entities.Question.get(session.current_question_id);
      // strip correct answer unless revealed
      if (question && session.status !== "revealed" && session.status !== "ended") {
        question = { ...question, correct_option: undefined };
      }
      if (data.player_id) {
        const a = await b.entities.Answer.filter({ game_session_id: data.game_session_id, player_id: data.player_id, question_id: session.current_question_id }, { limit: 1 });
        myAnswer = a.items.length > 0 ? a.items[0] : null;
      }
    }
    return { session, question, myAnswer };
  });

// answered count for current question (host progress)
export const getAnswerProgress = createServerFn({ method: "GET" })
  .validator(z.object({ game_session_id: z.string(), question_id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const count = await b.entities.Answer.count({ game_session_id: data.game_session_id, question_id: data.question_id });
    const players = await b.entities.Player.count({ game_session_id: data.game_session_id });
    return { answered: count, total: players };
  });

// final results
export const getResults = createServerFn({ method: "GET" })
  .validator(z.object({ game_session_id: z.string() }))
  .handler(async ({ data, context }) => {
    const b = svc(context);
    const session = await b.entities.GameSession.get(data.game_session_id);
    const players = await b.entities.Player.filter({ game_session_id: data.game_session_id }, { sort: "-score", limit: 200 });
    return { session, leaderboard: players.items };
  });