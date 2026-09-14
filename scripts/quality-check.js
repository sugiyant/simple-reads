import fs from "node:fs/promises";
import path from "node:path";
const dir=path.join(process.cwd(),"src/content/articles");
const files=(await fs.readdir(dir)).filter(f=>f.endsWith(".md"));
const banned=["you won't believe","10x your","secret hack","guaranteed","miracle cure","get rich quick"];
let bad=false;
for(const f of files){
 const s=(await fs.readFile(path.join(dir,f),"utf8")).toLowerCase();
 for(const x of banned)if(s.includes(x)){console.error(`${f}: suspicious phrase "${x}"`);bad=true}
 if(s.split(/\s+/).length<750){console.error(`${f}: suspiciously short (${s.split(/\s+/).length} words, need 750+)`);bad=true}
}
if(bad)process.exit(1);
console.log("Quality heuristics passed.");
