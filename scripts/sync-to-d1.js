import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");

async function run() {
  console.log("Loading local articles.json...");
  const localData = JSON.parse(await fs.readFile(dbPath, "utf8"));
  
  console.log("Fetching existing slugs from D1...");
  const rawD1 = execSync('set -a; [ -f ~/.env ] && . ~/.env; npx wrangler d1 execute simple-reads-db --remote --command="SELECT slug FROM articles;"', { encoding: "utf8" });
  
  const jsonMatch = rawD1.match(/\[\s*\{\s*"results":[\s\S]*\}\s*\]/);
  const existingSlugs = new Set();
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    parsed[0].results.forEach(r => existingSlugs.add(r.slug));
  }
  console.log(`Found ${existingSlugs.size} existing slugs in D1.`);

  const toInsert = localData.filter(a => !existingSlugs.has(a.slug));
  console.log(`Found ${toInsert.length} new articles to insert.`);

  if (toInsert.length === 0) {
    console.log("No new articles to insert.");
    return;
  }

  // Create batch SQL file
  const sqlStatements = toInsert.map(a => {
    const slug = a.slug.replace(/'/g, "''");
    const title = a.title.replace(/'/g, "''");
    const category = (a.category || "mind").toLowerCase().replace(/'/g, "''");
    const content = (a.content || "").replace(/'/g, "''");
    const desc = (a.description || "").replace(/'/g, "''");
    const now = a.created_at || new Date().toISOString();
    return `INSERT OR IGNORE INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${slug}', '${title}', '${category}', '${content}', 'published', 9, '${now}', '${now}');`;
  });

  const batchFile = path.join(root, "tmp_batch_insert.sql");
  await fs.writeFile(batchFile, sqlStatements.join("\n"), "utf8");
  console.log(`Wrote SQL batch to ${batchFile}. Executing via Wrangler...`);

  execSync('set -a; [ -f ~/.env ] && . ~/.env; npx wrangler d1 execute simple-reads-db --remote --file="' + batchFile + '"', { stdio: "inherit" });
  
  await fs.unlink(batchFile);
  console.log("Successfully inserted all new articles and cleaned up temp file.");
}

run().catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
