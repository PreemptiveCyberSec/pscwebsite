import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const pageUrl = new URL("../skillscan.html", import.meta.url);

test("the sixteen-part capstone harness records fifteen bounded fixture tasks and rejects expanded authority", async () => {
  const { taskCatalogue, defaultPlan, validateSeriesPlan, runSeries, initialiseWorkspace, boundedPlan } = await import("../examples/series-harness.mjs");
  assert.equal(taskCatalogue.length, 15);
  for (const plan of [null, { ...defaultPlan, target: "https://example.com" }, { ...defaultPlan, mode: "live" },
    { ...defaultPlan, tasks: [3] }, { ...defaultPlan, tasks: [1, 1] }, { ...defaultPlan, tasks: [16] }]) {
    assert.throws(() => validateSeriesPlan(plan));
  }
  const root = await mkdtemp(join(tmpdir(), "psc-series-"));
  try {
    await initialiseWorkspace(join(root, "workspace"));
    const { createWorkspaceDocuments, skillDefinitions } = createRequire(import.meta.url)("../examples/series-workspace-pack.cjs");
    const docs = createWorkspaceDocuments(taskCatalogue);
    assert.equal(skillDefinitions.length, 15);
    assert.equal(Object.keys(docs).length, 34);
    for (const file of ["ORCHESTRATION.md", "CONTRACTS.md", "DECISION-LOG.md"]) assert.ok(docs[file]);
    assert.match(docs["ORCHESTRATION.md"], /Oh My Pi proposes; Hermes critiques/);
    assert.match(docs["ORCHESTRATION.md"], /OpenClaw receives those two small records/);
    assert.match(docs["CONTRACTS.md"], /approval_issued/);
    assert.match(docs["DECISION-LOG.md"], /unsigned template cannot override/);
    for (const [relativePath, expected] of Object.entries(docs)) {
      assert.equal(await readFile(join(root, "workspace", relativePath), "utf8"), expected);
      for (const match of expected.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        await access(join(root, "workspace", relativePath, "..", match[1]));
      }
      for (const match of expected.matchAll(/```json\n([\s\S]*?)\n```/g)) JSON.parse(match[1]);
    }
    for (const skill of skillDefinitions) {
      const body = docs[`skills/${skill.slug}/SKILL.md`];
      assert.ok(body.startsWith(`---\nname: ${skill.slug}\ndescription: "Use when `));
      for (const heading of ["Example Input", "Procedure", "Expected Review Shape", "Negative Controls", "Stop And Escalate", "Implemented Boundary", "Completion And Cleanup"]) {
        assert.ok(body.includes(`## ${heading}`), `${skill.slug}: missing ${heading}`);
      }
    }
    assert.deepEqual(await boundedPlan(join(root, "workspace", "reviewed-plan.json")), defaultPlan);
    await writeFile(join(root, "oversized.json"), " ".repeat(65537));
    await assert.rejects(boundedPlan(join(root, "oversized.json")), /64 KiB/);
    for (const framework of ["oh-my-pi", "hermes", "openclaw"]) {
      assert.equal(validateSeriesPlan({ ...defaultPlan, framework }).framework, framework);
    }
    const report = await runSeries({ outputDirectory: join(root, "run") });
    assert.equal(report.status, "completed");
    assert.equal(report.recorded_tasks, 15);
    assert.equal(report.requests, 5);
    assert.ok(report.results.every(item => item.live_status === "not_run"));
    for (const result of report.results) {
      const content = await readFile(join(root, "run", result.evidence_id + ".json"));
      const { createHash } = await import("node:crypto");
      assert.equal(createHash("sha256").update(content).digest("hex"), result.sha256);
    }
    await assert.rejects(runSeries({ outputDirectory: join(root, "run") }), { code: "EEXIST" });
    await writeFile(join(root, "STOP"), "stop");
    const cancelled = await runSeries({ outputDirectory: join(root, "cancelled"), stopFile: join(root, "STOP") });
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.recorded_tasks, 0);
    await assert.rejects(runSeries({ outputDirectory: join(root, "budget"), maxRequests: 2 }), /budget exhausted/);
    const failed = JSON.parse(await readFile(join(root, "budget", "report.json"), "utf8"));
    assert.equal(failed.status, "failed");
    assert.equal(failed.recorded_tasks, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hackbot lab validates plans and verifies vulnerable and fixed fixtures within its budget", async () => {
  const { runLab, validatePlan } = await import("../examples/hackbot-lab.mjs");
  for (const plan of [null, [], { checks: [] }, { checks: ["shell"] },
    { checks: ["health", "health"] }, { checks: ["health"], target: "https://example.com" }]) {
    assert.throws(() => validatePlan(plan));
  }
  const root = await mkdtemp(join(tmpdir(), "psc-hackbot-"));
  try {
    const vulnerable = await runLab({ outputDirectory: join(root, "vulnerable") });
    assert.equal(vulnerable.requests, 5);
    assert.equal(vulnerable.findings.length, 2);
    assert.equal(vulnerable.findings.find(item => item.id === "LAB-AUTHZ-001").status, "verified_lab_only");
    const fixed = await runLab({ outputDirectory: join(root, "fixed"), secure: true });
    assert.equal(fixed.requests, 4);
    assert.equal(fixed.findings.length, 0);
    await assert.rejects(runLab({ outputDirectory: join(root, "bounded"), maxRequests: 2 }), /budget exhausted/);
    const failed = JSON.parse(await readFile(join(root, "bounded", "report.json"), "utf8"));
    assert.equal(failed.status, "failed");
    assert.equal(failed.requests, 2);
    await assert.rejects(runLab({ outputDirectory: join(root, "fixed") }), { code: "EEXIST" });
    await assert.rejects(runLab({ outputDirectory: join(root, "invalid"), maxRequests: 6 }), /budget/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("hackbot planner calls only the local gateway and never executes model output", async () => {
  const { createProposal } = await import("../examples/hackbot-propose.mjs");
  const root = await mkdtemp(join(tmpdir(), "psc-proposal-"));
  const outputFile = join(root, "proposed-plan.json");
  let calls = 0;
  const mock = async (url, options) => {
    calls += 1;
    assert.equal(url, "http://127.0.0.1:11434/v1/chat/completions");
    assert.equal(options.redirect, "error");
    assert.equal(JSON.parse(options.body).model, "fixture-model");
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"checks":["health"]}' } }] }));
  };
  try {
    assert.deepEqual(await createProposal({ model: "fixture-model", outputFile, fetchImpl: mock }), { checks: ["health"] });
    assert.equal(calls, 1);
    assert.deepEqual(JSON.parse(await readFile(outputFile, "utf8")), { checks: ["health"] });
    await assert.rejects(createProposal({ model: "fixture-model", outputFile, fetchImpl: mock }), { code: "EEXIST" });
    await assert.rejects(createProposal({ model: "fixture-model", outputFile: join(root, "rejected.json"),
      fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"checks":["shell"]}' } }] }))
    }), /approved check/);
    await assert.rejects(access(join(root, "rejected.json")), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("RSS preserves co-authors and still reads existing single-author articles", async () => {
  const { readArticlePosts, buildFeed } = createRequire(import.meta.url)("../scripts/generate-feed.js");
  assert.ok(readArticlePosts(fileURLToPath(new URL("../", import.meta.url))).length >= 95);
  const root = await mkdtemp(join(tmpdir(), "psc-authors-"));
  try {
    await mkdir(join(root, "pages", "blog"), { recursive: true });
    const posting = {
      "@type": "BlogPosting", mainEntityOfPage: "https://preemptivecybersec.com/pages/blog/example.html",
      headline: "Example", description: "Fixture", datePublished: "2026-10-28", articleSection: "AI Security",
      author: ["Viral Maniar", "Harsh Maniar", "Mike Chen"].map(name => ({ "@type": "Person", name }))
    };
    await writeFile(join(root, "pages", "blog", "example.html"),
      `<script type="application/ld+json" data-psc-structured-data>${JSON.stringify({ "@graph": [posting] })}</script>`);
    const posts = readArticlePosts(root);
    assert.equal(posts[0].author, "Viral Maniar, Harsh Maniar, Mike Chen");
    assert.match(buildFeed(posts), /<dc:creator>Viral Maniar, Harsh Maniar, Mike Chen<\/dc:creator>/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("every AI testing part has a detailed walkthrough, three worked cases, and executable offline controls", () => {
  const require = createRequire(import.meta.url);
  const { articles, render } = require("../scripts/generate-ai-pentest-series.js");
  let executed = 0;
  const decode = value => value.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  for (const article of articles.slice(0, 15)) {
    const lab = article.sections.find(entry => entry.id === "guided-lab");
    const examples = article.sections.find(entry => entry.id === "worked-examples");
    const troubleshooting = article.sections.find(entry => entry.id === "lab-troubleshooting");
    assert.ok(lab && examples && troubleshooting, `Missing practical coverage: ${article.slug}`);
    assert.ok((lab.body.match(/<li>/g) || []).length >= 7, `Incomplete lab steps: ${article.slug}`);
    assert.ok(lab.body.includes("Prerequisites:") && lab.body.includes("Expected result:"));
    assert.equal((examples.body.match(/<h3>Example [ABC]:/g) || []).length, 3, article.slug);
    assert.ok(troubleshooting.body.includes("Retest and completion:"));
    assert.equal(article.modified, "2026-10-29");
    const rendered = render(articles.indexOf(article));
    const graph = JSON.parse(rendered.match(/<script type="application\/ld\+json" data-psc-structured-data>([\s\S]*?)<\/script>/)[1]);
    const posting = graph["@graph"].find(node => node["@type"] === "BlogPosting");
    assert.equal(posting.datePublished, "2026-10-28");
    assert.equal(posting.dateModified, "2026-10-29");
    assert.ok(rendered.includes('Updated <time datetime="2026-10-29">2026-10-29</time>'));
    assert.equal(new Set(article.sections.map(entry => entry.id)).size, article.sections.length);
    for (const entry of [lab, examples]) {
      for (const match of entry.body.matchAll(/<code class="language-javascript">([\s\S]*?)<\/code>/g)) {
        require("node:vm").runInNewContext(decode(match[1]), { URLSearchParams, console: { log() {} } }, { timeout: 1000 });
        executed += 1;
      }
    }
  }
  assert.ok(executed >= 14, `Expected at least 14 executable offline controls, got ${executed}`);
});

test("Part 1 includes real subdomain tool commands, explicit scope gates, and verified offline reducers", () => {
  const require = createRequire(import.meta.url);
  const { articles } = require("../scripts/generate-ai-pentest-series.js");
  const article = articles[0];
  const ids = ["subdomain-enumeration", "passive-subdomains", "subdomain-scope-filter", "subdomain-dns-validation", "subdomain-web-validation"];
  const sections = ids.map(id => {
    const entry = article.sections.find(item => item.id === id);
    assert.ok(entry, `Missing subdomain workflow: ${id}`);
    return entry;
  });
  const body = sections.map(entry => entry.body).join(" ");
  for (const term of ["subfinder -d $Domain", "dnsx -l", "httpx -l", "DNS-APPROVED", "crt.sh", "wildcard", "Illustrative results, not a live scan", "documentation examples, not current assessment results"]) {
    assert.ok(body.includes(term), `Missing enumeration detail: ${term}`);
  }
  let executed = 0;
  for (const entry of sections) {
    for (const match of entry.body.matchAll(/<code class="language-javascript">([\s\S]*?)<\/code>/g)) {
      const source = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      require("node:vm").runInNewContext(source, { console: { log() {} } }, { timeout: 1000 });
      executed += 1;
    }
  }
  assert.equal(executed, 2);
  article.sections.forEach((entry, index) => assert.ok(entry.title.startsWith(`${index + 1}. `)));
});

test("Parts 2 to 15 contain topic-specific real-tool workflows without changing Part 1", () => {
  const { articles } = createRequire(import.meta.url)("../scripts/generate-ai-pentest-series.js");
  const expectedTools = [
    ["Thunderbird", "Resolve-DnsName"], ["curl.exe", "Repeater"], ["node --check", "DevTools"],
    ["urllib.parse", "--data-raw"], ["syft", "grype"], ["nuclei -validate", "Nessus"],
    ["Burp", "Use AI"], ["Pester", "Get-FileHash"], ["MCP Inspector", "hackbot-lab.mjs"],
    ["analyzeHeadless", "IDAPython"], ["lldb --version", "frame variable"],
    ["rabin2", "binaryninja"], ["rejected-plan.json", "Node.js"], ["aws sts get-caller-identity", "Get-Acl"]
  ];
  assert.equal(articles[0].sections.filter(entry => entry.id === "tool-workflow").length, 0);
  for (let index = 1; index < 15; index += 1) {
    const workflows = articles[index].sections.filter(entry => entry.id === "tool-workflow");
    assert.equal(workflows.length, 1, `Missing/duplicate tools workflow: Part ${index + 1}`);
    const workflow = workflows[0];
    assert.ok((workflow.body.match(/<li>/g) || []).length >= 6);
    assert.ok((workflow.body.match(/<pre>/g) || []).length >= 1);
    for (const required of ["Prerequisites:", "Step-by-Step Tool Operation", "Expected Evidence and Interpretation", "Troubleshooting and Cleanup", ...expectedTools[index - 1]]) {
      assert.ok(workflow.body.includes(required), `Part ${index + 1} missing ${required}`);
    }
    articles[index].sections.forEach((entry, sectionIndex) => assert.ok(entry.title.startsWith(`${sectionIndex + 1}. `)));
  }
});

test("the sixteen-part AI testing series has complete navigation, co-authors, evidence labs, and publication entries", async () => {
  const { articles, filename, render } = createRequire(import.meta.url)("../scripts/generate-ai-pentest-series.js");
  const root = new URL("../", import.meta.url);
  const resources = await readFile(new URL("pages/resources.html", root), "utf8");
  const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
  const llms = await readFile(new URL("llms.txt", root), "utf8");
  const expectedNames = ["Viral Maniar", "Harsh Maniar", "Mike Chen"];
  assert.equal(articles.length, 16);
  for (let index = 0; index < articles.length; index += 1) {
    const relativePath = `pages/blog/${filename(index)}`;
    const url = new URL(relativePath, root);
    const html = await readFile(url, "utf8");
    assert.equal(html, render(index), `Generated article is stale: ${relativePath}`);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json" data-psc-structured-data>([\s\S]*?)<\/script>/)[1]);
    const posting = graph["@graph"].find(node => node["@type"] === "BlogPosting");
    assert.deepEqual(posting.author.map(author => author.name), expectedNames);
    assert.equal(posting.position, index + 1);
    assert.ok(articles[index].sections.length >= 6);
    const body = articles[index].sections.map(entry => entry.body).join(" ");
    assert.ok(body.replace(/<[^>]*>/g, " ").split(/\s+/).length >= 600, `Insufficient technical content: ${relativePath}`);
    assert.match(body, /<pre><code class="language-/);
    assert.match(html, /<svg[^>]*role="img"[^>]*aria-label=/);
    assert.match(html, /aria-label="In this article"/);
    const seriesIndex = html.match(/<nav class="series-index"[\s\S]*?<\/nav>/)[0];
    for (let part = 0; part < articles.length; part += 1) {
      assert.ok(seriesIndex.includes(`href="${filename(part)}"`), `Missing series part ${part + 1}`);
    }
    if (index > 0) assert.ok(html.includes(`href="${filename(index - 1)}" rel="prev"`));
    if (index < articles.length - 1) assert.ok(html.includes(`href="${filename(index + 1)}" rel="next"`));
    const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);
    for (const reference of new Set(references)) {
      if (/^(?:https?:|mailto:|tel:)/.test(reference)) continue;
      const target = new URL(reference, url);
      await access(new URL(target.pathname, target));
      if (target.hash) {
        const destination = await readFile(new URL(target.pathname, target), "utf8");
        assert.ok(destination.includes(`id="${target.hash.slice(1)}"`), `Missing anchor: ${reference}`);
      }
    }
    assert.equal(sitemap.split(`<loc>https://preemptivecybersec.com/${relativePath}</loc>`).length - 1, 1);
    const sitemapEntry = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)]
      .find(match => match[0].includes(`<loc>https://preemptivecybersec.com/${relativePath}</loc>`))?.[0];
    assert.ok(sitemapEntry?.includes("<lastmod>2026-10-29</lastmod>"), `Stale sitemap revision: ${relativePath}`);
    assert.equal(resources.split(`href="blog/${filename(index)}"`).length - 1, 1);
    assert.ok(llms.includes(`https://preemptivecybersec.com/${relativePath}`));
  }
  for (const slug of ["viral-maniar", "harsh-maniar", "mike-chen"]) {
    const profile = await readFile(new URL(`pages/authors/${slug}.html`, root), "utf8");
    for (let index = 0; index < articles.length; index += 1) {
      assert.equal(profile.split(`href="../blog/${filename(index)}"`).length - 1, 1);
    }
    assert.ok(llms.includes(`/pages/authors/${slug}.html`));
  }
  assert.ok(render(3).includes("Get-FileHash .\\app.bundle.js"));
  assert.ok(render(10).includes('printf(&quot;%d\\n&quot;'));
});

test("Part 16 contains every complete Markdown example and keeps native skill loading explicit", () => {
  const require = createRequire(import.meta.url);
  const { articles, render } = require("../scripts/generate-ai-pentest-series.js");
  const { createWorkspaceDocuments } = require("../examples/series-workspace-pack.cjs");
  const docs = createWorkspaceDocuments();
  const article = articles[15];
  const html = render(15);
  assert.equal(article.sections.length, 29);
  assert.equal((html.match(/<details class="workspace-document">/g) || []).length, 37);
  const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  for (const [relativePath, body] of Object.entries(docs)) {
    assert.ok(html.includes(`<summary>${relativePath}</summary>`), `Missing inline file: ${relativePath}`);
    assert.ok(html.includes(escape(body.trim())), `Stale inline Markdown: ${relativePath}`);
  }
  for (const id of ["markdown-workspace", "shared-markdown", "complete-skills", "role-markdown", "case-study", "multi-agent-markdown", "runbook-markdown", "fixture-report-markdown"]) {
    assert.ok(article.sections.some(entry => entry.id === id));
  }
  for (const reference of ["series-workspace-pack.cjs", "series-workspace-pack.zip", "--no-skills", "does not parse", "not a signature", "omp-proposal.json", "hermes-review.json", "coordination-note.md", "majority agreement"]) {
    assert.ok(html.includes(reference), `Missing document-pack boundary: ${reference}`);
  }
  article.sections.forEach((entry, index) => assert.ok(entry.title.startsWith(`${index + 1}. `)));
});

test("Part 16 maps all fifteen tasks and embeds the exact harness with agent architecture diagrams", async () => {
  const { articles, filename, render } = createRequire(import.meta.url)("../scripts/generate-ai-pentest-series.js");
  const capstone = articles[15];
  assert.equal(capstone.published, "2026-10-29");
  assert.ok(capstone.sections.length >= 20);
  const html = await readFile(new URL(`../pages/blog/${filename(15)}`, import.meta.url), "utf8");
  assert.equal(html, render(15));
  for (const term of ["Oh My Pi", "Hermes Agent", "OpenClaw", "DAG", "not_run", "fixture_recorded", "--check-plan", "--stop-file", "required_live_gate", "hermes-review.json", "coordination-note.md", "proposal_sha256"]) {
    assert.ok(html.includes(term), `Missing capstone concept: ${term}`);
  }
  const caseStudy = capstone.sections.find(entry => entry.id === "case-study");
  assert.match(caseStudy.body, /<svg[^>]*role="img"[^>]*aria-label=/);
  for (const stage of ["Synthetic case", "Oh My Pi planner", "Plan gate", "Hermes reviewer", "OpenClaw coordinator", "Human operator", "Fixture harness", "Evidence ledger"]) {
    assert.ok(caseStudy.body.includes(stage), `Missing case diagram stage: ${stage}`);
  }
  for (let index = 0; index < 15; index += 1) assert.ok(html.includes(`href="${filename(index)}"`));
  assert.ok((html.match(/<svg[^>]*role="img"/g) || []).length >= 5);
  const source = await readFile(new URL("../examples/series-harness.mjs", import.meta.url), "utf8");
  const escaped = source.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  assert.ok(html.includes(escaped));
  assert.ok(html.includes('href="../../examples/series-harness.mjs" download'));
});

test("the hackbot build guide publishes complete source, diagrams, links, authors, and no source-video reference", async () => {
  const require = createRequire(import.meta.url);
  const { article, relativePath } = require("../scripts/generate-hackbot-guide.js");
  const { renderStandalone } = require("../scripts/generate-ai-pentest-series.js");
  const root = new URL("../", import.meta.url);
  const url = new URL(relativePath, root);
  const html = await readFile(url, "utf8");
  assert.equal(html, renderStandalone(article, relativePath));
  assert.equal(article.sections.length, 25);
  assert.ok((html.match(/<svg[^>]*role="img"/g) || []).length >= 9);
  for (const id of ["collection-pipeline", "asset-events", "surface-mapping", "triage-contracts",
    "operator-workspace", "caido-handoff", "evidence-recovery", "calibration-roadmap"]) {
    assert.ok(article.sections.some(entry => entry.id === id), `Missing research workflow section: ${id}`);
  }
  for (const term of ["Code gathers; the agent judges", "Subfinder", "dnsx", "httpx", "ffuf",
    "Certificate Transparency", "six-hour", "catch-all", "CNAME", "Caido Replay", "SESSION.md",
    "unsent", "restore", "source map", "OpenAPI"]) {
    assert.ok(html.includes(term), `Missing transcript-grounded workflow topic: ${term}`);
  }
  article.sections.forEach((entry, index) => assert.ok(entry.title.startsWith(`${index + 1}. `)));
  assert.match(article.sections[0].body, /Two tracks, two different promises/);
  const mapping = article.sections.find(entry => entry.id === "surface-mapping");
  const encoded = mapping.body.match(/<code class="language-javascript">([\s\S]*?)<\/code>/)[1];
  const source = encoded.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  let draftOutput;
  require("node:vm").runInNewContext(source, { console: { log: value => { draftOutput = value; } } }, { timeout: 1000 });
  const drafts = JSON.parse(draftOutput);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].method, "GET");
  assert.equal(drafts[0].route, "/api/invoices/{invoice_id}");
  assert.equal(drafts[0].send, false);
  assert.doesNotMatch(html, /youtube|youtu\.be|NahamSec|z5wQNqQ-e6M/i);
  const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  for (const sourcePath of ["examples/hackbot-lab.mjs", "examples/hackbot-propose.mjs"]) {
    const source = await readFile(new URL(sourcePath, root), "utf8");
    assert.ok(html.includes(escape(source.trim())), `Stale embedded source: ${sourcePath}`);
  }
  assert.ok(html.includes("run-${INVOCATION_ID}"));
  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  for (const reference of new Set(references)) {
    if (/^(?:https?:|mailto:|tel:)/.test(reference)) continue;
    const target = new URL(reference, url);
    const targetFile = new URL(target.pathname, target);
    await access(targetFile);
    if (target.hash) assert.ok((await readFile(targetFile, "utf8")).includes(`id="${target.hash.slice(1)}"`));
  }
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json" data-psc-structured-data>([\s\S]*?)<\/script>/)[1]);
  const posting = graph["@graph"].find(node => node["@type"] === "BlogPosting");
  assert.deepEqual(posting.author.map(author => author.name), ["Viral Maniar", "Harsh Maniar", "Mike Chen"]);
  assert.equal(posting.position, undefined);
  const sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
  assert.equal(sitemap.split(`<loc>https://preemptivecybersec.com/${relativePath}</loc>`).length - 1, 1);
  const resources = await readFile(new URL("pages/resources.html", root), "utf8");
  assert.equal(resources.split('href="blog/build-a-hackbot-ai-bug-bounty.html"').length - 1, 1);
  assert.ok((await readFile(new URL("llms.txt", root), "utf8")).includes(`https://preemptivecybersec.com/${relativePath}`));
  for (const slug of ["viral-maniar", "harsh-maniar", "mike-chen"]) {
    const profile = await readFile(new URL(`pages/authors/${slug}.html`, root), "utf8");
    assert.equal(profile.split('href="../blog/build-a-hackbot-ai-bug-bounty.html"').length - 1, 1);
  }
});

test("the combined upload manifest contains every required public file exactly once", async () => {
  const { filename, articles } = createRequire(import.meta.url)("../scripts/generate-ai-pentest-series.js");
  const root = new URL("../", import.meta.url);
  const manifest = await readFile(new URL("UPLOAD-MANIFEST.md", root), "utf8");
  const publicSection = manifest.split("## Required Website Files")[1].split("## Repository-Only Files")[0];
  const listed = [...publicSection.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/gm)].map(match => {
    assert.equal(match[1], match[2]);
    return match[1];
  });
  const expected = [
    ...articles.map((article, index) => `pages/blog/${filename(index)}`),
    "pages/blog/build-a-hackbot-ai-bug-bounty.html", "pages/authors/viral-maniar.html",
    "pages/authors/harsh-maniar.html", "pages/authors/mike-chen.html", "pages/resources.html",
    "assets/css/blog.css", "examples/hackbot-lab.mjs", "examples/hackbot-propose.mjs", "examples/series-harness.mjs",
    "examples/series-workspace-pack.cjs", "examples/series-workspace-pack.zip",
    "feed.xml", "sitemap.xml", "llms.txt"
  ];
  assert.equal(listed.length, 30);
  assert.equal(new Set(listed).size, listed.length);
  assert.deepEqual([...listed].sort(), expected.sort());
  for (const relativePath of listed) await access(new URL(relativePath, root));
});

test("integrated SkillScan page resolves every local link and asset from the website root", async () => {
  const html = await readFile(pageUrl, "utf8");
  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  for (const reference of new Set(references)) {
    if (reference.startsWith("#") || /^https?:/.test(reference)) continue;
    await access(new URL(reference, pageUrl));
  }
  assert.match(html, /src="SkillScan\/app\.js"/);
  assert.match(html, /href="assets\/css\/style\.css"/);
  assert.match(html, /href="https:\/\/preemptivecybersec\.com\/skillscan\.html"/);
  await assert.rejects(access(new URL("./index.html", import.meta.url)), { code: "ENOENT" });
});

test("SkillScan is reachable from Resources tools and existing root navigation", async () => {
  const resources = await readFile(new URL("../pages/resources.html", import.meta.url), "utf8");
  const tools = resources.split('<div id="tools" class="tab-content">')[1]?.split('<div id="talks"')[0];
  assert.ok(tools, "Resources must have a Tools section");
  assert.match(tools, /href="\.\.\/skillscan\.html"/);
  for (const filename of ["index.html", "easm.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.match(html, /href="skillscan\.html">SkillScan<\/a>/);
  }
});

test("SkillScan is included in the public sitemap", async () => {
  const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
  assert.match(sitemap, /<loc>https:\/\/preemptivecybersec\.com\/skillscan\.html<\/loc>/);
});

test("homepage service cards link across the full card to their matching categories", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../assets/css/style.css", import.meta.url), "utf8");
  const cards = [...html.matchAll(/<div class="card service-card">/g)];
  const links = [...html.matchAll(/<a href="pages\/services\.html#(offensive|defensive|ai|training)" class="card-link" aria-label="Explore ([^"]+)">/g)];

  assert.equal(cards.length, 4);
  assert.deepEqual(links.map(([, category]) => category), ["offensive", "defensive", "ai", "training"]);
  assert.match(css, /\.service-card \.card-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(css, /\.service-card:has\(\.card-link:focus-visible\)/);
});

test("every Resources Tools card is clickable across its full surface", async () => {
  const resources = await readFile(new URL("../pages/resources.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../assets/css/style.css", import.meta.url), "utf8");
  const tools = resources.split('<div id="tools" class="tab-content">')[1]?.split('<div id="talks"')[0];
  assert.ok(tools, "Resources must have a Tools section");
  const cards = [...tools.matchAll(/<div class="card">([\s\S]*?)<\/div>/g)].map(([, body]) => body);
  assert.ok(cards.length > 0);
  for (const card of cards) assert.equal((card.match(/class="card-link"/g) || []).length, 1);
  const breachCard = cards.find(card => card.includes("<h3>Breach Intelligence</h3>"));
  assert.ok(breachCard);
  assert.match(breachCard, /href="\.\.\/CI\.html" class="card-link"/);
  const easmCard = cards.find(card => card.includes("<h3>EASM</h3>"));
  assert.ok(easmCard);
  assert.match(easmCard, /href="\.\.\/easm\.html" class="card-link"/);
  assert.match(css, /#tools \.card > \.card-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(css, /#tools \.card:has\(> \.card-link:focus-visible\)/);
});

test("every website header matches index.html with correctly resolved links and working Resources tools", async () => {
  const root = new URL("../", import.meta.url);
  const navbarPattern = /<nav\b[^>]*class="[^"]*\bnavbar\b[^"]*"[^>]*>[\s\S]*?<\/nav>/g;
  const homepage = await readFile(new URL("index.html", root), "utf8");
  function normalizeNavbar(navbar, base) {
    return navbar.replace(/\bhref="([^"]+)"/g, (_, href) => `href="${new URL(href, base).href}"`)
      .replace(/>\s+</g, "><").trim();
  }
  const canonical = normalizeNavbar(homepage.match(navbarPattern)[0], "https://preemptivecybersec.com/");
  async function htmlFiles(directory, recursive) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(entry => {
      if (entry.isDirectory()) return recursive ? htmlFiles(new URL(`${entry.name}/`, directory), true) : [];
      return entry.name.endsWith(".html") ? [new URL(entry.name, directory)] : [];
    }));
    return files.flat();
  }
  const files = [
    ...await htmlFiles(root, false),
    ...await htmlFiles(new URL("pages/", root), true)
  ];
  assert.ok(files.length > 0);
  for (const file of files) {
    const relativePath = file.href.slice(root.href.length);
    const html = await readFile(file, "utf8");
    const navbars = html.match(navbarPattern) ?? [];
    assert.equal(navbars.length, 1, `Expected exactly one header: ${relativePath}`);
    const navbar = navbars[0];
    const base = new URL(relativePath, "https://preemptivecybersec.com/");
    assert.equal(normalizeNavbar(navbar, base), canonical, `Header differs from index.html: ${relativePath}`);
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)];
    assert.ok(scripts.some(script => new URL(script[1], base).pathname === "/assets/js/main.js"),
      `Missing shared header interactions: ${relativePath}`);
    const dropdown = navbar.match(/<ul class="nav-dropdown-menu">([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(dropdown, `Missing Resources dropdown: ${relativePath}`);
    const links = [...dropdown.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];
    const topLevel = navbar.match(/<ul class="nav-menu"[^>]*>([\s\S]*?)<li class="nav-dropdown">/)?.[1] ?? "";
    assert.doesNotMatch(topLevel, /Breach Intelligence/, `Breach Intelligence must stay under Resources: ${relativePath}`);
    for (const [label, target] of [["EASM", "easm.html"], ["SkillScan", "skillscan.html"], ["Breach Intelligence", "CI.html"]]) {
      const matches = links.filter(link => link[2] === label);
      assert.equal(matches.length, 1, `Expected one ${label} link: ${relativePath}`);
      assert.equal(new URL(matches[0][1], base).href, `https://preemptivecybersec.com/${target}`,
        `Incorrect ${label} target: ${relativePath}`);
    }
  }
});
