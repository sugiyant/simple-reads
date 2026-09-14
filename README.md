# Reader — Complete V1

A quiet place on the internet for thoughtful reading.

## What is included

- Astro static site
- Markdown content collections with schema validation
- Daily 5-article AI pipeline
- Idea generation
- Article generation
- AI editorial review
- Fail-closed publishing
- Basic AI-slop/clickbait heuristics
- Rejection archive
- Category pages
- Full archive
- Pagefind search
- RSS
- XML sitemap
- Canonical URLs
- OpenGraph/Twitter metadata
- Reading progress
- Responsive reading UI
- System dark mode
- GitHub Actions scheduler
- CI build checks
- Cloudflare Pages Git deployment
- No database
- No server required for the reader
- Provider isolated in `scripts/lib/ai.js`

## 1. Local test

Requirements: Node.js 22+.

```bash
npm install
cp .env.example .env
```

Put your key in `.env`.

```bash
npm run dev
```

Then test:

```bash
npm run validate
npm run quality
npm run build
```

To test the AI generator:

```bash
npm run generate
```

## 2. GitHub

Create a repository and push this project.

Then:

GitHub → Settings → Secrets and variables → Actions

Add repository secret:

```text
GEMINI_API_KEY
```

Optional repository variable:

```text
GEMINI_MODEL
```

If omitted, the default in the code is `gemini-2.5-flash`.

Run:

Actions → Reader Daily Content → Run workflow

Do this manually before relying on the schedule.

The scheduled workflow runs at 01:00 UTC, which is 08:00 WIB.

## 3. Cloudflare Pages

Cloudflare Dashboard → Workers & Pages → Create application → Pages → Import existing Git repository.

Use:

Production branch:
```text
main
```

Build command:
```text
npm run build
```

Build directory:
```text
dist
```

Do NOT put the Gemini API key into Cloudflare Pages. AI generation happens in GitHub Actions. Cloudflare only builds and serves the static website.

## 4. Custom domain

After the first successful deployment, add your domain in the Cloudflare Pages custom domain settings.

Change:

```text
PUBLIC_SITE_URL
```

only when you are using it during local generation/builds. The production canonical URL is primarily controlled by `astro.config.mjs` through `PUBLIC_SITE_URL`.

## 5. Daily architecture

```text
GitHub Actions
      ↓
Generate ideas
      ↓
Select candidates
      ↓
Write articles
      ↓
AI editorial review
      ↓
Score >= 8
      ↓
Publish up to 5
      ↓
Git commit
      ↓
Cloudflare Pages sees commit
      ↓
Astro build
      ↓
LIVE
```

The system intentionally does NOT force five weak articles. If only two pass review, only two are published.

## 6. Where content lives

Published:

```text
src/content/articles/
```

Rejected AI output:

```text
content/rejected/
```

Generated idea batches:

```text
content/ideas/
```

## 7. Important operational rule

Never commit API keys.

The only place the production AI key should live is:

GitHub repository → Settings → Secrets and variables → Actions → Secrets.

## 8. Editorial constitution

Read:

```text
EDITORIAL_CONSTITUTION.md
```

before changing prompts.

The constitution is the project's most important asset after the content itself.

## 9. Costs

The website is designed to use static hosting and a Git repository. The AI provider's free tier is subject to its own current quotas and limits. Five articles every day is therefore a target, not a guarantee of unlimited free AI usage.

## 10. Future extension points

The project can later add:

- privacy-friendly analytics
- bookmarks
- reading history
- newsletter
- audio articles
- multiple AI providers
- image generation
- human editorial dashboard
- personalization
- offline/PWA support

None of those are required to run V1.
