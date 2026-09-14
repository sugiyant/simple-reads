export async function onRequestGet({ env }) {
  const db = env.DB;
  const { results } = await db.prepare("SELECT * FROM articles").all();
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
}
