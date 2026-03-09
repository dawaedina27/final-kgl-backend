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
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Karibu Groceries API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; background: #f5f7fb; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/docs.json',
      dom_id: '#swagger-ui',
      deepLinking: true
    });
  </script>
</body>
</html>`;
  return res.type("html").send(html);
});

module.exports = router;

