#let paper = rgb("#fbfaf6")
#let paper-deep = rgb("#f2efe7")
#let ink = rgb("#2f2c27")
#let muted = rgb("#756f66")
#let border = rgb("#d9d3c6")
#let mint = rgb("#4d796b")
#let mint-deep = rgb("#315c50")
#let mint-soft = rgb("#e4eee9")
#let coral = rgb("#b96555")
#let coral-soft = rgb("#f5e6e1")
#let ochre = rgb("#b68745")
#let ochre-soft = rgb("#f4ead8")
#let white = rgb("#fffefa")

#let heading-font = "Libertinus Serif"
#let body-font = "Libertinus Serif"
#let label-font = "DejaVu Sans Mono"

#let display(size: 30pt, color: ink, body) = text(
  font: heading-font,
  size: size,
  weight: "bold",
  fill: color,
  body,
)

#let copy(size: 13pt, color: ink, body) = text(
  font: body-font,
  size: size,
  fill: color,
  body,
)

#let label(size: 8pt, color: mint-deep, body) = text(
  font: label-font,
  size: size,
  weight: "bold",
  tracking: 0.8pt,
  fill: color,
  upper(body),
)

#let panel(
  body,
  width: auto,
  height: auto,
  inset: 18pt,
  radius: 15pt,
  fill-color: white,
  stroke-color: border,
) = block(
  width: width,
  height: height,
  inset: inset,
  radius: radius,
  fill: fill-color,
  stroke: 0.8pt + stroke-color,
  body,
)

#let pill(
  body,
  fill-color: mint-soft,
  color: mint-deep,
  stroke-color: none,
) = box(
  inset: (x: 8pt, y: 4pt),
  radius: 99pt,
  fill: fill-color,
  stroke: if stroke-color == none { none } else { 0.7pt + stroke-color },
  text(font: label-font, size: 7.5pt, weight: "bold", fill: color, body),
)

#let arrow(color: mint, size: 24pt) = text(
  font: heading-font,
  size: size,
  weight: "bold",
  fill: color,
)[→]

#let brand() = [
  #box(
    width: 30pt,
    height: 30pt,
    radius: 9pt,
    fill: mint,
    align(center + horizon, text(font: heading-font, size: 11pt, weight: "bold", fill: white)[10′]),
  )
  #h(9pt)
  #text(font: heading-font, size: 14pt, weight: "bold", fill: ink)[Ten Minutes Review]
]

#let note-sheet(title, lines, accent: mint, angle: 0deg) = rotate(
  angle,
  origin: center,
  panel(
    width: 142pt,
    height: 112pt,
    inset: 13pt,
    radius: 9pt,
    stroke-color: accent.lighten(52%),
    [
      #label(size: 6.5pt, color: accent)[#title]
      #v(10pt)
      #for line in lines [
        #copy(size: 9.5pt)[#line]
        #v(5pt)
      ]
    ],
  ),
)

#let number-badge(number, tone: mint) = box(
  width: 34pt,
  height: 34pt,
  radius: 99pt,
  fill: tone,
  align(center + horizon, text(font: label-font, size: 10pt, weight: "bold", fill: white)[#number]),
)
