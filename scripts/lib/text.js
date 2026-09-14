export function slugify(s){return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,90)}
export function wordCount(s){return s.trim().split(/\s+/).filter(Boolean).length}
export function readingTime(s){return Math.max(1,Math.round(wordCount(s)/220))}
export function hasForeignDiacritics(s){
  // Check for foreign diacritics like đ, ê, â, ô, ơ, ư or specific non-Indonesian characters
  const pattern = /[đĐêÊâÂôÔơƠưƯ]/;
  return pattern.test(s);
}
export function extractUrls(s){return [...s.matchAll(/https?:\/\/[^\s)]+/g)].map(x=>x[0])}
