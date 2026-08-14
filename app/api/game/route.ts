import { getDb } from "@/db";

const ARABIC_LETTERS = [..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];
const DEFAULT_CATEGORIES = ["اسم ولد", "اسم بنت", "حيوان", "مهنة", "بلد", "أكلة"];

function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}

function cleanName(value: unknown) {
  return String(value ?? "").trim().slice(0, 24);
}

function cleanCategories(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_CATEGORIES;
  const list = value
    .map((item) => String(item ?? "").trim().slice(0, 30))
    .filter(Boolean)
    .slice(0, 12);
  return list.length >= 3 ? list : DEFAULT_CATEGORIES;
}

function normalizeArabic(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

function startsWithLetter(answer: string, letter: string) {
  const normalized = normalizeArabic(answer);
  return Boolean(normalized) && normalized.startsWith(normalizeArabic(letter));
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function rawDb() {
  await getDb();
  const { env } = await import("cloudflare:workers");
  return env.DB;
}

async function generateCode(db: any) {
  for (let i = 0; i < 30; i += 1) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const exists = await db.prepare("SELECT id FROM game_rooms WHERE code = ?").bind(code).first();
    if (!exists) return code;
  }
  throw new Error("Could not create a room code");
}

function pickLetter(used: string[]) {
  const available = ARABIC_LETTERS.filter((letter) => !used.includes(letter));
  const pool = available.length ? available : ARABIC_LETTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function getContext(db: any, code: string, token: string) {
  const room = await db.prepare("SELECT * FROM game_rooms WHERE code = ?").bind(code).first<any>();
  if (!room) return { room: null, player: null };
  const player = token
    ? await db
        .prepare("SELECT * FROM game_players WHERE room_id = ? AND token = ?")
        .bind(room.id, token)
        .first<any>()
    : null;
  return { room, player };
}

async function saveAnswers(db: any, room: any, player: any, answers: unknown) {
  if (room.status !== "playing" || !player || !Array.isArray(answers)) return;
  const categories = parseJson<string[]>(room.categories_json, DEFAULT_CATEGORIES);
  const statements = categories.map((_, categoryIndex) => {
    const answer = String(answers[categoryIndex] ?? "").trim().slice(0, 60);
    return db
      .prepare(`INSERT INTO game_answers
        (room_id, round_index, player_id, category_index, answer, normalized, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(room_id, round_index, player_id, category_index)
        DO UPDATE SET answer = excluded.answer, normalized = excluded.normalized, updated_at = CURRENT_TIMESTAMP`)
      .bind(room.id, room.current_round, player.id, categoryIndex, answer, normalizeArabic(answer));
  });
  if (statements.length) await db.batch(statements);
}

async function snapshot(db: any, code: string, token = "") {
  const { room, player } = await getContext(db, code, token);
  if (!room) return null;
  const playersResult = await db
    .prepare("SELECT id, name, score, joined_at FROM game_players WHERE room_id = ? ORDER BY joined_at ASC")
    .bind(room.id)
    .all<any>();
  const players = playersResult.results ?? [];
  let answers: any[] = [];
  if (room.current_round > 0 && player) {
    if (["review", "scoring", "results", "finished"].includes(room.status)) {
      const result = await db
        .prepare("SELECT player_id, category_index, answer, normalized, host_valid, points FROM game_answers WHERE room_id = ? AND round_index = ? ORDER BY category_index ASC")
        .bind(room.id, room.current_round)
        .all<any>();
      answers = result.results ?? [];
    } else if (room.status === "playing") {
      const result = await db
        .prepare("SELECT player_id, category_index, answer FROM game_answers WHERE room_id = ? AND round_index = ? AND player_id = ?")
        .bind(room.id, room.current_round, player.id)
        .all<any>();
      answers = result.results ?? [];
    }
  }
  return {
    room: {
      code: room.code,
      status: room.status,
      roundCount: room.round_count,
      currentRound: room.current_round,
      currentLetter: room.current_letter,
      usedLetters: parseJson<string[]>(room.used_letters_json, []),
      categories: parseJson<string[]>(room.categories_json, DEFAULT_CATEGORIES),
      stoppedBy: room.stopped_by,
    },
    me: player ? { id: player.id, name: player.name, isHost: room.host_player_id === player.id } : null,
    players,
    answers,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim();
  const token = url.searchParams.get("token") ?? "";
  if (!/^\d{6}$/.test(code)) return reply({ error: "رمز الغرفة غير صالح" }, 400);
  const db = await rawDb();
  const state = await snapshot(db, code, token);
  if (!state) return reply({ error: "الغرفة غير موجودة" }, 404);
  return reply(state);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as any;
  const action = String(body.action ?? "");
  const db = await rawDb();

  try {
    if (action === "create") {
      const name = cleanName(body.name);
      if (!name) return reply({ error: "اكتب اسمك أولاً" }, 400);
      const roundCount = Math.max(3, Math.min(15, Number(body.roundCount) || 5));
      const categories = cleanCategories(body.categories);
      const roomId = crypto.randomUUID();
      const playerId = crypto.randomUUID();
      const token = crypto.randomUUID();
      const code = await generateCode(db);
      await db.batch([
        db
          .prepare(`INSERT INTO game_rooms
            (id, code, host_player_id, status, round_count, current_round, categories_json)
            VALUES (?, ?, ?, 'lobby', ?, 0, ?)`)
          .bind(roomId, code, playerId, roundCount, JSON.stringify(categories)),
        db
          .prepare("INSERT INTO game_players (id, room_id, name, token) VALUES (?, ?, ?, ?)")
          .bind(playerId, roomId, name, token),
      ]);
      return reply({ token, state: await snapshot(db, code, token) }, 201);
    }

    if (action === "join") {
      const code = String(body.code ?? "").trim();
      const name = cleanName(body.name);
      if (!/^\d{6}$/.test(code)) return reply({ error: "رمز الغرفة غير صالح" }, 400);
      if (!name) return reply({ error: "اكتب اسمك أولاً" }, 400);
      const room = await db.prepare("SELECT * FROM game_rooms WHERE code = ?").bind(code).first<any>();
      if (!room) return reply({ error: "الغرفة غير موجودة" }, 404);
      if (room.status !== "lobby") return reply({ error: "اللعبة بدأت بالفعل" }, 409);
      const count = await db.prepare("SELECT COUNT(*) AS n FROM game_players WHERE room_id = ?").bind(room.id).first<any>();
      if (Number(count?.n ?? 0) >= 10) return reply({ error: "الغرفة ممتلئة" }, 409);
      const playerId = crypto.randomUUID();
      const token = crypto.randomUUID();
      await db
        .prepare("INSERT INTO game_players (id, room_id, name, token) VALUES (?, ?, ?, ?)")
        .bind(playerId, room.id, name, token)
        .run();
      return reply({ token, state: await snapshot(db, code, token) }, 201);
    }

    const code = String(body.code ?? "").trim();
    const token = String(body.token ?? "");
    if (!/^\d{6}$/.test(code) || !token) return reply({ error: "بيانات الغرفة ناقصة" }, 400);
    const { room, player } = await getContext(db, code, token);
    if (!room || !player) return reply({ error: "الجلسة غير صالحة" }, 403);
    const isHost = room.host_player_id === player.id;

    if (action === "start") {
      if (!isHost) return reply({ error: "فقط صاحب الغرفة يبدأ اللعبة" }, 403);
      if (room.status !== "lobby") return reply({ error: "اللعبة بدأت" }, 409);
      const count = await db.prepare("SELECT COUNT(*) AS n FROM game_players WHERE room_id = ?").bind(room.id).first<any>();
      if (Number(count?.n ?? 0) < 2) return reply({ error: "لازم لاعبين على الأقل" }, 409);
      const letter = pickLetter([]);
      await db
        .prepare("UPDATE game_rooms SET status = 'playing', current_round = 1, current_letter = ?, used_letters_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(letter, JSON.stringify([letter]), room.id)
        .run();
    } else if (action === "save") {
      await saveAnswers(db, room, player, body.answers);
    } else if (action === "stop") {
      if (room.status === "playing") {
        await saveAnswers(db, room, player, body.answers);
        await db
          .prepare("UPDATE game_rooms SET status = 'review', stopped_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'playing'")
          .bind(player.id, room.id)
          .run();
      }
    } else if (action === "review") {
      if (!isHost) return reply({ error: "فقط صاحب الغرفة يحسب النقاط" }, 403);
      if (room.status !== "review") return reply({ error: "الجولة ليست في مرحلة الحساب" }, 409);
      const claim = await db
        .prepare("UPDATE game_rooms SET status = 'scoring', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'review'")
        .bind(room.id)
        .run();
      if (Number((claim as any)?.meta?.changes ?? 0) === 0) return reply(await snapshot(db, code, token));

      const categories = parseJson<string[]>(room.categories_json, DEFAULT_CATEGORIES);
      const playerRows = await db
        .prepare("SELECT id FROM game_players WHERE room_id = ? ORDER BY joined_at ASC")
        .bind(room.id)
        .all<any>();
      const answerRows = await db
        .prepare("SELECT player_id, category_index, answer, normalized FROM game_answers WHERE room_id = ? AND round_index = ?")
        .bind(room.id, room.current_round)
        .all<any>();
      const answerMap = new Map<string, any>();
      for (const row of answerRows.results ?? []) answerMap.set(`${row.player_id}:${row.category_index}`, row);
      const counts = new Map<string, number>();
      for (const row of answerRows.results ?? []) {
        const key = String(row.normalized ?? "");
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const validity = body.validity && typeof body.validity === "object" ? body.validity : {};
      const pointsByPlayer = new Map<string, number>();
      const writes: any[] = [];

      for (const p of playerRows.results ?? []) {
        let total = 0;
        for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
          const key = `${p.id}:${categoryIndex}`;
          const row = answerMap.get(key);
          const answer = String(row?.answer ?? "").trim();
          const normalized = normalizeArabic(answer);
          const duplicate = Boolean(normalized) && (counts.get(normalized) ?? 0) > 1;
          const correctLetter = startsWithLetter(answer, room.current_letter);
          const hostValid = validity[key] !== false;
          const points = answer && !duplicate && correctLetter && hostValid ? 1 : 0;
          total += points;
          writes.push(
            db
              .prepare(`INSERT INTO game_answers
                (room_id, round_index, player_id, category_index, answer, normalized, host_valid, points, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(room_id, round_index, player_id, category_index)
                DO UPDATE SET answer = excluded.answer, normalized = excluded.normalized,
                  host_valid = excluded.host_valid, points = excluded.points, updated_at = CURRENT_TIMESTAMP`)
              .bind(room.id, room.current_round, p.id, categoryIndex, answer, normalized, hostValid ? 1 : 0, points)
          );
        }
        pointsByPlayer.set(p.id, total);
      }
      if (writes.length) await db.batch(writes);
      const scoreWrites = [...pointsByPlayer.entries()].map(([playerId, points]) =>
        db.prepare("UPDATE game_players SET score = score + ? WHERE id = ? AND room_id = ?").bind(points, playerId, room.id)
      );
      if (scoreWrites.length) await db.batch(scoreWrites);
      await db.prepare("UPDATE game_rooms SET status = 'results', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(room.id).run();
    } else if (action === "next") {
      if (!isHost) return reply({ error: "فقط صاحب الغرفة ينتقل للجولة التالية" }, 403);
      if (room.status !== "results") return reply({ error: "احسب النقاط أولاً" }, 409);
      if (room.current_round >= room.round_count) {
        await db.prepare("UPDATE game_rooms SET status = 'finished', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(room.id).run();
      } else {
        const used = parseJson<string[]>(room.used_letters_json, []);
        const letter = pickLetter(used);
        used.push(letter);
        await db
          .prepare("UPDATE game_rooms SET status = 'playing', current_round = current_round + 1, current_letter = ?, used_letters_json = ?, stopped_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(letter, JSON.stringify(used), room.id)
          .run();
      }
    } else {
      return reply({ error: "عملية غير معروفة" }, 400);
    }

    return reply(await snapshot(db, code, token));
  } catch (error) {
    console.error("Bent Walad game API error", error);
    return reply({ error: "صار خطأ. جرّب مرة أخرى." }, 500);
  }
}
