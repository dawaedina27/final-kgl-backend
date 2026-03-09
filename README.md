# Karibu Groceries LTD Backend

Node.js + Express + MongoDB backend for Karibu Groceries LTD.

It provides:
- Authentication and JWT-based authorization
- User and branch management
- Procurement, stock, sales, and credit payment APIs
- Reports endpoints
- OpenAPI docs (`/api/docs`, `/api/docs.json`)
- Static hosting for `../frontend/public`

## Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Security middlewares: `helmet`, `cors`, `express-rate-limit`

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Running MongoDB instance (local or cloud)

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```
On Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

3. Fill in `.env` values:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/kgl
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

Important:
- `JWT_SECRET` is required. Server startup fails if missing/unsafe.
- If frontend is served by this same backend server, `CORS_ORIGIN` can be left empty in local development.

## Run Commands

- Start server:
```bash
npm start
```

- Start in dev mode (currently same command):
```bash
npm run dev
```

- Seed sample data:
```bash
npm run seed
```

Server default URL:
- `http://localhost:4000`

Health check:
- `GET http://localhost:4000/api/health`

## API Documentation

- Swagger JSON: `GET /api/docs.json`
- Swagger UI: `GET /api/docs`

When running locally:
- `http://localhost:4000/api/docs`

## Main Route Groups

- `/api/auth`
- `/api/users`
- `/api/branches`
- `/api/procurements`
- `/api/stocks`
- `/api/sales`
- `/api/credit-payments`
- `/api/reports`

## Seeded Demo Users

Created by `npm run seed` if they do not already exist:

- Manager
  - `username`: `dawa`
  - `password`: `manager123`
- Director
  - `username`: `orban`
  - `password`: `director123`
- Sales Agent
  - `username`: `hana`
  - `password`: `sales123`

Change these credentials immediately for non-demo environments.

## Folder Structure

```text
backend/
  config/         # DB and backend config
  controllers/    # Request handlers
  middleware/     # Auth, validation, error handlers
  models/         # Mongoose models
  routes/         # Express route modules
  utils/          # Shared helpers
  docs/swagger.js # OpenAPI document source
  server.js       # App entry point
  seed.js         # Seed script
```

## Security and Runtime Notes

- `helmet` is enabled with a CSP allow-list for known frontend/script CDNs.
- CORS:
  - allows configured `CORS_ORIGIN`
  - if empty, allows common localhost origins (`3000`, `4000`, `5173`)
- Global rate limit:
  - 300 requests per 15 minutes per IP
- JSON body size limit:
  - 1 MB

## Troubleshooting

- `MONGO_URI is not set`:
  - define `MONGO_URI` in `.env`
- `JWT_SECRET must be set`:
  - provide a strong `JWT_SECRET` value in `.env`
- `EADDRINUSE` on startup:
  - port is occupied; free it or change `PORT`
- CORS blocked:
  - set `CORS_ORIGIN` to your frontend origin and restart server

## Production Checklist

- Use a strong random `JWT_SECRET`
- Set explicit `CORS_ORIGIN` to trusted frontend origin
- Use managed MongoDB with network restrictions and credentials
- Rotate demo users and disable default credentials
- Run behind HTTPS reverse proxy
