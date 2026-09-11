import { parseCompositionResult } from "./schemas";
import type { CompositionResult } from "../types";

export const COMPOSITION_PROMPT_VERSION = "v1";

const COMPOSITION_SCHEMA = `{
  "quiz_date": "YYYY-MM-DD",
  "questions": [
    {
      "knowledge_point_id": "the id of the knowledge point this question tests",
      "category": "vocabulary | phrase | grammar | expression | comprehension",
      "type": "mcq | fill_blank | true_false | image",
      "stem": "the question, in the target language",
      "options": ["option A", "option B", "..."] or null,
      "answer": { "index": 0 } | { "blanks": ["..."] } | { "value": false } | { "index": 0 },
      "explanation": "one sentence, in the target language, on why the answer is right"
    }
  ]
}`;

const COMPOSITION_PROMPT_BODY = `You write one day's quiz for a language learner, drawn from their own session
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
${COMPOSITION_SCHEMA}`;

export const COMPOSITION_PROMPT_V1 = COMPOSITION_PROMPT_BODY;

export function parseCompositionResponse(text: string): CompositionResult {
  return parseCompositionResult(JSON.parse(text));
}
