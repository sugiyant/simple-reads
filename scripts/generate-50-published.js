import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON, generateText } from "./lib/ai.js";
import { slugify } from "./lib/text.js";
import { execSync } from "node:child_process";

const categories = ["mind", "islam", "philosophy", "history", "science", "technology", "world", "story", "uplift", "poetry", "sufi", "tasawuf", "aqidah", "akhlak", "fiqih"];

function normalize(title) {
  const stopWords = new Set(["dan", "di", "dalam", "dari", "untuk", "yang", "the", "of", "in", "a", "an", "and", "or", "for", "on", "at", "to", "by", "as", "with", "its", "is", "are"]);
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .join(" ");
}

function hasSemanticDuplicate(newTitle, existingTitles) {
  const norm = normalize(newTitle);
  const words = norm.split(/\s+/);
  if (words.length < 2) return false;
  
  for (const existing of existingTitles) {
    const exNorm = normalize(existing);
    // Check if 2+ consecutive words match
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + " " + words[i + 1];
      if (exNorm.includes(bigram)) return true;
    }
  }
  return false;
}

async function run() {
  console.log("Starting batched generation with semantic dedup...");
  let count = 0;

  const existingRes = execSync('npx wrangler d1 execute simple-reads-db --remote --command "SELECT slug, title FROM articles"', { encoding: 'utf8' });
  const existingSlugs = new Set();
  const existingTitles = [];
  try {
    const data = JSON.parse(existingRes.split('\n').filter(l => l.startsWith('[')).join(''))[0].results;
    data.forEach(r => { existingSlugs.add(r.slug); existingTitles.push(r.title); });
  } catch(e) {}

  console.log(`Existing articles: ${existingSlugs.size}`);

  while (count < 50) {
    let batchQueries = [];
    let batchCount = 0;

    while (batchCount < 5 && count < 50) {
      const cat = categories[count % categories.length];
      console.log(`Generating article ${count + 1}/50 for category: ${cat}`);

      try {
        const idea = await generateJSON(`
          Generate 1 unique and constructive "Mental Nutrition" article idea for category: ${cat}.
          Strictly unique topic, no duplicates.
          Avoid: neuroplasticity, dhikr focus, deep focus, echo chambers, House of Wisdom, Stoic resilience, Tazkiyat al-Nafs — these are overused.
          Return JSON: { title, description, angle }.
        `);

        const slug = slugify(idea.title);
        if (existingSlugs.has(slug)) { console.log(`Skip exact slug: ${slug}`); continue; }
        if (hasSemanticDuplicate(idea.title, existingTitles)) { console.log(`Skip semantic dup: ${idea.title}`); continue; }

        const article = await generateText(`Write a "Mental Nutrition" article in Bahasa Indonesia. Title: ${idea.title}. Category: ${cat}. Angle: ${idea.angle}. Length: 750-900 words. Use Markdown. Reflective question at the end.`, { temperature: .7 });

        const now = new Date().toISOString();
        const escapedTitle = idea.title.replace(/'/g, "''");
        const escapedContent = article.replace(/'/g, "''");

        batchQueries.push(`INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${slug}', '${escapedTitle}', '${cat}', '${escapedContent}', 'published', 9, '${now}', '${now}');`);

        existingSlugs.add(slug);
        existingTitles.push(idea.title);
        count++;
        batchCount++;
      } catch (e) {
        console.error(`Failed generation step, retrying in 5s:`, e.message);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (batchQueries.length > 0) {
      const tempFile = path.join(process.cwd(), `tmp_batch_${Date.now()}.sql`);
      await fs.writeFile(tempFile, batchQueries.join("\n"), 'utf8');

      console.log(`Executing batch of ${batchQueries.length} articles on D1 remote...`);
      try {
        execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${tempFile}"`, { stdio: 'inherit' });
      } catch (err) {
        console.error("D1 batch execute error:", err.message);
      }
      await fs.unlink(tempFile).catch(() => {});

      console.log("Cooling down for 10 seconds...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  console.log("Done: 50 articles with semantic dedup.");
}

run();
