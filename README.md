# Fruteria — Retail Billing & Inventory

Full-stack POS (Point of Sale) and inventory management template tailored for small retail shops.

## Project layout

- `backend/` — Node.js + Express API (MongoDB via Mongoose).
- `frontend/` — React (Vite) admin and billing UI.

## Quick features

- Real-time billing and socket-based updates.
- Inventory CRUD and categorization.
- Purchase and staff expense tracking.
- Customer loyalty points and simple discount rules.
- Admin dashboard with analytics and a Product Sales Analysis tab.

Recent notable UI/behavior changes

- Admin navbar is now fixed at the top for easier navigation.
- Global font changed to Inter for a cleaner look.
- Product Sales Analysis page uses a light card layout (route: `/admin/product-analysis`).
- Backend analytics use a 2:00 AM cutoff for "today" sales attribution.

## Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)

## Getting started (dev)

1. Start the backend

```bash
cd backend
npm install
# create .env with MONGODB_URI and PORT (optional: SHOP_NAME)
npm run dev
```

2. Start the frontend

```bash
cd frontend
npm install
# create .env with VITE_API_URL and VITE_SHOP_NAME
npm run dev
```

## Where to look

- Backend entry: `backend/server.js`
- Frontend entry: `frontend/src/main.jsx`
- Admin components: `frontend/src/admin`

If you want a production build, run `npm run build` in the `frontend` folder and deploy the built files behind the backend or a static host.

If you'd like, I can expand these READMEs with deployment steps, env examples, or a contributor guide.