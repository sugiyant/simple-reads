import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON, generateText } from "./lib/ai.js";
import { slugify } from "./lib/text.js";
import { execSync } from "node:child_process";

const categories = [
  "mind", "islam", "philosophy", "history", "science", "technology", 
  "world", "story", "uplift", "poetry", "sufi", "tasawuf", 
  "aqidah", "akhlak", "fiqih"
];

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
  console.log("Starting lightweight sequential bulk generation (50 articles)...");
  
  // 1. Fetch existing articles
  let existingRes;
  try {
    existingRes = execSync('npx wrangler d1 execute simple-reads-db --remote --command "SELECT slug, title, category FROM articles"', { encoding: 'utf8' });
  } catch (err) {
    console.error("Failed to connect to D1 remote:", err.message);
    process.exit(1);
  }

  const existingSlugs = new Set();
  const existingTitles = [];
  const counts = {};
  categories.forEach(c => counts[c] = 0);

  try {
    const data = JSON.parse(existingRes.split('\n').filter(l => l.startsWith('[')).join(''))[0].results;
    data.forEach(r => { 
      existingSlugs.add(r.slug); 
      existingTitles.push(r.title);
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });
  } catch(e) {
    console.log("No existing articles or failed to parse data. Proceeding empty.");
  }

  let generated = 0;
  let attempts = 0;

  while (generated < 133 && attempts < 1500) {
    attempts++;
    
    // Sort categories by current count (ascending) to focus on the ones with fewest articles
    const sortedCats = Object.keys(counts).sort((a, b) => counts[a] - counts[b]);
    
    // Introduce some random weight but heavily bias towards the lowest-count categories
    // Choose from the bottom 5 categories
    const pool = sortedCats.slice(0, 5);
    const cat = pool[Math.floor(Math.random() * pool.length)];

    console.log(`\n[Article ${generated + 1}/250] (Attempt ${attempts}) targeting category: ${cat} (current count: ${counts[cat]})`);

    try {
      const idea = await generateJSON(`
        Generate 1 unique and highly constructive "Mental Nutrition" article idea for category: ${cat}.
        The topic should be deep, analytical, and timeless.
        Strictly unique topic, no duplicates.
        Return JSON: { title, description, angle }.
      `);

      const slug = slugify(idea.title);
      if (existingSlugs.has(slug)) { 
        console.log(`Skip exact slug`); 
        continue; 
      }
      if (hasSemanticDuplicate(idea.title, existingTitles)) { 
        console.log(`Skip semantic duplicate`); 
        continue; 
      }

      console.log(`Writing article: "${idea.title}"...`);
      const article = await generateText(`Write a deep "Mental Nutrition" article in Bahasa Indonesia. 
      Title: ${idea.title}. 
      Category: ${cat}. 
      Angle: ${idea.angle}. 
      Length: MINIMUM 1000 words. 
      Structure: Introduction, Deep Analysis (3-4 sections), Practical Application, Conclusion.
      Tone: Reflective, wise, and highly academic but accessible.
      Use Markdown. Reflective question at the end.`, { temperature: .7 });

      const count = article.split(/\s+/).length;
      if (count < 950) {
        console.log(`✗ [REJECTED] Word count too low: ${count}`);
        continue;
      }

      // QUALITY GATE check
      const review = await generateJSON(`Review article against: factuality, depth, constructive_impact, and pure Indonesian language. 
      Must be > 950 words.
      Return JSON: { publish: bool, score: 0-10, reason: string }. 
      ARTICLE: ${article}`);

      if (!review.publish || review.score < 8) {
        console.log(`✗ [REJECTED by Quality Gate] Score: ${review.score}/10, Reason: ${review.reason}`);
        continue;
      }

      const now = new Date().toISOString();
      const escapedTitle = idea.title.replace(/'/g, "''");
      const escapedContent = article.replace(/'/g, "''");

      const sqlQuery = `INSERT INTO articles (slug, title, category, content, status, impact_score, created_at, published_at) VALUES ('${slug}', '${escapedTitle}', '${cat}', '${escapedContent}', 'published', 9, '${now}', '${now}');`;
      
      const tempFile = path.join(process.cwd(), `tmp_bulk_${slug}.sql`);
      await fs.writeFile(tempFile, sqlQuery, 'utf8');

      execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${tempFile}"`, { stdio: 'ignore' });
      await fs.unlink(tempFile).catch(() => {});

      existingSlugs.add(slug);
      existingTitles.push(idea.title);
      counts[cat]++;
      generated++;
      console.log(`✓ [SUCCESS] ${generated}/250: "${idea.title}" published under category: ${cat}.`);

      // Sleep 3 seconds between requests to maintain low network/cpu stress
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`Error generating article:`, e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`Bulk generation complete: ${generated} articles published.`);
}

run();
