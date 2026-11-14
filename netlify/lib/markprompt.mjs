export function markPrompt({ code, questions, recheck }) {
  const memo = questions.map((q) => `${q.n}) ${q.plain}   memo answer: ${q.answer}`).join("\n");
  const only = recheck ? `\nONLY answer question ${recheck.n}. Re-read it carefully. ${recheck.note}\n` : "";
  return `You are a careful maths marker for a South African Grade 6 class (fractions). The images above are the pages of ONE learner's exercise book, record number ${code}.
Rules:
- Read what the learner wrote for each numbered question exactly. Never guess. If any digit is smudged, scribbled over or you are not sure, set "legible": false and "confidence" below 0.8. An honest "unclear" is always better than a guess.
- Mark the learner's FINAL answer. An answer is correct when its value equals the memo answer (3/9 equals 1/3). A missing answer is wrong with read "".
- "read" is only the final answer the learner wrote (for example "5/6" or "3 2/3" or "9").
- "evidence" is a short quote of what you saw. "page" is the image number (1 = Image 1). "box" is [x0,y0,x1,y1] of the answer on that page as fractions of the page width and height between 0 and 1.
${only}
Memo:
${memo}

Reply with JSON only: {"learner":"${code}","answers":[{"n":1,"read":"3/6","legible":true,"confidence":0.97,"correct":true,"evidence":"...","page":1,"box":[0.1,0.1,0.5,0.2]}]}`;
}
