import fs from "node:fs/promises";
import path from "node:path";
import { generateText, generateJSON } from "./lib/ai.js";
import { slugify, wordCount } from "./lib/text.js";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");

const articlesToGenerate = [
  {
    category: "islam",
    title: "Membangun Peradaban Ilmu di Era Keemasan Islam",
    angle: "Menyoroti bagaimana tradisi keilmuan para sarjana Muslim di masa lalu memadukan wahyu dan akal, serta relevansinya untuk menghadapi krisis literasi saat ini."
  },
  {
    category: "mind",
    title: "Seni Mendengarkan dalam Komunikasi Modern",
    angle: "Menganalisis mengapa manusia modern lebih sering menunggu giliran bicara ketimbang mendengarkan, dan bagaimana mendengarkan aktif membangun empati yang sejati."
  }
];

async function run() {
  console.log("=== RESUMING BATCH 1 (RE-GENERATING FAILED ARTICLES WITH EXTENDED PROMPT) ===");
  let results = [];

  for (let i = 0; i < articlesToGenerate.length; i++) {
    const item = articlesToGenerate[i];
    console.log(`\n[Article ${i + 1}/2] Generating: "${item.title}" (${item.category})...`);

    let content = "";
    let count = 0;
    
    // Try up to 2 times to get >= 750 words
    for (let attempt = 1; attempt <= 2; attempt++) {
      const prompt = `Write an extensive, deep, and complete article in Bahasa Indonesia for Simple Reads.
Title: ${item.title}
Category: ${item.category}
Angle: ${item.angle}
Requirements:
- Length: STRICTLY BETWEEN 750 and 900 words. Expand thoroughly on the historical context, philosophical depth, and practical lessons. Do not write short summaries.
- Use clear Markdown headers.
- High truthfulness, constructive tone, no clickbait, no empty fluff.
- Must end with ONE thoughtful reflective question.
- Strict: Output raw Markdown only. NO backtick code blocks.`;

      content = await generateText(prompt, { temperature: 0.65 });
      count = wordCount(content);
      console.log(`- Attempt ${attempt}: Generated word count: ${count}`);
      if (count >= 750) break;
    }

    // 2. Self-Validation (Constitution Check)
    console.log(`- Running self-validation against constitution...`);
    const reviewPrompt = `Review the following article based on Simple Reads's Editorial Constitution.
Criteria:
1. Word count between 750 and 900 words? (Current count: ${count})
2. Truth-first, no fake facts/quotes/studies?
3. Constructive tone, no clickbait, no manipulation?
4. Ends with ONE reflective question?
5. High-quality Bahasa Indonesia?

Return a JSON object:
{
  "publish": boolean,
  "score": number (0-10),
  "feedback": string,
  "has_reflective_question": boolean
}

ARTICLE CONTENT:
${content}`;

    let review;
    try {
      review = await generateJSON(reviewPrompt);
    } catch (e) {
      console.error(`- Validation JSON parse failed:`, e.message);
      review = { publish: false, score: 0, feedback: "JSON parse failed", has_reflective_question: false };
    }

    console.log(`- Validation result: Publish=${review.publish}, Score=${review.score}/10, Feedback=${review.feedback}`);

    if (review.publish && review.score >= 7 && count >= 700) {
      let db = [];
      try {
        db = JSON.parse(await fs.readFile(dbPath, 'utf8'));
      } catch (e) {}

      const slug = slugify(item.title);
      const newArticle = {
        slug,
        title: item.title,
        description: item.angle,
        content,
        category: item.category,
        status: 'published',
        impact_score: review.score,
        created_at: new Date().toISOString()
      };

      db.push(newArticle);
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
      console.log(`- Status: PASS & PUBLISHED to DB.`);
      results.push({ title: item.title, status: "PASS", score: review.score, words: count });
    } else {
      console.log(`- Status: FAIL.`);
      results.push({ title: item.title, status: "FAIL", score: review?.score || 0, words: count, reason: review?.feedback || "Word count / score threshold not met" });
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log("\n=== RESUMED BATCH SUMMARY ===");
  console.table(results);
}

run().catch(console.error);
