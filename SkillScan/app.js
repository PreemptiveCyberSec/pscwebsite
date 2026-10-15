import { API_BASE, MAX_BYTES, MAX_FILES, inspectContent, scanWarnings } from "./scan-client.js";

const element = id => document.getElementById(id);
const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const categories = ["prompt-injection", "exfiltration", "command-injection", "supply-chain", "persistence", "privilege-escalation", "filesystem-abuse", "network", "obfuscation", "secret-harvesting", "scope-creep", "powershell", "docker", "ruby", "model-specific"];
const categoryIcons = ["shield-alert", "upload", "terminal", "box", "timer", "lock-keyhole", "folder", "network", "binary", "key-round", "crosshair", "square-terminal", "container", "gem", "brain-circuit"];
const state = { mode: "paste", files: [], results: [], errors: [], category: "ALL", running: false, controller: null, cancelled: false, attempted: 0 };
const formatBytes = size => size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
const labelCategory = category => category.replaceAll("-", " ").replace(/^./, character => character.toUpperCase());

function showError(message = "") {
  element("input-error").textContent = message;
  element("input-error").hidden = !message;
}

function setMode(mode) {
  state.mode = mode;
  for (const option of ["paste", "files"]) {
    element(`${option}-panel`).hidden = false;
    element(`${option}-tab`).setAttribute("aria-pressed", String(mode === option));
  }
  showError();
}

async function showFiles(files) {
  if (files.length > MAX_FILES) return showError(`Select at most ${MAX_FILES} files per batch.`);
  if (files.some(file => file.size > MAX_BYTES)) return showError("Each file must be smaller than 512 KB.");
  state.files = files;
  element("file-list").replaceChildren();
  for (const file of files) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const size = document.createElement("span");
    name.textContent = file.name;
    size.textContent = formatBytes(file.size);
    item.append(name, size);
    element("file-list").append(item);
  }
  element("clear-files").hidden = files.length === 0;
  if (files.length) {
    setMode("files");
    const preview = await files[0].text();
    if (state.files[0] === files[0]) {
      element("filename").value = files[0].name;
      element("content").value = preview;
      updateByteCount();
    }
  } else {
    setMode("paste");
  }
  showError();
}

function updateByteCount() {
  element("byte-count").textContent = formatBytes(new TextEncoder().encode(element("content").value).byteLength);
}

function allFindings() {
  return state.results.flatMap(result => result.findings);
}

function renderCategories(findings) {
  const container = element("category-filters");
  container.replaceChildren();
  for (const category of ["ALL", ...categories]) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(category === state.category));
    const name = document.createElement("span");
    const count = document.createElement("span");
    const icon = document.createElement("img");
    icon.src = new URL(`./assets/${category === "ALL" ? "scan-line" : categoryIcons[categories.indexOf(category)]}.svg`, import.meta.url).href;
    icon.alt = "";
    icon.width = 19;
    icon.height = 19;
    name.textContent = category === "ALL" ? "All categories" : labelCategory(category);
    count.textContent = String(category === "ALL" ? findings.length : findings.filter(finding => finding.category === category).length).padStart(2, "0");
    button.append(icon, name, count);
    button.addEventListener("click", () => { state.category = category; render(); });
    container.append(button);
  }
}

function openDetail(finding, row) {
  element("detail-panel").hidden = false;
  element("detail-id").textContent = `${finding.ruleId} / ${finding.severity}`;
  element("detail-message").textContent = finding.message;
  element("detail-location").textContent = `${finding.file}:${finding.line} · ${labelCategory(finding.category)}`;
  element("detail-evidence").textContent = finding.evidence;
  element("detail-decoded").textContent = finding.decodedFrom ? `DECODED SOURCE / ${finding.decodedFrom}. Line refers to decoded text, not necessarily the original file.` : "";
  element("detail-decoded").hidden = !finding.decodedFrom;
  document.querySelectorAll("tr.selected").forEach(item => item.classList.remove("selected"));
  row.classList.add("selected");
  element("close-detail").focus({ preventScroll: true });
}

function render() {
  const findings = allFindings();
  const completed = state.results.length;
  const warnings = state.results.flatMap(result => scanWarnings(result).map(warning => `${result.filename}: ${warning}`));
  const partial = warnings.length > 0 || state.errors.length > 0 || state.cancelled;
  const inspected = completed > 0 || state.attempted > 0;
  const highest = severities.find(severity => findings.some(finding => finding.severity === severity));
  const maxRisk = completed ? Math.max(...state.results.map(result => result.riskScore.score)) : 0;
  element("files-count").textContent = String(completed).padStart(2, "0");
  element("files-caption").textContent = inspected ? `${completed} complete response${completed === 1 ? "" : "s"}` : "No active scan";
  element("findings-count").textContent = String(findings.length).padStart(2, "0");
  for (const severity of severities) element(`count-${severity.toLowerCase()}`).textContent = String(findings.filter(finding => finding.severity === severity).length);
  element("findings-caption").textContent = partial ? "Incomplete assessment" : inspected ? "Returned by scan engine" : "Awaiting results";
  element("severity-value").textContent = highest ?? (completed ? "NONE" : "—");
  element("severity-value").className = `severity-value ${highest?.toLowerCase() ?? ""}`;
  element("severity-caption").textContent = highest ? "Review required" : completed ? "No matching patterns" : "Not assessed";
  element("risk-value").textContent = completed ? maxRisk.toFixed(1).replace(/\.0$/, "") : "—";
  element("risk-fill").style.width = `${maxRisk}%`;
  element("risk-dial").style.setProperty("--score", `${maxRisk}%`);
  element("risk-dial").style.setProperty("--risk-color", maxRisk > 60 ? "var(--red)" : maxRisk > 30 ? "var(--amber)" : "var(--accent)");
  element("risk-caption").textContent = completed ? `${state.results.find(result => result.riskScore.score === maxRisk).riskScore.label} · highest file score` : "Not assessed";
  element("result-status").textContent = state.running ? `Inspecting ${completed + state.errors.length + 1} of ${state.attempted} files…` : partial ? "Partial inspection / review warnings" : completed ? "Inspection complete" : inspected ? "Inspection failed" : "Awaiting inspection";
  element("warnings").replaceChildren();
  for (const warning of [...warnings, ...state.errors, ...(state.cancelled ? ["Inspection cancelled. Results cover only completed requests."] : [])]) {
    const paragraph = document.createElement("p");
    paragraph.textContent = warning;
    element("warnings").append(paragraph);
  }
  element("warnings").hidden = element("warnings").childElementCount === 0;
  renderCategories(findings);
  const query = element("search").value.trim().toLowerCase();
  const severity = element("severity-filter").value;
  const visible = findings.filter(finding => (state.category === "ALL" || finding.category === state.category) && (severity === "ALL" || finding.severity === severity) && (!query || [finding.message, finding.ruleId, finding.file, finding.evidence].join(" ").toLowerCase().includes(query)));
  element("visible-count").textContent = `${visible.length} result${visible.length === 1 ? "" : "s"}`;
  element("findings-body").replaceChildren();
  element("detail-panel").hidden = true;
  for (const finding of visible) {
    const row = document.createElement("tr");
    const severityCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge ${finding.severity.toLowerCase()}`;
    badge.textContent = finding.severity;
    severityCell.append(badge);
    const messageCell = document.createElement("td");
    const ruleId = document.createElement("span");
    ruleId.className = "rule-id";
    ruleId.textContent = finding.ruleId;
    const message = document.createElement("p");
    message.className = "finding-title";
    message.textContent = finding.message;
    messageCell.append(ruleId, message);
    const locationCell = document.createElement("td");
    const location = document.createElement("div");
    location.className = "finding-location";
    location.textContent = `${finding.file}:${finding.line}`;
    const category = document.createElement("span");
    category.className = "finding-category";
    category.textContent = finding.category;
    locationCell.append(location, category);
    const actionCell = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inspect-button";
    button.textContent = "↗";
    button.title = `Inspect ${finding.ruleId}`;
    button.setAttribute("aria-label", `Inspect ${finding.ruleId} at ${finding.file}:${finding.line}`);
    button.addEventListener("click", () => openDetail(finding, row));
    actionCell.append(button);
    row.append(severityCell, messageCell, locationCell, actionCell);
    element("findings-body").append(row);
  }
  element("empty-state").hidden = visible.length > 0;
  element("findings-container").hidden = visible.length === 0;
  element("empty-title").textContent = state.running ? "Inspection in progress" : findings.length ? "No matching findings" : partial ? "Assessment incomplete" : completed ? "No patterns detected" : inspected ? "No completed results" : "Ready for inspection";
  element("empty-description").textContent = findings.length ? "Current filters returned no results" : partial ? "Review the scan warnings above" : completed ? "Static scan complete. Not a safety guarantee." : "No scan results";
  element("export-button").disabled = !inspected || state.running;
  element("reset-button").disabled = !inspected || state.running;
}

function setRunning(running) {
  state.running = running;
  for (const id of ["scan-button", "paste-tab", "files-tab", "sample-button", "filename", "content", "file-input", "clear-files", "consent"]) element(id).disabled = running;
  element("cancel-button").hidden = !running;
  element("scan-button").querySelector("span").textContent = running ? "Inspecting…" : "Run inspection";
}

async function startInspection() {
  showError();
  if (!element("consent").checked) return showError("Confirm cloud upload consent before scanning.");
  if (state.mode === "paste" && !element("content").value.trim()) return showError("Add skill content before scanning.");
  if (state.mode === "files" && state.files.length === 0) return showError("Select at least one file.");
  state.results = [];
  state.errors = [];
  state.cancelled = false;
  state.category = "ALL";
  const targets = state.mode === "paste" ? [{ name: element("filename").value.trim() || "SKILL.md", text: async () => element("content").value }] : state.files;
  state.attempted = targets.length;
  setRunning(true);
  render();
  const start = performance.now();
  try {
    for (const file of targets) {
      if (state.cancelled) break;
      state.controller = new AbortController();
      const timeout = setTimeout(() => state.controller.abort(), 25000);
      try {
        state.results.push(await inspectContent(await file.text(), file.name, state.controller.signal));
      } catch (error) {
        if (state.cancelled) break;
        const message = error.name === "AbortError" ? "Request timed out." : error instanceof TypeError ? "Cloud API unavailable. Check your connection or try again later." : error.message;
        state.errors.push(`${file.name}: ${message}`);
      } finally {
        clearTimeout(timeout);
      }
      render();
    }
  } finally {
    state.controller = null;
    setRunning(false);
    element("scan-time").textContent = `${((performance.now() - start) / 1000).toFixed(1)}s · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    render();
  }
}

element("scan-button").addEventListener("click", startInspection);
element("cancel-button").addEventListener("click", () => { state.cancelled = true; state.controller?.abort(); });
for (const mode of ["paste", "files"]) {
  element(`${mode}-tab`).addEventListener("click", () => setMode(mode));
  element(`${mode}-tab`).addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? "paste" : event.key === "End" ? "files" : mode === "paste" ? "files" : "paste";
      setMode(next);
      element(`${next}-tab`).focus();
    }
  });
}
element("content").addEventListener("input", () => { updateByteCount(); setMode("paste"); });
element("filename").addEventListener("input", () => setMode("paste"));
element("sample-button").addEventListener("click", () => {
  element("content").value = "---\nname: release-notes\ndescription: Summarize project changes\n---\n\n# Release notes\n\nRead the provided changelog.\nSummarize changes by category.\nReturn a concise Markdown report.\n";
  element("filename").value = "SKILL.md";
  element("content").dispatchEvent(new Event("input"));
});
element("file-input").addEventListener("change", event => showFiles([...event.target.files]));
element("clear-files").addEventListener("click", () => { showFiles([]); element("file-input").value = ""; });
for (const eventName of ["dragover", "dragleave", "drop"]) element("drop-zone").addEventListener(eventName, event => {
  event.preventDefault();
  if (state.running) return;
  element("drop-zone").classList.toggle("dragging", eventName === "dragover");
  if (eventName === "drop") showFiles([...event.dataTransfer.files]);
});
element("search").addEventListener("input", render);
element("severity-filter").addEventListener("change", render);
element("close-detail").addEventListener("click", () => {
  element("detail-panel").hidden = true;
  const selected = document.querySelector("tr.selected");
  selected?.querySelector("button").focus();
  selected?.classList.remove("selected");
});
element("reset-button").addEventListener("click", () => { state.results = []; state.errors = []; state.attempted = 0; state.cancelled = false; state.category = "ALL"; element("scan-time").textContent = "—"; render(); });
element("export-button").addEventListener("click", () => {
  const data = { generatedAt: new Date().toISOString(), results: state.results, errors: state.errors, cancelled: state.cancelled };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "skillscan-report.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

render();
setMode("paste");
fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(8000), credentials: "omit", referrerPolicy: "no-referrer" })
  .then(response => { if (!response.ok) throw new Error(); element("service-status").lastChild.textContent = " API ONLINE"; })
  .catch(() => { element("service-status").lastChild.textContent = " API UNVERIFIED"; element("service-status").querySelector(".status-dot").classList.add("offline"); });