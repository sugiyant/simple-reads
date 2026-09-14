import fs from "node:fs/promises";
import path from "node:path";
import {generateJSON} from "./lib/ai.js";

const dir=path.join(process.cwd(),"content","ideas");
await fs.mkdir(dir,{recursive:true});
const today=new Date().toISOString().slice(0,10);
const ideas=await generateJSON(`
Create 20 original article ideas for Reader for ${today}.
Allowed categories: mind, islam, philosophy, history, science, technology, world.
Avoid breaking news, politics, medical advice, investment advice, celebrity gossip and topics that require live browsing.
Each idea must have a clear human benefit and a non-clickbait title.
Return JSON array with title, description, category, angle, keywords.
`);
await fs.writeFile(path.join(dir,`${today}.json`),JSON.stringify(ideas,null,2));
console.log(`Generated ${ideas.length} ideas.`);
