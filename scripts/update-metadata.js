const fs = require("fs");
const path = require("path");
const { generateFeed } = require("./generate-feed");

const root = path.resolve(__dirname, "..");
const origin = "https://preemptivecybersec.com";
const siteName = "Preemptive Cyber Security";
const socialImage = `${origin}/assets/images/social/preemptive-cyber-security.png`;
const fallbackDescriptions = {
    "pages/cookies.html": "Learn how Preemptive Cyber Security uses cookies and similar technologies across this website.",
    "pages/privacy.html": "Read how Preemptive Cyber Security collects, uses, protects, and manages personal information.",
    "pages/terms.html": "Review the terms and conditions governing use of the Preemptive Cyber Security website and services."
};

function htmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return htmlFiles(absolutePath);
        if (!entry.name.endsWith(".html")) return [];
        return [path.relative(root, absolutePath).replace(/\\/g, "/")];
    });
}

const pagePaths = ["index.html", ...htmlFiles(path.join(root, "pages"))].sort();

function extractAttribute(tag, attribute) {
    const match = tag.match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
    return match ? match[2] : "";
}

function metaContent(html, key) {
    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
        const tag = match[0];
        const identity = extractAttribute(tag, "name") || extractAttribute(tag, "property");
        if (identity.toLowerCase() === key.toLowerCase()) {
            return extractAttribute(tag, "content");
        }
    }
    return "";
}

function stripTags(value) {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function htmlAttribute(value) {
    return value
        .replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function canonicalUrl(relativePath) {
    return relativePath === "index.html" ? `${origin}/` : `${origin}/${relativePath}`;
}

function feedHref(relativePath) {
    const depth = relativePath.split("/").length - 1;
    return `${"../".repeat(depth)}feed.xml`;
}

function ensureFooterFeedLink(source, relativePath) {
    const footerStart = source.search(/<footer\b/i);
    const footerEnd = source.search(/<\/footer\s*>/i);
    if (footerStart === -1 || footerEnd === -1 || footerEnd < footerStart) return source;

    const footer = source.slice(footerStart, footerEnd);
    if (/\bdata-psc-footer-rss\b/i.test(footer)) return source;

    const href = feedHref(relativePath);
    const footerLinks = footer.match(/<ul\b[^>]*class=["'][^"']*\bfooter-links\b[^"']*["'][^>]*>[\s\S]*?<\/ul\s*>/i);
    if (footerLinks) {
        const updatedLinks = footerLinks[0].replace(
            /<\/ul\s*>$/i,
            `<li data-psc-footer-rss><a href="${href}" type="application/rss+xml">RSS</a></li></ul>`
        );
        return source.replace(footerLinks[0], updatedLinks);
    }

    return source.replace(
        /<\/footer\s*>/i,
        `<div class="container footer-rss" data-psc-footer-rss><a href="${href}" type="application/rss+xml">Subscribe via RSS</a></div></footer>`
    );
}

function articleDetails(html) {
    const date = html.match(/\b20\d{2}-\d{2}-\d{2}\b/)?.[0];
    const dateModified = metaContent(html, "article:modified_time") || date;
    const byline = html.match(/\bBy\s*<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i);
    const section = html.match(/<span\b[^>]*class=["'][^"']*\bcat\b[^"']*["'][^>]*>([\s\S]*?)<\/span\s*>/i);
    let author = byline ? stripTags(byline[1]) : "";

    if (!author) {
        for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
            try {
                const data = JSON.parse(match[1]);
                if (typeof data.author?.name === "string") {
                    author = data.author.name;
                    break;
                }
            } catch {
                // Existing structured data is validated separately.
            }
        }
    }

    return {
        author: author || `${siteName} Research`,
        date,
        dateModified,
        section: section ? stripTags(section[1]) : "Cybersecurity Research"
    };
}

function authorEntityUrl(author) {
    const slugs = {
        "Viral Maniar": "viral-maniar",
        "Mike Chen": "mike-chen",
        "Lisa Garcia": "lisa-garcia",
        "Mark Chen": "mark-chen"
    };
    return slugs[author]
        ? `${origin}/pages/authors/${slugs[author]}.html`
        : `${origin}/#organization`;
}

function removeManagedMetadata(head) {
    return head
        .replace(/^\s*<link\b[^>]*rel=["']canonical["'][^>]*>\s*$/gim, "")
        .replace(/^\s*<link\b[^>]*type=["']application\/rss\+xml["'][^>]*>\s*$/gim, "")
        .replace(/^\s*<meta\b[^>]*(?:name|property)=["'](?:robots|og:[^"']+|twitter:[^"']+|article:[^"']+)["'][^>]*>\s*$/gim, "");
}

function metadataBlock({ title, description, canonical, article, pageType, image }) {
    const type = article ? "article" : pageType;
    const safeTitle = htmlAttribute(title);
    const safeDescription = htmlAttribute(description);
    const imageAlt = image === socialImage
        ? "Preemptive Cyber Security — Know the Unknown"
        : title;
    const lines = [
        "    <meta name=\"robots\" content=\"index,follow,max-image-preview:large\">",
        `    <link rel="canonical" href="${canonical}">`,
        "    <link rel=\"alternate\" type=\"application/rss+xml\" title=\"PSC Security Research\" href=\"https://preemptivecybersec.com/feed.xml\">",
        `    <meta property="og:type" content="${type}">`,
        `    <meta property="og:title" content="${safeTitle}">`,
        `    <meta property="og:description" content="${safeDescription}">`,
        `    <meta property="og:url" content="${canonical}">`,
        `    <meta property="og:site_name" content="${siteName}">`,
        `    <meta property="og:image" content="${image}">`,
        "    <meta property=\"og:image:width\" content=\"1200\">",
        "    <meta property=\"og:image:height\" content=\"630\">",
        `    <meta property="og:image:alt" content="${htmlAttribute(imageAlt)}">`,
        "    <meta name=\"twitter:card\" content=\"summary_large_image\">",
        `    <meta name="twitter:title" content="${safeTitle}">`,
        `    <meta name="twitter:description" content="${safeDescription}">`,
        `    <meta name="twitter:image" content="${image}">`,
        `    <meta name="twitter:image:alt" content="${htmlAttribute(imageAlt)}">`
    ];

    if (article) {
        lines.push(
            `    <meta property="article:published_time" content="${article.date}">`,
            `    <meta property="article:modified_time" content="${article.dateModified}">`,
            `    <meta property="article:author" content="${authorEntityUrl(article.author)}">`,
            `    <meta property="article:section" content="${htmlAttribute(article.section)}">`
        );
    }

    return lines.join("\n");
}

for (const relativePath of pagePaths) {
    const absolutePath = path.join(root, relativePath);
    let html = fs.readFileSync(absolutePath, "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
    let description = metaContent(html, "description") || fallbackDescriptions[relativePath];

    if (!title || !description) {
        throw new Error(`Missing title or description source in ${relativePath}`);
    }

    if (!metaContent(html, "description")) {
        html = html.replace(/(<title>[\s\S]*?<\/title>)/i, `$1\n    <meta name="description" content="${description}">`);
    }

    const isArticle = relativePath.startsWith("pages/blog/");
    const servicePage = relativePath.match(/^pages\/services\/([a-z0-9-]+)\.html$/);
    const article = isArticle ? articleDetails(html) : null;
    if (isArticle && !article.date) {
        throw new Error(`Missing publication date in ${relativePath}`);
    }

    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    if (!headMatch) {
        throw new Error(`Missing head element in ${relativePath}`);
    }

    let head = removeManagedMetadata(headMatch[1]);
    const block = metadataBlock({
        title,
        description,
        canonical: canonicalUrl(relativePath),
        article,
        pageType: relativePath.startsWith("pages/authors/") ? "profile" : "website",
        image: servicePage
            ? `${origin}/assets/images/social/services/${servicePage[1]}.png`
            : socialImage
    });
    const themeColor = /^\s*<meta\b[^>]*name=["']theme-color["'][^>]*>\s*$/im;

    if (themeColor.test(head)) {
        head = head.replace(themeColor, (tag) => `${tag.trimEnd()}\n${block}`);
    } else {
        head = `${head.trimEnd()}\n${block}\n`;
    }

        html = html.replace(headMatch[0], `<head>${head}</head>`);
        html = ensureFooterFeedLink(html, relativePath);
    fs.writeFileSync(absolutePath, html, "utf8");
}

const feedResult = generateFeed({ root });
console.log(`Updated ${pagePaths.length} pages and generated ${feedResult.itemCount} feed items from ${feedResult.articleCount} articles.`);