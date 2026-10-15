# SkillScan Web Development

The website entry point has moved from this directory to [`../skillscan.html`](../skillscan.html), alongside the EASM page. It uses the shared Preemptive Cyber Security navigation, fonts, and near-black/mint-green theme. The Resources page lists SkillScan under Tools. Scanner JavaScript, styles, icons, tests, and documentation remain in this directory. The underlying CLI source described in the guide is not included in this website checkout.

## Run Locally

Node.js 18.3 or newer is required. No npm install is necessary.

```bash
cd SkillScan
npm start
```

Run these commands from the website root. Open the URL printed in the terminal, normally http://127.0.0.1:4173/skillscan.html. The server now serves the whole website so shared navigation and assets work. If that port is occupied, the server selects the next available port. Stop it with Ctrl+C.

## Tests

```bash
npm test
```

## Scanning and Privacy

The website is hosted locally, but scans call the public Cloudflare API at https://skillsguard.apiskillsguard.workers.dev/scan. Content is sent only after upload consent and an explicit scan command. This UI is not an offline scanner. Use the parent project's CLI for offline scanning.

Paste content or select up to 20 files. Each request must fit within 512 KB including JSON encoding. Results include severity/category filters, evidence details, decoding context, partial-result warnings, and JSON export. For batches, the risk dial shows the highest individual file score, not an aggregate repository score.

## Files

- `../skillscan.html`: website layout, using root-relative-to-page asset links
- `preemptive.css`: responsive scanner workspace styles, isolated from shared navigation
- `app.js`: upload, result, and interaction behavior
- `scan-client.js`: fixed-origin API client and validation
- `assets/`: locally hosted images and Lucide icons
- `server.mjs`: loopback-only static development server
- `scan-client.test.mjs`: focused API-client tests
- `website.test.mjs`: root-page asset, Resources navigation, and sitemap integration tests
- `howto.md`: project architecture and deployment guide

Deploy the website root, not this directory alone. No build step is required. The page uses the existing Cloudflare API; production scanning requires that API to allow the website origin through CORS.

Lucide icon attribution is in `assets/NOTICE.txt`. Inter and JetBrains Mono load from Google Fonts; Sentient loads from Fontshare to match the reference site's display type. There is no analytics or uploaded-content persistence. Upstream repository links have been removed from the website and hosted guide; scanning still calls the Cloudflare API described above.