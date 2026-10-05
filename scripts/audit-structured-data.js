const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const origin = "https://preemptivecybersec.com";
const organizationId = `${origin}/#organization`;
const failures = [];

function decodeHtml(value) {
    return value
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function text(value) {
    return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function attribute(tag, name) {
    return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2] || "";
}

function meta(source, key) {
    for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
        const tag = match[0];
        if ((attribute(tag, "name") || attribute(tag, "property")).toLowerCase() === key.toLowerCase()) {
            return decodeHtml(attribute(tag, "content"));
        }
    }
    return "";
}

function graph(relativePath, source) {
    const scripts = [...source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
    for (const script of scripts) {
        try {
            JSON.parse(script[1]);
        } catch (error) {
            failures.push(`${relativePath}: invalid JSON-LD (${error.message})`);
        }
    }
    const managed = scripts.filter((script) => script[0].includes("data-psc-structured-data"));
    if (managed.length !== 1) {
        failures.push(`${relativePath}: managed JSON-LD count is ${managed.length}`);
        return [];
    }
    try {
        return JSON.parse(managed[0][1])["@graph"] || [];
    } catch {
        return [];
    }
}

function one(relativePath, nodes, type) {
    const matches = nodes.filter((node) => node["@type"] === type);
    if (matches.length !== 1) failures.push(`${relativePath}: ${type} count is ${matches.length}`);
    return matches[0] || {};
}

function visibleCrumbs(source) {
    const nav = source.match(/<nav\b[^>]*class=["'][^"']*\bbreadcrumbs\b[^"']*["'][^>]*>([\s\S]*?)<\/nav\s*>/i)?.[1] || "";
    return [...nav.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi)].map((match) => text(match[1]));
}

const homepagePath = path.join(root, "index.html");
const homepageNodes = graph("index.html", fs.readFileSync(homepagePath, "utf8"));
const organization = one("index.html", homepageNodes, "Organization");
const website = one("index.html", homepageNodes, "WebSite");
if (organization["@id"] !== organizationId) failures.push("index.html: incorrect Organization @id");
if (website["@id"] !== `${origin}/#website`) failures.push("index.html: incorrect WebSite @id");
if (website.publisher?.["@id"] !== organizationId) failures.push("index.html: WebSite publisher mismatch");
for (const unsupported of ["sameAs", "logo", "foundingDate", "address"]) {
    if (organization[unsupported] !== undefined) failures.push(`index.html: unverified Organization ${unsupported}`);
}
if (homepageNodes.some((node) => node["@type"] === "SearchAction")) failures.push("index.html: SearchAction exists without site search");

const authorDirectory = path.join(root, "pages", "authors");
const authorFiles = fs.readdirSync(authorDirectory).filter((file) => file.endsWith(".html")).sort();
if (authorFiles.length !== 4) failures.push(`Expected 4 author profiles, found ${authorFiles.length}`);
const personIds = new Set();
for (const file of authorFiles) {
    const relativePath = `pages/authors/${file}`;
    const source = fs.readFileSync(path.join(authorDirectory, file), "utf8");
    const nodes = graph(relativePath, source);
    const person = one(relativePath, nodes, "Person");
    const breadcrumb = one(relativePath, nodes, "BreadcrumbList");
    const canonical = `${origin}/${relativePath}`;
    if (person["@id"] !== `${canonical}#person` || person.url !== canonical) failures.push(`${relativePath}: Person URL mismatch`);
    if (person.worksFor?.["@id"] !== organizationId) failures.push(`${relativePath}: Person worksFor mismatch`);
    if (person.name !== text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1] || "")) failures.push(`${relativePath}: Person name differs from H1`);
    if (breadcrumb.itemListElement?.map((item) => item.name).join("|") !== visibleCrumbs(source).join("|")) failures.push(`${relativePath}: breadcrumb names differ`);
    personIds.add(person["@id"]);
}

const blogDirectory = path.join(root, "pages", "blog");
const articleFiles = fs.readdirSync(blogDirectory).filter((file) => file.endsWith(".html")).sort();
let organizationAuthors = 0;
for (const file of articleFiles) {
    const relativePath = `pages/blog/${file}`;
    const source = fs.readFileSync(path.join(blogDirectory, file), "utf8");
    const nodes = graph(relativePath, source);
    const posting = one(relativePath, nodes, "BlogPosting");
    const breadcrumb = one(relativePath, nodes, "BreadcrumbList");
    const canonical = `${origin}/${relativePath}`;
    const h1 = text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1] || "");
    const category = text(source.match(/<span\b[^>]*class=["'][^"']*\bcat\b[^"']*["'][^>]*>([\s\S]*?)<\/span\s*>/i)?.[1] || "");
    const visibleAuthor = text(source.match(/\bBy\s*<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i)?.[1] || "");

    if (!h1 || posting.headline !== h1) failures.push(`${relativePath}: headline differs from visible H1`);
    if (posting.description !== meta(source, "description")) failures.push(`${relativePath}: description mismatch`);
    if (posting.mainEntityOfPage !== canonical || posting["@id"] !== `${canonical}#article`) failures.push(`${relativePath}: canonical entity IDs mismatch`);
    if (posting.datePublished !== meta(source, "article:published_time") || posting.dateModified !== meta(source, "article:modified_time")) failures.push(`${relativePath}: dates mismatch`);
    if (posting.image !== meta(source, "og:image")) failures.push(`${relativePath}: image mismatch`);
    if (posting.articleSection !== category) failures.push(`${relativePath}: article section mismatch`);
    if (posting.publisher?.["@id"] !== organizationId) failures.push(`${relativePath}: publisher mismatch`);
    if (breadcrumb.itemListElement?.map((item) => item.name).join("|") !== visibleCrumbs(source).join("|")) failures.push(`${relativePath}: breadcrumb names differ`);

    if (posting.author?.["@id"] === organizationId) {
        organizationAuthors += 1;
        if (visibleAuthor !== "Preemptive Cyber Security Research" || meta(source, "article:author") !== organizationId) failures.push(`${relativePath}: organization byline mismatch`);
    } else {
        if (!personIds.has(posting.author?.["@id"])) failures.push(`${relativePath}: unresolved Person author`);
        if (posting.author?.name !== visibleAuthor || meta(source, "article:author") !== posting.author?.url) failures.push(`${relativePath}: Person byline mismatch`);
    }
}
if (articleFiles.length !== 89) failures.push(`Expected 89 articles, found ${articleFiles.length}`);
if (organizationAuthors !== 7) failures.push(`Expected 7 organization-authored articles, found ${organizationAuthors}`);

const servicesSource = fs.readFileSync(path.join(root, "pages", "services.html"), "utf8");
const serviceNodes = graph("pages/services.html", servicesSource);
one("pages/services.html", serviceNodes, "CollectionPage");
const services = serviceNodes.filter((node) => node["@type"] === "Service");
if (services.length !== 4) failures.push(`pages/services.html: Service count is ${services.length}`);
for (const service of services) {
    if (service.provider?.["@id"] !== organizationId) failures.push(`pages/services.html: ${service.name} provider mismatch`);
    if (!service.url?.startsWith(`${origin}/pages/services.html#`)) failures.push(`pages/services.html: ${service.name} URL mismatch`);
}
if (serviceNodes.some((node) => node["@type"] === "BreadcrumbList")) failures.push("pages/services.html: breadcrumb should not be present");
if (visibleCrumbs(servicesSource).length) failures.push("pages/services.html: visible breadcrumb should not be present");

const serviceManifest = JSON.parse(fs.readFileSync(path.join(root, "scripts", "service-pages.json"), "utf8"));
for (const entry of serviceManifest) {
    const relativePath = `pages/services/${entry.slug}.html`;
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    const nodes = graph(relativePath, source);
    const service = one(relativePath, nodes, "Service");
    const breadcrumb = one(relativePath, nodes, "BreadcrumbList");
    const canonical = `${origin}/${relativePath}`;
    const h1 = text(source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i)?.[1] || "");

    if (service["@id"] !== `${canonical}#service` || service.url !== canonical || service.mainEntityOfPage !== canonical) failures.push(`${relativePath}: canonical Service IDs mismatch`);
    if (service.name !== entry.name || service.serviceType !== entry.name || service.name !== h1) failures.push(`${relativePath}: Service name differs from manifest or H1`);
    if (service.description !== entry.description || service.description !== meta(source, "description")) failures.push(`${relativePath}: Service description mismatch`);
    if (service.provider?.["@id"] !== organizationId) failures.push(`${relativePath}: Service provider mismatch`);
    if (breadcrumb.itemListElement?.map((item) => item.name).join("|") !== visibleCrumbs(source).join("|")) failures.push(`${relativePath}: breadcrumb names differ`);
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const file of authorFiles) {
    const url = `${origin}/pages/authors/${file}`;
    if (sitemap.split(url).length - 1 !== 1) failures.push(`sitemap.xml: ${url} count is not one`);
}

if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
}
console.log("PASS: Organization, WebSite, 4 Person, 89 BlogPosting, 9 Service, and 98 BreadcrumbList entities agree with visible content.");