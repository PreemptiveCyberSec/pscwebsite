const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tools = [["easm.html", "EASM"], ["skillscan.html", "SkillScan"]];

function htmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? htmlFiles(filename) : entry.name.endsWith(".html") ? [filename] : [];
    });
}

const files = [
    ...fs.readdirSync(root).filter(file => file.endsWith(".html")).map(file => path.join(root, file)),
    ...htmlFiles(path.join(root, "pages"))
];
let updated = 0;

for (const filename of files) {
    const source = fs.readFileSync(filename, "utf8");
    const navbarPattern = /<nav\b[^>]*class="[^"]*\bnavbar\b[^"]*"[^>]*>[\s\S]*?<\/nav>/;
    if (!navbarPattern.test(source)) throw new Error(`Missing navbar in ${filename}`);

    const result = source.replace(navbarPattern, navbar => {
        const prefix = filename === path.join(root, "404.html")
            ? "/"
            : path.relative(path.dirname(filename), root).split(path.sep).filter(Boolean).map(() => "../").join("");
        let navigation = navbar.replace(/<li><a href="([^"]*resources\.html)">Resources<\/a><\/li>/, (_, href) =>
            `<li class="nav-dropdown"><a href="${href}" class="nav-dropdown-toggle" aria-haspopup="true" aria-expanded="false">Resources<svg class="nav-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a><ul class="nav-dropdown-menu"><li><a href="${href}#blog">Blog</a></li><li><a href="${href}#tools">Tools</a></li><li><a href="${href}#talks">Talks &amp; Presentations</a></li></ul></li>`
        );
        const dropdownPattern = /(<ul class="nav-dropdown-menu">)([\s\S]*?)(<\/ul>)/;
        if (!dropdownPattern.test(navigation)) throw new Error(`Missing Resources dropdown in ${filename}`);
        navigation = navigation.replace(dropdownPattern, (_, opening, menu, closing) => {
            const multiline = menu.includes("\n");
            const indent = menu.match(/\n([ \t]*)<li>/)?.[1] ?? "";
            const separator = multiline ? `\n${indent}` : "";
            const additions = tools.filter(([, label]) => !menu.includes(`>${label}</a>`))
                .map(([file, label]) => `<li><a href="${prefix}${file}">${label}</a></li>`);
            if (!additions.length) return `${opening}${menu}${closing}`;
            const trailing = menu.match(/\s*$/)[0];
            return `${opening}${menu.trimEnd()}${separator}${additions.join(separator)}${trailing}${closing}`;
        });
        return navigation;
    });
    if (result !== source) {
        fs.writeFileSync(filename, result, "utf8");
        updated += 1;
    }
}

console.log(`Updated Resources navigation in ${updated} of ${files.length} pages.`);
