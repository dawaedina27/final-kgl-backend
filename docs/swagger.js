// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
// This is the OpenAPI document used by /api/docs.json and /api/docs.
const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Karibu Groceries API",
    version: "1.0.0",
    description: "API documentation for procurement, stock, sales, credits, reports, and user management."
  },
  servers: [{ url: "/api", description: "Current server" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "orban" },
          password: { type: "string", example: "director123" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          username: { type: "string" },
          role: { type: "string", enum: ["Manager", "SalesAgent", "Director"] },
          branch: { type: "string" }
        }
      },
      Sale: {
        type: "object",
        properties: {
          saleType: { type: "string", enum: ["cash", "credit"] },
          produce: { type: "string" },
          tonnage: { type: "number" },
          amountPaid: { type: "number" },
          amountDue: { type: "number" },
          buyer: { type: "string" },
          agent: { type: "string" },
          branch: { type: "string" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          200: { description: "Server is running" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login and get JWT",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: { description: "Authenticated" },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/auth/me": {
      get: {
        summary: "Get authenticated user profile",
        responses: {
          200: { description: "Current user" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/users": {
      get: {
        summary: "List users (Director)",
        responses: {
          200: { description: "User list" },
          403: { description: "Forbidden" }
        }
      },
      post: {
        summary: "Create user (Director)",
        responses: {
          201: { description: "User created" }
        }
      }
    },
    "/sales": {
      get: {
        summary: "List sales",
        responses: {
          200: { description: "Sales list" }
        }
      },
      post: {
        summary: "Create sale",
        responses: {
          201: { description: "Sale created" }
        }
      }
    },
    "/procurements": {
      get: {
        summary: "List procurements",
        responses: {
          200: { description: "Procurement list" }
        }
      },
      post: {
        summary: "Create procurement (Manager)",
        responses: {
          201: { description: "Procurement created" }
        }
      }
    },
    "/stocks": {
      get: {
        summary: "List stock items",
        responses: {
          200: { description: "Stock list" }
        }
      }
    },
    "/credit-payments": {
      get: {
        summary: "List credit payments",
        responses: {
          200: { description: "Payment list" }
        }
      },
      post: {
        summary: "Record credit payment",
        responses: {
          201: { description: "Payment created" }
        }
      }
    },
    "/reports/director-summary": {
      get: {
        summary: "Director summary report",
        responses: {
          200: { description: "Summary metrics and rankings" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;

