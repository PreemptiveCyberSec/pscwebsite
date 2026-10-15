import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filePath = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    const actualPath = await realpath(filePath);
    const mimeType = mimeTypes[extname(actualPath)];
    if (!actualPath.startsWith(`${root}${sep}`) || !mimeType) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const content = await readFile(actualPath);
    response.writeHead(200, { "Content-Type": mimeType });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404);
    response.end(error instanceof URIError ? "Invalid URL" : "Not found");
  }
});

let port = Number(process.env.PORT ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("PORT must be an integer between 1024 and 65535.");
const firstPort = port;
server.on("error", error => {
  if (error.code === "EADDRINUSE" && port < Math.min(firstPort + 10, 65535)) {
    port += 1;
    server.listen(port, "127.0.0.1");
    return;
  }
  console.error(error.message);
  process.exitCode = 1;
});
server.on("listening", () => console.log(`SkillScan: http://127.0.0.1:${port}/skillscan.html`));
server.listen(port, "127.0.0.1");