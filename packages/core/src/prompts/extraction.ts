import { parseExtractionResult } from "./schemas";
import type { ExtractionResult } from "../types";

export const EXTRACTION_PROMPT_VERSION = "v1";

const EXTRACTION_SCHEMA = `{
  "target_language": "ISO 639-1 code of the language being learned",
  "native_language": "ISO 639-1 code of the language the glosses are in",
  "knowledge_points": [
    {
      "category": "vocabulary | phrase | grammar | expression | comprehension",
      "target_text": "the term, phrase, rule label, or full sentence",
      "native_text": "the gloss or translation, or null if none",
      "inferred": "true when the gloss was inferred, not read from the notes",
      "note": "a correction or caveat, or null when clean",
      "grammar": "for grammar only: { \\"rule\\": string, \\"examples\\": [ { \\"target\\": string, \\"related\\": string | null } ] }",
      "passage_ref": "for comprehension only: index into passages",
      "source_excerpt": "the raw note line this came from"
    }
  ],
  "passages": [
    {
      "target_text": "the passage in the target language",
      "native_text": "its translation, or null",
      "source_excerpt": "the raw note line this came from"
    }
  ],
  "discarded": [ { "line": "the raw line", "reason": "a short reason" } ]
}`;

const EXTRACTION_PROMPT_BODY = `You turn a language learner's raw session notes into structured study material.

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

9. Output JSON only, matching the schema below. No prose, no markdown fence.

Schema:
${EXTRACTION_SCHEMA}`;

export const EXTRACTION_PROMPT_V1 = EXTRACTION_PROMPT_BODY;

export function parseExtractionResponse(text: string): ExtractionResult {
  return parseExtractionResult(JSON.parse(text));
}
