# Cross-Border E-Commerce Manager (環球選物 Global Shop)

A comprehensive e-commerce solution tailored for cross-border sellers, featuring a dual-view interface: a customer-facing shop and an internal admin dashboard.

## Features

### 🛍️ Client Side (Shop)
- **Product Catalog**: Browse products with filtering and sorting (Popularity, Price, Newest).
- **Shopping Cart**: Real-time cart management with quantity adjustments.
- **Checkout Process**:
  - Integrated 7-11 Myship (賣貨便) logic (auto-deduct $20 shipping deposit).
  - Bank transfer payment reporting.
  - Form validation for shipping details.
- **Member System**:
  - LINE Login integration (Mock).
  - Order history tracking.
  - Shipping status updates.

### 🛠️ Admin Side (Dashboard)
- **Product Management**:
  - CRUD operations for products.
  - Image upload (supports Base64).
  - Cost & Pricing calculation (Exchange rates, Local price, Material costs).
- **Accounting**:
  - Real-time revenue and profit calculation.
  - Sales performance analytics.
- **Order Management**:
  - Payment reconciliation (Verify bank transfers).
  - Shipping management (Link to 7-11 Myship).
  - Order status tracking (Pending -> Paid -> Shipped).

## Tech Stack

- **Framework**: Angular (v17+, Zoneless architecture)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **Build/Serve**: ES Modules (Import Maps) / Vite compatible

## Setup & Running

This project uses a modern Zoneless Angular setup.

### Development
1. Install dependencies (optional for intellisense):
   ```bash
   npm install
   ```
2. Run with a local development server (like Vite or Live Server):
   ```bash
   npm start
   ```

### GitHub Usage
This repository is formatted to be easily hosted or cloned. The `src` folder contains all logic, and `index.html` is the entry point.

## License

Private / Custom License
