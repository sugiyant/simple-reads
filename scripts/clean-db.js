import { execSync } from "node:child_process";

async function clean() {
  console.log("Fetching articles from D1 remote...");
  const res = execSync('npx wrangler d1 execute simple-reads-db --remote --command "SELECT slug, content FROM articles"', { encoding: 'utf8' });
  try {
    const rows = JSON.parse(res.split('\n').filter(l => l.startsWith('[')).join(''))[0].results;
    console.log(`Found ${rows.length} articles to check.`);
    
    for (const row of rows) {
      let content = row.content;
      let modified = false;
      
      if (content.startsWith("```markdown")) {
        content = content.replace(/^```markdown\s*/i, "").replace(/```\s*$/, "").trim();
        modified = true;
      } else if (content.startsWith("```")) {
        content = content.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        modified = true;
      }
      
      if (modified) {
        console.log(`Cleaning slug: ${row.slug}`);
        const escaped = content.replace(/'/g, "''");
        // Use base64 or parameterized file approach if content is large, but for now template string with replace
        const tempSql = `UPDATE articles SET content = '${escaped}' WHERE slug = '${row.slug}';`;
        const tempFile = `tmp_clean_${row.slug}.sql`;
        const fs = await import('node:fs/promises');
        await fs.writeFile(tempFile, tempSql, 'utf8');
        execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${tempFile}"`);
        await fs.unlink(tempFile).catch(() => {});
      }
    }
    console.log("Database cleanup complete!");
  } catch (e) {
    console.error("Cleanup error:", e);
  }
}

clean();
