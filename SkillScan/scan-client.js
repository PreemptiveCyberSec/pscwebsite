export const API_BASE = "https://skillsguard.apiskillsguard.workers.dev";
export const MAX_BYTES = 524288;
export const MAX_FILES = 20;

export function bodyForScan(content, filename) {
  if (!content.trim()) throw new Error("The selected content is empty.");
  const body = JSON.stringify({ content, filename });
  if (new TextEncoder().encode(body).byteLength > MAX_BYTES) {
    throw new Error("Request exceeds 512 KB including JSON encoding. Select a smaller file.");
  }
  return body;
}

export function validateResult(result) {
  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  if (!result || !Array.isArray(result.findings) || typeof result.safe !== "boolean" ||
      !Number.isFinite(result.riskScore?.score) || result.riskScore.score < 0 || result.riskScore.score > 100 ||
      result.findings.length > 500 || result.findings.some(finding =>
        !finding || !severities.includes(finding.severity) || !Number.isInteger(finding.line) || finding.line < 1 ||
        ["ruleId", "category", "message", "file", "evidence"].some(field => typeof finding[field] !== "string"))) {
    throw new Error("The scan API returned an unexpected response.");
  }
  return result;
}

export async function inspectContent(content, filename, signal, request = fetch) {
  const response = await request(`${API_BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyForScan(content, filename),
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer"
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const retry = response.status === 429 ? " Rate limit reached; try again in one minute." : "";
    throw new Error(`${typeof result.error === "string" ? result.error : `Scan failed (HTTP ${response.status}).`}${retry}`);
  }
  return validateResult(result);
}

export function scanWarnings(result) {
  const warnings = [];
  if (result.warning) warnings.push(String(result.warning));
  if (result.findingsTruncated) warnings.push(`Findings truncated: ${result.findings.length} of ${result.totalFindings ?? "all"} returned.`);
  return warnings;
}