import fs from "node:fs/promises";
import path from "node:path";
import { generateText, generateJSON } from "./lib/ai.js";
import { slugify, wordCount } from "./lib/text.js";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");

const remainingArticles = [
  {
    category: "islam",
    title: "Konsep Sabar dan Syukur sebagai Pilar Ketahanan Mental",
    angle: "Mengkaji bagaimana integrasi sabar dan syukur dalam tradisi Islam membentuk ketahanan psikologis yang kokoh dalam menghadapi tekanan hidup modern."
  },
  {
    category: "mind",
    title: "Mengatasi Kelelahan Keputusan (Decision Fatigue) di Dunia Serba Cepat",
    angle: "Menganalisis fenomena kelelahan keputusan akibat terlalu banyaknya pilihan di era digital serta strategi psikologis untuk menyederhanakan fokus."
  }
];

async function run() {
  console.log("=== GENERATING REMAINING BATCH 1 ARTICLES == >");
  let results = [];

  for (let i = 0; i < remainingArticles.length; i++) {
    const item = remainingArticles[i];
    console.log(`\n[Article ${i + 1}/2] Generating: "${item.title}" (${item.category})...`);

    let content = "";
    let count = 0;
    
    for (let attempt = 1; attempt <= 2; attempt++) {
      const prompt = `Write an extensive, deep, and complete article in Bahasa Indonesia for Simple Reads.
Title: ${item.title}
Category: ${item.category}
Angle: ${item.angle}
Requirements:
- Length: STRICTLY between 800 and 1000 words to ensure it comfortably exceeds the 750 words minimum. Expand thoroughly with rich explanations, examples, and reflections.
- Use clear Markdown headers.
- High truthfulness, constructive tone, no clickbait, no empty fluff.
- Must end with ONE thoughtful reflective question.
- Strict: Output raw Markdown only. NO backtick code blocks.`;

      content = await generateText(prompt, { temperature: 0.65 });
      count = wordCount(content);
      console.log(`- Attempt ${attempt}: Generated word count: ${count}`);
      if (count >= 750) break;
    }

    console.log(`- Running self-validation against constitution...`);
    const reviewPrompt = `Review the following article based on Simple Reads's Editorial Constitution.
Criteria:
1. Word count at least 750 words? (Current count: ${count})
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

  console.log("\n=== REMAINING ARTICLES SUMMARY ===");
  console.table(results);
}

run().catch(console.error);
