<div align="center">

# Evenly — The art of splitting evenly

Fast, fair group expenses.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Convex](https://img.shields.io/badge/Convex-Serverless%20DB-6E56CF)](https://docs.convex.dev)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-5C3EA3)](https://clerk.com/)

</div>

## Overview

Evenly helps groups split expenses quickly and fairly. Create a group, add expenses (equally or by weighted shares), scan receipts to auto‑extract line items, and track who owes what with clear balances and suggested settlements.

## Features

- Groups dashboard: create, view, and manage groups
- Join via code: simple invite flow for collaborators
- Expenses: equal or weighted splits, per‑member shares
- Receipt OCR: parse receipt line items via OCR.space API
- Balances: real‑time net positions per member
- Suggested settlements: minimal transfers to square up
- Members & invites: manage participants and roles
- Settings: per‑group currency and preferences

## Tech Stack

- Frontend: `Next.js 15` (App Router), `React 19`, `TypeScript`
- UI: `Tailwind CSS 4`, `shadcn/ui` (Radix Primitives), `lucide-react`
- Data & Backend: `Convex` serverless functions + storage
- Auth: `Clerk` for authentication and session management
- Utilities: `zod`, `react-hook-form`, `date-fns`, `sonner`

## Quick Start

Prerequisites:

- Node.js 18+ (recommend 20 LTS)
- A Convex project (for local dev, the CLI can bootstrap it)
- A Clerk application (for auth keys)

1) Install dependencies

```bash
npm install
```

2) Configure environment

Create `.env.local` in the project root and add the following (replace with your values):

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-alias
NEXT_PUBLIC_CONVEX_URL=https://<your-project>.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_FRONTEND_API_URL=<your-subdomain>.clerk.accounts.dev

# Optional: enable receipt OCR via OCR.space
OCR_API_KEY=your_ocr_space_api_key
```

3) Run Convex in one terminal

```bash
npx convex dev
```

4) Run the Next.js app in another terminal

```bash
npm run dev
# opens http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Environment Variables

- `CONVEX_DEPLOYMENT`: Convex deployment alias for local dev.
- `NEXT_PUBLIC_CONVEX_URL`: Public URL to your Convex backend.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key for the web app.
- `CLERK_SECRET_KEY`: Clerk server key for backend actions.
- `CLERK_FRONTEND_API_URL`: Clerk frontend API domain.
- `OCR_API_KEY` (optional): OCR.space API key to enable receipt scanning.

Keep secrets out of version control. Use `.env.local` for local development.

## Architecture

- App Router (`/app`): pages, layouts, providers
- Components (`/components`): UI and feature modules
- Backend (`/convex`): schema, queries, mutations, actions
- Lib (`/lib`): helpers for formatting and settlements
- Styling: Tailwind 4 with shadcn/ui components

Convex provides real‑time data and storage. Clerk enforces authentication at the edge via middleware.

## Development Notes

- Receipt OCR uses OCR.space; errors surface gracefully if `OCR_API_KEY` is missing.
- Currency is set per group (e.g., `SGD`, `USD`, `EUR`).
- Suggested settlements are computed client‑side from net balances.

## Deployment

- Vercel is recommended for Next.js. Set all environment variables in your host and link your Convex project.
- Convex production deployments can be created via the Convex dashboard or CLI.

## Roadmap

- Multi‑currency groups and FX handling
- Export/import (CSV, PDF summaries)
- Mobile PWA enhancements

## Acknowledgements

- Built with Next.js, Tailwind CSS, shadcn/ui, Convex, and Clerk.

---

Questions or feedback? Open an issue or reach out.
