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

// POST /api/recovery-code — body: { anon_id }
export async function onRequestPost({ request, env }) {
  const { anon_id } = await request.json();
  if (!anon_id || typeof anon_id !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'anon_id diperlukan.' }), {
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
    // Check if code already exists for this anon_id
    const existing = await db.prepare('SELECT code FROM recovery_codes WHERE anon_id = ?1').bind(anon_id).first();
    if (existing) {
      return new Response(JSON.stringify({ success: true, code: existing.code }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate new code (retry on collision, max 5 attempts)
    let code;
    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const collision = await db.prepare('SELECT code FROM recovery_codes WHERE code = ?1').bind(code).first();
      if (!collision) break;
      code = null;
    }
    if (!code) {
      return new Response(JSON.stringify({ success: false, error: 'Gagal generate kode. Coba lagi.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure anon_id exists in anon_tokens
    await db.prepare('INSERT OR IGNORE INTO anon_tokens (anon_id, created_at) VALUES (?1, ?2)').bind(anon_id, Date.now()).run();
    
    // Insert recovery code
    await db.prepare('INSERT INTO recovery_codes (code, anon_id, created_at) VALUES (?1, ?2, ?3)').bind(code, anon_id, Date.now()).run();

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal membuat kode pemulihan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
