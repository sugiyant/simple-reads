import fs from "node:fs/promises";
import path from "node:path";
import {generateJSON, generateText} from "./lib/ai.js";
import {slugify, wordCount} from "./lib/text.js";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");
const logPath = path.join(root, "generate-200.log");

const categories = ["mind", "islam", "philosophy", "history", "science", "technology", "world", "story", "uplift", "poetry"];
const targetCount = 200;

async function getStats() {
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        const db = JSON.parse(data);
        const stats = {};
        categories.forEach(c => stats[c] = 0);
        db.forEach(a => { if(stats.hasOwnProperty(a.category)) stats[a.category]++; });
        return { total: db.length, stats };
    } catch(e) { return { total: 0, stats: {} }; }
}

async function run() {
    await fs.writeFile(logPath, "Starting 200 article generation...\n");
    
    while(true) {
        const { total, stats } = await getStats();
        if (total >= targetCount) break;

        // Choose category: Islam (50%) vs others (50% split)
        // stats.islam < 100? prioritize islam.
        let category;
        if (stats.islam < 100) {
            category = "islam";
        } else {
            // Pick lowest from others
            let others = categories.filter(c => c !== "islam");
            others.sort((a,b) => stats[a] - stats[b]);
            category = others[0];
        }

        console.log(`Generating for ${category}...`);
        
        // Generate batch of 2
        for(let i=0; i<2; i++) {
            try {
                const idea = await generateJSON(`Generate 1 "Mental Nutrition" article idea for category: ${category}. Return JSON: { title, description, category, angle, factual_risk }`);
                const article = await generateText(`Write a "Mental Nutrition" article in Bahasa Indonesia. Title: ${idea.title}. Category: ${idea.category}. Angle: ${idea.angle}. Length: 750-900 words. Use Markdown. Reflective question at the end.`);
                
                let db = [];
                try { db = JSON.parse(await fs.readFile(dbPath, 'utf8')); } catch(e) {}
                db.push({ 
                    slug: slugify(idea.title), 
                    title: idea.title, 
                    description: idea.description, 
                    content: article, 
                    category: idea.category, 
                    status: 'draft', 
                    created_at: new Date().toISOString() 
                });
                await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
                await fs.appendFile(logPath, `Added: ${idea.title} (${category})\n`);
            } catch(e) {
                await fs.appendFile(logPath, `Error: ${e.message}\n`);
            }
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    await fs.appendFile(logPath, "Done! 200 articles reached.\n");
}

run();
