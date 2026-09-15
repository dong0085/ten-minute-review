#import "theme.typ": *

#set page(width: 1200pt, height: 460pt, margin: 34pt, fill: paper)
#set text(font: body-font, fill: ink)
#set par(leading: 0.6em)

#grid(
  columns: (1fr, auto),
  align: horizon,
  [
    #label([SYSTEM AT A GLANCE])
    #v(6pt)
    #display(size: 25pt)[Fast requests. Durable background work.]
  ],
  pill([NO INLINE LLM CALLS], fill-color: coral-soft, color: coral),
)

#v(18pt)
#grid(
  columns: (224pt, 32pt, 224pt, 32pt, 224pt, 32pt, 224pt),
  align: horizon,
  column-gutter: 8pt,
  panel(
    width: 224pt,
    height: 142pt,
    inset: 16pt,
    stroke-color: mint.lighten(50%),
    [
      #grid(columns: (auto, 1fr), align: horizon, number-badge([01]), align(right, label([CLIENT])))
      #v(13pt)
      #display(size: 19pt)[Browser]
      #v(6pt)
      #copy(size: 10.5pt, color: muted)[Notes arrive. Quizzes and submitted feedback return.]
    ],
  ),
  align(center, arrow(size: 21pt)),
  panel(
    width: 224pt,
    height: 142pt,
    inset: 16pt,
    [
      #grid(columns: (auto, 1fr), align: horizon, number-badge([02], tone: ochre), align(right, label(color: ochre)[VERCEL]))
      #v(13pt)
      #display(size: 19pt)[Next.js web]
      #v(6pt)
      #copy(size: 10.5pt, color: muted)[App Router UI, APIs, and Auth.js sessions.]
    ],
  ),
  align(center, arrow(size: 21pt)),
  panel(
    width: 224pt,
    height: 142pt,
    inset: 16pt,
    stroke-color: mint.lighten(50%),
    [
      #grid(columns: (auto, 1fr), align: horizon, number-badge([03]), align(right, label([NEON])))
      #v(13pt)
      #display(size: 19pt)[Postgres]
      #v(6pt)
      #copy(size: 10.5pt, color: muted)[Product state plus the durable job queue.]
    ],
  ),
  align(center, arrow(size: 21pt)),
  panel(
    width: 224pt,
    height: 142pt,
    inset: 16pt,
    [
      #grid(columns: (auto, 1fr), align: horizon, number-badge([04], tone: coral), align(right, label(color: coral)[RENDER]))
      #v(13pt)
      #display(size: 19pt)[Worker]
      #v(6pt)
      #copy(size: 10.5pt, color: muted)[Extracts, composes, delivers, and retries safely.]
    ],
  ),
)

#v(16pt)
#panel(
  width: 100%,
  height: 105pt,
  inset: 14pt,
  radius: 13pt,
  fill-color: paper-deep,
  stroke-color: paper-deep,
  [
    #grid(
      columns: (150pt, 1fr, 1fr, 1fr),
      align: horizon,
      column-gutter: 12pt,
      [
        #label([ADAPTER RAIL])
        #v(7pt)
        #copy(size: 9.5pt, color: muted)[One interface per external service.]
      ],
      panel(inset: 11pt, radius: 9pt, [#label([LANGUAGE MODEL]) #v(5pt) #display(size: 15pt)[Mock / DeepSeek]]),
      panel(inset: 11pt, radius: 9pt, [#label(color: ochre)[IMAGE STORAGE] #v(5pt) #display(size: 15pt)[Local / Vercel Blob]]),
      panel(inset: 11pt, radius: 9pt, [#label(color: coral)[DELIVERY] #v(5pt) #display(size: 15pt)[Console / Brevo / Resend]]),
    )
  ],
)
