# Fruteria Shop — Frontend

React + Vite admin and billing UI for the Fruteria Shop.

## Features

- Real-time billing with socket updates
- Admin dashboards: Products, Orders, Purchases, Staff Expenses
- Product Sales Analysis page with charts (Recharts)

## Tech

- React (Vite)
- Tailwind CSS + custom utilities
- Axios for API calls
- Recharts for visualizations

## Development

1. Install dependencies

```bash
cd frontend
npm install
```

2. Create a `.env` (example):

```
VITE_API_URL=http://localhost:5000/api
VITE_SHOP_NAME=Fruteria
```

3. Start the dev server

```bash
npm run dev
```

## Notes

- Global font: Inter is loaded by the app (`src/index.css`).
- Admin navbar is fixed at the top for consistent navigation.
- Product Analysis route: `/admin/product-analysis` (uses Recharts).
- Linting: run `npm run lint`.

If you want, I can add deployment instructions (Netlify/Vercel or Docker) and a short troubleshooting section.
