# PureAid

Fully transparent, zero-profit donation platform connecting donors with verified recipients in Nepal (medical patients, students, startups) using AI verification and direct local payments.

## Tech Stack
- Next.js 15+ (App Router)
- TypeScript
- Tailwind CSS & shadcn/ui
- Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- AI & OCR: Tesseract.js, sharp.js, Transformers.js
- Local Payments: eSewa, Khalti, IME Pay JS SDKs
- npm package manager

## Setup Instructions

```bash
npm install
npm run dev
```

> **Note:** Create a Supabase project at [supabase.com](https://supabase.com) and add the environment keys to `.env.local`.

## Sanity CMS

The website reads owner-editable content from Sanity and falls back to the current hardcoded copy when Sanity is not configured.

Add these environment variables to local development and production hosting:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

For local Studio development:

```bash
npm run studio:dev
```

For a public owner-facing Studio, deploy it to Sanity's hosted Studio service:

```bash
npx sanity login
npm run studio:deploy
```

The first deploy asks for a Studio hostname and then gives you a public `https://<name>.sanity.studio` URL. Give that URL to the website owner; they do not need localhost.

If you deploy the Studio somewhere else instead of Sanity's hosted service, register that external URL:

```bash
npm run studio:register-external -- --url https://your-studio-domain.com
```

Also add your production website URL and Studio URL as allowed CORS origins in the Sanity project settings.
