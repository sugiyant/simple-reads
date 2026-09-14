export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const db = context.locals?.runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "DB not bound" }), { status: 500 });
  }

  try {
    const { results } = await db.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
