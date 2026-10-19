# Brand study

Two short studies for F1R3FLY, built as plain static pages so anyone can run them, read them, or fork them.

- `name/` the company-name study (one name per person, two minutes). `name/recall/` is the next-day question.
- `site/` the website study (ten-second first impression on a capture of f1r3fly.io, then the live site).
- `plan/` the pages for the people running it: decisions, who, where, questions with bias notes, results, brand map. Not linked from the respondent pages.
- `assets/config.js` the only file you need to touch: the name cells, the context line, and `collectUrl`.

## Preview vs live

With `collectUrl` empty every page shows a yellow Preview bar and records nothing. Put a collector URL in and the bar goes away:

- Google Apps Script web app bound to a Google Sheet (script in `plan/index.html`, "Go live"). Best for volume; one row per response, one tab per study.
- A Formspree form endpoint (`https://formspree.io/f/...`). Zero setup, emails every response. Fine for a pilot.

## Links to share

Every channel gets its own tag so results can be read by source: `name/?c=signal`, `site/?c=nicholas`. Force a name cell for testing with `name/?cell=F1R3`.

## Hosting

Live at https://hannahadamsdesign-spec.github.io/brand-study/ (repo `hannahadamsdesign-spec/brand-study`).

GitHub Pages from the `main` branch, root folder. No build step. Keep the repository name free of the brand name: respondents see the URL before they see the name.

Built 19 October 2026 by Claude for Hannah Adams, F1R3FLY Industries.
