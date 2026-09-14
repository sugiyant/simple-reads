export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  const db = context.locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });
  }

  const ADMIN_SECRET = context.locals?.runtime?.env?.BASIC_AUTH_PASS;
  if (!ADMIN_SECRET) return new Response("Unauthorized: Server misconfigured", { status: 500 });
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ADMIN_SECRET));
  const token = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  const authHeader = context.request.headers.get("Authorization");

  if (authHeader !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await context.request.json();
    const { action } = body;

    if (action === "create") {
      const { title, category, content } = body;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const now = new Date().toISOString();
      await db.prepare("INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(slug, title, category, content, "published", 9, now, now).run();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === "publish") {
      const { slug } = body;
      const now = new Date().toISOString();
      await db.prepare("UPDATE articles SET status = 'published', published_at = ? WHERE slug = ?").bind(now, slug).run();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === "delete") {
      const { slug } = body;
      await db.prepare("DELETE FROM articles WHERE slug = ?").bind(slug).run();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
