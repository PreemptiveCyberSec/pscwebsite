import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";

const pageUrl = new URL("../skillscan.html", import.meta.url);

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
    for (const [label, target] of [["EASM", "easm.html"], ["SkillScan", "skillscan.html"]]) {
      const matches = links.filter(link => link[2] === label);
      assert.equal(matches.length, 1, `Expected one ${label} link: ${relativePath}`);
      assert.equal(new URL(matches[0][1], base).href, `https://preemptivecybersec.com/${target}`,
        `Incorrect ${label} target: ${relativePath}`);
    }
  }
});
