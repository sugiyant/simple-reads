import rss from "@astrojs/rss";

export const prerender = false;

export async function GET(context) {
  const db = context.locals?.runtime?.env?.DB;
  let articles = [];

  if (db) {
    const { results } = await db.prepare("SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC").all();
    articles = results || [];
  }

  return rss({
    title: "Simple Reads",
    description: "Makanan untuk pikiran.",
    site: context.site || "https://simple.sugiyanto.com",
    items: articles.map(a => ({
      title: a.title,
      description: a.description || a.content?.substring(0, 100),
      pubDate: new Date(a.published_at || a.created_at || Date.now()),
      link: `/articles/${a.slug}/`
    }))
  });
}
