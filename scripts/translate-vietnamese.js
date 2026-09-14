import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { generateJSON, generateText } from "./lib/ai.js";
import { slugify } from "./lib/text.js";

// Utility to escape single quotes in SQL
function escapeSQL(str) {
  return str.replace(/'/g, "''");
}

async function run() {
  console.log("Fetching articles with potential Vietnamese slugs...");
  
  const query = "SELECT slug, title, content, category FROM articles WHERE slug LIKE '%-cua-%' OR slug LIKE '%-trong-%' OR slug LIKE '%-su-%' OR slug LIKE '%-nghich-%' OR slug LIKE '%-thoi-%' OR slug LIKE '%-thuat-%' OR slug LIKE '%-thanh-%' OR slug LIKE '%-nhan-%' OR slug LIKE '%-trinh-%' OR slug LIKE '%-cach-%' OR slug LIKE '%-cho-%' OR slug LIKE '%-viec-%'";
  
  let res;
  try {
    res = execSync(`npx wrangler d1 execute simple-reads-db --remote --command "${query}"`, { encoding: 'utf8' });
  } catch (err) {
    console.error("Failed to fetch articles:", err.message);
    process.exit(1);
  }

  let articles = [];
  try {
    const jsonStart = res.indexOf('[');
    const jsonEnd = res.lastIndexOf(']') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON block found in wrangler output");
    }
    const rawJSON = res.substring(jsonStart, jsonEnd);
    articles = JSON.parse(rawJSON)[0].results;
  } catch(e) {
    console.log("Failed to parse articles JSON or none found:", e.message);
    return;
  }

  console.log(`Found ${articles.length} potential Vietnamese articles. Starting translation pipeline...`);

  for (const art of articles) {
    console.log(`\nTranslating: "${art.title}" (${art.slug})...`);
    
    try {
      // 1. Generate Translated Title & Description
      const translationMeta = await generateJSON(`
        Translate this title and description from Vietnamese/Mixed to clean, natural, and highly academic/eloquent Bahasa Indonesia.
        Do NOT use Google Translate literalism. Use deep, beautiful Indonesian vocabulary (Mental Nutrition style).
        Title: ${art.title}
        Return JSON: { title: "translated title", description: "translated description" }
      `);

      console.log(`Translated Title: "${translationMeta.title}"`);
      const newSlug = slugify(translationMeta.title);

      // 2. Generate Translated Content
      const newContent = await generateText(`
        You are an elite editorial translator. 
        Translate this "Mental Nutrition" article from Vietnamese to highly fluent, deep, and eloquent Bahasa Indonesia.
        Ensure it matches the academic, wise, and highly reflective tone of Simple Reads.
        Do NOT summarize. Keep the length and format (Markdown, headings).
        Ensure it maintains the minimum 1000 words length.
        
        Original Content:
        ${art.content}
      `);

      const escapedTitle = escapeSQL(translationMeta.title);
      const escapedDesc = escapeSQL(translationMeta.description);
      const escapedContent = escapeSQL(newContent);
      const now = new Date().toISOString();

      // We will DELETE the old article (using old slug) and INSERT the new one!
      // This is safer as D1's slug is UNIQUE and changing it with UPDATE can be tricky or leave the old one.
      const sqlQueries = [
        `DELETE FROM articles WHERE slug = '${escapeSQL(art.slug)}';`,
        `INSERT INTO articles (slug, title, description, category, content, status, impact_score, created_at, published_at) VALUES ('${newSlug}', '${escapedTitle}', '${escapedDesc}', '${art.category}', '${escapedContent}', 'published', 9, '${now}', '${now}');`
      ].join("\n");

      const tempFile = path.join(process.cwd(), `tmp_trans_${art.slug}.sql`);
      await fs.writeFile(tempFile, sqlQueries, 'utf8');

      console.log(`Executing SQL update for ${art.slug} -> ${newSlug}...`);
      execSync(`npx wrangler d1 execute simple-reads-db --remote --file="${tempFile}"`, { stdio: 'ignore' });
      await fs.unlink(tempFile).catch(() => {});

      console.log(`✓ Successfully translated and live: "${translationMeta.title}"`);
      
      // Delay to avoid network stress
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.error(`Error translating ${art.slug}:`, e.message);
    }
  }

  console.log("All translations completed!");
}

run();
