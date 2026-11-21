// Night Out — server function.
// Keeps the Anthropic API key on the server and builds every prompt here,
// so the endpoint can only be used for this role-play.
//
// Environment variables (Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY  optional. If you don't set one, Netlify's AI Gateway supplies
//                      ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL automatically (billed to Netlify credits).
//                      If you set your own key, calls go straight to Anthropic.
//   CLAUDE_MODEL       optional, defaults to claude-haiku-5-5 (falls back to claude-haiku-4-5)
//   CLASS_CODE         optional; if set, students must enter this code to play

// Keep these in sync with public/index.html
const ACTS = ['Movie — Friday, 8:00 p.m.', 'Bowling — Saturday, 7:00 p.m.', 'Dinner — Sunday, 6:00 p.m.'];
const FRIENDS = [
  { name: 'Maya', gender: 'female' },
  { name: 'Jon', gender: 'male' },
  { name: 'Priya', gender: 'female' },
];
const REASONS = [
  'you have to work', 'you have a family dinner', 'you have a soccer game',
  'you are visiting your grandmother', 'you have to study for a big test',
  'you are babysitting your little brother', 'you have a dentist appointment',
  "you are going to a cousin's birthday party",
];
const TRAITS = [
  'cheerful and chatty', 'a little shy; gives short answers', 'funny; likes to make small jokes',
  'relaxed and friendly', 'very enthusiastic',
];
const LEVEL = 'Novice Mid to Novice High';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const isIdx = (v, n) => Number.isInteger(v) && v >= 0 && v < n;

function persona(i, busy, reason, trait) {
  const f = FRIENDS[i];
  const opts = ACTS.map((a, k) => `${k + 1}. ${a}`).join('\n');
  const free = ACTS.map((_, k) => k).filter((k) => k !== busy).map((k) => `option ${k + 1}`).join(' and ');
  return `You are ${f.name}, a friend of the student, in an English language-learning role-play. Speak ONLY English.
You are ${f.gender === 'male' ? 'a young man' : 'a young woman'}. Personality: ${TRAITS[trait]}.
Learner level: ${LEVEL} (ACTFL). Keep every turn very short: 1–2 simple sentences, at most about 20 words, high-frequency vocabulary, mostly present tense.
Situation: the student is planning a night out with you and two other friends. The possible plans are:
${opts}
YOUR PRIVATE SCHEDULE (keep it consistent at all times): you are NOT free for option ${busy + 1} (${ACTS[busy]}) because ${REASONS[reason]}. You are free for ${free}, and you would enjoy either of them.
Answer what the student asks; don't recite your whole schedule unless asked. You do NOT know the other friends' schedules; if the student tells you about them, believe it. Never decide the plan for the student and never say which option works for everyone.
Let the student lead. Do NOT bring up the weekend, going out, or any of the plans yourself: wait until the student suggests doing something together. Until then, only answer and return small talk (for example, how you are). Once the student asks about a day or a plan, answer it.
Don't correct grammar explicitly; if a form was wrong, you may naturally reuse the correct form in your reply. If you didn't understand, ask them to repeat, simply.
Stay in this role-play. If the student asks for anything unrelated, gently steer back to making plans.`;
}

function transcript(i, history) {
  if (!history.length) return '(nothing yet)';
  return history.map((e) => {
    const where = e.ch === 'call' ? 'phone call' : e.ch === 'text' ? 'private text' : 'group chat';
    const who = e.who === 'me' ? 'Student' : e.who === i ? `You (${FRIENDS[i].name})` : FRIENDS[e.who].name;
    return `[${where}] ${who}: ${e.text}`;
  }).join('\n');
}

function instruction(mode, i) {
  const name = FRIENDS[i].name;
  const tail = `Write ONLY your next line as ${name}: plain text, no quotes, no name label, no stage directions.`;
  if (mode === 'call-open')
    return `Channel now: a PHONE CALL (spoken). The phone is ringing and you do NOT know who is calling. Answer with a simple phone greeting such as "Hello?" and nothing else. Do not use any name.\n${tail}`;
  if (mode === 'call')
    return `Channel now: a PHONE CALL (spoken). Continue the call. Only use the caller's name after they have told you who they are on this call; if they have not said who they are yet, you may ask "Who is this?". If the student says goodbye, say a short, natural goodbye.\n${tail}`;
  if (mode === 'text')
    return `Channel now: a private TEXT MESSAGE. You already know the student from the phone call. Reply like a short text; simple texting style is fine.\n${tail}`;
  return `The student has just written in the GROUP CHAT with all three friends. Decide how you react:
- If the student's latest group message clearly proposes one of the 3 options and you are free then, accept happily.
- If it proposes an option you are NOT free for, push back politely and say why (briefly).
- If it is not clear which option they mean, ask simply.
Reply ONLY with JSON: {"reply":"<your short group-chat message>","option":<1-3, or 0 if unclear>,"status":"accept"|"reject"|"unclear"}`;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'No API key found. Turn on AI for this project in Netlify, or add an ANTHROPIC_API_KEY environment variable.' }, 500);

  let b;
  try { b = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const code = process.env.CLASS_CODE;
  if (code && String(b.code || '').trim().toLowerCase() !== code.trim().toLowerCase())
    return json({ error: 'class_code' }, 401);

  const { mode, friend, busy, reason, trait } = b;
  if (!['call-open', 'call', 'text', 'group'].includes(mode) || !isIdx(friend, 3) || !isIdx(busy, 3) ||
      !isIdx(reason, REASONS.length) || !isIdx(trait, TRAITS.length) || !Array.isArray(b.history))
    return json({ error: 'Bad request' }, 400);

  const history = b.history.slice(-80).filter((e) =>
    e && ['call', 'text', 'group'].includes(e.ch) && (e.who === 'me' || isIdx(e.who, 3)) && typeof e.text === 'string'
  ).map((e) => ({ ch: e.ch, who: e.who, text: e.text.slice(0, 500) }));

  const user = `Everything between you and the student so far:\n${transcript(friend, history)}\n\n${instruction(mode, friend)}`;

  const base = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
  const call = (model) => fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system: persona(friend, busy, reason, trait),
      messages: [{ role: 'user', content: user }],
    }),
  });
  const models = process.env.CLAUDE_MODEL ? [process.env.CLAUDE_MODEL] : ['claude-haiku-5-5', 'claude-haiku-4-5'];
  let r, d;
  try {
    for (const m of models) {
      r = await call(m);
      d = await r.json().catch(() => ({}));
      const msg = (d && d.error && d.error.message) || '';
      // Try the next model only when this one isn't available.
      if (r.ok || !(r.status === 404 || /model/i.test(msg))) break;
    }
  } catch {
    return json({ error: 'Could not reach Claude.' }, 502);
  }
  if (!r.ok) return json({ error: (d && d.error && d.error.message) || `Claude returned an error (${r.status}).` }, 502);

  let text = (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();

  if (mode === 'group') {
    try {
      const j = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      return json({ reply: String(j.reply || ''), option: Number(j.option) || 0, status: String(j.status || 'unclear') });
    } catch {
      return json({ reply: text, option: 0, status: 'unclear' });
    }
  }
  text = text.replace(new RegExp('^' + FRIENDS[friend].name + '\\s*:\\s*'), '').replace(/^["“]+|["”]+$/g, '').trim();
  return json({ text });
};

export const config = { path: '/api/chat' };
