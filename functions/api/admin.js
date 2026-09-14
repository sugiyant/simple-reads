export async function onRequestPost({ request, env }) {
  const { action, slug, title, category, content } = await request.json();
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database not bound" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    if (action === 'publish') {
      await db.prepare("UPDATE articles SET status = 'published', published_at = ?1 WHERE slug = ?2")
        .bind(new Date().toISOString(), slug)
        .run();
    } else if (action === 'delete') {
      await db.prepare("DELETE FROM articles WHERE slug = ?1")
        .bind(slug)
        .run();
    } else if (action === 'create') {
      const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await db.prepare("INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES (?1, ?2, ?3, ?4, 'published', 10, ?5, ?5)")
        .bind(newSlug, title, category, content, new Date().toISOString())
        .run();
    } else if (action === 'update') {
      await db.prepare("UPDATE articles SET title = ?1, category = ?2, content = ?3 WHERE slug = ?4")
        .bind(title, category, content, slug)
        .run();
    }
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
