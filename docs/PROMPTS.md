# Prompt Spec

Two prompts carry the product.

- **Extraction** turns a session's notes into knowledge points.
- **Composition** turns knowledge points into one day's quiz.

Both are versioned. Every question row stores the `prompt_version` that produced it, so a quality regression traces back to a prompt change.

---

## 1. Extraction

**Runs:** once per upload, in the worker, right after the upload is stored.
**Input:** the upload's text, plus any attached images.
**Output:** a short subject line, knowledge points, passages, and an explicit list of discarded lines.

### The five categories

| Category | What belongs here | Example from a real session |
|---|---|---|
| `vocabulary` | One term and its gloss | `étendoir` → the clothes line |
| `phrase` | A fixed multi-word expression | `apprendre à lâcher prise` → learn to let go |
| `grammar` | A rule the notes teach, with its examples | noun ↔ adjective: `heureux` / `le bonheur` |
| `expression` | A full sentence worth producing | `Au fil des jours, j'accumulais de l'anxiété.` |
| `comprehension` | A passage plus questions about it | the Buddhist monk paragraph |

### System prompt

```
You turn a language learner's raw session notes into structured study material.

The notes come from a live tutoring session and were written down quickly.
Expect no consistent separator between entries, entries with no translation,
misspellings, fragments, and lines that are simply garbled.

Extract what is genuinely studyable. Discard the rest.

Rules:

1. Classify every extracted item into exactly one of: vocabulary, phrase,
   grammar, expression, comprehension.

2. Detect the language being learned (target) and the language the glosses are
   written in (native). Report both as ISO 639-1 codes.

3. Never invent a gloss. When a term carries no translation in the notes, you
   may infer one from context and set "inferred": true. When you cannot infer
   it confidently, discard the line.

4. Discard any line that is garbled, unintelligible, or carries nothing
   studyable. List every discard with a short reason. Discarding is correct
   behaviour, not a failure. A missing question costs the learner nothing; a
   wrong one costs them trust.

5. Grammar arrives as teaching, not as a list. When the notes state a rule —
   even in shorthand like "noun et adjective différence" — capture the rule
   together with the examples that belong to it.

6. Preserve the target-language spelling exactly as written. Correct an obvious
   typo only when you are confident, and record the correction in "note".

7. Emit one knowledge point per item. Two distinct terms are two knowledge
   points.

8. Write explanations in the target language.

9. Write "subject": a short subject line, three to eight words, naming the topic
   the notes cover, in the native language. Name the theme, not the first line.

10. Output JSON only, matching the schema below. No prose, no markdown fence.

Schema:
<schema>
```

### Output schema

```json
{
  "subject": "Home vocabulary, emotions, and a Buddhist passage",
  "target_language": "fr",
  "native_language": "en",
  "knowledge_points": [
    {
      "category": "vocabulary",
      "target_text": "l'étendoir",
      "native_text": "the clothes line",
      "inferred": false,
      "note": null,
      "source_excerpt": "étendoir - clothe line"
    },
    {
      "category": "grammar",
      "target_text": "adjectif → nom",
      "native_text": "adjective → noun",
      "inferred": false,
      "note": null,
      "grammar": {
        "rule": "An adjective becomes a noun by changing form and taking a gender.",
        "examples": [
          { "target": "heureux", "related": "le bonheur" },
          { "target": "triste", "related": "la tristesse" },
          { "target": "en colère", "related": "la colère" }
        ]
      },
      "source_excerpt": "noun et adjective différence"
    }
  ],
  "passages": [
    {
      "target_text": "Pour les bouddhistes, après la mort, l'âme entre dans l'univers et se prépare pour une prochaine vie.",
      "native_text": "For Buddhists, after death, the soul enters the universe and prepares for a next life.",
      "source_excerpt": "pour les bouddhistes, après la mort, l'âme entre dans l'univers..."
    }
  ],
  "discarded": [
    { "line": "tension au bibeau", "reason": "unintelligible" },
    { "line": "Pilates", "reason": "no gloss and no surrounding context" }
  ]
}
```

`note` carries a correction or a caveat. It is `null` on a clean extraction.

`subject` is the short native-language title the upload lists show as the row title.

### Category-specific payloads

| Category | Extra field | Shape |
|---|---|---|
| `vocabulary` | — | `target_text` and `native_text` carry the pair |
| `phrase` | — | same |
| `grammar` | `grammar` | `{ rule, examples[] }` |
| `expression` | — | `target_text` is the full sentence, `native_text` its translation |
| `comprehension` | `passage_ref` | index into `passages` |

### What the real notes proved

Taken from the trial run in `TRIAL-RUN.md`:

- **Mess is normal.** No consistent separator, several entries with no gloss at all (`signe`, `maintenir`, `par exemple`), one misspelling (`ischio-jambièrs`), one garbled line (`tension au bibeau`). Rule 4 exists because of the garbled line. A strict parser turns `au bibeau` into a quiz question.
- **Grammar is taught inline.** `noun et adjective différence` is a teaching note sitting in a vocabulary list. Rule 5 exists because of it.
- **One session mixes topics.** Home, Buddhism, emotions, Pilates, and language anxiety all appear together. Extraction keeps them as separate points; composition decides the daily mix.
- **The gloss direction is stable.** French is the target throughout, English the native language. Detection is cheap here, but rule 2 keeps it honest for mixed decks.

### Failure handling

- Malformed JSON → retry once, appending the raw response with an instruction to correct it.
- A knowledge point with no `target_text` → drop it, log it.
- A `passage_ref` pointing at a missing passage → drop the dependent point.
- Every discard is stored on the upload row so the behaviour is auditable.

---

## 2. Composition

**Runs:** once per classroom per day, before the email goes out.
**Input:** the classroom's knowledge points, the questions already asked this week, the recent wrong answers, and the day's target size.
**Output:** one ordered quiz.

### System prompt

```
You write one day's quiz for a language learner, drawn from their own session
notes.

You receive their knowledge points, the questions they have already seen this
week, and the points they answered wrong. Write a quiz they can finish in about
ten minutes.

Rules:

1. Prefer the newest material. Within the 7-day window, weight toward knowledge
   points from the most recent uploads.

2. Never repeat a question the learner has already seen this week. Re-testing a
   knowledge point is good. Reusing the wording is not. Reword it.

3. Include one or two re-tests of points the learner answered wrong, reworded as
   a new question.

4. Vocabulary runs both directions. Ask production (native → target) more often
   than recognition (target → native). Recognition is easier and flatters the
   learner.

5. Pick the question type that serves each category best:

   vocabulary    → mcq, fill_blank, image
   phrase        → mcq, fill_blank
   grammar       → true_false, fill_blank
   expression    → mcq, fill_blank
   comprehension → the passage, plus mcq, true_false, fill_blank about it

   A grammar drill with several blanks is one fill_blank question, not several.

6. Write questions and explanations in the target language.

7. Every question carries a one-sentence explanation of why the answer is right.

8. Spread the categories. One category never fills the whole quiz.

9. Output JSON only, matching the schema below. No prose, no markdown fence.

Schema:
<schema>
```

### Output schema

```json
{
  "quiz_date": "2026-09-10",
  "questions": [
    {
      "knowledge_point_id": "b1f2...",
      "category": "vocabulary",
      "type": "mcq",
      "stem": "« l'étendoir » veut dire :",
      "options": ["the clothes line", "the ceiling", "the rent", "the hamstring"],
      "answer": { "index": 0 },
      "explanation": "Un étendoir est l'objet sur lequel on fait sécher le linge."
    },
    {
      "knowledge_point_id": "c9a4...",
      "category": "grammar",
      "type": "fill_blank",
      "stem": "Donnez le nom : heureux → ____ ; triste → ____ ; en colère → ____",
      "options": null,
      "answer": { "blanks": ["le bonheur", "la tristesse", "la colère"] },
      "explanation": "Chaque adjectif d'émotion a un nom correspondant, avec son genre."
    }
  ]
}
```

### Answer shapes by type

| Type | `answer` shape |
|---|---|
| `mcq` | `{ "index": 2 }` |
| `fill_blank` | `{ "blanks": ["le bonheur", "la tristesse"] }` |
| `true_false` | `{ "value": false }` |
| `image` | `{ "index": 0 }` — the stem points at a retained upload image |

Text blanks compare case-insensitively and ignore accents, so `etendoir` marks correct against `étendoir`.

### Selection inputs

Composition reads four things:

1. **The bank** — every knowledge point in the classroom, with its `created_at`.
2. **The week's questions** — stems asked in the last 7 days, to honour rule 2.
3. **The misses** — questions answered incorrectly, to honour rule 3.
4. **The size** — `min(20, max(8, floor(bank_size / 8)))`, with the ten-minute budget overriding it.

### Failure handling

- A question referencing an unknown `knowledge_point_id` is dropped and backfilled from the next-best point.
- An `mcq` whose `answer.index` falls outside `options` is dropped.
- Fewer than 5 usable questions → the quiz is not sent; the classroom is flagged for review. For an on-demand quiz the compose job fails and the user can retry.
- A daily quiz is composed once per classroom per day. The partial unique index on `(classroom_id, quiz_date) WHERE kind = 'daily'` makes a retry safe. On-demand quizzes share the same prompt and selection rules and can be composed at any time.

---

## 3. Versioning

- Both prompts live in code as named constants: `EXTRACTION_PROMPT_V2`, `COMPOSITION_PROMPT_V1`.
- Every `knowledge_point` and every `question` row stores the version that produced it.
- Bumping a version affects new work only. Existing rows keep their original version, so old and new output can be compared side by side.
