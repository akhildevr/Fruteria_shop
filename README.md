# Retail Billing & Inventory Management Template

A professional, full-stack POS (Point of Sale) and inventory management template. Configurable for any retail business via environment variables.

## Project Structure

- `/backend`: Node.js/Express API with MongoDB/Mongoose.
  - `/models`: Schemas for Products, Orders, Customers, Categories, and Purchases.
  - `/controllers`: Logic for transaction processing and data management.
  - `/routes`: API endpoint definitions.
- `/frontend`: React application built with Vite and Tailwind CSS.
  - `/src/admin`: Management views for Products, Orders, Purchases, and Customers.
  - `/src/billing`: POS interface for sales.

## Core Functionalities

### Dashboard & Analytics
- Real-time sales monitoring (Today's Sales, Total Sales, Total Purchases).
- Daily Sales Report generation with PDF export capability.

### Inventory Management
- Create, Read, Update, and Delete (CRUD) operations for products.
- Categorization and pricing management via `productController.js`.

### Billing & Orders
- Responsive billing screen for quick item selection.
- Real-time cart updates.
- Support for **Cash** and **UPI** payment methods.
- Built-in Cash Calculator (Received vs Balance) for cash transactions.
- Automated logic: 5% Discount for orders ≥ ₹500, or 5% Reward Points for orders < ₹500.

### Purchase Management
- Record and track business expenses/inventory purchases.
- Support for units: KG, G, Ltr, PCS.
- Historical tracking with cost analysis.

### Customer Loyalty
- Integrated reward points system based on mobile number identification.
- Wallet tracking and automatic redemption logic.

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
# Set VITE_API_URL and VITE_SHOP_NAME in .env
npm run dev
```