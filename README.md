# 🏦 Bank Transaction System

A **production-ready full-stack** banking application built with **Node.js · Express · MongoDB** on the backend and **React 18 · Vite 5 · Tailwind CSS** on the frontend. Features secure JWT authentication, real-time fund transfers, double-entry ledger accounting, admin controls, email notifications, CSV export, and a professional dark-themed banking UI.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture & Data Flow](#architecture--data-flow)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Frontend Pages & Components](#frontend-pages--components)
- [Security](#security)
- [Development & Deployment](#development--deployment)

---

## 🎯 Overview

The **Bank Transaction System** is a professional banking platform that manages:

- **User Authentication** — Secure registration, login, and logout with JWT + httpOnly cookies
- **User Profiles** — Extended profile fields (phone, address, date of birth) with validated updates
- **Multi-Account Management** — Create and manage multiple accounts per user with INR currency
- **Fund Transfers** — Atomic transfers between accounts with double-entry ledger tracking
- **Transaction History** — Paginated, filterable history with date range, type, amount range, and sorting
- **CSV Export** — Stream filtered transactions to a downloadable `.csv` file
- **Admin Controls** — Freeze / unfreeze accounts to block transfers instantly
- **Email Notifications** — Transaction confirmations & admin alerts via SMTP (OAuth2 supported)
- **Audit Logging** — Every request recorded to a dedicated `audit_logs` collection
- **Idempotency** — Duplicate submissions safely return the original response

The system uses a **double-entry ledger accounting model** ensuring financial accuracy and full auditability.

---

## ✨ Features

### Core Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Register, login, logout with bcrypt hashing and token blacklisting |
| **Multi-Account** | Users can create multiple accounts; each gets ₹4,000 initial funding |
| **Fund Transfers** | Atomic transfers via MongoDB sessions with balance validation |
| **Ledger System** | Immutable DEBIT/CREDIT entries for every transaction |
| **Transaction History** | Paginated list with filters: date range, type, amount range, sort order |
| **Amount Filter Auto-Swap** | If minAmount > maxAmount, values are auto-swapped instead of erroring |
| **CSV Export** | Download filtered transactions as `.csv` |
| **Idempotency Keys** | Client-generated keys prevent duplicate transfers |
| **Email Notifications** | Success/failure emails to sender + admin alerts for large transfers |
| **Admin Dashboard** | Freeze/unfreeze accounts, view all accounts across users |
| **Profile Management** | Update name, phone, address (supports object or string), date of birth |
| **Audit Logging** | Non-blocking `res.on('finish')` middleware logs every request |
| **Error Boundary** | React error boundary prevents white-screen crashes |

### Security Features

- 🔐 **Password hashing** with bcrypt (10 salt rounds)
- 🔐 **JWT tokens** with `isAdmin` claim for role-based access
- 🔐 **Secure cookies** — httpOnly, secure in production, SameSite strict
- 🔐 **Token blacklist** — Logout invalidates tokens permanently (MongoDB TTL auto-cleanup)
- 🔐 **Rate limiting** — Auth routes (20 req/15 min), Transfer routes (30 req/15 min)
- 🔐 **Admin middleware** — Separate `authAdminMiddleware` for privileged operations
- 🔐 **Immutable ledger** — Ledger entries cannot be modified or deleted
- 🔐 **Account status checks** — Only ACTIVE accounts can send/receive transfers
- 🔐 **Audit trail** — Captures userId, IP, route, method (never passwords/tokens)
- 🔐 **Auth null-check** — Returns 401 if JWT user no longer exists in database

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework & routing |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **JWT (jsonwebtoken)** | Token-based authentication with `isAdmin` claim |
| **bcrypt** | Password hashing |
| **Nodemailer** | Email service (SMTP / OAuth2) |
| **express-validator** | Input validation |
| **express-rate-limit** | IP-based rate limiting |
| **fast-csv** | CSV streaming / export |
| **cookie-parser** | Cookie parsing middleware |
| **cors** | Cross-origin resource sharing |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite 5** | Build tool & dev server |
| **Tailwind CSS 3** | Utility-first styling (dark theme) |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with interceptors |
| **Framer Motion** | Animations & transitions |
| **Headless UI v2** | Accessible modal dialogs |
| **clsx** | Conditional class names |

---

## 📁 Project Structure

```
bank-transaction-system/
├── package.json                       # Monorepo scripts: install:all, dev, build
├── README.md
│
├── backend/                           # Node.js / Express API
│   ├── server.js                      # Entry point (port 3000)
│   ├── package.json
│   ├── scripts/
│   │   └── seedDemo.js               # Demo data seeder
│   └── src/
│       ├── app.js                     # Express setup, middleware & routes
│       ├── config/
│       │   ├── db.js                  # MongoDB connection
│       │   └── constants.js           # App-wide constants
│       ├── routes/
│       │   ├── auth.routes.js         # POST login|register|logout
│       │   ├── account.routes.js      # POST create, GET list, GET detail, GET balance
│       │   ├── transaction.routes.js  # POST transfer, GET history, GET export
│       │   ├── profile.routes.js      # GET|PATCH profile
│       │   └── admin.routes.js        # GET accounts, POST freeze|unfreeze
│       ├── controllers/
│       │   ├── auth.controller.js     # Register, login (isAdmin in JWT), logout
│       │   ├── account.controller.js  # Create, list, detail, balance
│       │   ├── transaction.controller.js  # Transfer, history, export
│       │   ├── profile.controller.js  # Get/update profile (address flattening)
│       │   └── admin.controller.js    # Freeze, unfreeze, list all accounts
│       ├── middleware/
│       │   ├── auth.middleware.js      # JWT verify + null check, admin guard
│       │   ├── auditLog.middleware.js  # Non-blocking audit via res.on('finish')
│       │   └── rateLimiter.middleware.js
│       ├── models/
│       │   ├── user.model.js          # name, email, password, isAdmin, profile fields
│       │   ├── account.model.js       # user, currency, status, balance (denormalized)
│       │   ├── transaction.model.js   # from, to, amount, status, idempotencyKey
│       │   ├── ledger.model.js        # account, transaction, type (DEBIT/CREDIT), amount
│       │   ├── blackList.model.js     # token blacklist with TTL auto-expiry
│       │   ├── audit.model.js         # Admin action audits
│       │   └── auditLog.model.js      # Request-level audit logs
│       ├── services/
│       │   └── email.service.js       # SMTP with Gmail OAuth2 support
│       └── utils/
│           ├── response.js            # successResponse / errorResponse helpers
│           └── validation.js          # Amount range, date range validators
│
└── frontend/                          # React 18 + Vite 5 SPA
    ├── package.json
    ├── vite.config.js                 # Dev proxy: /api/* → backend :3000
    ├── tailwind.config.js             # Custom colors: brand, credit, debit, surface
    ├── index.html
    └── src/
        ├── main.jsx                   # React root + providers
        ├── App.jsx                    # Routes + MobileNav state management
        ├── index.css                  # Tailwind directives + component classes
        ├── context/
        │   ├── AuthContext.jsx        # useAuth() — login, logout, user state
        │   └── ToastContext.jsx       # useToast() — notification system
        ├── lib/
        │   ├── api.js                 # Axios instance + API_ROUTES + helper functions
        │   ├── auth.js                # JWT helpers: setToken, getToken, isAdmin
        │   ├── format.js             # formatCurrency (₹), formatDate, formatDateTime
        │   └── download.js            # Blob download utilities
        ├── hooks/
        │   ├── useAccounts.js         # Account list + detail hooks
        │   ├── useAuth.js             # Auth state hook
        │   └── useTransactions.js     # Transaction list, create transfer, CSV export
        ├── components/
        │   ├── Header.jsx             # Top nav with mobile hamburger button
        │   ├── MobileNav.jsx          # Slide-in drawer with animated backdrop
        │   ├── AccountCard.jsx        # Account info card (status-aware, balance toggle)
        │   ├── TransferModal.jsx      # Headless UI dialog (select or manual ID input)
        │   ├── TransferForm.jsx       # Controlled transfer form with validation
        │   ├── TransactionList.jsx    # Color-coded transaction rows
        │   ├── FilterBar.jsx          # Date/type/amount/sort filter controls
        │   ├── Badge.jsx              # Status badge component
        │   ├── Toast.jsx              # Fixed notification stack
        │   ├── ProtectedRoute.jsx     # Auth guard → /login
        │   ├── AdminRoute.jsx         # Admin guard → /unauthorized
        │   └── ErrorBoundary.jsx      # Dark-themed error boundary
        └── pages/
            ├── Auth/
            │   ├── Login.jsx
            │   └── Register.jsx
            ├── Dashboard.jsx          # Account overview, stats, recent transactions
            ├── Accounts/
            │   ├── AccountsList.jsx   # All accounts with balance toggle
            │   └── AccountDetail.jsx  # Single account view + transfer form
            ├── Transactions.jsx       # Full history with filters + CSV export
            ├── Profile.jsx            # Profile editor
            ├── Admin/
            │   └── AdminDashboard.jsx # All accounts, freeze/unfreeze controls
            ├── NotFound.jsx           # 404
            └── Unauthorized.jsx       # 403
```

---

## 🏗 Architecture & Data Flow

### High-Level Architecture

```
Client (React SPA)
    ↓ HTTPS / Axios
Express Server (:3000)
    ↓
├── auditLogMiddleware   → logs to audit_logs (non-blocking, res.on('finish'))
├── rateLimiter          → auth (20/15min), transfer (30/15min)
├── authMiddleware       → JWT verify + blacklist + null check
├── express-validator    → input validation
├── Controller           → business logic
├── Models + Sessions    → MongoDB (ACID transactions)
├── Email Service        → SMTP / OAuth2 (if enabled)
└── Response             → successResponse / errorResponse format
```

### Transaction Flow (Double-Entry Ledger)

```
1. POST /api/transactions
   Body: { fromAccount, toAccount, amount, idempotencyKey }
   Header: Authorization: Bearer <JWT>

2. Validation
   ├── Check idempotency key (return cached if duplicate)
   ├── Verify both accounts exist and are ACTIVE
   ├── Verify sender is the authenticated user
   └── Check sufficient balance (denormalized account.balance)

3. MongoDB Session (atomic)
   ├── Create Transaction document (status: PENDING)
   ├── Create DEBIT ledger entry (fromAccount, -amount)
   ├── Create CREDIT ledger entry (toAccount, +amount)
   ├── Update fromAccount.balance -= amount
   ├── Update toAccount.balance += amount
   ├── Set transaction status = COMPLETED
   └── COMMIT (all-or-nothing)

4. Post-transaction
   ├── Send success email to sender
   ├── Send admin alert if amount > threshold
   └── Return 201 + transaction details
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas) — must be a **replica set** for transaction support
- **npm** v9+

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd bank-transaction-system

# 2. Install all dependencies (backend + frontend)
npm run install:all

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, JWT secret, etc.

# 4. Start both servers (development)
npm run dev
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:3000` |
| Frontend App | `http://localhost:5173` |

### Other Commands

```bash
npm run seed           # Seed demo users (demo+alice@example.com, demo+bob@example.com)
npm run build          # Build frontend for production (→ frontend/dist/)
npm run start          # Start backend in production mode (serves frontend/dist/)
```

---

## 🔧 Environment Configuration

Create `backend/.env` from `backend/.env.example`:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB (must be a replica set for transactions)
MONGO_URI=YOUR_MONGO_URI

# JWT Secret (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET

# Email Configuration
DISABLE_EMAILS=true                    # Set to 'false' to enable email sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password            # Use app-specific password, never login password
EMAIL_FROM=no-reply@yourbank.com

# Gmail OAuth2 (optional, more secure than app passwords)
# GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
# GMAIL_CLIENT_SECRET=your-client-secret
# GMAIL_REFRESH_TOKEN=your-refresh-token

# Admin alert email
ADMIN_ALERT_EMAIL=admin@yourbank.com

# Rate Limiting (optional, these are defaults)
AUTH_RATE_LIMIT_WINDOW_MIN=15
AUTH_RATE_LIMIT_MAX=20
TRANSFER_RATE_LIMIT_WINDOW_MIN=15
TRANSFER_RATE_LIMIT_MAX=30
```

**Frontend** (optional): Create `frontend/.env.local`:
```env
VITE_API_BASE_URL=                     # Empty = use Vite proxy (default for dev)
VITE_USE_COOKIE_AUTH=true              # Enable httpOnly cookie auth
VITE_ALLOW_DEMO=true                   # Show demo login button
```

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT (also set as httpOnly cookie) |
| `POST` | `/api/auth/logout` | Logout (blacklists token) |

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** `201`:
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully.",
    "user": { "_id": "...", "name": "John Doe", "email": "john@example.com" },
    "token": "eyJhbGci..."
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "john@example.com", "password": "SecurePass123!" }
```

**Response** `200`: Same structure as register. JWT includes `{ userId, isAdmin }`.

---

### Accounts (`/api/account`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/account` | JWT | Create a new account |
| `GET` | `/api/account` | JWT | List user's accounts |
| `GET` | `/api/account/:accountId` | JWT | Get account details |
| `GET` | `/api/account/balance/:accountId` | JWT | Get account balance & status |

---

### Transactions (`/api/transactions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/transactions` | JWT | Create a fund transfer |
| `GET` | `/api/transactions` | JWT | List transactions (paginated, filterable) |
| `GET` | `/api/transactions/export` | JWT | Export transactions as CSV |

#### Query Parameters for GET `/api/transactions`

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `type` | string | Filter: `DEBIT`, `CREDIT`, or `ALL` |
| `startDate` | ISO date | Filter: transactions after this date |
| `endDate` | ISO date | Filter: transactions before this date |
| `minAmount` | number | Filter: minimum amount (auto-swapped if > maxAmount) |
| `maxAmount` | number | Filter: maximum amount (auto-swapped if < minAmount) |
| `sortBy` | string | Sort field: `date`, `amount` (default: `date`) |
| `sortOrder` | string | Sort direction: `asc`, `desc` (default: `desc`) |

---

### Profile (`/api/profile`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/profile` | JWT | Get user profile |
| `PATCH` | `/api/profile` | JWT | Update profile fields |

Updatable fields: `name`, `phoneNumber`, `address` (string or `{street, city, country}` object), `dateOfBirth`.

---

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/accounts` | Admin JWT | List all accounts (with user info) |
| `POST` | `/api/admin/accounts/:accountId/freeze` | Admin JWT | Freeze an account |
| `POST` | `/api/admin/accounts/:accountId/unfreeze` | Admin JWT | Unfreeze an account |

---

## 📊 Database Schema

### User
```
name         String (required)
email        String (required, unique, lowercase)
password     String (hashed, select: false)
isAdmin      Boolean (default: false, select: false)
phoneNumber  String
address      String
dateOfBirth  Date
```

### Account
```
user         ObjectId → User (required)
currency     String (default: 'INR')
status       String: ACTIVE | FROZEN | CLOSED (default: ACTIVE)
balance      Number (default: 4000, denormalized for fast reads)
```

### Transaction
```
fromAccount  ObjectId → Account
toAccount    ObjectId → Account
amount       Number (required, > 0)
status       String: PENDING | COMPLETED | FAILED
idempotencyKey  String (unique, sparse)
createdAt    Date (auto)
```

### Ledger (Immutable)
```
account      ObjectId → Account
transaction  ObjectId → Transaction
type         String: DEBIT | CREDIT
amount       Number
createdAt    Date (auto)
```

### BlackList (Token Blacklist)
```
token        String (unique)
createdAt    Date (auto, TTL: 7 days)
```

### AuditLog (Request Logging)
```
userId       ObjectId → User
method       String (GET, POST, etc.)
url          String
statusCode   Number
ip           String
userAgent    String
responseTime Number (ms)
createdAt    Date (auto)
```

### Audit (Admin Actions)
```
actor        ObjectId → User
action       String (ACCOUNT_FROZEN, ACCOUNT_UNFROZEN, etc.)
entityType   String
entityId     ObjectId
meta         Mixed
source       String
createdAt    Date (auto)
```

---

## 🖥 Frontend Pages & Components

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Login** | `/login` | Email/password login form |
| **Register** | `/register` | New user registration |
| **Dashboard** | `/dashboard` | Account overview, stats cards, recent transactions |
| **Accounts** | `/accounts` | All accounts with combined balance, transfer quick-action |
| **Account Detail** | `/accounts/:id` | Single account view with transfer form |
| **Transactions** | `/transactions` | Full history with filter bar + CSV export |
| **Profile** | `/profile` | Edit profile fields |
| **Admin** | `/admin` | Admin dashboard: all accounts, freeze/unfreeze |
| **Not Found** | `*` | 404 page |
| **Unauthorized** | `/unauthorized` | 403 page |

### Key Components

| Component | Purpose |
|-----------|---------|
| **Header** | Sticky top nav with desktop links + mobile hamburger |
| **MobileNav** | Slide-in drawer with animated backdrop (Framer Motion) |
| **AccountCard** | Account info with status badge, balance show/hide toggle |
| **TransferModal** | Headless UI dialog — select from own accounts or enter ID manually |
| **TransferForm** | Standalone transfer form with validation |
| **TransactionList** | Color-coded rows (green=credit, red=debit) |
| **FilterBar** | Date range, type, amount range, sort controls |
| **Toast** | Fixed notification stack with auto-dismiss |
| **ErrorBoundary** | Dark-themed crash fallback with reload button |

### Theme

The app uses a **dark theme** throughout:
- Background: `gray-950` / `gray-900`
- Cards: `gray-800` with `gray-700` borders
- Text: `gray-100` (primary), `gray-400` (secondary)
- Brand: Navy blue (`brand-500` to `brand-800`)
- Credit: Green (`credit-500` to `credit-700`)
- Debit: Red (`debit-400` to `debit-700`)
- Currency: Indian Rupee (₹) via `Intl.NumberFormat` with `en-IN` locale

---

## 🔒 Security

### Authentication Flow

```
Register → bcrypt hash → save user → generate JWT (userId + isAdmin) → set httpOnly cookie + return token
Login    → verify password → generate JWT (userId + isAdmin) → set httpOnly cookie + return token
Logout   → add token to BlackList → clear cookie
```

### Cookie Configuration (Production)

```javascript
{
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 3 * 24 * 60 * 60 * 1000  // 3 days
}
```

### Rate Limiting

| Route | Window | Max Requests |
|-------|--------|-------------|
| `/api/auth/*` | 15 minutes | 20 |
| `/api/transactions` (POST) | 15 minutes | 30 |

---

## 🚢 Development & Deployment

### Development

```bash
npm run dev              # Starts both backend (nodemon) and frontend (vite) concurrently
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3000`, so no CORS issues in development.

### Production Build

```bash
npm run build            # Builds frontend → frontend/dist/
npm run start            # Starts backend which serves frontend/dist/ as static files
```

### Deployment (Render)

1. Push to GitHub `main` branch
2. Create a **Web Service** on Render:
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm run start`
   - **Environment**: Node.js
3. Set all environment variables from `.env.example`
4. Ensure MongoDB Atlas allows connections from Render IPs

### Demo Seed

```bash
npm run seed
```

Creates two demo users with accounts:
- `demo+alice@example.com` / `Password123!`
- `demo+bob@example.com` / `Password123!`

---

## 📝 Changelog (Latest)

### Bug Fixes & Improvements

- **Amount filter auto-swap** — `minAmount > maxAmount` now auto-swaps instead of returning an error
- **Admin dashboard** — Fixed broken freeze/unfreeze (correct API routes, POST method, response parsing)
- **Account status** — Fixed `account.isFrozen` (non-existent field) → `account.status === "FROZEN"` across all components
- **JWT `isAdmin` claim** — Admin flag now included in JWT payload for both register and login
- **Account detail route** — Added `GET /api/account/:accountId` endpoint (was returning 404)
- **Admin list accounts** — Added `GET /api/admin/accounts` endpoint with user population
- **Token blacklist TTL** — Fixed `expiredAfterSeconds` → `expireAfterSeconds` (MongoDB spelling)
- **Auth null check** — Returns 401 if JWT user no longer exists in database
- **Cookie security** — Production-safe httpOnly/secure/sameSite cookie options
- **Audit middleware** — Rewritten to use `res.on('finish')` so `req.user` is populated
- **Profile address** — Supports both string and `{street, city, country}` object input (flattened to string)
- **Balance consistency** — Uses denormalized `account.balance` instead of aggregation for reads
- **TransferForm** — Fixed response parsing (`data.data.transaction` not `data.transaction`)
- **TransferModal** — Fixed `formatCurrency` receiving string instead of number
- **MobileNav** — Wired up with state management (was rendered with no props)
- **Header** — Added mobile hamburger button for small screens
- **Tailwind** — Added missing `debit-400` and `credit-400` color shades
- **ErrorBoundary** — Converted to dark theme to match app styling
- **Currency** — All amounts display in ₹ (Indian Rupee) format

---

## 📄 License

This project is for educational and demonstration purposes.
