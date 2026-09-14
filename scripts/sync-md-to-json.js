import fs from "node:fs/promises";
import path from "node:path";

async function run() {
  const articlesDir = path.join(process.cwd(), "src/content/articles");
  const jsonPath = path.join(process.cwd(), "articles.json");
  const files = (await fs.readdir(articlesDir)).filter(f => f.endsWith(".md") && f.includes("2026-09-13"));
  
  const currentJson = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  
  for (const file of files) {
    const raw = await fs.readFile(path.join(articlesDir, file), "utf8");
    // Primitive frontmatter/content split (assumes --- frontmatter ---)
    const parts = raw.split("---");
    const content = parts.slice(2).join("---").trim();
    // Assuming simple slug-from-filename
    const slug = file.replace(".md", "");
    currentJson.push({
      slug,
      title: slug.split("-").slice(3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      description: "Auto-generated content.",
      content,
      category: "mind", // Default to mind for now
      status: "published",
      impact_score: 9,
      created_at: new Date().toISOString()
    });
  }
  
  await fs.writeFile(jsonPath, JSON.stringify(currentJson, null, 2), "utf8");
  console.log("Updated articles.json with new articles.");
}
run();
