const fs = require("fs");
const path = require("path");
const { feedSize, readArticlePosts, rssDate } = require("./generate-feed");

const root = path.resolve(__dirname, "..");
const origin = "https://preemptivecybersec.com";
const imageUrl = `${origin}/assets/images/social/preemptive-cyber-security.png`;
const failures = [];

function expectedImageUrl(relativePath) {
    const match = relativePath.match(/^pages\/services\/([a-z0-9-]+)\.html$/);
    return match
        ? `${origin}/assets/images/social/services/${match[1]}.png`
        : imageUrl;
}

function htmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return htmlFiles(absolutePath);
        if (!entry.name.endsWith(".html")) return [];
        return [path.relative(root, absolutePath).replace(/\\/g, "/")];
    });
}

const pagePaths = ["index.html", ...htmlFiles(path.join(root, "pages"))].sort();

function attributes(tag) {
    return Object.fromEntries(
        [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)]
            .map((match) => [match[1].toLowerCase(), match[3]])
    );
}

function tags(html, name) {
    return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))]
        .map((match) => attributes(match[0]));
}

function matchingMeta(html, key) {
    return tags(html, "meta").filter((tag) =>
        (tag.name || tag.property || "").toLowerCase() === key.toLowerCase()
    );
}

function decodeHtml(value) {
    return value
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

function feedHref(relativePath) {
    return `${"../".repeat(relativePath.split("/").length - 1)}feed.xml`;
}

function requireOne(relativePath, html, key, expected) {
    const matches = matchingMeta(html, key);
    if (matches.length !== 1) {
        failures.push(`${relativePath}: ${key} count is ${matches.length}`);
    } else if (!matches[0].content) {
        failures.push(`${relativePath}: ${key} is empty`);
    } else if (expected !== undefined && decodeHtml(matches[0].content) !== decodeHtml(expected)) {
        failures.push(`${relativePath}: ${key} does not match expected value`);
    }
    return matches[0]?.content;
}

const titles = new Map();
const descriptions = new Map();

for (const relativePath of pagePaths) {
    const html = fs.readFileSync(path.join(root, relativePath), "utf8");
    const expectedCanonical = relativePath === "index.html"
        ? `${origin}/`
        : `${origin}/${relativePath}`;
    const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
    const canonicalLinks = tags(html, "link").filter((tag) => tag.rel === "canonical");
    const feedLinks = tags(html, "link").filter((tag) => tag.type === "application/rss+xml");
    const isArticle = relativePath.startsWith("pages/blog/");
    const expectedImage = expectedImageUrl(relativePath);

    if (titleMatches.length !== 1) failures.push(`${relativePath}: title count is ${titleMatches.length}`);
    if (canonicalLinks.length !== 1 || canonicalLinks[0]?.href !== expectedCanonical) {
        failures.push(`${relativePath}: canonical is missing, duplicated, or incorrect`);
    }
    if (feedLinks.length !== 1
        || feedLinks[0]?.rel !== "alternate"
        || feedLinks[0]?.title !== "PSC Security Research"
        || feedLinks[0]?.href !== `${origin}/feed.xml`) {
        failures.push(`${relativePath}: RSS discovery link is missing, duplicated, or incorrect`);
    }

    const footer = html.match(/<footer\b[\s\S]*?<\/footer\s*>/i)?.[0] || "";
    if (footer) {
        const footerMarkers = (footer.match(/\bdata-psc-footer-rss\b/gi) || []).length;
        const footerFeedLinks = tags(footer, "a").filter((tag) => tag.href === feedHref(relativePath));
        if (footerMarkers !== 1 || footerFeedLinks.length !== 1) {
            failures.push(`${relativePath}: footer RSS link is missing or duplicated`);
        }
    }

    const title = titleMatches[0]?.[1];
    const description = requireOne(relativePath, html, "description");
    requireOne(relativePath, html, "robots", "index,follow,max-image-preview:large");
    const expectedType = isArticle ? "article" : relativePath.startsWith("pages/authors/") ? "profile" : "website";
    requireOne(relativePath, html, "og:type", expectedType);
    requireOne(relativePath, html, "og:title", title);
    requireOne(relativePath, html, "og:description", description);
    requireOne(relativePath, html, "og:url", expectedCanonical);
    requireOne(relativePath, html, "og:site_name", "Preemptive Cyber Security");
    requireOne(relativePath, html, "og:image", expectedImage);
    requireOne(relativePath, html, "og:image:width", "1200");
    requireOne(relativePath, html, "og:image:height", "630");
    requireOne(relativePath, html, "og:image:alt");
    requireOne(relativePath, html, "twitter:card", "summary_large_image");
    requireOne(relativePath, html, "twitter:title", title);
    requireOne(relativePath, html, "twitter:description", description);
    requireOne(relativePath, html, "twitter:image", expectedImage);
    requireOne(relativePath, html, "twitter:image:alt");

    if (isArticle) {
        requireOne(relativePath, html, "article:published_time");
        requireOne(relativePath, html, "article:modified_time");
        requireOne(relativePath, html, "article:author");
        requireOne(relativePath, html, "article:section");
    }

    if (title) {
        if (titles.has(title)) failures.push(`${relativePath}: duplicate title also used by ${titles.get(title)}`);
        titles.set(title, relativePath);
    }
    if (description) {
        if (descriptions.has(description)) failures.push(`${relativePath}: duplicate description also used by ${descriptions.get(description)}`);
        descriptions.set(description, relativePath);
    }
}

const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
const llmsLinks = tags(homepage, "a").filter((tag) => tag.href === "llms.txt");
if (llmsLinks.length !== 1) failures.push(`index.html: llms.txt link count is ${llmsLinks.length}`);

const resources = fs.readFileSync(path.join(root, "pages", "resources.html"), "utf8");
const resourceFeedLinks = tags(resources, "a").filter((tag) => tag.href === "../feed.xml");
if (resourceFeedLinks.length !== 2 || !resources.includes("data-psc-resource-rss")) {
    failures.push("pages/resources.html: expected visible body and footer RSS links");
}

const image = fs.readFileSync(path.join(root, "assets", "images", "social", "preemptive-cyber-security.png"));
const pngSignature = "89504e470d0a1a0a";
if (image.subarray(0, 8).toString("hex") !== pngSignature) failures.push("Social image is not a PNG");
if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630) {
    failures.push("Social image is not 1200x630");
}

const servicePages = pagePaths.filter((relativePath) => relativePath.startsWith("pages/services/"));
for (const relativePath of servicePages) {
    const slug = path.basename(relativePath, ".html");
    const imagePath = path.join(root, "assets", "images", "social", "services", `${slug}.png`);
    if (!fs.existsSync(imagePath)) {
        failures.push(`${relativePath}: service social image is missing`);
        continue;
    }
    const serviceImage = fs.readFileSync(imagePath);
    if (serviceImage.subarray(0, 8).toString("hex") !== pngSignature) failures.push(`${relativePath}: social image is not a PNG`);
    if (serviceImage.readUInt32BE(16) !== 1200 || serviceImage.readUInt32BE(20) !== 630) failures.push(`${relativePath}: social image is not 1200x630`);
}

const feed = fs.readFileSync(path.join(root, "feed.xml"), "utf8");
const feedItems = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)];
const requiredRoot = '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">';
if (!feed.includes(requiredRoot)) failures.push("feed.xml: RSS, Atom, or Dublin Core namespace declaration is incorrect");
if (!feed.includes(`<atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />`)) {
    failures.push("feed.xml: Atom self-discovery link is missing or incorrect");
}
if (!feed.includes("<title>PSC Security Research</title>")) failures.push("feed.xml: channel title is incorrect");
if (!feed.includes(`<link>${origin}/pages/resources.html</link>`)) failures.push("feed.xml: channel link is incorrect");
if (feedItems.length !== feedSize) failures.push(`feed.xml: expected ${feedSize} items, found ${feedItems.length}`);

function itemValue(item, element) {
    const value = item.match(new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)<\\/${element}>`, "i"))?.[1] || "";
    return decodeHtml(value);
}

const expectedFeedPosts = readArticlePosts(root)
    .sort((left, right) => right.date.localeCompare(left.date) || left.url.localeCompare(right.url))
    .slice(0, feedSize);
const feedGuids = new Set();

for (let index = 0; index < feedItems.length; index += 1) {
    const item = feedItems[index][0];
    const expected = expectedFeedPosts[index];
    if (!expected) break;

    const title = itemValue(item, "title");
    const link = itemValue(item, "link");
    const guid = itemValue(item, "guid");
    const date = itemValue(item, "pubDate");
    const creator = itemValue(item, "dc:creator");
    const category = itemValue(item, "category");
    const description = itemValue(item, "description");

    if (title !== expected.title) failures.push(`feed.xml: item ${index + 1} title mismatch`);
    if (link !== expected.url || guid !== expected.url) failures.push(`feed.xml: item ${index + 1} link/GUID is not canonical`);
    if (!/<guid\s+isPermaLink="true">/i.test(item)) failures.push(`feed.xml: item ${index + 1} GUID is not permanent`);
    if (date !== rssDate(expected.date)) failures.push(`feed.xml: item ${index + 1} publication date mismatch`);
    if (creator !== expected.author) failures.push(`feed.xml: item ${index + 1} creator mismatch`);
    if (category !== expected.category) failures.push(`feed.xml: item ${index + 1} category mismatch`);
    if (description !== expected.description) failures.push(`feed.xml: item ${index + 1} summary mismatch`);
    if (feedGuids.has(guid)) failures.push(`feed.xml: duplicate GUID ${guid}`);
    feedGuids.add(guid);

    const relativePath = link.replace(`${origin}/`, "");
    const articlePath = path.join(root, relativePath);
    if (!link.startsWith(`${origin}/pages/blog/`) || !fs.existsSync(articlePath)) {
        failures.push(`feed.xml: item ${index + 1} does not map to a local article`);
    } else {
        const article = fs.readFileSync(articlePath, "utf8");
        const canonical = tags(article, "link").find((tag) => tag.rel === "canonical")?.href;
        if (canonical !== link) failures.push(`feed.xml: item ${index + 1} target canonical mismatch`);
    }
}

const notFound = fs.readFileSync(path.join(root, "404.html"), "utf8");
if (!matchingMeta(notFound, "robots").some((tag) => tag.content.toLowerCase().includes("noindex"))) {
    failures.push("404.html: missing noindex robots directive");
}
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
if (sitemap.includes("404.html")) failures.push("sitemap.xml: includes 404.html");

if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log(`PASS: ${pagePaths.length} pages, 89 articles, ${feedSize} complete RSS items, and ${servicePages.length + 1} valid social images.`);