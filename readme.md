# Quotes

A personal quotes collection that uses Notion as a headless CMS. Content lives in a
Notion database, gets pulled at build time via the Notion API, and renders as a fast,
zero-JS static site.

**Stack:** Astro · Notion API · Netlify

## How it works
- Quotes are added/edited in Notion — no code changes needed
- The Notion API feeds Astro's build step
- Netlify rebuilds and deploys on content updates
