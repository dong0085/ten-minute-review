#import "theme.typ": *

#set page(width: 1200pt, height: 360pt, margin: 0pt, fill: paper)
#set text(font: body-font, fill: ink)
#set par(leading: 0.62em)

#place(left + top, dx: 44pt, dy: 34pt, brand())
#place(right + top, dx: -44pt, dy: 36pt, pill([OPEN SOURCE · MOCK-FIRST], fill-color: paper-deep, color: muted))

#place(left + top, dx: 46pt, dy: 84pt)[
  #block(width: 470pt)[
    #label([A QUIETER WAY TO KEEP LEARNING])
    #v(10pt)
    #display(size: 37pt)[Turn lesson notes into]
    #v(1pt)
    #box(fill: mint-soft, radius: 5pt, inset: (x: 7pt, y: 1pt), display(size: 37pt)[a focused daily review.])
    #v(13pt)
    #copy(size: 13pt, color: muted)[Typed notes and handwriting become fresh questions across five learning categories—sized to fit ten minutes.]
    #v(14pt)
    #pill([NEXT.JS 16]) #h(7pt)
    #pill([POSTGRES], fill-color: ochre-soft, color: ochre) #h(7pt)
    #pill([EN · FR], fill-color: coral-soft, color: coral)
  ]
]

#place(left + top, dx: 556pt, dy: 80pt)[
  #panel(
    width: 600pt,
    height: 242pt,
    inset: 22pt,
    radius: 22pt,
    fill-color: paper-deep,
    stroke-color: paper-deep,
    [
      #grid(
        columns: (160pt, 30pt, 170pt, 30pt, 150pt),
        align: horizon,
        column-gutter: 4pt,
        [
          #label(color: coral)[01 · CAPTURE]
          #v(17pt)
          #stack(
            dir: ltr,
            spacing: -105pt,
            note-sheet([TYPED NOTES], ([prendre soin de], [la confiance]), accent: ochre, angle: -3deg),
            move(dx: 29pt, dy: 42pt, note-sheet([HANDWRITING], ([il faut + infinitif], [mardi · leçon]), accent: coral, angle: 3deg)),
          )
        ],
        align(center, arrow(size: 22pt)),
        [
          #align(center, label([02 · DISTILL]))
          #v(12pt)
          #align(center, circle(
            radius: 45pt,
            fill: mint,
            align(center + horizon, [
              #display(size: 28pt, color: white)[5]
              #v(-2pt)
              #label(size: 6.5pt, color: white)[CATEGORIES]
            ]),
          ))
          #v(12pt)
          #align(center, [#pill([WORDS]) #h(4pt) #pill([GRAMMAR], fill-color: ochre-soft, color: ochre)])
          #v(5pt)
          #align(center, pill([IDEAS · PASSAGES], fill-color: coral-soft, color: coral))
        ],
        align(center, arrow(size: 22pt)),
        [
          #align(center, label([03 · REVIEW]))
          #v(15pt)
          #align(center, circle(
            radius: 55pt,
            fill: white,
            stroke: 1.3pt + mint,
            align(center + horizon, [
              #display(size: 34pt, color: mint-deep)[10′]
              #v(1pt)
              #label(size: 6.5pt)[FRESH QUIZ]
            ]),
          ))
          #v(12pt)
          #align(center, copy(size: 10pt, color: muted)[Review · feedback · retake])
        ],
      )
    ],
  )
]
