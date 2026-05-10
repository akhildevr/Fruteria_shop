# Fruteria Shop Management System

A full-stack POS (Point of Sale) and inventory management application designed specifically for fruit shops.

## Project Structure

-   `/backend`: Node.js/Express API with MongoDB/Mongoose.
-   `/frontend`: React application built with Vite and Tailwind CSS.

## Core Functionalities

### Inventory Management
- Create, Read, Update, and Delete (CRUD) operations for products.
- Categorization and pricing management via `productController.js`.

### Billing & Orders
- Responsive billing screen for quick item selection.
- Real-time cart updates.
- Automated reward point calculation and discount application upon checkout.

## Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Add MONGODB_URI and PORT to your .env
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Set VITE_API_URL in .env
npm run dev
```