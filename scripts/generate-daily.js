import fs from "node:fs/promises";
import path from "node:path";
import {generateJSON,generateText} from "./lib/ai.js";
import {slugify,wordCount} from "./lib/text.js";

const root=process.cwd();
const rejectedDir=path.join(root,"content/rejected");
const dbPath = path.join(root, "articles.json"); // Fallback simple DB for dev
await fs.mkdir(rejectedDir,{recursive:true});

const today=new Date().toISOString().slice(0,10);
const categories=["mind","islam","philosophy","history","science","technology","world","story","uplift","poetry","sufi","tasawuf","aqidah","akhlak","fiqih"];

const ideas=await generateJSON(`
Generate 5 candidate "Mental Nutrition" articles for ${today}.
Categories: ${categories.join(", ")}.
Themes: Constructive, truthful.
Return JSON array: title, description, category, angle, factual_risk (low|medium|high).
`);

const candidates=ideas.filter(x=>x.factual_risk!=="high").slice(0,5);
let published=0;

for(const idea of candidates){
  const slug=slugify(idea.title);

  // 2. WRITER
  const article=await generateText(`Write a "Mental Nutrition" article in Bahasa Indonesia. Title: ${idea.title}. Category: ${idea.category}. Angle: ${idea.angle}. Length: 750-900 words. Use Markdown. Reflective question at the end.`,{temperature:.65});
  if(wordCount(article)<650)continue;

  // 3. REVIEW
  const review=await generateJSON(`Review article against: factuality, depth, constructive_impact. Return JSON: { publish: bool, score: 0-10, has_reflective_question: bool }. ARTICLE: ${article}`);

  if(!review.publish || review.score<8){
    await fs.writeFile(path.join(rejectedDir,`${today}-${slug}.json`),JSON.stringify({idea,review,article},null,2));
    continue;
  }

  // 4. SAVE TO FALLBACK DB
  let db = [];
  try { db = JSON.parse(await fs.readFile(dbPath, 'utf8')); } catch(e) {}
  db.push({ slug, title: idea.title, description: idea.description, content: article, category: idea.category, status: 'draft', impact_score: review.score, created_at: new Date().toISOString() });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  published++;
}
console.log(`Published ${published} article(s) to draft DB.`);
