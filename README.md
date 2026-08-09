# AuraDigital QuickSite

A template-based website builder for AuraDigital customers. Visitors choose a ready-made design, enter their business content, preview the result in real time, and submit it for owner approval.

**Live builder:** https://auradigital-builder.dhiamahouachi115.chatgpt.site  
**AuraDigital:** https://auradigital.ink

## Approval flow

1. The customer selects a template and edits their website.
2. The draft is submitted as **pending** and **unpaid**.
3. The request appears in the protected owner dashboard.
4. AuraDigital reviews the content and marks payment as received.
5. Only the owner can approve the request and make its public site URL available.

Customer sites are never published automatically.

## Features

- Four ready-made website templates
- Turkish, English, and Arabic interfaces
- Right-to-left Arabic layout
- Live desktop and mobile previews
- Editable branding, colors, text, services, prices, benefits, gallery and contact details
- Customer request notes and preferred site slug
- D1-backed request storage
- Protected owner dashboard
- Payment status and approval gate
- Approve, reject, preview and internal-note actions
- Automatic compatibility migration for earlier QuickSite databases

## Technology

- Next.js 16
- React 19
- TypeScript
- Vinext and Cloudflare Workers
- Cloudflare D1
- Drizzle ORM
- Vite

## Local development

Requirements:

- Node.js 22.13 or newer
- npm

Install and run:

```bash
npm ci
npm run dev
```

Production validation:

```bash
npm run lint
npm test
```

## Environment

Set the production runtime variable below through the hosting platform:

```text
OWNER_EMAIL=your-owner-email@example.com
```

Do not commit `.env` files. They are excluded by `.gitignore`.

## Important routes

- `/builder` — customer website builder
- `/preview/[id]` — submitted draft preview
- `/admin` — protected AuraDigital requests dashboard
- `/site/[slug]` — approved public customer website
- `/api/projects` — customer request submission
- `/api/admin/projects` — protected request management
