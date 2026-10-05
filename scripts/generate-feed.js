const fs = require("fs");
const path = require("path");

const origin = "https://preemptivecybersec.com";
const feedSize = 50;
const organizationId = `${origin}/#organization`;
const organizationAuthor = "Preemptive Cyber Security Research";

function attribute(tag, name) {
    return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2] || "";
}

function managedGraph(source, relativePath) {
    const scripts = [...source.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)]
        .filter((match) => /\bdata-psc-structured-data\b/i.test(match[0]));

    if (scripts.length !== 1) {
        throw new Error(`${relativePath}: expected one managed JSON-LD block, found ${scripts.length}`);
    }

    const openingTag = scripts[0][0].match(/^<script\b[^>]*>/i)?.[0] || "";
    if (attribute(openingTag, "type").toLowerCase() !== "application/ld+json") {
        throw new Error(`${relativePath}: managed structured data is not JSON-LD`);
    }

    const json = scripts[0][0]
        .replace(/^<script\b[^>]*>/i, "")
        .replace(/<\/script\s*>$/i, "");
    const data = JSON.parse(json);
    return Array.isArray(data["@graph"]) ? data["@graph"] : [data];
}

function requireText(post, property, relativePath) {
    const value = post[property];
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${relativePath}: BlogPosting.${property} is required for RSS`);
    }
    return value.trim();
}

function readArticlePosts(root) {
    const blogDirectory = path.join(root, "pages", "blog");
    const files = fs.readdirSync(blogDirectory)
        .filter((file) => file.endsWith(".html"))
        .sort();
    const urls = new Set();

    return files.map((file) => {
        const relativePath = `pages/blog/${file}`;
        const source = fs.readFileSync(path.join(root, relativePath), "utf8");
        const posts = managedGraph(source, relativePath)
            .filter((node) => node["@type"] === "BlogPosting");

        if (posts.length !== 1) {
            throw new Error(`${relativePath}: expected one BlogPosting, found ${posts.length}`);
        }

        const post = posts[0];
        const url = requireText(post, "mainEntityOfPage", relativePath);
        const expectedUrl = `${origin}/${relativePath}`;
        const date = requireText(post, "datePublished", relativePath);
        const author = typeof post.author?.name === "string"
            ? post.author.name.trim()
            : post.author?.["@id"] === organizationId ? organizationAuthor : "";

        if (url !== expectedUrl) throw new Error(`${relativePath}: BlogPosting canonical URL mismatch`);
        if (urls.has(url)) throw new Error(`${relativePath}: duplicate BlogPosting canonical URL`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
            throw new Error(`${relativePath}: invalid BlogPosting publication date`);
        }
        if (!author) throw new Error(`${relativePath}: BlogPosting author name is required for RSS`);

        urls.add(url);
        return {
            title: requireText(post, "headline", relativePath),
            description: requireText(post, "description", relativePath),
            url,
            date,
            author,
            category: requireText(post, "articleSection", relativePath)
        };
    });
}

function xmlEscape(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function rssDate(date) {
    return new Date(`${date}T00:00:00Z`).toUTCString().replace(/GMT$/, "+0000");
}

function buildFeed(posts) {
    const selected = [...posts]
        .sort((left, right) => right.date.localeCompare(left.date) || left.url.localeCompare(right.url))
        .slice(0, feedSize);

    if (!selected.length) throw new Error("Cannot generate an empty RSS feed");

    const items = selected.map((post) => `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(post.url)}</link>
      <guid isPermaLink="true">${xmlEscape(post.url)}</guid>
      <pubDate>${rssDate(post.date)}</pubDate>
      <dc:creator>${xmlEscape(post.author)}</dc:creator>
      <category>${xmlEscape(post.category)}</category>
      <description>${xmlEscape(post.description)}</description>
    </item>`).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>PSC Security Research</title>
    <link>${origin}/pages/resources.html</link>
    <description>Defensive security research from Preemptive Cyber Security.</description>
    <language>en</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${rssDate(selected[0].date)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

function generateFeed({ root = path.resolve(__dirname, "..") } = {}) {
    const posts = readArticlePosts(root);
    const feed = buildFeed(posts);
    fs.writeFileSync(path.join(root, "feed.xml"), feed, "utf8");
    return { articleCount: posts.length, itemCount: Math.min(feedSize, posts.length) };
}

if (require.main === module) {
    const result = generateFeed();
    console.log(`Generated ${result.itemCount} RSS items from ${result.articleCount} validated BlogPosting nodes.`);
}

module.exports = { buildFeed, feedSize, generateFeed, readArticlePosts, rssDate };
