(function () {
  const C = window.STUDY_CONFIG, U = window.studyUtil;
  // Cell: ?cell=F1R3 forces one (for testing). Otherwise a fair random draw, which beats the first-letter-of-your-name trick.
  // Cell: fixed by the page (one page per name), else ?cell=, else a fair random draw.
  const forced = (window.FIXED_CELL || U.qs.get("cell") || "").toUpperCase();
  const cell = C.names.find(n => n.id === forced) || C.names[Math.floor(Math.random() * C.names.length)];

  runStudy({
    study: "name", version: 2, cell: cell.id, cellForced: !!forced,
    steps: [
      { id: "intro", type: "info", title: "A two-minute study on a company name",
        body: "<p>You'll see one company name and answer a few questions about it. There are no right answers.</p>" +
              "<p>It takes about two minutes. Your answers are anonymous. At the end you can leave an email for a ten-second second part tomorrow; that's optional.</p>" +
              "<p class='hint'>Please do this on your own, with your sound on, and without looking anything up.</p>",
        button: "Start" },
      { id: "s1", type: "radio", q: "What best describes your work?",
        options: ["Software developer or engineer", "Technical lead, architect, or CTO", "Product or program management", "Design or marketing", "Founder or executive", "Student", "Other"], last: "Other" },
      { id: "s2", type: "radio", q: "How old are you?", options: ["Under 22", "22 to 29", "30 to 40", "41 to 55", "Over 55"] },
      { id: "expose", type: "expose", word: cell.show, seconds: 5,
        instruction: "Look at this company name. It disappears after five seconds, and you won't be able to come back to it." },
      { id: "q1", type: "text", q: "In one or two words, what do you think this company does?", placeholder: "Your first guess", rows: 2 },
      { id: "ctx", type: "info", title: "One line about the company", body: "<p>" + C.context + "</p><p class='hint'>Keep that in mind for the next questions.</p>" },
      { id: "q2", type: "text", q: "Say the name out loud, then type how you said it, spelled the way it sounds.", placeholder: "For example: ack-me", multiline: false, caps: "none" },
      { id: "q3", type: "scale", q: "How easy was it to know how to say it?", low: "I had to guess", high: "Obvious" },
      { id: "q4", type: "radio", q: "Would you be comfortable saying this name out loud in a work meeting?", options: ["Yes", "Yes, but I'd feel a little silly", "No"] },
      { id: "q5", type: "scale", q: "If you heard this name spoken and had to type it into a browser, how confident are you that you'd spell it right?", low: "Not at all", high: "Completely" },
      { id: "q6", type: "audio", q: "Listen to this clip once, then type the company name you heard.", say: cell.say,
        hint: "Turn your sound on. The clip plays once and can't be replayed." },
      { id: "q7", type: "check", q: "Which of these words fit the name? Pick up to three.", max: 3, shuffle: true,
        options: ["Serious", "Playful", "Technical", "Trustworthy", "Gimmicky", "Modern", "Dated", "Young", "Corporate", "Confusing", "Memorable", "Forgettable"] },
      { id: "q8", type: "text", q: "Does the name remind you of any other company, product, or thing?", required: false, rows: 2, placeholder: "Leave blank if nothing comes to mind" },
      { id: "q9", type: "radio", q: "Had you seen or heard this name before today?", options: ["Yes", "No", "Not sure"] },
      { id: "q10", type: "text", q: "Anything else about the name?", required: false, rows: 3 },
      { id: "email", type: "email", q: "One more thing tomorrow?",
        hint: "This study has a ten-second second part tomorrow. If you're willing, leave an email we'll use once for that message only. We delete it within seven days.", button: "Finish" },
    ],
    thanksTitle: "Thank you.",
    thanks: "<p>That's everything. You can close this page.</p>",
    emailNote: "You'll get one short message tomorrow, then nothing more."
  });
})();
