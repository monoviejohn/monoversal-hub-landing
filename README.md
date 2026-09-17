# Monoversal Hub — Landing Page

Lead-generation landing page for Monoversal Hub.

**Domain:** monoversalhub.vercel.app  
**Type:** landing-page  
**Stack:** Next.js 15, React 19, Tailwind CSS, TypeScript  
**Integrations:** Google Analytics, Tally form embed  

This project was initialized from Monovie Web Factory v1.2.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm run security` | Static security scan |

## Tally Form Setup

Replace `YOUR_FORM_ID` in `app/page.tsx` with your actual Tally form ID.
Load the Tally embed script by adding to `app/layout.tsx`:
```html
<Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
```
