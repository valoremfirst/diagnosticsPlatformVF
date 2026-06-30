# Firebase (Cloud Firestore) Setup

This platform ships with an in-memory store (`src/lib/store.ts`) seeded from
mock data, so it runs with zero configuration. This guide moves persistence to
**Cloud Firestore** using the foundation already in the codebase:

- `src/lib/firebase.ts` — Admin SDK boot + `firebaseEnabled()` + `getDb()`
- `src/lib/firebase-repo.ts` — async CRUD mirroring `store.ts`

The `firebase-admin` dependency is already installed.

---

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. Name it (e.g. `diagnostics-platform`), finish the wizard.
3. In the left nav: **Build → Firestore Database → Create database**.
   - Start in **production mode**.
   - Pick a region close to your users (e.g. `europe-west2` for the UK).

## 2. Create a service account (server credentials)

1. **Project settings** (gear icon) → **Service accounts** tab.
2. Click **Generate new private key** → confirm. A JSON file downloads.
3. From that JSON you need three values:
   - `project_id`
   - `client_email`
   - `private_key`

## 3. Add credentials to `.env.local`

Create `.env.local` (git-ignored) in the project root:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

> **Private key formatting:** keep it on a single line wrapped in double quotes,
> with the line breaks written as literal `\n`. `firebase.ts` converts the `\n`
> back to real newlines at runtime. (If you paste the multi-line key directly,
> wrap it in quotes and it will also work in most shells.)

`firebaseEnabled()` returns `true` only when all three vars are present — until
then the app keeps using the in-memory store.

## 4. Firestore data model

Two top-level collections (names live in `COLLECTIONS` in `firebase.ts`):

| Collection           | Doc id        | Shape (see `src/lib/types.ts`) |
| -------------------- | ------------- | ------------------------------ |
| `companies`          | `company.id`  | `Company`                      |
| `diagnosticSessions` | `session.id`  | `DiagnosticSession`            |

Each diagnostic session references its company via `companyId` and its business
function via `function`. There are no subcollections — section views are derived
by filtering sessions on `companyId` + `function`.

## 5. Go live: swap the store for Firestore

The repository (`firebase-repo.ts`) is intentionally **not yet wired in**, so
flipping to Firestore is a deliberate, reviewable change. To switch:

1. The consuming server components and route handlers already run on the
   server. Make them `async` where needed and `await` the repo functions.

   Example — `src/app/companies/[id]/page.tsx`:

   ```ts
   // Before (in-memory, sync)
   import { getCompany, listSessionsByCompany } from "@/lib/store";
   const company = getCompany(params.id);
   const sessions = listSessionsByCompany(company.id);

   // After (Firestore, async)
   import { getCompany, listSessionsByCompany } from "@/lib/firebase-repo";
   const company = await getCompany(params.id);
   const sessions = await listSessionsByCompany(company.id);
   ```

2. Do the same in the API routes under `src/app/api/**` (they are already
   `async` handlers, so just `await` the repo calls).

3. Optional — a hybrid switch so the app self-selects the backend:

   ```ts
   import { firebaseEnabled } from "@/lib/firebase";
   import * as memory from "@/lib/store";
   import * as firestore from "@/lib/firebase-repo";

   const repo = firebaseEnabled() ? firestore : memory;
   ```

   Note the in-memory store is synchronous and the Firestore repo is async, so
   wrap memory calls in `Promise.resolve(...)` if you want one async surface.

## 6. Seed Firestore with the mock data (optional)

To start with the same demo companies/sessions, run a one-off seed using the
repo:

```ts
// scripts/seed.ts (run with: node --import tsx scripts/seed.ts)
import { MOCK_COMPANIES, MOCK_SESSIONS } from "@/lib/mock-data";
import { saveCompany, saveSession } from "@/lib/firebase-repo";

for (const c of MOCK_COMPANIES) await saveCompany(c);
for (const s of MOCK_SESSIONS) await saveSession(s);
```

## 7. Security rules

Reads/writes go through the **Admin SDK** (server-side), which bypasses
Firestore security rules. As long as no client SDK touches Firestore directly,
keep the default locked-down rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

---

### Checklist

- [ ] Firestore database created
- [ ] Service account key generated
- [ ] `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` in `.env.local`
- [ ] Repo functions awaited in pages + API routes
- [ ] (Optional) mock data seeded
- [ ] Locked-down security rules in place
