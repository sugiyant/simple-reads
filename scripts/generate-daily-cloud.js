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
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + " " + words[i + 1];
      if (exNorm.includes(bigram)) return true;
    }
  }
  return false;
}

async function run() {
  console.log("Starting cloud daily content generation (3 articles)...");
  
  const existingRes = execSync('npx wrangler d1 execute simple-reads-db --remote --command "SELECT slug, title FROM articles"', { encoding: 'utf8' });
  const existingSlugs = new Set();
  const existingTitles = [];
  try {
    const data = JSON.parse(existingRes.split('\n').filter(l => l.startsWith('[')).join(''))[0].results;
    data.forEach(r => { existingSlugs.add(r.slug); existingTitles.push(r.title); });
  } catch(e) {}

  let published = 0;
  let attempts = 0;

  while (published < 3 && attempts < 10) {
    attempts++;
    const cat = categories[Math.floor(Math.random() * categories.length)];
    console.log(`Attempt ${attempts}: Generating daily article for category: ${cat}`);

    try {
      const idea = await generateJSON(`
        Generate 1 unique and constructive "Mental Nutrition" article idea for category: ${cat}.
        Strictly unique topic, no duplicates.
        Return JSON: { title, description, angle }.
      `);

      const slug = slugify(idea.title);
      if (existingSlugs.has(slug)) { console.log(`Skip exact slug`); continue; }
      if (hasSemanticDuplicate(idea.title, existingTitles)) { console.log(`Skip semantic dup`); continue; }

      const article = await generateText(`Write a "Mental Nutrition" article in Bahasa Indonesia. Title: ${idea.title}. Category: ${cat}. Angle: ${idea.angle}. Length: 750-900 words. Use Markdown. Reflective question at the end.`, { temperature: .7 });

      const now = new Date().toISOString();
      const escapedTitle = idea.title.replace(/'/g, "''");
      const escapedContent = article.replace(/'/g, "''");

      const sqlQuery = `INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${slug}', '${escapedTitle}', '${cat}', '${escapedContent}', 'published', 9, '${now}', '${now}');`;
      
      const tempFile = path.join(process.cwd(), `tmp_daily_${slug}.sql`);
      await fs.writeFile(tempFile, sqlQuery, 'utf8');

      execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${tempFile}"`, { stdio: 'inherit' });
      await fs.unlink(tempFile).catch(() => {});

      existingSlugs.add(slug);
      existingTitles.push(idea.title);
      published++;
      console.log(`Published article ${published}/3: ${idea.title}`);

      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error("Error generating daily article:", e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`Cloud daily generation complete: ${published} articles published.`);
}

run();
