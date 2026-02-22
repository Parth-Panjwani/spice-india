# SpiceIndia - Student & Financial Management System

SpiceIndia is a comprehensive web-based platform built to streamline the management of students (e.g., MBBS entrants), their memberships, ID cards, and the agency's overarching financial ledgers (Income and Expenses). The system is uniquely designed to handle dual-currency transactions (Indian Rupees and Russian Rubals) dynamically.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Radix primitives)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Charts & Data Visualization**: [Recharts](https://recharts.org/)
- **Utilities**: 
  - `html2canvas` for high-resolution ID card generation
  - `date-fns` for precise date and tenure calculations
  - `Zod` & `react-hook-form` for form validation

---

## ✨ Core Features

### 1. 📊 Interactive Financial Dashboard
The dashboard provides a real-time, birds-eye view of the agency's performance.
- **KPI Metrics**: Total Income, Total Expenses, Net Balance, and Active Students count. Financials are shown in primarily INR (₹) with estimated equivalencies in Russian Rubals (₽).
- **Data Visualization**: A bar chart mapping out income vs. expenses over a 6-month historical period.
- **Activity Feed**: A chronological list of recent transactions (student fees collected, expenses paid).
- **Global Reset**: A "Danger Zone" module capable of purging all data (Students, History, Ledgers) completely, protected by a confirmation dialog.

### 2. 👨‍🎓 Student & Membership Management
A dedicated hub for handling incoming students and tracking their ongoing relationships with the agency.
- **Registration**: Captures standard details (Full Name, Batch Year, Course, Start Date, Tenure).
- **Auto-generated IDs**: Automatically assigns a unique `Student ID` (e.g., `SI-2024-8492`).
- **ID Card Generator**:
  - Live preview of a Standard ID-1 format (85.60 × 53.98 mm) identification card.
  - Supports local photo uploads.
  - One-click high-resolution image (`.png`) export directly to the user's device.
- **Membership Cycles**: 
  - Students are granted a tenure (1, 3, 6, 12 months). 
  - System automatically calculates the expiry date.
  - Supports a dedicated **Renewal Flow** for expired students, instantly logging the renewal fee to the income ledger.

### 3. 💰 Income Tracking
Tightly integrated with the Student Management module.
- **Automated Logging**: Adding a new student or renewing an existing one automatically prompts for a "Membership Fee" which gets instantly inserted into the Income database.
- **Exchange Rates**: Users can input the daily Rubal exchange rate, and the system automatically calculates the exact Rubal equivalent (₽) for the paid INR (₹) sum.

### 4. 📉 Advanced Ledger / Expense Tracking
Instead of a simple flat expense list, SpiceIndia categorizes expenses hierarchically by `Category`a -> `Entity` -> `Transaction`.
- **Entities**: Can be people (e.g., Staff members) or things (e.g., a specific apartment for Rent).
- **Dynamic Ledger Views**:
  - **Staff Logic**: If the category is "Staff", the ledger intelligently groups expenses into "Setup" (Visas, Travel Tickets), "Salary" (monthly retainers), and "Other Expenses". 
  - **Simple Logic**: For standard categories (like Groceries or Rent), it provides a standard chronological ledger.
- **Transaction Details**: Tracks the exact amount (INR + RUB equivalent), date, payment method, and specific subtypes (Salary, Visa, Rent, etc.).

---

## 🗄️ Database Architecture (Mongoose Models)

1. **`Student`**: Holds demographic and membership data (`fullName`, `studentId`, `course`, `year`, `status`, `photoUrl`).
2. **`Category`**: The top-level financial bucket (e.g., "Staff", "Rent", "Groceries"). Has a `type` (`expense` | `income`).
3. **`Entity`**: A specific sub-target under a category (e.g., "Rahul" under "Staff", or "Block A" under "Rent").
4. **`Income`**: Records inbound money (`amount`, `rubalAmount`, `source`, `student` ref).
5. **`Transaction`**: Records outbound money (`amount`, `category` ref, `entity` ref, `subType`, `paymentMethod`).

---

## 🛠️ Getting Started

First, ensure you have your MongoDB connection string set in `.env.local`:
```env
MONGODB_URI=your_mongodb_connection_string
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
