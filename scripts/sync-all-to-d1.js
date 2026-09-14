import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");

async function run() {
  console.log("Loading local articles.json...");
  const localData = JSON.parse(await fs.readFile(dbPath, "utf8"));
  
  console.log(`Preparing batch upsert for ${localData.length} articles to D1...`);

  // Create batch SQL file with INSERT OR REPLACE (or UPSERT)
  const sqlStatements = localData.map(a => {
    const slug = a.slug.replace(/'/g, "''");
    const title = a.title.replace(/'/g, "''");
    const category = (a.category || "mind").toLowerCase().replace(/'/g, "''");
    const content = (a.content || "").replace(/'/g, "''");
    const desc = (a.description || "").replace(/'/g, "''");
    const now = a.created_at || new Date().toISOString();
    return `INSERT OR REPLACE INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${slug}', '${title}', '${category}', '${content}', 'published', 9, '${now}', '${now}');`;
  });

  const batchFile = path.join(root, "tmp_batch_upsert.sql");
  await fs.writeFile(batchFile, sqlStatements.join("\n"), "utf8");
  console.log(`Wrote SQL batch to ${batchFile}. Executing via Wrangler...`);

  execSync('set -a; [ -f ~/.env ] && . ~/.env; npx wrangler d1 execute simple-reads-db --remote --file="' + batchFile + '"', { stdio: "inherit" });
  
  await fs.unlink(batchFile);
  console.log("Successfully synced all articles to D1 and cleaned up temp file.");
}

run().catch(e => {
  console.error("Sync failed:", e);
  process.exit(1);
});
