// Rate limiter: simple in-memory IP tracker
const attempts = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 60000; // 1 minute
  const maxAttempts = 5;
  const record = attempts.get(ip) || { count: 0, first: now };
  if (now - record.first > window) {
    attempts.set(ip, { count: 1, first: now });
    return true;
  }
  if (record.count >= maxAttempts) return false;
  record.count++;
  attempts.set(ip, record);
  return true;
}

// Recovery code charset: no 0/O/1/I/L
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateCode() {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    if (i === 3) code += '-';
  }
  return code;
}

// POST /api/restore — body: { code }
export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ success: false, error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { code } = await request.json();
  if (!code || typeof code !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Kode tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database tidak tersedia.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const normalized = code.toUpperCase().trim();
    const row = await db.prepare('SELECT anon_id FROM recovery_codes WHERE code = ?1').bind(normalized).first();
    if (!row) {
      return new Response(JSON.stringify({ success: false, error: 'Kode tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch all bookmarks for this anon_id
    const { results } = await db.prepare('SELECT article_id FROM bookmarks WHERE anon_id = ?1 ORDER BY created_at ASC').bind(row.anon_id).all();
    
    return new Response(JSON.stringify({
      success: true,
      anon_id: row.anon_id,
      bookmarks: results.map(r => r.article_id)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal memulihkan bookmark.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
