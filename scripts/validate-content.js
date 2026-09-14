import fs from "node:fs/promises";
import path from "node:path";
const dir=path.join(process.cwd(),"src/content/articles");
const files=(await fs.readdir(dir)).filter(f=>f.endsWith(".md"));
const allowed=["mind","islam","philosophy","history","science","technology","world"];
let bad=false;
for(const f of files){
 const s=await fs.readFile(path.join(dir,f),"utf8");
 for(const field of ["title:","description:","date:","category:","readingTime:","status:"])if(!s.includes(field)){console.error(`${f}: missing ${field}`);bad=true}
 const m=s.match(/category:\s*["']?([a-z]+)["']?/); if(m&&!allowed.includes(m[1])){console.error(`${f}: invalid category`);bad=true}
 if(s.includes("{{")||s.includes("}}")){console.error(`${f}: template residue`);bad=true}
}
if(bad)process.exit(1);
console.log(`Validated ${files.length} article files.`);
