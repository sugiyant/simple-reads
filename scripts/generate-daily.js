import fs from "node:fs/promises";
import path from "node:path";
import {generateJSON,generateText} from "./lib/ai.js";
import {slugify,wordCount} from "./lib/text.js";

const root=process.cwd();
const rejectedDir=path.join(root,"content/rejected");
const dbPath = path.join(root, "articles.json"); // Fallback simple DB for dev
await fs.mkdir(rejectedDir,{recursive:true});

const today=new Date().toISOString().slice(0,10);
const categories=["daily-life", "nature", "people-culture", "world", "science", "short-story"];
const levels=["A1", "A2", "B1", "B2"];

const ideas=await generateJSON(`
Generate 3 candidate "Simple Reads" English articles for ${today}.
Categories: ${categories.join(", ")}.
Levels: ${levels.join(", ")}.
Themes: Educational, simple vocabulary, CEFR aligned.
Return JSON array: title, description, category, level, angle.
`);

const candidates=ideas.filter(x=>x.factual_risk!=="high").slice(0,5);
let published=0;

for(const idea of candidates){
  const slug=slugify(idea.title);

  // 2. WRITER
  const article=await generateText(`Write a "Simple Reads" article in English for CEFR level ${idea.level}. Category: ${idea.category}. Topic: ${idea.title}. Description: ${idea.description}. Target audience: Learners. Style: Simple, clear, short sentences. Avoid idioms. Length: 400-600 words. Use Markdown. End with a simple question.`);
  
  // 3. REVIEW
  const review=await generateJSON(`Review article against: clarity, grammar, CEFR level alignment (${idea.level}). Return JSON: { publish: bool, score: 0-10 }. ARTICLE: ${article}`);

  if(!review.publish || review.score<8){
    await fs.writeFile(path.join(rejectedDir,`${today}-${slug}.json`),JSON.stringify({idea,review,article},null,2));
    continue;
  }

  // 4. SAVE TO FALLBACK DB
  let db = [];
  try { db = JSON.parse(await fs.readFile(dbPath, 'utf8')); } catch(e) {}
  db.push({ slug, title: idea.title, description: idea.description, content: article, category: idea.category, level: idea.level, status: 'draft', created_at: new Date().toISOString() });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  published++;
}
console.log(`Published ${published} article(s) to draft DB.`);
