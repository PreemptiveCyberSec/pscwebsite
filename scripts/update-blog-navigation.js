const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const blogDirectory = path.join(root, "pages", "blog");
const articleFiles = fs.readdirSync(blogDirectory).filter((file) => file.endsWith(".html")).sort();
const navbar = `
    <nav class="navbar">
        <div class="container">
            <div class="nav-wrapper">
                <a href="../../index.html" class="logo">
                    <span class="logo-mark"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="21.5" stroke-width="1.5"/><g stroke-width="1"><ellipse cx="24" cy="24" rx="19" ry="7.5"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(30 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(90 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(120 24 24)"/><ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(150 24 24)"/></g><circle cx="24" cy="24" r="2.8" fill="currentColor" stroke="none"/></svg></span>
                    <span class="logo-word"><span class="logo-name">Preemptive <em>Cyber Security</em></span><span class="logo-tag">Know the Unknown</span></span>
                </a>
                <button class="hamburger" id="hamburger" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
                <ul class="nav-menu" id="nav-menu">
                    <li><a href="../services.html">Services</a></li>
                    <li><a href="../about.html">About</a></li>
                    <li><a href="../team.html">Team</a></li>
                    <li class="nav-dropdown">
                        <a href="../resources.html" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Resources<svg class="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>
                        <ul class="nav-dropdown-menu">
                            <li><a href="../resources.html#blog">Blog</a></li>
                            <li><a href="../resources.html#tools">Tools</a></li>
                            <li><a href="../resources.html#talks">Talks &amp; Presentations</a></li>
                        </ul>
                    </li>
                    <li><a href="../careers.html">Careers</a></li>
                    <li class="nav-cta"><a href="../contact.html">Get in touch</a></li>
                </ul>
            </div>
        </div>
    </nav>`;

for (const file of articleFiles) {
    const articlePath = path.join(blogDirectory, file);
    let source = fs.readFileSync(articlePath, "utf8");
    const navbarPattern = /\s*<nav\b[^>]*class=["'][^"']*\bnavbar\b[^"']*["'][^>]*>[\s\S]*?<\/nav\s*>/i;

    if (navbarPattern.test(source)) {
        source = source.replace(navbarPattern, navbar);
    } else if (/<body\b[^>]*>/i.test(source)) {
        source = source.replace(/(<body\b[^>]*>)/i, `$1${navbar}`);
    } else {
        throw new Error(`Missing body element in pages/blog/${file}`);
    }

    if (!/<script\b[^>]*src=["']\.\.\/\.\.\/assets\/js\/main\.js["'][^>]*>/i.test(source)) {
        source = source.replace(/<\/body\s*>/i, "    <script src=\"../../assets/js/main.js\"></script>\n</body>");
    }

    fs.writeFileSync(articlePath, source, "utf8");
}

for (const file of articleFiles) {
    const source = fs.readFileSync(path.join(blogDirectory, file), "utf8");
    const navbarCount = (source.match(/<nav\b[^>]*class=["'][^"']*\bnavbar\b/gi) || []).length;
    if (navbarCount !== 1) throw new Error(`Expected one navbar in pages/blog/${file}, found ${navbarCount}`);
    for (const required of ["logo-mark", "nav-menu", "nav-dropdown", "hamburger", "Get in touch"]) {
        if (!source.includes(required)) throw new Error(`Incomplete navbar in pages/blog/${file}: missing ${required}`);
    }
    if (!source.includes('../../assets/js/main.js')) throw new Error(`Missing shared script in pages/blog/${file}`);
}

console.log(`Updated and verified the shared navbar in ${articleFiles.length} blog posts.`);
