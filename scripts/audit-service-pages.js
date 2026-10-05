const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const origin = "https://preemptivecybersec.com";
const services = JSON.parse(fs.readFileSync(path.join(__dirname, "service-pages.json"), "utf8"));
const failures = [];

function read(relativePath) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
        failures.push(`${relativePath}: missing`);
        return "";
    }
    return fs.readFileSync(absolutePath, "utf8");
}

function count(source, value) {
    return source.split(value).length - 1;
}

const homepage = read("index.html");
const hub = read("pages/services.html");
const catalogue = read("assets/js/services.js");
const contact = read("pages/contact.html");
const mainScript = read("assets/js/main.js");
const sitemap = read("sitemap.xml");
const llms = read("llms.txt");
const feed = read("feed.xml");
const articleLinks = new Map();

for (const service of services) {
    const relativePath = `pages/services/${service.slug}.html`;
    const canonical = `${origin}/${relativePath}`;
    const source = read(relativePath);
    const pageHref = `pages/services/${service.slug}.html`;
    const hubHref = `services/${service.slug}.html`;
    const localFooterHref = `${service.slug}.html`;

    for (const heading of [
        "Problems this engagement addresses",
        "When this service is useful",
        "Choose the boundary that matches the decision",
        "Evidence at every phase",
        "Deliverables built for decisions and fixes",
        "A governed path from scope to verification",
        "Related PSC research",
        "Questions buyers ask before scoping"
    ]) {
        if (!source.includes(heading)) failures.push(`${relativePath}: missing section ${heading}`);
    }

    if (count(homepage, pageHref) < 2) failures.push(`index.html: ${service.slug} is not linked from body and footer`);
    if (count(hub, hubHref) < 2) failures.push(`pages/services.html: ${service.slug} is not linked from body and footer`);
    if (!catalogue.includes(`services/${service.slug}.html`)) failures.push(`assets/js/services.js: ${service.slug} landing-page mapping missing`);
    if (count(source.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || "", localFooterHref) !== 1) failures.push(`${relativePath}: footer link to ${service.slug} missing or duplicated`);
    if (count(sitemap, canonical) !== 1 || !sitemap.includes(`<loc>${canonical}</loc>\n    <lastmod>2026-10-05</lastmod>`)) failures.push(`sitemap.xml: ${service.slug} entry missing, duplicated, or has wrong lastmod`);
    if (count(llms, canonical) !== 1) failures.push(`llms.txt: ${service.slug} URL count is not one`);
    if (feed.includes(canonical)) failures.push(`feed.xml: service page ${service.slug} must not be included`);
    if (!source.includes(`contact.html?service=${service.slug}&source=service-page`)) failures.push(`${relativePath}: attributed CTA missing`);

    for (const evidence of service.evidence) {
        const articleFile = path.basename(evidence.href);
        const linkedServices = articleLinks.get(articleFile) || [];
        linkedServices.push(service.slug);
        articleLinks.set(articleFile, linkedServices);
    }
}

for (const [articleFile, slugs] of articleLinks) {
    const relativePath = `pages/blog/${articleFile}`;
    const source = read(relativePath);
    if (count(source, "data-psc-related-services") !== 1) failures.push(`${relativePath}: related-services aside count is not one`);
    for (const slug of slugs) {
        const href = `../services/${slug}.html`;
        if (count(source, href) !== 1) failures.push(`${relativePath}: backlink to ${slug} count is not one`);
    }
}

for (const field of ['name="service_detail"', 'name="enquiry_source"', "serviceSelections", "allowedSources", "contact_form_submitted"]) {
    if (!contact.includes(field)) failures.push(`pages/contact.html: missing attribution contract ${field}`);
}
for (const field of ["service_enquiry_click", "psc:service-enquiry-click"]) {
    if (!mainScript.includes(field)) failures.push(`assets/js/main.js: missing conversion contract ${field}`);
}

if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
}

const linkCount = [...articleLinks.values()].reduce((total, slugs) => total + slugs.length, 0);
console.log(`PASS: ${services.length} service pages, ${articleLinks.size} supporting articles, ${linkCount} article backlinks, and all discovery/conversion contracts.`);
