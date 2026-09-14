export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  const db = context.locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "DB not bound" }), {
      status: 500,
    });
  }

  try {
    const body = await context.request.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
      });
    }

    // Rate limit: skip if slug is empty or too long (prevents abuse)
    if (slug.length > 200) {
      return new Response(JSON.stringify({ error: "Slug too long" }), {
        status: 400,
      });
    }

    // ponytail: idempotent per-session via localStorage on client; server just increments
    // upgrade: add per-IP dedup with a separate table if spam becomes a problem
    const result = await db
      .prepare("UPDATE articles SET views = views + 1 WHERE slug = ?1 RETURNING views")
      .bind(slug)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ views: result.views }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
