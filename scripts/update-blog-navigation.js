const fs = require("fs");
const path = require("path");
const { navbarForPage } = require("./update-resource-navigation");

const root = path.resolve(__dirname, "..");
const blogDirectory = path.join(root, "pages", "blog");
const articleFiles = fs.readdirSync(blogDirectory).filter((file) => file.endsWith(".html")).sort();
for (const file of articleFiles) {
    const articlePath = path.join(blogDirectory, file);
    const navbar = `\n    ${navbarForPage(`pages/blog/${file}`)}`;
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
