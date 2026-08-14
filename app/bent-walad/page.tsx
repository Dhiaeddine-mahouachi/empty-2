"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Player = { id: string; name: string; score: number };
type AnswerRow = { player_id: string; category_index: number; answer: string; normalized?: string; host_valid?: number; points?: number };
type GameState = {
  room: {
    code: string;
    status: "lobby" | "playing" | "review" | "scoring" | "results" | "finished";
    roundCount: number;
    currentRound: number;
    currentLetter: string;
    usedLetters: string[];
    categories: string[];
    stoppedBy?: string | null;
  };
  me: { id: string; name: string; isHost: boolean } | null;
  players: Player[];
  answers: AnswerRow[];
};

const DEFAULT_CATEGORIES = ["اسم ولد", "اسم بنت", "حيوان", "مهنة", "بلد", "أكلة"];

async function api(body: Record<string, unknown>) {
  const response = await fetch("/api/game", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "صار خطأ");
  return data;
}

function normalizeArabic(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

export default function BentWaladPage() {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roundCount, setRoundCount] = useState(5);
  const [categoriesText, setCategoriesText] = useState(DEFAULT_CATEGORIES.join("، "));
  const [token, setToken] = useState("");
  const [state, setState] = useState<GameState | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [validity, setValidity] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeFromUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("room") ?? "" : "";

  useEffect(() => {
    if (codeFromUrl && /^\d{6}$/.test(codeFromUrl)) setJoinCode(codeFromUrl);
  }, [codeFromUrl]);

  useEffect(() => {
    if (!state?.room?.code || !token) return;
    const code = state.room.code;
    const poll = async () => {
      try {
        const response = await fetch(`/api/game?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as GameState;
        setState(next);
        if (next.room.status === "playing") {
          const mine = next.answers.filter((row) => row.player_id === next.me?.id);
          if (mine.length) {
            setAnswers((current) => {
              const copy = [...current];
              for (const row of mine) copy[row.category_index] = row.answer ?? "";
              return copy;
            });
          }
        }
      } catch {}
    };
    const id = setInterval(poll, 850);
    return () => clearInterval(id);
  }, [state?.room?.code, token]);

  useEffect(() => {
    if (!state) return;
    if (state.room.status === "playing") {
      setAnswers((current) => {
        const next = Array(state.room.categories.length).fill("");
        current.forEach((value, index) => { if (index < next.length) next[index] = value; });
        return next;
      });
    }
  }, [state?.room.currentRound, state?.room.status, state?.room.categories.length]);

  const stoppedByName = useMemo(() => {
    if (!state?.room.stoppedBy) return "";
    return state.players.find((player) => player.id === state.room.stoppedBy)?.name ?? "لاعب";
  }, [state]);

  async function createRoom() {
    setError("");
    setBusy(true);
    try {
      const categories = categoriesText.split(/[،,]/).map((item) => item.trim()).filter(Boolean);
      const data = await api({ action: "create", name, roundCount, categories });
      setToken(data.token);
      setState(data.state);
      setAnswers(Array(data.state.room.categories.length).fill(""));
      history.replaceState(null, "", `/bent-walad?room=${data.state.room.code}`);
    } catch (err) { setError(err instanceof Error ? err.message : "صار خطأ"); }
    finally { setBusy(false); }
  }

  async function joinRoom() {
    setError("");
    setBusy(true);
    try {
      const data = await api({ action: "join", name, code: joinCode });
      setToken(data.token);
      setState(data.state);
      setAnswers(Array(data.state.room.categories.length).fill(""));
      history.replaceState(null, "", `/bent-walad?room=${data.state.room.code}`);
    } catch (err) { setError(err instanceof Error ? err.message : "صار خطأ"); }
    finally { setBusy(false); }
  }

  async function action(actionName: string, extra: Record<string, unknown> = {}) {
    if (!state) return;
    setError("");
    setBusy(true);
    try {
      const next = await api({ action: actionName, code: state.room.code, token, ...extra });
      setState(next);
      if (actionName === "next") setAnswers(Array(next.room.categories.length).fill(""));
    } catch (err) { setError(err instanceof Error ? err.message : "صار خطأ"); }
    finally { setBusy(false); }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((current) => {
      const next = [...current];
      next[index] = value;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (state) api({ action: "save", code: state.room.code, token, answers: next }).catch(() => {});
      }, 220);
      return next;
    });
  }

  function shareRoom() {
    if (!state) return;
    const url = `${location.origin}/bent-walad?room=${state.room.code}`;
    if (navigator.share) navigator.share({ title: "بنت ولد", text: `ادخل الغرفة ${state.room.code}`, url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => alert("تم نسخ رابط الغرفة"));
  }

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    if (!state) return counts;
    for (const row of state.answers) {
      const normalized = normalizeArabic(row.answer || "");
      if (!normalized) continue;
      const key = `${row.category_index}:${normalized}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [state]);

  return (
    <main className="bw-page" dir="rtl">
      <style>{css}</style>
      <div className="doodle d1">★</div><div className="doodle d2">✦</div><div className="doodle d3">☻</div>
      <section className="shell">
        <header className="hero">
          <div className="logoBubble">بنت<br/><span>ولد</span></div>
          <div>
            <div className="sticker">لعبة الحروف مع صحابك ✨</div>
            <h1>فكّر بسرعة… واضغط <b>قِف!</b></h1>
            <p>غرف خاصة أونلاين • كل واحد يلعب من تلفونه</p>
          </div>
        </header>

        {error && <div className="errorBox">⚠️ {error}</div>}

        {!state && (
          <div className="homeGrid">
            <article className="comicCard yellowCard">
              <span className="cardIcon">🚀</span><h2>أنشئ غرفة</h2>
              <label>اسمك</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: ضياء" maxLength={24}/>
              <label>عدد الحروف / الجولات</label>
              <select value={roundCount} onChange={(e) => setRoundCount(Number(e.target.value))}>
                {[3,5,7,10,15].map((n) => <option key={n} value={n}>{n} جولات</option>)}
              </select>
              <label>الخانات</label><textarea value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} rows={3}/>
              <button className="comicBtn pink" disabled={busy} onClick={createRoom}>أنشئ الغرفة 🎉</button>
            </article>
            <article className="comicCard blueCard">
              <span className="cardIcon">👋</span><h2>ادخل مع صحابك</h2>
              <label>اسمك</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" maxLength={24}/>
              <label>رمز الغرفة</label><input className="codeInput" inputMode="numeric" value={joinCode} onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456"/>
              <button className="comicBtn purple" disabled={busy} onClick={joinRoom}>ادخل نلعب! 🎮</button>
            </article>
          </div>
        )}

        {state?.room.status === "lobby" && (
          <article className="comicCard lobbyCard">
            <div className="roomTop"><div><span className="mini">رمز الغرفة</span><div className="roomCode">{state.room.code}</div></div><button className="shareBtn" onClick={shareRoom}>شارك الرابط 🔗</button></div>
            <h2>نستناو في اللاعبين… 👀</h2>
            <div className="players">{state.players.map((p, i) => <div className="playerChip" key={p.id}><span>{["😎","🤠","🥳","🤓","🦊","🐼","👾","🐸","🐯","🧠"][i % 10]}</span>{p.name}{p.id === state.me?.id && <small>أنت</small>}</div>)}</div>
            <p className="hint">شارك الرمز أو الرابط. لازم لاعبين على الأقل.</p>
            {state.me?.isHost ? <button className="comicBtn pink huge" disabled={busy || state.players.length < 2} onClick={() => action("start")}>ابدأ اللعبة! 🔥</button> : <div className="waiting">صاحب الغرفة سيبدأ اللعبة… ⏳</div>}
          </article>
        )}

        {state?.room.status === "playing" && (
          <article className="comicCard gameCard">
            <div className="roundBar"><span>الجولة {state.room.currentRound} / {state.room.roundCount}</span><span>النقاط: {state.players.find((p) => p.id === state.me?.id)?.score ?? 0}</span></div>
            <div className="letterBurst"><small>حرف اليوم</small><strong>{state.room.currentLetter}</strong></div>
            <div className="answerList">{state.room.categories.map((category, index) => <label className="answerRow" key={category + index}><span>{category}</span><input value={answers[index] ?? ""} onChange={(e) => updateAnswer(index, e.target.value)} placeholder={`${state.room.currentLetter}...`} autoComplete="off"/></label>)}</div>
            <button className="stopBtn" disabled={busy} onClick={() => action("stop", { answers })}>قِــــــــف! ✋</button>
            <div className="usedLetters">الحروف السابقة: {state.room.usedLetters.join(" • ")}</div>
          </article>
        )}

        {state?.room.status === "review" && (
          <article className="comicCard reviewCard">
            <div className="stopBubble">✋ {stoppedByName} قال قِف!</div>
            <h2>وقت الحساب 🧮</h2>
            {!state.me?.isHost && <div className="waiting">صاحب الغرفة يراجع الإجابات…</div>}
            <div className="reviewWrap">
              {state.room.categories.map((category, categoryIndex) => (
                <div className="categoryReview" key={category}>
                  <h3>{category}</h3>
                  {state.players.map((player) => {
                    const row = state.answers.find((a) => a.player_id === player.id && a.category_index === categoryIndex);
                    const answer = row?.answer?.trim() ?? "";
                    const norm = normalizeArabic(answer);
                    const duplicate = !!norm && (duplicateKeys.get(`${categoryIndex}:${norm}`) ?? 0) > 1;
                    const wrongLetter = !!answer && !norm.startsWith(normalizeArabic(state.room.currentLetter));
                    const key = `${player.id}:${categoryIndex}`;
                    const allowed = validity[key] !== false;
                    return <div className="reviewRow" key={key}>
                      <b>{player.name}</b><span className={!answer || duplicate || wrongLetter ? "badAnswer" : "goodAnswer"}>{answer || "—"}</span>
                      <span className="reason">{!answer ? "فارغ" : duplicate ? "نفس الكلمة" : wrongLetter ? "حرف غلط" : "مختلفة"}</span>
                      {state.me?.isHost && answer && !duplicate && !wrongLetter && <button className={allowed ? "validBtn" : "invalidBtn"} onClick={() => setValidity((v) => ({ ...v, [key]: !allowed }))}>{allowed ? "✓ صحيحة" : "✕ مرفوضة"}</button>}
                    </div>;
                  })}
                </div>
              ))}
            </div>
            {state.me?.isHost && <button className="comicBtn purple huge" disabled={busy} onClick={() => action("review", { validity })}>احسب النقاط 🧮</button>}
          </article>
        )}

        {state && (state.room.status === "scoring") && <article className="comicCard"><div className="waiting">نحسب النقاط… ✨</div></article>}

        {state && (state.room.status === "results" || state.room.status === "finished") && (
          <article className="comicCard resultsCard">
            <div className="trophy">🏆</div><h2>{state.room.status === "finished" ? "الترتيب النهائي" : `نتيجة الجولة ${state.room.currentRound}`}</h2>
            <div className="scoreboard">{[...state.players].sort((a,b) => b.score-a.score).map((player, index) => <div className="scoreRow" key={player.id}><span className="place">#{index+1}</span><b>{player.name}</b><strong>{player.score} نقطة</strong></div>)}</div>
            {state.me?.isHost && state.room.status === "results" && <button className="comicBtn pink huge" disabled={busy} onClick={() => action("next")}>{state.room.currentRound >= state.room.roundCount ? "اعرض الفائز 🎉" : "الجولة التالية ➜"}</button>}
            {state.room.status === "finished" && <button className="comicBtn purple" onClick={() => { setState(null); setToken(""); history.replaceState(null, "", "/bent-walad"); }}>لعبة جديدة 🔄</button>}
          </article>
        )}
      </section>
    </main>
  );
}

const css = `
*{box-sizing:border-box}.bw-page{min-height:100vh;background:#fff7d6;color:#191522;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;position:relative;overflow:hidden;padding:28px 14px 70px}.bw-page:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(#f6b800 1.4px,transparent 1.4px);background-size:26px 26px;opacity:.16}.shell{width:min(960px,100%);margin:auto;position:relative;z-index:2}.hero{display:flex;gap:24px;align-items:center;justify-content:center;margin:4px 0 30px}.hero h1{font-size:clamp(28px,6vw,54px);line-height:1.05;margin:8px 0}.hero h1 b{color:#f03d7a}.hero p{margin:0;font-weight:800;color:#5b506a}.logoBubble{width:122px;height:122px;flex:0 0 122px;border:5px solid #17131d;border-radius:45% 55% 51% 49% / 55% 43% 57% 45%;background:#ffd72e;display:grid;place-content:center;text-align:center;font-size:34px;font-weight:1000;line-height:.9;transform:rotate(-5deg);box-shadow:8px 8px 0 #17131d}.logoBubble span{color:#f03d7a}.sticker{display:inline-block;background:#fff;border:3px solid #17131d;border-radius:999px;padding:7px 14px;font-weight:900;transform:rotate(1deg)}.homeGrid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.comicCard{border:4px solid #17131d;border-radius:30px;padding:24px;background:#fff;box-shadow:9px 9px 0 #17131d;position:relative}.yellowCard{background:#ffe565;transform:rotate(-.4deg)}.blueCard{background:#8be2ff;transform:rotate(.5deg)}.lobbyCard{background:#fff}.gameCard{background:#fffdf2}.reviewCard{background:#f5e8ff}.resultsCard{background:#dfffe7;text-align:center}.cardIcon{font-size:42px}.comicCard h2{font-size:30px;margin:4px 0 18px}.comicCard label{display:block;font-weight:900;margin:13px 0 7px}.comicCard input,.comicCard select,.comicCard textarea{width:100%;border:3px solid #17131d;border-radius:16px;background:#fff;padding:13px 14px;font:inherit;font-weight:800;outline:none;box-shadow:3px 3px 0 #17131d}.comicCard input:focus,.comicCard textarea:focus{transform:translate(-1px,-1px);box-shadow:5px 5px 0 #17131d}.codeInput{text-align:center;font-size:28px;letter-spacing:7px;direction:ltr}.comicBtn{width:100%;border:4px solid #17131d;border-radius:18px;padding:14px 18px;margin-top:18px;font:inherit;font-size:19px;font-weight:1000;cursor:pointer;box-shadow:5px 5px 0 #17131d;transition:.1s}.comicBtn:active{transform:translate(4px,4px);box-shadow:1px 1px 0 #17131d}.comicBtn:disabled{opacity:.5;cursor:not-allowed}.pink{background:#ff5b93}.purple{background:#b98cff}.huge{font-size:23px;padding:17px}.errorBox{border:3px solid #17131d;background:#ffafaf;border-radius:16px;padding:12px 16px;font-weight:900;margin-bottom:16px}.roomTop{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.mini{font-weight:900;color:#6d6078}.roomCode{font-size:48px;font-weight:1000;letter-spacing:7px;direction:ltr}.shareBtn{border:3px solid #17131d;border-radius:14px;padding:12px 16px;background:#8be2ff;font:inherit;font-weight:1000;box-shadow:4px 4px 0 #17131d}.players{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.playerChip{border:3px solid #17131d;border-radius:999px;padding:9px 14px;background:#fff;font-weight:900;display:flex;gap:7px;align-items:center}.playerChip small{background:#ffd72e;padding:2px 7px;border-radius:99px}.hint,.waiting{text-align:center;font-weight:900;color:#6d6078;padding:15px}.roundBar{display:flex;justify-content:space-between;font-weight:1000;background:#8be2ff;border:3px solid #17131d;border-radius:14px;padding:10px 14px}.letterBurst{width:160px;height:160px;margin:20px auto;display:grid;place-content:center;text-align:center;background:#ffd72e;border:5px solid #17131d;clip-path:polygon(50% 0,61% 15%,79% 7%,80% 27%,100% 32%,85% 47%,98% 63%,78% 67%,76% 88%,58% 78%,48% 100%,38% 79%,17% 90%,20% 68%,0 63%,14% 47%,0 31%,21% 27%,21% 7%,40% 16%)}.letterBurst small{font-weight:1000}.letterBurst strong{font-size:78px;line-height:.9}.answerList{display:grid;grid-template-columns:1fr 1fr;gap:14px}.answerRow{margin:0!important}.answerRow span{display:block;margin-bottom:7px}.stopBtn{display:block;width:min(420px,100%);margin:26px auto 8px;border:5px solid #17131d;border-radius:24px;padding:19px;background:#ff4e60;color:#fff;font:inherit;font-size:34px;font-weight:1000;box-shadow:8px 8px 0 #17131d;cursor:pointer}.usedLetters{text-align:center;font-weight:900;color:#746b7c;margin-top:18px}.stopBubble{display:inline-block;background:#ff5b93;border:3px solid #17131d;border-radius:999px;padding:8px 14px;font-weight:1000}.categoryReview{border-top:3px dashed #7f6d91;padding:16px 0}.categoryReview h3{font-size:22px;margin:0 0 9px}.reviewRow{display:grid;grid-template-columns:1fr 1.4fr .8fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #cfbee0}.goodAnswer{font-weight:1000;color:#11833a}.badAnswer{font-weight:1000;color:#d72745;text-decoration:line-through}.reason{font-size:12px;font-weight:900}.validBtn,.invalidBtn{border:2px solid #17131d;border-radius:10px;padding:6px 9px;font-weight:1000}.validBtn{background:#87efa5}.invalidBtn{background:#ff9baa}.trophy{font-size:74px}.scoreboard{display:grid;gap:10px;margin:20px 0}.scoreRow{display:grid;grid-template-columns:60px 1fr auto;align-items:center;gap:12px;text-align:right;border:3px solid #17131d;border-radius:16px;padding:12px;background:#fff}.scoreRow:first-child{background:#ffd72e}.place{font-size:24px;font-weight:1000}.scoreRow strong{font-size:20px}.doodle{position:fixed;font-size:50px;font-weight:1000;z-index:0;opacity:.25}.d1{left:4%;top:12%;transform:rotate(-15deg)}.d2{right:4%;top:48%;color:#f03d7a}.d3{left:8%;bottom:10%;color:#7a55d6}.reviewWrap{max-height:58vh;overflow:auto;padding-left:4px}
@media(max-width:700px){.bw-page{padding-top:16px}.hero{align-items:flex-start;gap:13px}.logoBubble{width:86px;height:86px;flex-basis:86px;font-size:24px;box-shadow:5px 5px 0 #17131d}.hero h1{font-size:31px}.hero p{font-size:13px}.sticker{font-size:12px}.homeGrid{grid-template-columns:1fr}.comicCard{padding:17px;border-radius:22px;box-shadow:6px 6px 0 #17131d}.answerList{grid-template-columns:1fr}.reviewRow{grid-template-columns:1fr 1.2fr}.reason{grid-column:1}.validBtn,.invalidBtn{grid-column:2}.roomCode{font-size:38px}.letterBurst{width:135px;height:135px}.letterBurst strong{font-size:64px}.stopBtn{font-size:28px}.scoreRow{grid-template-columns:45px 1fr auto}.scoreRow strong{font-size:16px}}
`;
