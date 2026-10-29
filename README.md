# CampusCode — Cinematic Scroll Intro

A scroll-driven introduction for [CampusCode](https://campus-code-ten.vercel.app/), built with React, TypeScript, GSAP ScrollTrigger and React Three Fiber.

The first frame is pure black. A scroll indicator is the only visible element. Scrolling opens a thin central slit, reveals the full CampusCode hero, then closes the hero back into the slit before a lime diagonal flash gives way to the editorial sections and the rest of the site.

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run typecheck
npm run build
npm run preview
```

## What is implemented

- **Cinema timeline** — one reversible, pinned ScrollTrigger timeline covering roughly five desktop viewports (4.4 on small screens): black hold → slit → full reveal → hero dwell → contraction → editorial panels → lime diagonal → site continuation.
- **Reveal mechanics** — the black layer is opened with an animated CSS mask; the complete hero sits behind it and is later contracted with an animated `clip-path`.
- **Original identity** — the nav mark is the site's own three skewed bars (black / purple / lime) with the `CAMPUSCODE` wordmark and `HACKATHON ARENA` descriptor. The original `favicon.svg` is preserved in `public/`.
- **3D object** — a white rounded cube with an extruded, original three-bar CC mark, three metallic orbital rings, glossy purple/lime/silver spheres, custom environment lighting, soft contact shadows, gentle float and scroll-driven position/scale/rotation.
- **Remaining site** — About, How It Works, Hackathons, Mission, Community, final CTA and footer, using the original copy, section order, typography, grid and accent language. The marquee returns between the intro and About.
- **Responsive** — six breakpoints tested from 375px to 1920px, including stacked editorial panels on phones and a dedicated tablet object placement.
- **Accessibility** — `prefers-reduced-motion` skips the cinema and shows the hero immediately; the 3D canvas is decorative; a skip link jumps to About; menus close on Escape; anchors scroll to their sections.
- **Performance** — capped canvas DPR, single environment render, limited contact-shadow resolution, paused render loop when the canvas is off-screen, one scrubbed timeline, and full GSAP/ScrollTrigger cleanup via `gsap.context()`.

## Key files

- `src/components/CinematicIntro.tsx` — pinned timeline and phase orchestration
- `src/components/Hero.tsx` — navigation, hero copy, CTA and mobile menu
- `src/components/CubeScene.tsx` — the 3D cube, rings, spheres and lighting
- `src/components/Logo.tsx` — original mark and wordmark
- `src/components/Sections.tsx` — all content below the intro
- `src/styles/intro.css` — blackout mask, panels, diagonal accent and cue
- `src/styles/hero.css` — hero, nav, object frame and responsive rules

## Integration note

The **Login** and **Join CampusCode** links currently point to the existing live CampusCode app (`campus-code-ten.vercel.app`). If this build is deployed as the new root site with local auth routes, update `LOGIN_URL` and `JOIN_URL` in `src/components/Hero.tsx`.
