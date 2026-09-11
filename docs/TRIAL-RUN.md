# Trial Run — Core Loop on Real Notes

**Input:** one real French tutoring session (typed notes, ~60 items, no images).
**Question:** can the pipeline turn this into a quiz someone would actually want to answer tomorrow morning?

**Verdict: yes.** The loop holds. Details and what it broke below.

This document is the evidence behind the scope. Findings 1 and 2 shaped the category list and confirmed the 7-day window. Findings 3 and 4 became hard requirements in `PROMPTS.md`.

---

## Sample daily quiz built from the notes

*Target: under 10 minutes. Mixed categories and types.*

**1. Vocabulary · MCQ (FR → EN)**
« l'étendoir » veut dire :
a) the clothes line b) the ceiling c) the rent d) the hamstring

**2. Vocabulary · MCQ (FR → EN)**
« morose » veut dire :
a) gloomy b) wet c) tense d) pleased

**3. Vocabulary · MCQ (FR → EN)**
« les ischio-jambiers » veut dire :
a) the hamstrings b) the shoulders c) the knees d) the lower back

**4. Vocabulary · MCQ (EN → FR)**
Comment dit-on « rent » ?
a) le loyer b) le moine c) l'âme d) le désir

**5. Phrase · MCQ**
« apprendre à lâcher prise » veut dire :
a) learn to let go b) learn to hold on c) learn to stretch d) learn to avoid

**6. Phrase · Fill in the blank**
« Je ____ tous les jours. » — I stretch every day.

**7. Comprehension · Fill in the blank**
« Pour les bouddhistes, après la mort, l'____ entre dans l'univers et se prépare pour une prochaine vie. »

**8. Grammar · True / False**
« le bonheur » est un adjectif.

**9. Grammar · Transformation**
Donnez le nom : heureux → ____ ; triste → ____ ; en colère → ____

**10. Grammar · Fill in the blank (imparfait)**
« Au fil des jours, j'____ de l'anxiété. »

**11. Comprehension · MCQ**
« Si tu as fait beaucoup de mal dans cette vie, tu emportes ces émotions avec toi. » Ici, « emportes » veut dire :
a) carry b) avoid c) forget d) leave behind

---

## Finding 1 — the content categories came out of the notes themselves

The initial guess was vocabulary / sentence / writing / idea. The real notes confirmed some and corrected others. The set that actually fits:

| Category | Source in these notes | Types that serve it |
|---|---|---|
| **Vocabulary** | ~40 FR↔EN term pairs | MCQ both directions, fill-in-the-blank, image-based |
| **Phrases & chunks** | je paie le loyer, tous les deux, au fil des jours, ça t'inclut, apprendre à lâcher prise | MCQ, fill-in-the-blank |
| **Grammar & structure** | noun↔adjective pairs, imparfait, adjective agreement, au niveau de | true/false, transformation, fill-in-the-blank |
| **Ideas & expression** | the let-go monologue, « je n'avais pas de but dans ma vie » | MCQ on meaning, reordering |
| **Comprehension** | the Buddhist monk passage | passage + questions on it |

**Grammar is its own category** — the notes teach it explicitly ("noun et adjective différence"). It was missing from the earlier list.
**Comprehension was missing too** — any session with a reading passage generates it.

## Finding 2 — one session comfortably fills the 7-day window

~60 items become roughly 110–150 questions once each pair yields both directions and each sentence yields a fill-in-the-blank plus a meaning check. At 8–12 questions a day, that is 7 days with room to spare.

**The 7-day email window is well matched to one session per week.** That design decision is now evidence-backed rather than assumed.

## Finding 3 — the notes are messy, and that is the real engineering risk

- No consistent separator: dashes, bare newlines, and runs of terms with no gloss at all (`signe`, `Pilates`, `maintenir`, `par exemple`, `à nouveau`).
- Garbled entries: `ischio-jambièrs` (misspelled), `tension au bibeau` (unintelligible).
- Meta-commentary mixed into the data: `noun et adjective différence`, `tension at the level of -`.
- Mixed topics in one session: home, Buddhism, emotions, Pilates, language anxiety.

**Conclusion:** extraction must be LLM-driven, and the model must be explicitly allowed to return "this line is unusable." A stricter parser would produce questions built on `au bibeau`. This became rule 4 of the extraction prompt.

## Finding 4 — the sample quiz is answerable, but two types need decisions

- **Image-based** is inert on a text-only deck. These notes have no images, so where an image question would get its image is unresolved: the user's own uploads, a stock library, or generation. *Resolved afterwards: image-based questions present the retained note image, and only exist in classrooms with image uploads.*
- **Ideas & expression** has the least natural fit with the remaining types, since short answer was dropped. Question 5-style meaning checks and reordering carry it for now.

## Finding 5 — language direction needs a rule

The notes are French (target) glossed in English (native). Half the value is recognition (FR→EN), half is production (EN→FR). The pipeline must detect which side is the target language, and the quiz should weight toward production — recognizing is easier than producing, so recognition questions flatter the learner.

---

## Open items this trial surfaced

All resolved afterwards:

1. **Questions per day** — was undefined. Now: `min(20, max(8, floor(bank_size / 8)))`, with the 10-minute budget binding.
2. **Vocabulary direction** — both, weighted toward production.
3. **Image source** — the retained note image, only in classrooms with uploads.
4. **Grammar detection** — became rule 5 of the extraction prompt.
