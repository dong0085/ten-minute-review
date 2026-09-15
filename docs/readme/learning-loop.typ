#import "theme.typ": *

#set page(width: 1200pt, height: 480pt, margin: 34pt, fill: paper)
#set text(font: body-font, fill: ink)
#set par(leading: 0.6em)

#let loop-card(number, kicker, title, description, tone: mint, visual) = panel(
  width: 255pt,
  height: 270pt,
  inset: 17pt,
  radius: 18pt,
  stroke-color: tone.lighten(55%),
  [
    #grid(columns: (auto, 1fr), align: horizon, number-badge(number, tone: tone), align(right, label(color: tone)[#kicker]))
    #v(10pt)
    #box(width: 100%, height: 104pt, align(center + horizon, visual))
    #v(9pt)
    #display(size: 18pt)[#title]
    #v(6pt)
    #copy(size: 9.5pt, color: muted)[#description]
  ],
)

#label([THE LEARNING LOOP])
#v(5pt)
#grid(
  columns: (1fr, auto),
  align: horizon,
  display(size: 25pt)[One lesson keeps paying you back.],
  pill([FRESH QUESTIONS · RETAINED HISTORY], fill-color: mint-soft),
)
#v(18pt)

#grid(
  columns: (255pt, 25pt, 255pt, 25pt, 255pt, 25pt, 255pt),
  align: horizon,
  column-gutter: 6pt,
  loop-card(
    [01], [CAPTURE], [Add the lesson],
    [Paste a recap or photograph the handwriting you already have.],
    tone: coral,
    [
      #scale(80%, origin: center, reflow: true, stack(
          dir: ltr,
          spacing: -79pt,
          note-sheet([TEXT], ([verbs + phrases], [grammar notes]), accent: ochre, angle: -4deg),
          move(dx: 28pt, dy: 21pt, note-sheet([PHOTO], ([mardi], [à revoir]), accent: coral, angle: 4deg)),
        ))
    ],
  ),
  align(center, arrow(size: 20pt)),
  loop-card(
    [02], [DISTILL], [Build memory],
    [The worker turns source material into reusable, categorized study points.],
    [
      #grid(columns: (1fr, 1fr), row-gutter: 7pt, column-gutter: 7pt,
        pill([VOCAB]), pill([PHRASES], fill-color: ochre-soft, color: ochre),
        pill([GRAMMAR], fill-color: coral-soft, color: coral), pill([IDEAS]),
      )
      #v(7pt)
      #align(center, pill([COMPREHENSION], fill-color: paper-deep, color: muted))
    ],
  ),
  align(center, arrow(size: 20pt)),
  loop-card(
    [03], [REVIEW], [Take ten minutes],
    [A fresh quiz mixes recent material with light retests from the bank.],
    tone: ochre,
    [
      #circle(
        radius: 42pt,
        fill: ochre-soft,
        stroke: 1.2pt + ochre,
        align(center + horizon, [#display(size: 31pt, color: ochre)[10′] #v(1pt) #label(size: 6.5pt, color: ochre)[DAILY REVIEW]]),
      )
    ],
  ),
  align(center, arrow(size: 20pt)),
  loop-card(
    [04], [REMEMBER], [Learn from it],
    [Submit to reveal answers, keep attempt history, and retake in a new order.],
    [
      #align(center, [
        #box(width: 104pt, height: 13pt, radius: 99pt, fill: paper-deep)[
          #box(width: 78pt, height: 13pt, radius: 99pt, fill: mint)
        ]
        #v(12pt)
        #display(size: 27pt, color: mint-deep)[7 / 8]
        #v(7pt)
        #pill([FEEDBACK SAVED], fill-color: mint-soft)
      ])
    ],
  ),
)

#v(12pt)
#align(center, [
  #text(font: label-font, size: 8pt, weight: "bold", tracking: 0.8pt, fill: muted)[RETURN WITH THE NEXT LESSON]
  #h(12pt)
  #line(length: 330pt, stroke: (paint: mint.lighten(35%), thickness: 1pt, dash: "dashed"))
  #h(7pt)
  #arrow(size: 16pt)
])
