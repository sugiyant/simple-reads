import type { APIRoute } from 'astro';

export const prerender = false;

// Rate limiter: simple in-memory IP tracker
const attempts = new Map<string, { count: number; first: number }>();
function checkRateLimit(ip: string): boolean {
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

export const POST: APIRoute = async ({ request, locals }) => {
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

  const db = (locals as any).runtime?.env?.DB;
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
      bookmarks: results.map((r: any) => r.article_id)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal memulihkan bookmark.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
