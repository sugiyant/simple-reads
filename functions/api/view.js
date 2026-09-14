export async function onRequestPost({ request, env }) {
  const { slug } = await request.json();
  const kv = env.SESSION; // Use KV if available, or fallback gracefully
  const db = env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database not bound" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Atomic increment with lightweight check
    await db.prepare("UPDATE articles SET views = COALESCE(views, 0) + 1 WHERE slug = ?1")
      .bind(slug)
      .run();
      
    return new Response(JSON.stringify({ success: true }), { 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      } 
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
