# Technical Design

The build blueprint. The data model is the centerpiece — it is the one part that is expensive to change once real data exists.

---

## 1. Shape of the system

| Piece | Choice | Job |
|---|---|---|
| Web | Next.js (App Router) on Vercel | UI and API route handlers |
| Database | Postgres on Neon | All state, plus the job queue |
| Worker | Node service on Render (free web service, health-check pinged) | Extraction, composition, email sends |
| Queue | `jobs` table in Postgres | Work handoff, no Redis needed |
| Images | Vercel Blob | Uploaded note images |
| LLM | DeepSeek, behind one adapter module | Extraction and composition |
| Email | Brevo (or Resend), behind one adapter | Daily quiz email |
| Billing | Stripe | Modeled now, inactive |

The web app never calls the LLM inline. It writes a row and returns. The worker picks it up. That keeps request latency predictable and lets a slow extraction retry without the user waiting.

### Localization

The UI ships in English and French. `apps/web/i18n/request.ts` resolves the locale per request: a signed-in user's `ui_language`, otherwise the `NEXT_LOCALE` cookie (set by the header language switch for signed-out visitors), otherwise the `Accept-Language` header, falling back to `en`. There is no locale segment in the URL — next-intl runs without i18n routing, so every route keeps its current path.

Message catalogs live in `packages/core/src/messages` (`en/` and `fr/`, namespaces `Common`, `Layout`, `Home`, `Auth`, `Account`, `Classroom`, `Quiz`, `Category`, `Upload`, `Email`, `Api`). `getMessages`, `formatMessage`, and `toUiLocale` are shared by the web app and the worker.

- API error messages are localized centrally in `apps/web/lib/api.ts`: routes keep their English literals, which map to `Api` catalog keys before the response leaves the server.
- Transactional emails (`packages/core/src/email-templates.ts`) take a `UiLocale`; call sites pass the recipient's `ui_language`.
- Quiz stems, options, and explanations are generated in the target language and stored as content. Only UI chrome is translated; a question authored in French stays French in an English interface.

---

## 2. Data model

Postgres. All ids are UUIDs. All timestamps are `timestamptz`.

### users

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `email` | citext unique | The identifier |
| `email_verified_at` | timestamptz | |
| `username` | text | Display only, shown beside the avatar |
| `avatar_url` | text | |
| `password_hash` | text | Null for OAuth-only accounts |
| `ui_language` | text | ISO 639-1, default `en` |
| `timezone` | text | IANA name, e.g. `Asia/Shanghai` |
| `created_at` / `updated_at` | timestamptz | |

### accounts, sessions, verification_tokens

Auth.js tables. `verification_tokens` carries a `purpose` column: `verify_email`, `reset_password`, or `invite`.

### classrooms

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk → users | |
| `name` | text | |
| `target_language` | text | ISO 639-1, auto-detected from notes, editable |
| `native_language` | text | ISO 639-1 |
| `auto_stop_days` | int | Default 7; the classroom-settings override |
| `active_until` | timestamptz | Extended by every upload **and** every login |
| `archived_at` | timestamptz | Null while live |
| `created_at` / `updated_at` | timestamptz | |

`active_until` is the whole active/dormant rule in one column. A classroom is active while `active_until > now()`. Uploads and logins both push it forward.

### uploads

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `classroom_id` | uuid fk | |
| `kind` | text | `text` or `image` |
| `text_content` | text | Null for image uploads |
| `storage_key` | text | Null for text uploads |
| `original_filename` / `mime_type` / `byte_size` | | |
| `extraction_status` | text | `pending`, `running`, `done`, `failed` |
| `extracted_at` / `extraction_error` | | |
| `subject` | text | Short AI-written title for the upload, null until extraction completes |
| `discarded` | jsonb | The discard list the extraction returned |
| `created_at` | timestamptz | |

### knowledge_points

The bank. One row per studyable item.

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `classroom_id` | uuid fk | |
| `source_upload_id` | uuid fk → uploads | |
| `category` | text | One of the five |
| `target_text` | text | In the target language |
| `native_text` | text | Nullable |
| `inferred` | boolean | True when the gloss was not in the notes |
| `note` | text | A correction or caveat, nullable |
| `detail` | jsonb | Grammar rule and examples, or a passage reference |
| `source_excerpt` | text | The note fragment it came from |
| `prompt_version` | text | |
| `retired_at` | timestamptz | Null while in play |
| `created_at` | timestamptz | Drives "newest material first" |

Index: `(classroom_id, created_at desc)`.

### passages

Long text that several questions can hang off: `id`, `classroom_id`, `source_upload_id`, `target_text`, `native_text`, `source_excerpt`, `created_at`.

### quizzes

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `classroom_id` | uuid fk | |
| `user_id` | uuid fk | |
| `quiz_date` | date | The user's local date |
| `kind` | text | `daily` or `manual` (default `daily`) |
| `size` | int | |
| `prompt_version` | text | |
| `composed_at` | timestamptz | |

**Partial unique index on `(classroom_id, quiz_date) WHERE kind = 'daily'`.** It keeps daily composition idempotent — a retry after a crash cannot double up. On-demand (`manual`) quizzes have no per-day limit. Index `(user_id, kind, composed_at)` supports usage counts over rolling windows.

### questions

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `quiz_id` | uuid fk | |
| `knowledge_point_id` | uuid fk | |
| `passage_id` | uuid fk | Nullable |
| `position` | int | |
| `category` / `type` | text | |
| `stem` | text | |
| `options` | jsonb | Nullable |
| `answer` | jsonb | See `PROMPTS.md` for shapes |
| `explanation` | text | |
| `prompt_version` | text | |
| `created_at` | timestamptz | |

### attempts / attempt_answers

`attempts`: `id`, `quiz_id`, `user_id`, `started_at`, `submitted_at`, `duration_ms`, `correct_count`, `question_count`.

`attempt_answers`: `id`, `attempt_id`, `question_id`, `response` jsonb, `is_correct`, `duration_ms`, `created_at`.

Attempts are unlimited and never deleted. Every answer is kept.

An attempt row is written at submit. Until then, answers and progress live in a browser-local draft keyed by user and quiz; a refresh restores the draft rather than starting a new attempt. The draft expires with the attempt token after two hours.

Usage stats are computed live from `attempts` and `attempt_answers` in `packages/db/src/repos/stats.ts` (`getActivityStats`, `getLearningStats`, `listRecentAttemptScores`, `listRecentMissesForUser`). Nothing is denormalized or stored, and no API route or schema change is involved: the account server component calls the repository directly.

### email_preferences, email_sends

`email_preferences`: `user_id` pk, `daily_enabled` (default true), `send_hour_local` (default 7), `unsubscribed_at`.

`email_sends`: `id`, `user_id`, `sent_on` date, `kind` (`daily` or `manual`), `quiz_id` nullable, `classroom_ids` jsonb, `provider_message_id`, `created_at`. **Partial unique on `(user_id, sent_on) WHERE kind = 'daily'`** — one daily email per user per morning. **Unique on `(user_id, quiz_id)`** — one email per on-demand quiz.

### subscriptions, referrals

`subscriptions`: `id`, `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `current_period_end`, `cancel_at_period_end`, timestamps. Populated by webhooks when billing turns on. The UI stays debug-only until then.

`referrals`: `id`, `referrer_user_id`, `code` unique, `referred_user_id` nullable, `status` (`created`, `signed_up`, `rewarded`), `reward_months` default 1, `created_at`, `rewarded_at`.

### jobs

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `kind` | text | `extract`, `compose`, `send_email` |
| `payload` | jsonb | |
| `run_at` | timestamptz | |
| `status` | text | `pending`, `running`, `done`, `failed`, `cancelled` |
| `attempts` | int | |
| `locked_at` / `locked_by` | | |
| `last_error` | text | |
| `created_at` / `finished_at` | | |

Index: `(status, run_at)` where `status = 'pending'`.

Claiming is one statement, so several workers can run safely:

```sql
UPDATE jobs
SET status = 'running', locked_at = now(), locked_by = $1, attempts = attempts + 1
WHERE id = (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_at <= now()
  ORDER BY run_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
RETURNING *;
```

A job that has been `running` for over 10 minutes returns to `pending`, up to 3 attempts, then lands in `failed` with the error stored.

Compose jobs carry `classroomId`, `userId`, `localDate`, and `source` (`daily` or `manual`). Cancelling a `pending` job sets its status to `cancelled`; cancelling a `running` job adds `cancelRequested: true` to the payload, and the worker re-reads that flag just before saving the quiz. A cancelled job writes no quiz.

---

## 3. Pipelines

### Extraction

```
upload stored
  → enqueue job(extract, { upload_id })
  → worker: load text + images
  → LLM extraction (EXTRACTION_PROMPT_V2)
  → write knowledge_points, passages, uploads.discarded, uploads.subject
  → uploads.extraction_status = 'done'
```

Images are sent to the model as image content and read the same way text is. Nothing distinguishes a handwritten page from a typed one downstream.

### Daily composition

The scheduler runs every 15 minutes and finds classrooms that are due:

```sql
SELECT c.*
FROM classrooms c
JOIN users u ON u.id = c.user_id
JOIN email_preferences ep ON ep.user_id = u.id
WHERE c.archived_at IS NULL
  AND c.active_until > now()
  AND ep.daily_enabled
  AND ep.unsubscribed_at IS NULL
  AND date_part('hour', now() AT TIME ZONE u.timezone) >= ep.send_hour_local
  AND NOT EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.classroom_id = c.id
      AND q.kind = 'daily'
      AND q.quiz_date = (now() AT TIME ZONE u.timezone)::date
  );
```

Each match gets a `compose` job. The worker writes the quiz and its questions, then enqueues one `send_email` job per **user** — not per classroom, because the email is a single menu.

On-demand quizzes use the same compose job and the same selection rules, enqueued directly by `POST /api/classrooms/:id/quizzes` with `source: "manual"`. They skip the daily existence check and never enqueue an email.

### Email

The worker builds one email per user per day containing every classroom quiz composed that morning, questions inline, each with a link to the web quiz. Sends through Brevo (or Resend), then writes `email_sends`. The unique constraint absorbs a duplicate run.

On-demand composition enqueues its own `send_email` job carrying `kind: "manual"` and the new `quizId`. That email contains just that quiz and dedupes per quiz, so it can be sent the same day the morning email already went out. Both kinds respect `email_preferences`.

### Billing

Stripe stays dark. The webhook route, the `subscriptions` table, and the plan checks exist; the UI that starts a checkout renders only in debug builds.

---

## 4. API surface

Next.js route handlers, all session-scoped.

| Method | Path | Job |
|---|---|---|
| `*` | `/api/auth/[...nextauth]` | Auth.js |
| `GET` `POST` | `/api/classrooms` | List, create |
| `GET` `PATCH` `DELETE` | `/api/classrooms/:id` | Read, rename and settings, archive |
| `POST` | `/api/classrooms/:id/uploads` | Text body or multipart image |
| `GET` | `/api/classrooms/:id/uploads` | Timeline |
| `GET` | `/api/classrooms/:id/bank` | Counts per category |
| `GET` | `/api/classrooms/:id/quizzes/today` | Today's daily quiz plus any in-flight compose job, answers withheld |
| `POST` | `/api/classrooms/:id/quizzes` | Create an on-demand quiz (enqueues a compose job) |
| `POST` | `/api/classrooms/:id/quizzes/cancel` | Cancel the in-flight compose job |
| `GET` | `/api/quizzes/:id` | Quiz, answers withheld |
| `POST` | `/api/quizzes/:id/attempts` | Start an attempt |
| `POST` | `/api/attempts/:id/submit` | Submit answers, receive correctness and explanations |
| `GET` | `/api/attempts/:id` | Full review |
| `GET` `PATCH` | `/api/me` | Profile |
| `GET` `PATCH` | `/api/me/email-preferences` | |
| `GET` | `/api/me/export` | Data export |
| `DELETE` | `/api/me` | Account deletion |
| `GET` | `/api/me/referrals` | Codes and status |
| `POST` | `/api/webhooks/stripe` | |
| `GET` | `/unsubscribe?token=` | One click, no login |

Answers and explanations never leave the server before a submission. The quiz payload carries stems and options only. A browser-local draft holds the learner's own responses and position between refreshes.

---

## 5. Multi-tenancy and security

- Every query goes through a repository layer that takes `user_id` and scopes by it. Ownership is enforced in the data layer, so a forgotten UI check is not a breach.
- Image reads use short-lived signed URLs.
- Upload limits: 10 MB per image, 50 uploads per user per day.
- LLM calls capped per user per day, so a runaway script cannot drain the DeepSeek balance.
- Sign-up requires an invite code while the product is invite-only.
- Passwords hashed with argon2id. Email verification required before the first upload.
- Session cookies: httpOnly, secure, sameSite lax.

---

## 6. Deployment

| Concern | Where |
|---|---|
| Web | Vercel |
| Postgres | Neon |
| Worker | Render free web service, kept awake by a health-check pinger |
| Images | Vercel Blob |
| Email | Brevo (or Resend) |
| Domain | Purchased at deploy |

Environment variables:

```
DATABASE_URL
AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DEEPSEEK_API_KEY
BREVO_API_KEY
RESEND_API_KEY
BLOB_READ_WRITE_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
APP_URL
```

Migrations run from the worker on boot, so the web app never needs database credentials at build time.

---

## 7. Deferred

Modeled in the schema, unbuilt:

- Stripe checkout and the billing UI
- Referral UI and reward granting
- Tier-cap enforcement (3 classrooms, 5 attempts per quiz per day, quiz-type selection)
- Full spaced repetition
- On-demand quiz quotas (creation counts are tracked over rolling windows; no limit enforced)
- The account center's export and deletion jobs

---

## 8. Open technical questions

These came up while writing this and are worth deciding before the schema is written:

1. **Fill-in-the-blank grading tolerance.** The plan compares case-insensitively and ignores accents. That marks `etendoir` correct against `étendoir`. Confirm that is the intended leniency.
2. **Blank count in a grammar drill.** A grammar drill like `heureux → ____ ; triste → ____` is one question. Marking it correct only when every blank is right is harsh; marking it correct on a majority is generous. My call: all blanks required, since the learner sees the answer immediately after.
3. **Question count when the bank is small.** The formula floors at 8, so a brand-new classroom with 20 points gets 8 questions on day one and repeats material by day three. My call: that is fine — it is a review app, and repetition in week one is the point.
