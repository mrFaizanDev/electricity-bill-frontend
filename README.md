# ⚡ Electricity Bill & Sub-Meter Calculator (Frontend)

A modern, responsive React application designed for property managers, landlords, and shop owners to calculate, split, record, and print electricity bills across multiple tenants/sub-meters with high precision.

---

## 🌟 Key Features

- **⚡ Precise Sub-Meter Splitter**: Auto-calculates consumed units (`Current Reading - Old Reading`) and exact proportional share per tenant/shop.
- **🔄 Flexible Meter Adjustments**: Supports positive and negative shared meter charges (e.g. Demand Charges, Duty, FPPA Surcharges, and Arrear adjustments).
- **💡 One-Click Rate Calculation**: Automatically calculates the exact per-unit rate from total bill and master units.
- **🖨️ Print & Download Receipts**: Clean, print-optimized bill invoices for distribution to tenants.
- **📋 Historical Record Archive**: Searchable database of past bills with debounced searching and summary statistics.
- **👥 Role-Based Access & User Management**:
  - **Full Access (Admin)**: Create bills, delete records, manage users, and reset user passwords.
  - **Standard (Viewer)**: View records, calculate breakdowns, and change personal credentials.
- **🚀 Ultra-Fast & Responsive**: Mobile-friendly, clean UI built with modern React.

---

## 🛠️ Tech Stack

- **Framework**: React 18
- **Routing**: React Router DOM (v7)
- **Styling**: Modern Custom CSS (Flexbox, Grid, Responsive Variables)
- **Deployment**: Netlify (Single Page App with `_redirects` routing)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- Running Backend API (see `electricity-bill-backend`)

### 2. Installation
```bash
# Clone repository
git clone https://github.com/mrFaizanDev/electricity-bill-frontend.git
cd electricity-bill-frontend

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root folder:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run Development Server
```bash
npm start
```
The app will open automatically at `http://localhost:3000`.

---

## 🌐 Deploy to Netlify (Free)

1. Connect your repository on [Netlify](https://app.netlify.com/).
2. Set Build Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
3. Add Environment Variable in Netlify:
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
4. Click **Deploy**.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
