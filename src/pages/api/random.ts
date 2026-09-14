export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async (context) => {
  const db = context.locals?.runtime?.env?.DB;
  if (!db) {
    return context.redirect("/", 302);
  }

  try {
    const { results } = await db.prepare("SELECT slug FROM articles ORDER BY RANDOM() LIMIT 1").all();
    if (results && results.length > 0 && results[0].slug) {
      return context.redirect(`/articles/${results[0].slug}`, 302);
    }
  } catch (error) {
    console.error("Random redirect failed:", error);
  }

  return context.redirect("/", 302);
};
