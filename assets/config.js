/* One place to switch the study on.
   collectUrl: the Google Apps Script web-app URL that appends responses to the shared sheet
   (see plan/index.html, "Go live"). Empty = preview mode: pages work, nothing is recorded. */
window.STUDY_CONFIG = {
  collectUrl: "",
  // Name cells. Add or remove a line to change the set; every cell gets the same questions.
  names: [
    { id: "F1R3FLY", show: "F1R3FLY", say: "firefly" },
    { id: "F1R3",    show: "F1R3",    say: "fire" },
    { id: "FIRE",    show: "FIRE",    say: "fire" },
    { id: "KAVRIX",  show: "KAVRIX",  say: "kavrix" },
    { id: "F1R3LY",  show: "F1R3LY",  say: "firely" },    // Hannah's 09-23 proposal, in since 10-19
  ],
  // One line of context shown after the first question. Identical for every cell, by design.
  context: "It makes infrastructure software for AI systems and enterprises.",
  siteUrl: "https://f1r3fly.io/",
};
