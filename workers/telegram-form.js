// Cloudflare Worker: принимает заявку с сайта и пересылает её в Telegram-чат.
// Секреты (Settings → Variables and Secrets): BOT_TOKEN, CHAT_ID.

const ALLOWED_ORIGINS = ['https://vivante-life.eu'];

const FIELDS = [
  ['firstName', 'Имя'],
  ['lastName', 'Фамилия'],
  ['email', 'Email'],
  ['phone', 'Телефон'],
  ['telegram', 'Telegram'],
  ['whatsapp', 'WhatsApp'],
  ['viber', 'Viber'],
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const reply = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ ok: false, error: 'method' }, 405);
    if (!ALLOWED_ORIGINS.includes(origin)) return reply({ ok: false, error: 'origin' }, 403);

    let data;
    try { data = await request.json(); } catch { return reply({ ok: false, error: 'json' }, 400); }

    // Скрытое поле-ловушка: люди его не видят, боты заполняют.
    if (data.website) return reply({ ok: true });

    const clean = (v) => String(v ?? '').trim().slice(0, 200);
    const f = Object.fromEntries(FIELDS.map(([k]) => [k, clean(data[k])]));
    if (!f.firstName || !f.lastName || !f.email) return reply({ ok: false, error: 'required' }, 400);

    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const lines = FIELDS.filter(([k]) => f[k]).map(([k, label]) => `<b>${label}:</b> ${esc(f[k])}`);
    const page = clean(data.page);
    const text = [
      '<b>Новая заявка — Vivante Maldives</b>',
      '',
      ...lines,
      '',
      page ? `Страница: ${esc(page)}` : '',
    ].filter((l, i, a) => l || a[i - 1]).join('\n').trim();

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) return reply({ ok: false, error: 'telegram' }, 502);
    return reply({ ok: true });
  },
};
