# Architecture

## Principle

The reader is static. AI is a build-time content worker.

This keeps the public website fast, cheap and independent of an AI API at request time.

## Components

### Reader
Astro generates static HTML.

### Content
Markdown files are validated by Astro's content collection schema.

### AI worker
GitHub Actions executes Node scripts once per day.

### AI provider
`src/scripts/lib/ai.js` isolates Gemini. A second provider can be implemented without changing the website.

### Quality gate
An article must pass:
- minimum length
- AI review score
- factuality score
- usefulness score
- banned-phrase heuristics
- frontmatter schema

### Deployment
A successful content commit triggers Cloudflare Pages Git deployment.

## Failure philosophy

The system is fail-closed.

No AI response means no publication.

Weak review means no publication.

Invalid metadata means no deployment.

This is preferable to automatically publishing low-quality content merely to hit a daily number.
