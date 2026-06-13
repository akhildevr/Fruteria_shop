# Retail Billing API (Backend)

Core backend for the Fruteria billing app — handles orders, customers, purchases, staff expenses, and real-time broadcasts.

## Tech
- Node.js + Express
- MongoDB with Mongoose
- Socket.io for realtime events

## Local development

1. Install dependencies

```bash
cd backend
npm install
```

2. Create a `.env` file with at least:

- `MONGODB_URI` — MongoDB connection string
- `PORT` — optional, default used in code
- `SHOP_NAME` — optional shop display name
- (optional) `JWT_SECRET` — for future auth

3. Start for development (uses `nodemon`):

```bash
npm run dev
```

Or run production: `npm start`

## Notes & recent changes

- Analytics: `today` sales calculation now uses a 2:00 AM cutoff to better align with store shifts.
- The backend exposes REST endpoints under `/api` — see `routes/` for details.

## Useful folders

- `controllers/` — business logic
- `models/` — Mongoose schemas
- `routes/` — API endpoints

## Production considerations

- Add authentication & role-based access for admin/cashier.
- Add request validation (Joi/Zod), logging, and secure image storage for product photos.