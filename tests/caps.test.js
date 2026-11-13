import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkAgainstCaps } from "../shared/caps.js";
const caps = JSON.parse(readFileSync("shared/caps-g6-t4.json")), off = JSON.parse(readFileSync("shared/official-atp-g6-t4.json"));
test("official ATP matches all CAPS topics", () => { const c = checkAgainstCaps(off, caps); assert.equal(c.missing.length, 0); assert.equal(c.rows.filter(r => r.status === "extra").length, 0); });
test("missing and extra topics are flagged, never invented", () => {
  const atp = { weeks: [{ from: 1, to: 1, topic: "Geometry: 3D objects", kind: "teach" }, { from: 2, to: 2, topic: "Mixed numbers", kind: "teach" }] };
  const c = checkAgainstCaps(atp, caps);
  assert.equal(c.rows[0].status, "extra"); assert.equal(c.rows[1].status, "matched"); assert.equal(c.missing.length, 5);
});
