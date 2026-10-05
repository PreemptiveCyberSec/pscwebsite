const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const origin = "https://preemptivecybersec.com";
const organizationId = `${origin}/#organization`;
const websiteId = `${origin}/#website`;
const socialImage = `${origin}/assets/images/social/preemptive-cyber-security.png`;
const today = "2026-10-05";

const authors = {
    "Viral Maniar": {
        slug: "viral-maniar",
        initials: "VM",
        role: "Managing Director & Principal Consultant",
        description: "Offensive security specialist leading Preemptive Cyber Security's offensive and defensive security services.",
        expertise: ["Offensive security", "Penetration testing", "Red teaming", "Cloud security"]
    },
    "Mike Chen": {
        slug: "mike-chen",
        initials: "MC",
        role: "Lead Penetration Tester",
        description: "Web application and API security specialist at Preemptive Cyber Security.",
        expertise: ["Web application security", "API security", "Penetration testing"]
    },
    "Lisa Garcia": {
        slug: "lisa-garcia",
        initials: "LG",
        role: "Security Researcher",
        description: "Security researcher at Preemptive Cyber Security focused on cryptography and vulnerability research.",
        expertise: ["Cryptography", "Vulnerability research", "Detection engineering"]
    },
    "Mark Chen": {
        slug: "mark-chen",
        initials: "MC",
        role: "Security Researcher",
        description: "Security researcher writing defensive analysis for Preemptive Cyber Security.",
        expertise: ["Windows security", "Digital forensics", "Defensive security"]
    }
};

function decodeHtml(value) {
    return value
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&nbsp;/gi, " ");
}

function stripTags(value) {
    return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function html(value) {
    return String(value)
        .replace(/&(?!(?:amp|lt|gt|quot|#39);)/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function metaContent(source, key) {
    for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
        const tag = match[0];
        const identity = tag.match(/\b(?:name|property)=["']([^"']+)["']/i)?.[1];
        if (identity?.toLowerCase() === key.toLowerCase()) {
            return tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] || "";
        }
    }
    return "";
}

function jsonLd(graph) {
    return `    <script type="application/ld+json" data-psc-structured-data>\n${JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph
    }, null, 4).split("\n").map((line) => `    ${line}`).join("\n")}\n    </script>`;
}

function removePscJsonLd(source) {
    return source.replace(/\s*<script\b[^>]*data-psc-structured-data[^>]*>[\s\S]*?<\/script\s*>/gi, "");
}

function replaceAllArticleJsonLd(source) {
    return source.replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script\s*>/gi, "");
}

function insertBeforeHeadClose(source, markup) {
    return source.replace(/\s*<\/head>/i, `\n${markup}\n</head>`);
}

function breadcrumbNode(id, items) {
    return {
        "@type": "BreadcrumbList",
        "@id": id,
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };
}

function visibleBreadcrumb(items, className = "breadcrumbs") {
    const entries = items.map((item, index) => {
        const current = index === items.length - 1;
        return current
            ? `<li aria-current="page">${html(item.name)}</li>`
            : `<li><a href="${item.href}">${html(item.name)}</a></li>`;
    }).join("");
    return `<nav class="${className}" aria-label="Breadcrumb"><ol>${entries}</ol></nav>`;
}

function organizationGraph() {
    return [
        {
            "@type": "Organization",
            "@id": organizationId,
            name: "Preemptive Cyber Security",
            url: `${origin}/`,
            description: "360° protection against cyber threats. Offensive security, defensive operations, and training.",
            email: "info@preemptivecybersec.com",
            telephone: "+61 415 821 123",
            areaServed: "Global",
            contactPoint: {
                "@type": "ContactPoint",
                contactType: "sales and security consulting",
                email: "info@preemptivecybersec.com",
                telephone: "+61 415 821 123",
                url: `${origin}/pages/contact.html`,
                availableLanguage: "English"
            }
        },
        {
            "@type": "WebSite",
            "@id": websiteId,
            url: `${origin}/`,
            name: "Preemptive Cyber Security",
            publisher: { "@id": organizationId },
            inLanguage: "en"
        }
    ];
}

function authorUrl(profile) {
    return `${origin}/pages/authors/${profile.slug}.html`;
}

function authorTemplate(name, profile, articles) {
    const canonical = authorUrl(profile);
    const articleLinks = articles.length
        ? articles.map((article) => `                    <li><a href="../blog/${article.file}">${html(article.title)}</a></li>`).join("\n")
        : "                    <li>No published research is currently listed.</li>";
    const person = {
        "@type": "Person",
        "@id": `${canonical}#person`,
        name,
        url: canonical,
        jobTitle: profile.role,
        description: profile.description,
        worksFor: { "@id": organizationId },
        knowsAbout: profile.expertise
    };
    const crumbs = breadcrumbNode(`${canonical}#breadcrumb`, [
        { name: "Home", url: `${origin}/` },
        { name: "Team", url: `${origin}/pages/team.html` },
        { name, url: canonical }
    ]);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${html(name)} — Preemptive Cyber Security</title>
    <meta name="description" content="${html(profile.description)}">
    <meta name="theme-color" content="#030806">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" type="application/rss+xml" title="PSC Security Research" href="${origin}/feed.xml">
    <meta property="og:type" content="profile">
    <meta property="og:title" content="${html(name)} — Preemptive Cyber Security">
    <meta property="og:description" content="${html(profile.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="Preemptive Cyber Security">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Preemptive Cyber Security — Know the Unknown">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${html(name)} — Preemptive Cyber Security">
    <meta name="twitter:description" content="${html(profile.description)}">
    <meta name="twitter:image" content="${socialImage}">
    <meta name="twitter:image:alt" content="Preemptive Cyber Security — Know the Unknown">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://api.fontshare.com">
    <link href="https://api.fontshare.com/v2/css?f[]=sentient@400,500,600&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="../../assets/css/animations.css">
    <link rel="stylesheet" href="../../assets/css/blog.css">
${jsonLd([person, crumbs])}
</head>
<body>
    <nav class="navbar">
        <div class="container"><div class="nav-wrapper">
            <a href="../../index.html" class="logo"><span class="logo-mark"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="21.5" stroke-width="1.5"/><g stroke-width="1"><ellipse cx="24" cy="24" rx="19" ry="7.5"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(120 24 24)"/></g><circle cx="24" cy="24" r="2.8" fill="currentColor" stroke="none"/></svg></span><span class="logo-word"><span class="logo-name">Preemptive <em>Cyber Security</em></span><span class="logo-tag">Know the Unknown</span></span></a>
            <button class="hamburger" id="hamburger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
            <ul class="nav-menu" id="nav-menu"><li><a href="../services.html">Services</a></li><li><a href="../about.html">About</a></li><li><a href="../team.html">Team</a></li><li><a href="../resources.html">Resources</a></li><li><a href="../careers.html">Careers</a></li><li class="nav-cta"><a href="../contact.html">Get in touch</a></li></ul>
        </div></div>
    </nav>
    <main class="author-page">
        <div class="container">
            ${visibleBreadcrumb([
                { name: "Home", href: "../../index.html" },
                { name: "Team", href: "../team.html" },
                { name }
            ])}
            <header class="author-header">
                <div class="author-avatar" aria-hidden="true">${profile.initials}</div>
                <div><span class="eyebrow">Research author</span><h1>${html(name)}</h1><p class="author-role">${html(profile.role)}</p></div>
            </header>
            <section class="author-bio" aria-labelledby="about-author"><h2 id="about-author">About ${html(name)}</h2><p>${html(profile.description)}</p></section>
            <section class="author-research" aria-labelledby="published-research"><h2 id="published-research">Published research</h2><ul>${articleLinks}</ul></section>
        </div>
    </main>
    <footer class="footer"><div class="container"><div class="footer-bottom"><p>© 2026 Preemptive Cyber Security</p><ul class="footer-links"><li><a href="../privacy.html">Privacy</a></li><li><a href="../terms.html">Terms</a></li><li><a href="../contact.html">Contact</a></li></ul></div></div></footer>
    <script src="../../assets/js/main.js"></script>
</body>
</html>
`;
}

const blogDirectory = path.join(root, "pages", "blog");
const articleFiles = fs.readdirSync(blogDirectory).filter((file) => file.endsWith(".html")).sort();
const articlesByAuthor = Object.fromEntries(Object.keys(authors).map((name) => [name, []]));
const parsedArticles = [];

for (const file of articleFiles) {
    const absolutePath = path.join(blogDirectory, file);
    const source = fs.readFileSync(absolutePath, "utf8");
    const h1Markup = source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1];
    const datePublished = metaContent(source, "article:published_time") || source.match(/\b20\d{2}-\d{2}-\d{2}\b/)?.[0];
    const dateModified = metaContent(source, "article:modified_time") || datePublished;
    const description = metaContent(source, "description");
    const categoryMarkup = source.match(/<span\b[^>]*class=["'][^"']*\bcat\b[^"']*["'][^>]*>([\s\S]*?)<\/span\s*>/i)?.[1];
    const bylineMarkup = source.match(/\bBy\s*<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i)?.[1];
    const visibleAuthor = bylineMarkup ? stripTags(bylineMarkup) : null;
    const authorName = visibleAuthor === "Preemptive Cyber Security Research" ? null : visibleAuthor;

    if (!h1Markup || !datePublished || !description || !categoryMarkup) {
        throw new Error(`Missing article source data in pages/blog/${file}`);
    }
    if (authorName && !authors[authorName]) {
        throw new Error(`Unknown article author ${authorName} in pages/blog/${file}`);
    }

    const article = {
        file,
        absolutePath,
        source,
        title: stripTags(h1Markup),
        datePublished,
        dateModified,
        description: decodeHtml(description),
        category: stripTags(categoryMarkup),
        authorName
    };
    parsedArticles.push(article);
    if (authorName) articlesByAuthor[authorName].push(article);
}

const authorsDirectory = path.join(root, "pages", "authors");
fs.mkdirSync(authorsDirectory, { recursive: true });
for (const [name, profile] of Object.entries(authors)) {
    fs.writeFileSync(
        path.join(authorsDirectory, `${profile.slug}.html`),
        authorTemplate(name, profile, articlesByAuthor[name]),
        "utf8"
    );
}

for (const article of parsedArticles) {
    const canonical = `${origin}/pages/blog/${article.file}`;
    const articleAuthor = article.authorName
        ? {
            "@type": "Person",
            "@id": `${authorUrl(authors[article.authorName])}#person`,
            name: article.authorName,
            url: authorUrl(authors[article.authorName])
        }
        : { "@id": organizationId };
    const graph = [
        {
            "@type": "BlogPosting",
            "@id": `${canonical}#article`,
            mainEntityOfPage: canonical,
            headline: article.title,
            description: article.description,
            image: socialImage,
            datePublished: article.datePublished,
            dateModified: article.dateModified,
            author: articleAuthor,
            publisher: { "@id": organizationId },
            articleSection: article.category,
            inLanguage: "en"
        },
        breadcrumbNode(`${canonical}#breadcrumb`, [
            { name: "Home", url: `${origin}/` },
            { name: "Research", url: `${origin}/pages/resources.html` },
            { name: article.title, url: canonical }
        ])
    ];
    const breadcrumb = visibleBreadcrumb([
        { name: "Home", href: "../../index.html" },
        { name: "Research", href: "../resources.html" },
        { name: article.title }
    ]);
    let source = replaceAllArticleJsonLd(article.source);
    source = source.replace(/<nav\b[^>]*class=["'][^"']*\bbreadcrumbs\b[^"']*["'][^>]*>[\s\S]*?<\/nav\s*>/i, breadcrumb);
    if (!/<nav\b[^>]*class=["'][^"']*\bbreadcrumbs\b/i.test(source)) {
        source = source.replace(/<a\b[^>]*class=["'][^"']*\bback-link\b[^"']*["'][^>]*>[\s\S]*?<\/a\s*>/i, breadcrumb);
    }
    if (!/<nav\b[^>]*class=["'][^"']*\bbreadcrumbs\b/i.test(source)) {
        throw new Error(`Unable to place breadcrumbs in pages/blog/${article.file}`);
    }

    if (article.authorName) {
        const profile = authors[article.authorName];
        const linkedName = `<strong><a href="../authors/${profile.slug}.html" rel="author">${html(article.authorName)}</a></strong>`;
        const escapedName = article.authorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const visibleName = new RegExp(`<strong\\b[^>]*>\\s*(?:<a\\b[^>]*>\\s*)?${escapedName}\\s*(?:<\\/a\\s*>)?\\s*<\\/strong\\s*>`, "i");
        if (!visibleName.test(source)) throw new Error(`Unable to link author in pages/blog/${article.file}`);
        source = source.replace(visibleName, linkedName);
    } else if (!/class=["'][^"']*\barticle-byline\b/i.test(source)) {
        const byline = `<div class="article-byline"><span class="avatar">PSC</span><span>By <strong><a href="../../index.html" rel="author">Preemptive Cyber Security Research</a></strong></span></div>`;
        source = source.replace(/<div\b[^>]*class=["'][^"']*\bprose\b[^>]*>/i, `${byline}$&`);
    } else if (!article.authorName) {
        source = source.replace(/href=["']\.\.\/\.\.\/index\.html#organization["']/i, "href=\"../../index.html\"");
    }

    source = source.replace(/class=(["'])prose\1\s*["']/gi, "class=\"prose\"");

    source = insertBeforeHeadClose(source, jsonLd(graph));
    fs.writeFileSync(article.absolutePath, source, "utf8");
}

const homepagePath = path.join(root, "index.html");
let homepage = removePscJsonLd(fs.readFileSync(homepagePath, "utf8"));
homepage = insertBeforeHeadClose(homepage, jsonLd(organizationGraph()));
fs.writeFileSync(homepagePath, homepage, "utf8");

const servicesPath = path.join(root, "pages", "services.html");
let services = removePscJsonLd(fs.readFileSync(servicesPath, "utf8"));
const serviceCanonical = `${origin}/pages/services.html`;
const serviceLines = [
    {
        id: "offensive",
        name: "Offensive Security",
        description: "We emulate real adversaries against your applications, networks, and people — finding attack paths before criminals do."
    },
    {
        id: "defensive",
        name: "Defensive Security",
        description: "Detection and response capabilities that assume compromise — hunting active threats, responding to incidents, and hardening your architecture."
    },
    {
        id: "ai",
        name: "AI Security",
        description: "Offensive and defensive security for LLMs, autonomous agents, and the infrastructure that runs them — securing how you build, deploy, connect, and defend AI systems."
    },
    {
        id: "training",
        name: "Training & Education",
        description: "Hands-on, specialist courses built from real engagements and delivered by security researchers."
    }
];
const serviceBreadcrumb = visibleBreadcrumb([
    { name: "Home", href: "../index.html" },
    { name: "Services" }
], "breadcrumbs page-breadcrumbs");
services = services.replace(/<nav\b[^>]*class=["'][^"']*\bpage-breadcrumbs\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i, serviceBreadcrumb);
if (!/class=["'][^"']*\bpage-breadcrumbs\b/i.test(services)) {
    services = services.replace(/(<header\b[^>]*class=["'][^"']*\bpage-header\b[^"']*["'][^>]*>\s*<div\b[^>]*class=["']container["'][^>]*>)/i, `$1\n            ${serviceBreadcrumb}`);
}
services = insertBeforeHeadClose(services, jsonLd([
    {
        "@type": "CollectionPage",
        "@id": `${serviceCanonical}#webpage`,
        url: serviceCanonical,
        name: "Services",
        description: decodeHtml(metaContent(services, "description")),
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
        inLanguage: "en"
    },
    ...serviceLines.map((service) => ({
        "@type": "Service",
        "@id": `${serviceCanonical}#${service.id}-service`,
        url: `${serviceCanonical}#${service.id}`,
        name: service.name,
        serviceType: service.name,
        description: service.description,
        provider: { "@id": organizationId }
    })),
    breadcrumbNode(`${serviceCanonical}#breadcrumb`, [
        { name: "Home", url: `${origin}/` },
        { name: "Services", url: serviceCanonical }
    ])
]));
fs.writeFileSync(servicesPath, services, "utf8");

const sitemapPath = path.join(root, "sitemap.xml");
let sitemap = fs.readFileSync(sitemapPath, "utf8");
sitemap = sitemap.replace(/\s*<!-- ===== Author profiles ===== -->[\s\S]*?(?=\s*<\/urlset>)/, "");
const authorUrls = Object.values(authors).map((profile) => `
  <url>
    <loc>${authorUrl(profile)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n");
sitemap = sitemap.replace(/\s*<\/urlset>/, `\n\n  <!-- ===== Author profiles ===== -->${authorUrls}\n\n</urlset>`);
fs.writeFileSync(sitemapPath, sitemap, "utf8");

console.log(`Updated ${parsedArticles.length} articles, 4 author profiles, homepage entities, services breadcrumbs, and sitemap.`);