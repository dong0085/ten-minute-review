#import "theme.typ": *

// 16:9 project card thumbnail. It recreates the web nav lockup from
// apps/web/app/layout.tsx on the paper canvas of apps/web/app/globals.css,
// with the oklch theme values converted to sRGB.
#let canvas = rgb(249, 246, 241) // --background  oklch(0.975 0.008 82)
#let primary = rgb(43, 101, 78)  // --primary     oklch(0.46 0.072 165)
#let ink = rgb(36, 28, 21)       // --foreground  oklch(0.235 0.018 64)
#let glow = rgb(176, 204, 190)   // body radial   oklch(0.82 0.035 165)
#let wash = rgb(225, 222, 216)   // body linear   oklch(0.9 0.008 82)

// Nav lockup at 4.5x browser scale: a 2rem badge with 0.65rem corners and a
// 2.5 gap, matching the utility values in the nav markup.
#let s = 4.5

#set page(width: 1280pt, height: 720pt, margin: 0pt, fill: canvas)
#set text(font: heading-font, fill: ink)

// The two body washes: a glow entering from the top-left corner and a light
// tint settling toward the bottom.
#place(
  top + left,
  dx: 102pt,
  dy: -72pt,
  circle(
    radius: 780pt,
    fill: gradient.radial(rgb(176, 204, 190, 16%), rgb(176, 204, 190, 0%)),
  ),
)
#place(
  top + left,
  rect(
    width: 1280pt,
    height: 720pt,
    fill: gradient.linear(dir: ttb, (rgb(225, 222, 216, 0%), 0%), (rgb(225, 222, 216, 12%), 100%)),
  ),
)

#place(
  center + horizon,
  grid(
    columns: (auto, auto),
    column-gutter: 10pt * s,
    align: horizon,
    box(
      width: 32pt * s,
      height: 32pt * s,
      radius: 10.4pt * s,
      fill: rgb(43, 101, 78, 8%),
      stroke: (1pt * s) + rgb(43, 101, 78, 20%),
      align(
        center + horizon,
        text(
          size: 15.2pt * s,
          weight: 600,
          tracking: -0.06em,
          fill: primary,
          top-edge: "bounds",
          bottom-edge: "bounds",
        )[10′],
      ),
    ),
    text(
      size: 16.8pt * s,
      weight: 600,
      tracking: -0.025em,
      fill: ink,
      top-edge: "bounds",
      bottom-edge: "bounds",
    )[Ten Minutes Review],
  ),
)
