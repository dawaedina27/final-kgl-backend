// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const swaggerDocument = require("../docs/swagger");

const router = express.Router();

// This returns raw OpenAPI JSON.
router.get("/docs.json", (req, res) => {
  return res.json(swaggerDocument);
});

// This opens a simple Swagger UI page.
router.get("/docs", (req, res) => {
  res.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';"
  );
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Karibu Groceries API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; background: #f5f7fb; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="/api/docs-init.js"></script>
</body>
</html>`;
  return res.type("html").send(html);
});

// Serve Swagger init script separately to comply with CSP (no inline script).
router.get("/docs-init.js", (req, res) => {
  const js = `window.ui = SwaggerUIBundle({
  url: '/api/docs.json',
  dom_id: '#swagger-ui',
  deepLinking: true
});`;
  return res.type("application/javascript").send(js);
});

module.exports = router;

