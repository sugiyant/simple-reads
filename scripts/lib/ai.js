function key() {
  return process.env.GEMINI_API_KEY || process.env.HERMES_CUSTOM_LOCALHOST_20128_API_KEY || "sk-local-key"; 
}

function model() {
  if (process.env.GEMINI_API_KEY) {
    return "gemini-3.6-flash";
  }
  return process.env.AI_MODEL || "my9model-free"; 
}

function endpoint() {
  if (process.env.GEMINI_API_KEY) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions";
  }
  return "http://localhost:20128/v1/chat/completions";
}

async function request(messages, json = false) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key()}`
      },
      body: JSON.stringify({
        model: model(),
        messages: messages,
        temperature: 0.6,
        response_format: json ? { type: "json_object" } : undefined
      })
    });
    
    if (r.ok) {
      const text = await r.text();
      // Handle SSE response (data: ...)
      if (text.includes('data: ')) {
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        let combined = "";
        for (const line of lines) {
          try {
            const raw = line.replace('data: ', '').trim();
            if (raw === '[DONE]') continue;
            const part = JSON.parse(raw);
            if (part.choices?.[0]?.delta?.content) {
              combined += part.choices[0].delta.content;
            } else if (part.choices?.[0]?.message?.content) {
              combined += part.choices[0].message.content;
            }
          } catch(e) {}
        }
        if (combined) return combined;
      }
      
      // Handle Standard JSON response
      try {
        const res = JSON.parse(text);
        
        // 1. Check if the top level has choices
        if (res.choices?.[0]?.message?.content) {
            let content = res.choices[0].message.content;
            
            // 2. If content itself is stringified JSON, parse it again
            if (typeof content === "string" && content.trim().startsWith("{")) {
                try {
                    const inner = JSON.parse(content);
                    // Often nested: { choices: [...] }
                    if (inner.choices?.[0]?.message?.content) return inner.choices[0].message.content;
                    // Sometimes just pure JSON
                    return content; 
                } catch(e) { return content; }
            }
            return content;
        }
        
        // 3. If raw string is actually JSON, try to extract content
        if (typeof res === "string") {
            try {
                const inner = JSON.parse(res);
                if (inner.choices?.[0]?.message?.content) return inner.choices[0].message.content;
            } catch(e) {}
        }
        
        // 4. Final fallback
        return typeof res === 'object' ? JSON.stringify(res) : res;
      } catch (e) {
        return text;
      }
    }
    
    const text = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 3) {
      await new Promise(x => setTimeout(x, attempt * 5000));
      continue;
    }
    throw new Error(`9Router API ${r.status}: ${text}`);
  }
}

export async function generateText(prompt, { json = false, temperature = 0.6 } = {}) {
  const messages = [
    {
      role: "system",
      content: "You are Simple Reads's editorial AI. Follow EDITORIAL_CONSTITUTION.md. Truth-first, constructive-second. Never invent facts, quotations, sources or statistics. When uncertain, say so or omit the claim. IMPORTANT: Output raw Markdown directly. NEVER wrap the article text in ```markdown ... ``` code blocks."
    },
    {
      role: "user",
      content: prompt
    }
  ];
  return await request(messages, json);
}

export async function generateJSON(prompt) {
  const finalPrompt = prompt + "\n\nRespond in pure JSON format only without codeblock wrapper.";
  const text = await generateText(finalPrompt, { json: true });
  try {
    // Remove everything before the first { and after the last }
    let clean = text.trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No valid JSON structure found");
    }
    
    clean = clean.substring(firstBrace, lastBrace + 1);
    
    // Further sanitize: remove potential trailing artifacts like "data: [DONE]"
    clean = clean.replace(/data:.*$/gm, '').trim();
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw e;
  }
}
