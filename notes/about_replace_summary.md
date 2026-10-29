About section rebuilt as "01 — WHAT IS CAMPUSCODE?" in place.

Changes made:
- Kept existing About component/section where it was (no duplicate, no reordering).
- New content:
  - 01
  - WHAT IS CAMPUSCODE?
  - WHERE / STUDENTS / BUILD.
  - CampusCode brings students, teams, organizers and hackathons into one connected ecosystem.
  - outlined CC square
  - — IDEAS BECOME REALITY.
  - A connected space to discover hackathons, find teams, and turn ideas into shipped projects.
- Full-size section styling preserved: off-white background, faint grid, vertical divider, oversized headline with outlined BUILD., right-column CC block.
- Added AboutGridCanvas + sections.css hook to render the faint grid / subtle vertical gradient / divider lines.
- Everything else (hero, intro/audio/loading, other sections, page order, App assembly) left as-is.

Files touched:
- src/components/Sections.tsx
- src/styles/sections.css
- src/components/AboutGridCanvas.tsx (new)
- notes/about_replace_summary.md (notes)
