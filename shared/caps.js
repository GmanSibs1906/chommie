// Checks an extracted ATP against the official CAPS topic list. Plain code, no model.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function matchTopic(text, caps) {
  const t = norm(text);
  for (const c of caps.topics) {
    // The first distinguishing word group wins: "related" before "same" so "same" ATP rows do not hit "related".
    const keys = [c.name, ...c.aliases].map(norm);
    if (keys.some((k) => k && t.includes(k))) return c;
  }
  return null;
}

export function checkAgainstCaps(atp, caps) {
  const rows = [];
  const found = new Set();
  for (const w of atp.weeks) {
    if (w.kind && w.kind !== "teach") { rows.push({ ...w, status: "assessment" }); continue; }
    const c = matchTopic(w.topic, caps);
    if (c) { found.add(c.id); rows.push({ ...w, status: "matched", capsId: c.id, capsName: c.name }); }
    else rows.push({ ...w, status: "extra" });
  }
  const missing = caps.topics.filter((c) => !found.has(c.id));
  return { rows, missing, ok: missing.length === 0 && !rows.some((r) => r.status === "extra") };
}

// Only topics found in the ATP and in CAPS are ever used downstream.
export function acceptedTopics(check) {
  return check.rows.filter((r) => r.status === "matched");
}
