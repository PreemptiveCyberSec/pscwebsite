const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const navbarPattern = /<nav\b[^>]*class="[^"]*\bnavbar\b[^"]*"[^>]*>[\s\S]*?<\/nav>/;

function navbarForPage(relativePath) {
    const homepage = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const navbar = homepage.match(navbarPattern)?.[0];
    if (!navbar) throw new Error("Missing canonical navbar in index.html");
    const prefix = relativePath === "404.html" ? "/" : "../".repeat(relativePath.split(/[\\/]/).length - 1);
    return navbar.replace(/\bhref="([^"]+)"/g, (attribute, href) =>
        /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href) ? attribute : `href="${prefix}${href}"`
    );
}

function htmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? htmlFiles(filename) : entry.name.endsWith(".html") ? [filename] : [];
    });
}

function syncNavigation() {
    const files = [
        ...fs.readdirSync(root).filter(file => file.endsWith(".html")).map(file => path.join(root, file)),
        ...htmlFiles(path.join(root, "pages"))
    ];
    let updated = 0;
    for (const filename of files) {
        const source = fs.readFileSync(filename, "utf8");
        if (!navbarPattern.test(source)) throw new Error(`Missing navbar in ${filename}`);
        const result = source.replace(navbarPattern, () => navbarForPage(path.relative(root, filename)));
        if (result !== source) {
            fs.writeFileSync(filename, result, "utf8");
            updated += 1;
        }
    }
    return { updated, total: files.length };
}

if (require.main === module) {
    const result = syncNavigation();
    console.log(`Synchronized the index.html header in ${result.updated} of ${result.total} pages.`);
}

module.exports = { navbarForPage, syncNavigation };
