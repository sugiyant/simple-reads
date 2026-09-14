// GET /api/bookmarks?anon_id=...
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const anon_id = url.searchParams.get('anon_id');
  if (!anon_id) {
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
    const { results } = await db.prepare('SELECT article_id, created_at FROM bookmarks WHERE anon_id = ?1 ORDER BY created_at DESC').bind(anon_id).all();
    return new Response(JSON.stringify({ success: true, bookmarks: results }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal mengambil bookmark.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/bookmarks — body: { anon_id, article_id }
export async function onRequestPost({ request, env }) {
  const { anon_id, article_id } = await request.json();
  if (!anon_id || !article_id) {
    return new Response(JSON.stringify({ success: false, error: 'anon_id dan article_id diperlukan.' }), {
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
    // Ensure anon_id exists
    await db.prepare('INSERT OR IGNORE INTO anon_tokens (anon_id, created_at) VALUES (?1, ?2)').bind(anon_id, Date.now()).run();
    
    // Insert bookmark (idempotent via UNIQUE constraint)
    await db.prepare('INSERT OR IGNORE INTO bookmarks (anon_id, article_id, created_at) VALUES (?1, ?2, ?3)').bind(anon_id, article_id, Date.now()).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal menyimpan bookmark.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/bookmarks — body: { anon_id, article_id }
export async function onRequestDelete({ request, env }) {
  const { anon_id, article_id } = await request.json();
  if (!anon_id || !article_id) {
    return new Response(JSON.stringify({ success: false, error: 'anon_id dan article_id diperlukan.' }), {
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
    await db.prepare('DELETE FROM bookmarks WHERE anon_id = ?1 AND article_id = ?2').bind(anon_id, article_id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Gagal menghapus bookmark.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
