import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const dbPath = path.join(root, "articles.json");

async function countDrafts() {
  try {
    const data = await fs.readFile(dbPath, "utf8");
    const db = JSON.parse(data);
    return db.filter(a => a.status === 'draft' || a.status === 'review').length;
  } catch (e) {
    return 0;
  }
}

async function run() {
  let drafts = await countDrafts();
  console.log(`Starting with ${drafts} drafts...`);
  
  while (drafts < 50) {
    console.log(`--- Loop run: current drafts = ${drafts}/50 ---`);
    try {
      execSync("node scripts/generate-daily.js", { stdio: "inherit" });
    } catch (e) {
      console.error("Error during generation run, retrying in 5 seconds:", e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
    drafts = await countDrafts();
    // sleep for 1 sec to be nice
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`Done! Collected ${drafts} drafts.`);
}

run();
