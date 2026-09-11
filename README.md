# ten-minute-review

Turns a tutoring session's notes — typed text or photos of handwriting — into a daily quiz that takes under 10 minutes.

Notes go in. The app reads them into a question bank of vocabulary, phrases, grammar, ideas, and comprehension passages. Every morning it composes one quiz per classroom and either emails it or waits for you to show up. Questions, answers, and explanations all live on the site; the email carries the questions inline so you can answer from your inbox or click through.

**Status: built.** Runnable locally with mock providers, real services behind one adapter each. The documents below remain the spec.

---

## Documents

| File | What it covers |
|---|---|
| [`docs/SCOPE.md`](docs/SCOPE.md) | What the product is and every decision made about it. Start here. |
| [`docs/PROMPTS.md`](docs/PROMPTS.md) | The two prompts that carry the product: extraction and composition. |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md) | Architecture, data model, API surface, pipelines, deployment. |
| [`docs/FLOWS.md`](docs/FLOWS.md) | Screen-by-screen behaviour. |
| [`docs/TRIAL-RUN.md`](docs/TRIAL-RUN.md) | The real session that validated the core loop, and what it broke. |

## The shape of it

- A **classroom** is one note set, one question bank, and one daily quiz series. A user can own several.
- Notes can be added any time. A classroom stays active for 7 days after the last upload, then goes quiet until the next visit.
- Questions come in four types: multiple choice, fill-in-the-blank, true/false, and image-based.
- Eleven spoken languages. Questions are asked in the language of the notes, with a tooltip in the reader's language.
- $2.99/month, with a free tier. Billing is modeled but switched off.

## Stack

Next.js and TypeScript on Vercel, Postgres, a small worker for extraction and scheduled sends, DeepSeek for the language model, Brevo (or Resend) for email, Stripe for billing when it turns on. Detail in [`docs/TECHNICAL.md`](docs/TECHNICAL.md).

## Building it

Prerequisites: Node 22+, pnpm 10+, Postgres 15+ (local or Neon).

```sh
pnpm install
cp .env.example .env        # fill in the values you have; dev defaults work as-is
pnpm db:migrate             # applies packages/db/drizzle to DATABASE_URL
pnpm dev:web                # http://localhost:3000
pnpm dev:worker             # job loop and the daily scheduler
```

Local development needs no accounts. `LLM_PROVIDER=mock` serves a fixture extraction and a deterministic quiz, `EMAIL_PROVIDER=console` prints emails to the worker log, and `STORAGE_PROVIDER=local` writes images to `.uploads/`. To use the real services set `LLM_PROVIDER=deepseek` with `DEEPSEEK_API_KEY`, `EMAIL_PROVIDER=brevo` with `BREVO_API_KEY` and `EMAIL_FROM` (or `EMAIL_PROVIDER=resend` with `RESEND_API_KEY`), `STORAGE_PROVIDER=vercel` with `BLOB_READ_WRITE_TOKEN`, and `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` for Google sign-in.

Checks: `pnpm typecheck`, `pnpm test`, `pnpm --filter web lint`, `pnpm build`.

Deploy: web to Vercel with the project's Root Directory set to `apps/web` and "Include files outside of the Root Directory" enabled. The worker to Render using the `render.yaml` blueprint (New → Blueprint → pick this repo), which sets the start command to `pnpm --filter worker start` and the health check to `/health` on the free plan. The free instance sleeps after 15 minutes without traffic, so ping `https://<service>.onrender.com/health` every 5–10 minutes with a free cron pinger (e.g. cron-job.org) to keep it awake. Both hostings need `DATABASE_URL`, `AUTH_SECRET`, the provider keys, and `APP_URL` set to the deployed origin.
