import test from "node:test";
import assert from "node:assert/strict";
import { bodyForScan, inspectContent, scanWarnings, validateResult } from "./scan-client.js";

const validResult = { filename: "SKILL.md", findings: [], riskScore: { score: 0, label: "NONE" }, safe: true };

test("web request rejects empty and oversized JSON-encoded input", () => {
  assert.throws(() => bodyForScan(" \n", "SKILL.md"), /empty/);
  assert.throws(() => bodyForScan("\"".repeat(300000), "SKILL.md"), /512 KB/);
  assert.deepEqual(JSON.parse(bodyForScan("# Skill", "test.md")), { content: "# Skill", filename: "test.md" });
});

test("web client sends content only to the fixed API origin without credentials", async () => {
  const controller = new AbortController();
  const result = await inspectContent("# Skill", "test.md", controller.signal, async (url, options) => {
    assert.equal(url, "https://skillsguard.apiskillsguard.workers.dev/scan");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.signal, controller.signal);
    assert.deepEqual(JSON.parse(options.body), { content: "# Skill", filename: "test.md" });
    return Response.json(validResult);
  });
  assert.deepEqual(result, validResult);
});

test("web client surfaces rate limits and malformed responses", async () => {
  await assert.rejects(inspectContent("# Skill", "SKILL.md", undefined, async () => Response.json({ error: "Too many requests" }, { status: 429 })), /Rate limit/);
  await assert.rejects(inspectContent("# Skill", "SKILL.md", undefined, async () => Response.json({ safe: true })), /unexpected response/);
  assert.throws(() => validateResult({ ...validResult, riskScore: { score: 101 } }), /unexpected response/);
});

test("web client preserves partial-result warnings even when safe is true", () => {
  assert.deepEqual(scanWarnings({ ...validResult, warning: "Only first 10,000 lines scanned", findingsTruncated: true, totalFindings: 900 }), ["Only first 10,000 lines scanned", "Findings truncated: 0 of 900 returned."]);
});