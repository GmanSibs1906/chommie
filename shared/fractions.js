// Plain-code fraction maths. Memo answers are computed here, never taken from a model.
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const F = (n, d = 1) => { if (!d) throw new Error("Zero denominator"); const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return { n: (s * n) / g, d: (s * d) / g }; };
const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => F(a.n * b.n, a.d * b.d), div = (a, b) => { if (!b.n) throw new Error("Divide by zero"); return F(a.n * b.d, a.d * b.n); };
export const eq = (a, b) => a.n === b.n && a.d === b.d;

const TOKEN = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.\d+|\d+)|(of|[+\-×x*÷])/gi;
function atom(t) {
  let m;
  if ((m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return F(+m[1] * +m[3] + +m[2], +m[3]);
  if ((m = t.match(/^(\d+)\/(\d+)$/))) return F(+m[1], +m[2]);
  if ((m = t.match(/^(\d+)\.(\d+)$/))) return F(+(m[1] + m[2]), 10 ** m[2].length);
  return F(+t, 1);
}
export function evalExpr(expr) {
  const toks = []; let m; TOKEN.lastIndex = 0;
  const cleaned = String(expr).trim();
  if (cleaned.replace(TOKEN, "").replace(/\s+/g, "") !== "") throw new Error("Cannot read: " + expr);
  while ((m = TOKEN.exec(cleaned))) toks.push(m[1] ? { v: atom(m[1].trim()) } : { op: m[2].toLowerCase() });
  if (!toks.length || toks.length % 2 === 0) throw new Error("Bad expression: " + expr);
  const apply = (ops) => { for (let i = 1; i < toks.length; i += 2) if (ops.includes(toks[i].op)) {
    const a = toks[i - 1].v, b = toks[i + 1].v, o = toks[i].op;
    const r = o === "+" ? add(a, b) : o === "-" ? sub(a, b) : o === "÷" ? div(a, b) : mul(a, b);
    toks.splice(i - 1, 3, { v: r }); i -= 2; } };
  apply(["of", "×", "x", "*", "÷"]); apply(["+", "-"]);
  return toks[0].v;
}
export function fmtFrac(f) {
  if (f.d === 1) return String(f.n);
  const w = Math.trunc(f.n / f.d), r = Math.abs(f.n) % f.d;
  return Math.abs(f.n) > f.d ? `${w} ${r}/${f.d}` : `${f.n}/${f.d}`;
}
const U = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘", "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞" };
export const pretty = (s) => String(s).replace(/(\d+)\/(\d+)/g, (m) => U[m] || m).replace(/(\d)\s+([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, "$1$2");
export function parseFrac(s) { return evalExpr(s); }
// true when a learner's written fraction/number equals the expected one (e.g. "2/4" equals 1/2)
export function sameValue(written, expectedStr) { try { return eq(evalExpr(written), evalExpr(expectedStr)); } catch { return false; } }
