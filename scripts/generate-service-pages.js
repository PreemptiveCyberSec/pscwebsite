const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDirectory = path.join(root, "pages", "services");
const services = JSON.parse(fs.readFileSync(path.join(__dirname, "service-pages.json"), "utf8"));
const origin = "https://preemptivecybersec.com";

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function list(items, className = "service-list") {
    return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function page(service) {
    const canonical = `${origin}/pages/services/${service.slug}.html`;
    const socialImage = `${origin}/assets/images/social/services/${service.slug}.png`;
    const contactUrl = `../contact.html?service=${encodeURIComponent(service.slug)}&source=service-page`;
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                "@id": `${canonical}#service`,
                url: canonical,
                name: service.name,
                serviceType: service.name,
                description: service.description,
                provider: { "@id": `${origin}/#organization` },
                mainEntityOfPage: canonical
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${canonical}#breadcrumb`,
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
                    { "@type": "ListItem", position: 2, name: "Services", item: `${origin}/pages/services.html` },
                    { "@type": "ListItem", position: 3, name: service.name, item: canonical }
                ]
            }
        ]
    };
    const title = `${service.name} — Preemptive Cyber Security`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(service.description)}">
    <meta name="theme-color" content="#030806">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" type="application/rss+xml" title="PSC Security Research" href="${origin}/feed.xml">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(service.description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="Preemptive Cyber Security">
    <meta property="og:image" content="${socialImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(service.name)} — Preemptive Cyber Security">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(service.description)}">
    <meta name="twitter:image" content="${socialImage}">
    <meta name="twitter:image:alt" content="${escapeHtml(service.name)} — Preemptive Cyber Security">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://api.fontshare.com">
    <link href="https://api.fontshare.com/v2/css?f[]=sentient@400,500,600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../assets/css/style.css">
    <link rel="stylesheet" href="../../assets/css/animations.css">
    <link rel="stylesheet" href="../../assets/css/service-pages.css">
    <script type="application/ld+json" data-psc-structured-data>
${JSON.stringify(structuredData, null, 8).replace(/</g, "\\u003c")}
    </script>
</head>
<body>
    <nav class="navbar">
        <div class="container"><div class="nav-wrapper">
            <a href="../../index.html" class="logo"><span class="logo-mark"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="21.5" stroke-width="1.5"/><g stroke-width="1"><ellipse cx="24" cy="24" rx="19" ry="7.5"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(30 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(90 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(120 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(150 24 24)"/></g><circle cx="24" cy="24" r="2.8" fill="currentColor" stroke="none"/></svg></span><span class="logo-word"><span class="logo-name">Preemptive <em>Cyber Security</em></span><span class="logo-tag">Know the Unknown</span></span></a>
            <button class="hamburger" id="hamburger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
            <ul class="nav-menu" id="nav-menu">
                <li><a href="../services.html">Services</a></li><li><a href="../about.html">About</a></li><li><a href="../team.html">Team</a></li>
                <li class="nav-dropdown"><a href="../resources.html" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Resources<svg class="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a><ul class="nav-dropdown-menu"><li><a href="../resources.html#blog">Blog</a></li><li><a href="../resources.html#tools">Tools</a></li><li><a href="../resources.html#talks">Talks &amp; Presentations</a></li></ul></li>
                <li><a href="../careers.html">Careers</a></li><li class="nav-cta"><a href="${contactUrl}">Get in touch</a></li>
            </ul>
        </div></div>
    </nav>

    <header class="service-hero">
        <div class="container">
            <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="../../index.html">Home</a></li><li><a href="../services.html">Services</a></li><li aria-current="page">${escapeHtml(service.name)}</li></ol></nav>
            <span class="eyebrow">${escapeHtml(service.category)}</span>
            <h1>${escapeHtml(service.name)}</h1>
            <div class="service-answer">${service.answer.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
            <div class="service-accountability"><span>Subject-matter owner: <a href="${service.owner.url}">${escapeHtml(service.owner.name)}</a> · ${escapeHtml(service.owner.role)}</span><span>Reviewer: <a href="${service.reviewer.url}">${escapeHtml(service.reviewer.name)}</a> · ${escapeHtml(service.reviewer.role)}</span></div>
        </div>
    </header>

    <main>
        <section class="service-band"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Risk focus</span><div><h2>Problems this engagement addresses</h2><p>The scope follows credible attack and failure paths rather than a generic control checklist.</p></div></div>
            ${list(service.problems)}
        </div></section>

        <section class="service-band alt"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Engagement fit</span><div><h2>When this service is useful</h2><p>A clear fit decision protects assessment quality and prevents a broad request from becoming a shallow exercise.</p></div></div>
            <div class="fit-grid"><div class="fit-block"><h3>Designed for</h3>${list(service.fitFor, "")}</div><div class="fit-block not-fit"><h3>Not the right fit for</h3>${list(service.notFor, "")}</div></div>
        </div></section>

        <section class="service-band"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Scope</span><div><h2>Choose the boundary that matches the decision</h2><p>Options can be combined after owners, environments, authority, safety limits, and expected evidence are agreed.</p></div></div>
            <div class="scope-grid">${service.scopeOptions.map((option) => `<article class="scope-card"><h3>${escapeHtml(option.title)}</h3><p>${escapeHtml(option.text)}</p></article>`).join("")}</div>
            <div class="requirements-grid" style="margin-top: 54px"><div><h3>Prerequisites</h3>${list(service.prerequisites, "")}</div><div><h3>Explicit exclusions</h3>${list(service.exclusions, "")}</div></div>
        </div></section>

        <section class="service-band alt"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Methodology</span><div><h2>Evidence at every phase</h2><p>Each phase produces an observable input to the final risk and remediation decisions.</p></div></div>
            <ol class="method-list">${service.phases.map((phase) => `<li><h3>${escapeHtml(phase.title)}</h3><p>${escapeHtml(phase.text)}</p></li>`).join("")}</ol>
            <div style="margin-top: 42px"><h3 style="margin-bottom: 18px">Standards and frameworks used</h3><div class="framework-row">${service.frameworks.map((framework) => `<span>${escapeHtml(framework)}</span>`).join("")}</div></div>
        </div></section>

        <section class="service-band"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Outputs</span><div><h2>Deliverables built for decisions and fixes</h2><p>Reporting separates observed evidence, uncertainty, business priority, and the action needed to verify remediation.</p></div></div>
            <div class="delivery-grid"><div>${list(service.deliverables, "delivery-list")}</div><div class="policy-stack"><section><h3>Severity approach</h3><p>${escapeHtml(service.severity)}</p></section><section><h3>Readout</h3><p>${escapeHtml(service.readout)}</p></section><section><h3>Remediation support</h3><p>${escapeHtml(service.remediation)}</p></section><section><h3>Retest policy</h3><p>${escapeHtml(service.retest)}</p></section></div></div>
        </div></section>

        <section class="service-band alt"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Typical process</span><div><h2>A governed path from scope to verification</h2><p>Timing depends on scope, access, environment, and evidence quality; PSC confirms milestones during scoping rather than publishing unsupported duration promises.</p></div></div>
            <div class="process-strip">${service.process.map((step, index) => `<div><span>0${index + 1}</span><p>${escapeHtml(step)}</p></div>`).join("")}</div>
        </div></section>

        <section class="service-band"><div class="container">
            <div class="service-section-head"><span class="eyebrow">Evidence</span><div><h2>Related PSC research</h2><p>These publications show the technical reasoning and defensive context behind the engagement.</p></div></div>
            <div class="evidence-grid">${service.evidence.map((item) => `<a class="evidence-card" href="${item.href}"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><span class="evidence-link">Read research →</span></a>`).join("")}</div>
        </div></section>

        <section class="service-band alt"><div class="container">
            <div class="service-section-head"><span class="eyebrow">FAQ</span><div><h2>Questions buyers ask before scoping</h2><p>Final rules, access, and deliverables are confirmed in the engagement scope.</p></div></div>
            <div class="faq-list">${service.faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}</div>
        </div></section>

        <section class="service-cta"><div class="container"><div class="service-cta-inner"><div><span class="eyebrow">Scope this service</span><h2>Discuss ${escapeHtml(service.name.toLowerCase())} with PSC.</h2><p>Share the system, decision, and constraints. PSC will confirm whether this service fits before proposing a scope.</p></div><a href="${contactUrl}" class="btn btn-primary" data-conversion="service-enquiry" data-service="${service.slug}">Request a scoped assessment</a></div></div></section>
    </main>

    <footer class="footer"><div class="container"><div class="footer-content"><div class="footer-brand"><a href="../../index.html" class="logo"><span class="logo-word"><span class="logo-name">Preemptive <em>Cyber Security</em></span><span class="logo-tag">Know the Unknown</span></span></a><p>Offensive security, defensive operations, AI security, and training.</p></div><div><h4>Company</h4><ul><li><a href="../about.html">About</a></li><li><a href="../team.html">Team</a></li><li><a href="../contact.html">Contact</a></li></ul></div><div><h4>Priority services</h4><ul><li><a href="penetration-testing.html">Penetration Testing</a></li><li><a href="red-team-exercise.html">Red Team Exercise</a></li><li><a href="ai-mcp-security.html">AI &amp; MCP Security</a></li><li><a href="detection-engineering.html">Detection Engineering</a></li><li><a href="ransomware-readiness.html">Ransomware Readiness</a></li></ul></div><div><h4>Research</h4><ul><li><a href="../resources.html">Articles</a></li><li><a href="../../llms.txt">llms.txt</a></li></ul></div></div><div class="footer-bottom"><p>© 2026 Preemptive Cyber Security</p><ul class="footer-links"><li><a href="../privacy.html">Privacy</a></li><li><a href="../terms.html">Terms</a></li><li data-psc-footer-rss><a href="../../feed.xml" type="application/rss+xml">RSS</a></li></ul></div></div></footer>
    <script src="../../assets/js/main.js"></script>
</body>
</html>
`;
}

function validate(service, slugs) {
    const requiredText = ["slug", "name", "category", "description", "severity", "readout", "remediation", "retest"];
    for (const key of requiredText) {
        if (typeof service[key] !== "string" || !service[key].trim()) throw new Error(`${service.slug || "service"}: missing ${key}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service.slug)) throw new Error(`${service.slug}: invalid slug`);
    if (slugs.has(service.slug)) throw new Error(`${service.slug}: duplicate slug`);
    slugs.add(service.slug);
    for (const key of ["answer", "problems", "fitFor", "notFor", "scopeOptions", "prerequisites", "exclusions", "phases", "frameworks", "deliverables", "process", "evidence", "faqs"]) {
        if (!Array.isArray(service[key]) || service[key].length < 2) throw new Error(`${service.slug}: ${key} needs substantive content`);
    }
    if (!service.owner?.name || !service.reviewer?.name) throw new Error(`${service.slug}: owner and reviewer are required`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const slugs = new Set();
for (const service of services) {
    validate(service, slugs);
    fs.writeFileSync(path.join(outputDirectory, `${service.slug}.html`), page(service), "utf8");
}

console.log(`Generated ${services.length} standalone service pages.`);
