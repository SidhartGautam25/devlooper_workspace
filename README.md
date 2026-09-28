# Agency Workspace

Next.js admin CRM for DevLooper Studio, including a public **Leads & Inquiries API** for the marketing site.

## Getting started

```bash
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

---

## Leads & Inquiries API

Other sites (for example `https://devlooperstudio.com`) can post package inquiries to this backend. CORS is enabled for the allowed frontend origin.

**Base URL**

- Production: `https://workspace.devlooperstudio.com`
- Local: `http://localhost:3000`

Set this on the marketing frontend:

```bash
NEXT_PUBLIC_BACKEND_API_URL=https://workspace.devlooperstudio.com
```

### `POST /api/leads` (public)

Creates an inquiry. No auth cookie is required. Browsers on the allowed origin may call this directly.

**Allowed origin (CORS):** `https://devlooperstudio.com`  
Configure with `ALLOWED_FRONTEND_ORIGIN` (comma-separated if you need more than one). Do not include a trailing slash.

**Request**

```http
POST /api/leads
Content-Type: application/json
Origin: https://devlooperstudio.com
```

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "phone": "+91 9876543210",
  "company": "Aarav Enterprises",
  "selectedPackage": {
    "id": "web-growth",
    "name": "Growth Business",
    "category": "Web Development",
    "priceInr": 10000
  },
  "projectDetails": "Need a modern web app for our local distribution business with SEO and lead capture forms.",
  "sourceUrl": "https://devlooperstudio.com/packages",
  "sourceComponent": "package-card"
}
```

**Rules**

- `name` is required
- At least one of `email` or `phone` is required
- `selectedPackage` is optional; when sent, `id` and `name` are required
- `priceInr` may be `null` for custom quotes
- Preflight `OPTIONS /api/leads` is supported

**201 success**

```json
{
  "success": true,
  "message": "Inquiry received successfully. Our team will contact you within 24 hours.",
  "data": {
    "leadId": "clt1abc990000xyz12345",
    "createdAt": "2026-09-28T08:00:00.000Z"
  }
}
```

**400 validation error**

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Please provide either a valid email address or phone number for us to contact you."
  ]
}
```

### Frontend TypeScript contract

Copy this into the marketing Next.js app:

```ts
export interface InquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  selectedPackage?: {
    id: string;
    name: string;
    category?: string;
    priceInr?: number | null;
  };
  projectDetails?: string;
  sourceUrl?: string;
  sourceComponent?: string;
}

export async function submitInquiry(payload: InquiryPayload) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://workspace.devlooperstudio.com";

  const response = await fetch(`${backendUrl}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}
```

The same helper lives in this repo at `lib/api/inquiry.ts`.

### `GET /api/leads` (protected)

Returns stored inquiries.

1. **Admin dashboard** — session cookie after login (existing CRM).
2. **External tools** — send the admin API key:

```http
GET /api/leads
X-Api-Key: <ADMIN_API_KEY>
```

`Authorization: Bearer <ADMIN_API_KEY>` is also accepted.

Set `ADMIN_API_KEY` in `.env`. Do not expose this key in the public frontend.

**200 success**

```json
{
  "success": true,
  "data": [
    {
      "id": "clt1abc990000xyz12345",
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "phone": "+91 9876543210",
      "company": "Aarav Enterprises",
      "packageId": "web-growth",
      "packageName": "Growth Business",
      "category": "Web Development",
      "priceInr": 10000,
      "projectDetails": "Need a modern web app...",
      "sourceUrl": "https://devlooperstudio.com/packages",
      "sourceComponent": "package-card",
      "status": "NEW",
      "createdAt": "2026-09-28T08:00:00.000Z"
    }
  ]
}
```

### Instant alerts (optional)

When a **public** inquiry is created, the API can notify the team:

```bash
LEAD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
# or a Slack incoming webhook

TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

Discord and Slack webhook URLs are detected automatically. Notification failures never block lead storage.

### Environment variables

```bash
ALLOWED_FRONTEND_ORIGIN="https://devlooperstudio.com"
ADMIN_API_KEY="generate-a-strong-random-key-here"
LEAD_WEBHOOK_URL=""
```

Add extra origins as a comma-separated list, for example:

```bash
ALLOWED_FRONTEND_ORIGIN="https://devlooperstudio.com,https://www.devlooperstudio.com"
```
