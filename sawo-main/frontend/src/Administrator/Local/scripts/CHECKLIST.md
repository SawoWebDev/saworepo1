# Local Sync Checklist

## First Time Setup
- [ ] Copy `.env.example` to `.env` inside `scripts/`
- [ ] Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- [ ] Run `npm install` inside `scripts/`
- [ ] Make sure both `saworepo1` and `saworepo2` are cloned side by side

## Every Time You Want to Sync
- [ ] Run `npm run sync` inside `scripts/`
- [ ] Check terminal output — confirm products, images, files count
- [ ] Check `data/products.json` was updated
- [ ] Push `saworepo2` → images are now live on jsDelivr
- [ ] Push `saworepo1` → Vercel auto-redeploys with new data

## How Images Work
- Images download from Supabase → saved to saworepo2
- Frontend reads products.json → builds URL using jsDelivr CDN
- URL format: https://cdn.jsdelivr.net/gh/jmesrafael/saworepo2@main/{slug}/filename.jpg

## Folder Reference
- Sync script → src/Administrator/Local/scripts/sync.js
- Product data → src/Administrator/Local/data/products.json
- Images repo → saworepo2 (sibling folder)
- Local CMS page → src/Administrator/Local/index.jsx
