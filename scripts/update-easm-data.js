const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'easm', 'Australia', 'organisations.json');
const outputPath = path.join(root, 'easm', 'Australia', 'data.json');
const scriptOutputPath = path.join(root, 'easm', 'Australia', 'data.js');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const previous = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : { organisations: [] };
const domainPattern = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const requestPauseMs = Number(process.env.EASM_REQUEST_PAUSE_MS || 1000);
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const unavailableSources = new Set();

function requestText(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { headers: { Accept: 'text/plain', 'User-Agent': 'PSC-EASM-Daily-Snapshot/1.0' } }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { body += chunk; });
            response.on('end', () => {
                if (response.statusCode === 200) { resolve(body); return; }
                const error = new Error(`HTTP ${response.statusCode}`);
                error.statusCode = response.statusCode;
                reject(error);
            });
        });
        request.setTimeout(45000, () => request.destroy(new Error('request timed out')));
        request.on('error', reject);
    });
}

function parseHostnames(text, domain) {
    return new Set(text.split(/\r?\n/)
        .map(value => value.trim().toLowerCase().replace(/^\*\./, '').replace(/\.$/, ''))
        .filter(hostname => domainPattern.test(hostname) && (hostname === domain || hostname.endsWith(`.${domain}`))));
}

function classifyEnvironment(hostname) {
    if (/(^|[.-])(dev|development|sandbox|lab)([.-]|$)/i.test(hostname)) return 'development';
    if (/(^|[.-])(stg|stage|staging|preprod|uat)([.-]|$)/i.test(hostname)) return 'staging';
    if (/(^|[.-])(test|tst|sit|nft|qa)(\d*?)([.-]|$)/i.test(hostname)) return 'test';
    return 'production';
}

async function collectOrganisation(organisation) {
    const domain = organisation.domain.toLowerCase();
    if (!domainPattern.test(domain)) throw new Error(`Invalid configured domain: ${domain}`);
    const fallback = previous.organisations.find(item => item.id === organisation.id);
    const endpoints = [
        { name: 'crt.name', url: `https://crt.name/v1/search?apex=${encodeURIComponent(domain)}` },
        { name: 'AgniOps', url: `https://app.agniops.in/v1/search?domain=${encodeURIComponent(domain)}` }
    ];
    const results = await Promise.allSettled(endpoints.map(endpoint => {
        if (unavailableSources.has(endpoint.name)) return Promise.reject(new Error('skipped after an earlier HTTP 429'));
        return requestText(endpoint.url);
    }));
    const sourceSets = new Map();
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') sourceSets.set(endpoints[index].name, parseHostnames(result.value, domain));
        else {
            const source = endpoints[index].name;
            if (result.reason.statusCode === 429) unavailableSources.add(source);
            const fallbackHostnames = fallback?.assets.filter(asset => asset.sources.includes(source)).map(asset => asset.hostname) || [];
            if (fallbackHostnames.length) {
                sourceSets.set(source, new Set(fallbackHostnames));
                console.warn(`${organisation.name}: ${source} failed; preserving ${fallbackHostnames.length} previous hostnames`);
            } else {
                console.warn(`${organisation.name}: ${source} failed: ${result.reason.message}`);
            }
        }
    });
    if (!sourceSets.size) {
        if (fallback) { console.warn(`${organisation.name}: preserving previous snapshot`); return { ...fallback, stale: true }; }
        throw new Error(`${organisation.name}: all sources failed and no previous snapshot exists`);
    }
    const hostSources = new Map();
    sourceSets.forEach((hostnames, source) => hostnames.forEach(hostname => hostSources.set(hostname, [...(hostSources.get(hostname) || []), source])));
    const assets = [...hostSources.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([hostname, sources]) => ({
        hostname,
        type: hostname === domain ? 'root' : 'subdomain',
        environment: classifyEnvironment(hostname),
        sources
    }));
    return {
        ...organisation,
        country: config.region,
        collectedAt: new Date().toISOString(),
        stale: results.some(result => result.status === 'rejected'),
        stats: {
            subdomains: assets.filter(asset => asset.type === 'subdomain').length,
            overlap: assets.filter(asset => asset.sources.length === 2).length,
            successfulSources: sourceSets.size
        },
        assets
    };
}

(async () => {
    const configOrder = new Map(config.organisations.map((organisation, index) => [organisation.id, index]));
    const hasPreviousAgniOpsData = organisation => previous.organisations
        .find(item => item.id === organisation.id)?.assets.some(asset => asset.sources.includes('AgniOps')) || false;
    const collectionOrder = [...config.organisations].sort((left, right) =>
        Number(hasPreviousAgniOpsData(left)) - Number(hasPreviousAgniOpsData(right)));
    const collectedOrganisations = [];
    for (const [index, organisation] of collectionOrder.entries()) {
        collectedOrganisations.push(await collectOrganisation(organisation));
        console.log(`${organisation.name}: ${collectedOrganisations.at(-1).assets.length} assets`);
        if (index < collectionOrder.length - 1) await pause(requestPauseMs);
    }
    const organisations = collectedOrganisations.sort((left, right) => configOrder.get(left.id) - configOrder.get(right.id));
    const snapshot = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        region: config.region,
        methodology: 'Public hostnames merged and deduplicated from crt.name and AgniOps. Environment labels are inferred from hostname tokens.',
        sources: ['https://crt.name/v1/search', 'https://app.agniops.in/v1/search'],
        organisations
    };
    fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    const scriptSnapshot = JSON.stringify(snapshot).replace(/</g, '\\u003c');
    fs.writeFileSync(scriptOutputPath, `window.__PSC_EASM_DATA__ = ${scriptSnapshot};\n`);
    console.log(`Wrote ${path.relative(root, outputPath)}`);
    console.log(`Wrote ${path.relative(root, scriptOutputPath)}`);
})().catch(error => { console.error(error); process.exitCode = 1; });