// SA-SAMS style mark sheet, formal tasks only. Rules (EMIS guideline): -1 = absent with valid reason, no blanks,
// file name changed only by adding the class letter before .xls, task totals and dates fixed first.
import { finalCorrect } from "./marking.js";

const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function markSheet({ tasks, marks, learners, absentAsMinusOne = false }) {
  const formal = tasks.filter((t) => t.type === "formal");
  const rows = learners.map((l) => {
    const cells = formal.map((t) => {
      const m = (marks[t.id] || {})[l.code];
      if (!m || !l.consent) return null;
      const done = m.items.filter((i) => finalCorrect(i) !== null);
      if (done.length < m.items.length) return null;
      return m.items.filter((i) => finalCorrect(i)).length;
    });
    return { l, cells };
  });
  const missing = rows.filter((r) => r.cells.some((c) => c === null)).map((r) => r.l);
  const blocked = missing.length && !absentAsMinusOne;
  return { formal, rows: rows.map((r) => ({ ...r, cells: r.cells.map((c) => (c === null ? (absentAsMinusOne ? -1 : null) : c)) })), missing, blocked };
}

export function toXls(sheet, { className = "B", grade = 6, term = 4 } = {}) {
  if (sheet.blocked) throw new Error("Some learners have no mark. Set them to -1 (absent with a valid reason) or capture their marks first.");
  if (!sheet.formal.length) throw new Error("No formal tasks to export.");
  const cell = (v, t = "String") => `<Cell><Data ss:Type="${t}">${x(v)}</Data></Cell>`;
  const rows = [
    `<Row>${cell("Task")}${cell("-")}${cell("-")}${sheet.formal.map((t) => cell(t.name)).join("")}</Row>`,
    `<Row>${cell("Total")}${cell("-")}${cell("-")}${sheet.formal.map((t) => cell(t.total, "Number")).join("")}</Row>`,
    `<Row>${cell("Date")}${cell("-")}${cell("-")}${sheet.formal.map((t) => cell(t.date)).join("")}</Row>`,
    `<Row>${cell("Learner no.")}${cell("Surname")}${cell("First name")}${sheet.formal.map(() => cell("Mark")).join("")}</Row>`,
    ...sheet.rows.map(({ l, cells }) => { const parts = l.name.trim().split(/\s+/), sur = parts.pop(); return `<Row>${cell(l.code)}${cell(sur)}${cell(parts.join(" "))}${cells.map((c) => cell(c, "Number")).join("")}</Row>`; }),
  ];
  const xml = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Marks"><Table>${rows.join("")}</Table></Worksheet></Workbook>`;
  return { xml, filename: `MarkSheet_Gr${grade}_Maths_Term${term}_${className}.xls` };
}
