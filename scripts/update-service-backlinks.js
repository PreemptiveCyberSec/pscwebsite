const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const services = JSON.parse(fs.readFileSync(path.join(__dirname, "service-pages.json"), "utf8"));
const articles = new Map();

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

for (const service of services) {
    for (const evidence of service.evidence) {
        const articleFile = path.basename(evidence.href);
        const linkedServices = articles.get(articleFile) || [];
        linkedServices.push(service);
        articles.set(articleFile, linkedServices);
    }
}

for (const [articleFile, linkedServices] of articles) {
    const articlePath = path.join(root, "pages", "blog", articleFile);
    if (!fs.existsSync(articlePath)) throw new Error(`Missing evidence article: ${articleFile}`);

    let source = fs.readFileSync(articlePath, "utf8");
    source = source.replace(/\s*<aside\b[^>]*data-psc-related-services[^>]*>[\s\S]*?<\/aside>\s*/i, "\n");

    const links = linkedServices.map((service) => `
                        <a href="../services/${service.slug}.html">
                            <strong>${escapeHtml(service.name)}</strong>
                            <span>${escapeHtml(service.description)}</span>
                        </a>`).join("");
    const block = `
                <aside class="related-services" data-psc-related-services aria-labelledby="related-services-title">
                    <span class="eyebrow">Related service</span>
                    <h2 id="related-services-title">Apply this research to your environment.</h2>
                    <div class="related-service-links">${links}
                    </div>
                </aside>

`;

    if (!/<div\b[^>]*class=["'][^"']*\barticle-nav\b/i.test(source)) {
        throw new Error(`Missing article navigation insertion point: ${articleFile}`);
    }
    source = source.replace(/(\s*<div\b[^>]*class=["'][^"']*\barticle-nav\b)/i, `${block}$1`);
    fs.writeFileSync(articlePath, source, "utf8");
}

console.log(`Updated related-service links in ${articles.size} research articles.`);
