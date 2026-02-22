# Bank Transaction System

A robust, production-ready **full-stack** banking application: a Node.js/Express REST API backend paired with a React + Vite + Tailwind frontend — featuring secure authentication, real-time transaction management, CSV export, admin controls, and a 3D parallax hero.

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
  - [Authentication](#authentication-routes-apiauth)
  - [Profile](#profile-routes-apiprofile)
  - [Account](#account-routes-apiaccount)
  - [Transactions](#transaction-routes-apitransactions)
  - [Admin](#admin-routes-apiadmin)
- [Database Schema](#database-schema)
- [How It Works](#how-it-works)
- [Key Components](#key-components)
- [Error Handling](#error-handling)
- [Development & Deployment](#development--deployment)

---

## 🎯 Overview

The **Bank Transaction System** is a Node.js/Express backend API designed to manage:
- **User Authentication**: Secure registration, login, and logout with JWT tokens
- **User Profiles**: Extended profile fields (phone, address, date of birth) with validated update endpoint
- **Account Management**: Create and manage multiple accounts per user with different currencies
- **Transactions**: Transfer funds between accounts with ledger-based balance tracking
- **Transaction History**: Paginated, filterable history with CSV export
- **Admin Controls**: Freeze/unfreeze accounts to block transfers
- **Security**: Token blacklisting, password hashing, rate limiting, middleware-based authorization
- **Audit Logging**: Every request is recorded to a dedicated `audit_logs` collection
- **Notifications**: Email alerts for transaction completions (disabled safely in dev via env flag)

This system uses a **double-entry ledger accounting model** to ensure financial accuracy and auditability of all transactions.

---

## ✨ Features

### Core Features
- ✅ **User Registration & Authentication** - Secure JWT-based authentication with bcrypt password hashing
- ✅ **User Profile Management** - Extended profile (phoneNumber, address, dateOfBirth) with validated PATCH endpoint
- ✅ **Multi-Account Support** - Users can create and manage multiple accounts in different currencies
- ✅ **Fund Transfers** - Transfer money between accounts with balance validation
- ✅ **Transaction History** - Paginated, filterable history (date range, type, amount range, sorting)
- ✅ **CSV Export** - Stream filtered transactions to a downloadable `.csv` file
- ✅ **Ledger System** - Every transaction creates immutable DEBIT/CREDIT entries for audit trails
- ✅ **Idempotency** - Duplicate requests with same idempotency key return cached responses
- ✅ **Token Blacklisting** - Logout invalidates tokens permanently
- ✅ **Email Notifications** - Transaction confirmations sent via SMTP; suppressed in dev with `DISABLE_EMAILS=true`
- ✅ **MongoDB Transactions** - ACID compliance with atomic operations
- ✅ **Audit Logging** - Every request persisted to `audit_logs` collection (no secrets stored)
- ✅ **Admin Controls** - Freeze / unfreeze accounts to block transfers instantly
- ✅ **Input Validation** - `express-validator` on all write endpoints

### Security Features
- 🔐 Password hashing with bcrypt
- 🔐 JWT token-based authentication
- 🔐 Token blacklist on logout
- 🔐 Protected middleware for authorized routes
- 🔐 Admin-only middleware (`authAdminMiddleware`) for privileged operations
- 🔐 Rate limiting on auth routes (20 req / 15 min) and transfer route (30 req / 15 min), configurable via env
- 🔐 Immutable ledger entries (cannot be modified/deleted)
- 🔐 Account status validation (only ACTIVE accounts can transact)
- 🔐 Audit log captures userId, IP, route, method — never passwords or raw tokens

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework & routing |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Token-based authentication |
| **bcrypt** | Password hashing |
| **Nodemailer** | Email service (SMTP) |
| **express-validator** | Request body / query validation |
| **express-rate-limit** | IP-based rate limiting |
| **fast-csv** | CSV streaming / export |
| **Dotenv** | Environment variable management |
| **Cookie-Parser** | Cookie parsing middleware |

**Dev Dependencies:**
- Nodemon (auto-reload on file changes)

---

## 📁 Project Structure

This project uses a **monorepo layout** — backend and frontend each live in their own subdirectory.

```
bank-transaction-system/               ← repo root
├── package.json                       # Monorepo root: install:all, dev, build scripts
├── .gitignore                         # Shared git ignore rules
├── README.md                          # This file
│
├── backend/                           # Node.js / Express API
│   ├── server.js                      # Application entry point  (node backend/server.js)
│   ├── package.json                   # Backend dependencies & scripts
│   ├── package-lock.json
│   ├── .env                           # Environment variables (git-ignored)
│   ├── .env.example                   # Safe placeholder reference
│   │
│   ├── scripts/
│   │   └── seedDemo.js               # Demo data seeder
│   │
│   └── src/
│       ├── app.js                     # Express app setup, middleware & route wiring
│       ├── config/
│       │   └── db.js                  # MongoDB connection config
│       ├── routes/
│       │   ├── auth.routes.js         # POST /api/auth/login|register|logout
│       │   ├── account.routes.js      # GET|POST /api/account
│       │   ├── transaction.routes.js  # POST /api/transactions + history + CSV export
│       │   ├── profile.routes.js      # GET|PATCH /api/profile
│       │   └── admin.routes.js        # PATCH /api/admin/accounts/:id/freeze|unfreeze
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── account.controller.js
│       │   ├── transaction.controller.js
│       │   ├── profile.controller.js
│       │   └── admin.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js        # JWT verify, authAdmin
│       │   ├── auditLog.middleware.js    # Non-blocking request logger
│       │   └── rateLimiter.middleware.js # express-rate-limit (auth + transfer)
│       ├── models/
│       │   ├── user.model.js
│       │   ├── account.model.js
│       │   ├── transaction.model.js
│       │   ├── ledger.model.js
│       │   ├── blackList.model.js
│       │   └── auditLog.model.js
│       └── services/
│           └── email.service.js          # SMTP email with DISABLE_EMAILS flag
│
└── frontend/                          # React 18 + Vite 5 SPA
    ├── package.json
    ├── vite.config.js                 # Dev proxy: /api/* → backend :3000
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx                   # React root (BrowserRouter → providers → App)
        ├── App.jsx                    # Route definitions (lazy-loaded pages)
        ├── index.css                  # Tailwind + component shortcuts
        ├── context/
        │   ├── AuthContext.jsx        # useAuth() — login, logout, refreshUser
        │   └── ToastContext.jsx       # useToast() — showToast, removeToast
        ├── lib/
        │   ├── api.js                 # Axios instance + API_ROUTES constants
        │   ├── auth.js                # JWT helpers: setToken, getToken, isAdmin
        │   └── download.js            # downloadBlob, csvFilename utilities
        ├── components/
        │   ├── ProtectedRoute.jsx     # Redirects to /login if unauthenticated
        │   ├── AdminRoute.jsx         # Redirects to /unauthorized if not admin
        │   ├── Header.jsx             # Top nav bar with mobile hamburger
        │   ├── MobileNav.jsx          # Slide-in side drawer (framer-motion)
        │   ├── Toast.jsx              # Fixed notification stack
        │   ├── AccountCard.jsx        # Account info + Transfer / Details buttons
        │   ├── TransactionList.jsx    # Colour-coded transaction rows
        │   ├── TransferForm.jsx       # Controlled fund transfer form
        │   ├── FilterBar.jsx          # Date/type/amount/sort filter controls
        │   ├── ThreeDParallaxHero.jsx # react-three-fiber hero (lazy, reduced-motion safe)
        │   └── Scene3DInner.jsx       # Actual Three.js canvas (code-split)
        └── pages/
            ├── Auth/
            │   ├── Login.jsx
            │   └── Register.jsx
            ├── Accounts/
            │   └── AccountDetail.jsx
            ├── Admin/
            │   └── AdminDashboard.jsx
            ├── Dashboard.jsx
            ├── Transactions.jsx
            ├── Profile.jsx
            ├── NotFound.jsx           # 404
            └── Unauthorized.jsx       # 403
```

---

## 🏗 Architecture & Data Flow

### High-Level Architecture Diagram

```
User Request
    ↓
Express Server (port 3000)
    ↓
auditLogMiddleware  ← logs every request to audit_logs (non-blocking)
    ↓
Rate Limiter (auth / transfer routes)
    ↓
Routes (auth / account / transaction / profile / admin)
    ↓
auth Middleware (JWT verification + blacklist check)
    ↓
express-validator (input validation on write routes)
    ↓
Controller (business logic)
    ↓
Models (database operations)
    ↓
MongoDB (data persistence)
    ↓
Email Service (if DISABLE_EMAILS !== "true")
    ↓
Response JSON
```

### Request Flow for a Transaction

```
1. User sends POST /api/transactions/
   ├── Body: { fromAccount, toAccount, amount, idempotencyKey }
   ├── Headers: { Authorization: "Bearer <JWT_TOKEN>" }
   
2. authMiddleware.authMiddleware
   ├── Extracts token from header/cookies
   ├── Verifies JWT signature
   ├── Checks token blacklist
   ├── Attaches user info to req.user
   └── Next → Controller
   
3. transactionController.createTransaction()
   ├── Validates required fields
   ├── Checks idempotency key (prevents duplicates)
   ├── Fetches user accounts from DB
   ├── Validates account status (must be ACTIVE)
   ├── Calculates balance from ledger aggregation
   ├── Validates sufficient funds
   ├── Starts MongoDB transaction session
   ├── Creates transaction document (status: PENDING)
   ├── Creates DEBIT ledger entry (fromAccount)
   ├── Creates CREDIT ledger entry (toAccount)
   ├── Marks transaction COMPLETED
   ├── Commits all changes atomically
   ├── Sends email notification
   └── Returns success response
   
4. Response sent to client
   └── Status 201 + Transaction details
```

### Balance Calculation Flow

```
Account.getBalance()
    ↓
MongoDB Aggregation Pipeline:
    1. $match: Filter ledger entries for this account
    2. $group: Calculate totalDebit & totalCredit
    3. $project: balance = totalCredit - totalDebit
    ↓
Returns: balance (positive = surplus, negative = overdraft)
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm v9+

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd bank-transaction-system
```

### Step 2: Install dependencies

**Option A — install both at once from the repo root:**
```bash
npm run install:all
```

**Option B — install individually:**
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### Step 3: Configure backend environment
```bash
cp backend/.env.example backend/.env
# Then edit backend/.env with your MongoDB URI, JWT secret, SMTP details, etc.
```

### Step 4: Configure frontend environment (optional)
```bash
cp frontend/.env.example frontend/.env.local
# Set VITE_API_BASE_URL if not using the built-in Vite proxy
# Set VITE_ALLOW_DEMO=true to enable the demo login button
```

### Step 5: Start MongoDB
```bash
# Local MongoDB:
mongod

# OR use a MongoDB Atlas connection string in backend/.env
```

### Step 6: Run the application

**Run backend only (API server on :3000):**
```bash
cd backend && npm run dev
```

**Run frontend only (Vite dev server on :5173, proxies /api/* → :3000):**
```bash
cd frontend && npm run dev
```

**Run both simultaneously from repo root (Windows):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build          # builds frontend/dist/
npm run start          # starts backend in production mode
```

**Seed demo data:**
```bash
npm run seed           # creates demo+alice@example.com and demo+bob@example.com
```

Backend API: `http://localhost:3000`  
Frontend app: `http://localhost:5173`

---

## 🔧 Environment Configuration

Create `backend/.env` (copy from `backend/.env.example`):

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB (local)
MONGO_URI=YOUR LOCAL MONGODB URI
# MongoDB Atlas example (replace placeholders with your actual credentials):
# MONGO_URI=YOUR ATLAS URI

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET

# Email — set DISABLE_EMAILS=true in dev to suppress sends
DISABLE_EMAILS=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=no-reply@example.com
SMTP_PASS=REPLACE_WITH_APP_PASSWORD
EMAIL_FROM=no-reply@example.com

# Rate Limiting (optional — these are the defaults)
AUTH_RATE_LIMIT_WINDOW_MIN=15
AUTH_RATE_LIMIT_MAX=20
TRANSFER_RATE_LIMIT_WINDOW_MIN=15
TRANSFER_RATE_LIMIT_MAX=30
```

> Copy `.env.example` from the repo root for a full reference with all available variables.

**Important Notes:**
- `JWT_SECRET`: Generate a strong random string (min 32 characters)
- `DISABLE_EMAILS=true`: Prevents any real emails from being sent (safe for development)
- `SMTP_PASS`: Use an app-specific password, never your login password
- Never commit `.env` to version control

---

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```
**Response:** `201 Created`
```json
{
  "message": "User registered successfully.",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
**Response:** `200 OK`
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCIrthbbXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Logout User
```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>
```
**Response:** `200 OK`
```json
{
  "message": "User logged out successfully."
}
```

---

### Account Routes (`/api/account`)

#### Create Account
```http
POST /api/account/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "currency": "INR"
}
```
**Response:** `201 Created`
```json
{
  "message": "Account created successfully.",
  "account": {
    "_id": "507f1f77bcf86cd729489012",
    "user": "507f1f77bcf86cd795436011",
    "currency": "INR",
    "status": "ACTIVE",
    "createdAt": "2026-02-21T10:00:00Z"
  }
}
```

#### Get User Accounts
```http
GET /api/account/
Authorization: Bearer <JWT_TOKEN>
```
**Response:** `200 OK`
```json
{
  "message": "Accounts fetched successfully.",
  "accounts": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user": "507f1f77bcf86cd799439011",
      "currency": "INR",
      "status": "ACTIVE"
    }
  ]
}
```

#### Get Account Balance
```http
GET /api/account/balance/:accountId
Authorization: Bearer <JWT_TOKEN>
```
**Response:** `200 OK`
```json
{
  "message": "Balance fetched successfully.",
  "balance": 50000,
  "accountId": "507f1f77bcf86cd799439012"
}
```

---

### Profile Routes (`/api/profile`)

#### Get Profile
```http
GET /api/profile
Authorization: Bearer <JWT_TOKEN>
```
**Response:** `200 OK` — returns `name, email, phoneNumber, address, dateOfBirth`.

#### Update Profile
```http
PATCH /api/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phoneNumber": "+919876543210",
  "address": "123 Main St, Mumbai",
  "dateOfBirth": "1992-08-20"
}
```
**Response:** `200 OK` — returns updated user (non-sensitive fields only).

---

### Admin Routes (`/api/admin`)

> Requires an account with `isAdmin: true`. Contact a super-admin or run a one-off DB update to assign the flag.

#### Freeze Account
```http
POST /api/admin/accounts/:accountId/freeze
Authorization: Bearer <ADMIN_JWT_TOKEN>
```
**Response:** `200 OK` — account status set to `FROZEN`. Transfers from frozen accounts are blocked.

#### Unfreeze Account
```http
POST /api/admin/accounts/:accountId/unfreeze
Authorization: Bearer <ADMIN_JWT_TOKEN>
```
**Response:** `200 OK` — account status restored to `ACTIVE`.

---

### Transaction Routes (`/api/transactions`)

#### Create Transaction
```http
POST /api/transactions/
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fromAccount": "507f1f77bcf86cd799439012",
  "toAccount": "507f1f77bcf86cd799439013",
  "amount": 5000,
  "idempotencyKey": "unique-key-12345"
}
```
**Response:** `201 Created`
```json
{
  "message": "Transaction completed successfully.",
  "transaction": {
    "_id": "507f1f77bcf86cd799439014",
    "fromAccount": "507f1f77bcf86cd799439012",
    "toAccount": "507f1f77bcf86cd799439013",
    "amount": 5000,
    "status": "COMPLETED",
    "idempotencyKey": "unique-key-12345",
    "createdAt": "2026-02-21T10:05:00Z"
  }
}
```

#### Get Transaction History
```http
GET /api/transactions
Authorization: Bearer <JWT_TOKEN>
```
**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO date | Filter `createdAt >= startDate` |
| `endDate` | ISO date | Filter `createdAt <= endDate` |
| `type` | `credit`\|`debit` | Filter by direction relative to user (omit for all) |
| `minAmount` | number | Lower bound on `amount` |
| `maxAmount` | number | Upper bound on `amount` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Records per page (default: 20, max: 100) |
| `sort` | `field:asc\|desc` | e.g. `amount:desc` or `createdAt:asc` |

**Response:** `200 OK`
```json
{ "data": [...], "page": 1, "limit": 20, "total": 45 }
```

#### Export Transactions as CSV
```http
GET /api/transactions/export?startDate=2026-01-01&type=debit
Authorization: Bearer <JWT_TOKEN>
```
Supports the same query params as the history endpoint. Downloads a `.csv` file.
If `page`/`limit` are omitted, exports **all** matching records (max 1000 per request).

---

#### Initial Funds Transaction (System)
```http
POST /api/transactions/system/initial-funds
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "toAccount": "507f1f77bcf86cd799439012",
  "amount": 100000,
  "idempotencyKey": "initial-funds-12345"
}
```
**Response:** `201 Created`
```json
{
  "message": "Initial funds transaction completed successfully.",
  "transaction": { ... }
}
```

---

## 🗄 Database Schema

### User Schema
```javascript
{
  _id: ObjectId,
  name: String (required, 2-100 chars),
  email: String (required, unique, validated),
  password: String (hashed with bcrypt, select: false),
  phoneNumber: String (optional, E.164-compatible pattern),
  address: String (optional, max 300 chars),
  dateOfBirth: Date (optional, ISO 8601, must be in the past),
  isAdmin: Boolean (default: false, select: false),
  systemUser: Boolean (default: false, immutable, select: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Account Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: "user", required),
  status: String (enum: ["ACTIVE", "FROZEN", "CLOSED"], default: "ACTIVE"),
  currency: String (default: "INR", required),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Schema
```javascript
{
  _id: ObjectId,
  fromAccount: ObjectId (ref: "account", required),
  toAccount: ObjectId (ref: "account", required),
  amount: Number (required, min: 0.01),
  status: String (enum: ["PENDING", "COMPLETED", "FAILED", "REVERSED"], default: "PENDING"),
  idempotencyKey: String (unique, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Ledger Schema
```javascript
{
  _id: ObjectId,
  account: ObjectId (ref: "account", required, immutable),
  amount: Number (required, immutable),
  transaction: ObjectId (ref: "transaction", required),
  type: String (enum: ["DEBIT", "CREDIT"], required, immutable),
  createdAt: Date,
  updatedAt: Date
}
```

### Token Blacklist Schema
```javascript
{
  _id: ObjectId,
  token: String (required, unique),
  createdAt: Date,
  expiresAt: Date
}
```

### AuditLog Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: "user", nullable — null for unauthenticated requests),
  ip: String,
  method: String (GET, POST, PATCH, etc.),
  route: String (e.g. /api/transactions/),
  meta: Mixed (safe fields only: amount, accountId, currency — no passwords/tokens),
  createdAt: Date   // updatedAt intentionally omitted
}
```

---

## 🔄 How It Works

### Authentication Flow
1. User registers with email, name and password — validated by `express-validator`
2. Password is hashed with bcrypt before save
3. User logs in with credentials (also validated)
4. JWT token is issued and returned in JSON body + cookie
5. Protected routes verify token validity and blacklist status
6. Logout blacklists the token permanently

### Profile Update Flow
1. User sends `PATCH /api/profile` with any subset of: `name`, `phoneNumber`, `address`, `dateOfBirth`
2. `express-validator` checks format/length constraints (e.g. ISO date, date must be in the past)
3. Only allow-listed fields are written; password and email cannot be changed here
4. Returns updated user with non-sensitive fields only

### Admin Freeze / Unfreeze Flow
1. Admin sends `POST /api/admin/accounts/:accountId/freeze`
2. `authAdminMiddleware` verifies JWT and checks `user.isAdmin === true`
3. Account `status` is set to `FROZEN`
4. All subsequent transfer attempts from/to that account are blocked by the existing status check in `createTransaction`
5. Unfreeze restores status to `ACTIVE`

### Audit Logging
- `auditLogMiddleware` runs on **every request** after body parsing
- Captures: `userId` (from `req.user` if set), `ip`, `method`, `route`, safe `meta` (amount / accountId)
- Write failures are caught and logged to console — they **never interrupt** the request
- Entries are stored in the `auditlogs` MongoDB collection

### Transaction Flow (Double-Entry Ledger)
1. User initiates transfer from Account A to Account B
2. System checks Account A has sufficient balance (via ledger aggregation)
3. Idempotency key prevents duplicate processing
4. MongoDB transaction begins (ACID guarantee)
5. Transaction record created with PENDING status
6. DEBIT entry created for Account A (money out)
7. CREDIT entry created for Account B (money in)
8. Transaction marked COMPLETED
9. All changes committed atomically
10. Email notification sent to user
11. Response returned with transaction details

### Balance Calculation
- **Balance = Total Credits - Total Debits**
- All ledger entries are immutable (cannot be modified/deleted)
- Balance is calculated on-demand using MongoDB aggregation
- If balance < requested amount → Insufficient funds error

### Idempotency
- Every transaction requires a unique `idempotencyKey`
- Duplicate requests with same key return the cached response
- Prevents accidental double-transfers if request is retried

---

## 🧩 Key Components

### Middleware
- **auth.middleware.js**
  - `authMiddleware` — verifies JWT, checks blacklist, attaches `req.user`
  - `authSystemUserMiddleware` — extends auth; requires `systemUser: true`
  - `authAdminMiddleware` — extends auth; requires `isAdmin: true` (admin-only routes)
- **auditLog.middleware.js** — writes a safe audit entry for every request; failures are non-fatal
- **rateLimiter.middleware.js**
  - `authRateLimiter` — applied to all `/api/auth/*` routes (default: 20 req / 15 min per IP)
  - `transferRateLimiter` — applied to `POST /api/transactions/` (default: 30 req / 15 min per IP)
  - All limits are read from env vars — see [Environment Configuration](#environment-configuration)

### Controllers
- **auth.controller.js** — registration (with validation result check), login, logout
- **account.controller.js** — account creation, listing, balance retrieval
- **transaction.controller.js** — fund transfer, initial funds, history, CSV export
- **profile.controller.js** — get profile, validated profile update
- **admin.controller.js** — freeze account, unfreeze account

### Models
- **user.model.js** — user schema with profile fields (`phoneNumber`, `address`, `dateOfBirth`) and `isAdmin` flag
- **account.model.js** — includes `getBalance()` aggregation method
- **ledger.model.js** — immutable entries; pre-hooks block all update/delete operations
- **auditLog.model.js** — stores per-request audit entries in `auditlogs` collection
- **transaction.model.js** — transaction lifecycle schema
- **blackList.model.js** — invalidated JWT store

### Services
- **email.service.js** — SMTP-based email using env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`); setting `DISABLE_EMAILS=true` skips actual sends and logs to console instead

---

## ⚠️ Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Validation errors | 422 | Invalid / missing fields (express-validator) | Check `errors` array in response |
| Missing required fields | 400 | Incomplete request body | Provide all required fields |
| Insufficient funds | 400 | Balance < amount | Add funds to account first |
| Account not found | 404 | Invalid account ID | Verify account ID |
| Unauthorized | 401 | Invalid/expired token | Login again to get new token |
| Token blacklisted | 401 | Token invalidated via logout | Cannot reuse, login again |
| Account not active | 400 | Account frozen/closed | Activate account first |
| Account already frozen | 400 | Freeze called on already-frozen account | Check account status first |
| Duplicate idempotency key | 400 | Same key used twice | Use unique idempotency key |
| Forbidden (admin) | 403 | `isAdmin` not set on user | Grant admin flag via DB |
| Too many requests | 429 | Rate limit exceeded | Wait for window to reset (see `RateLimit-Reset` header) |

---

## 🛠 Development & Deployment

### Running Tests
```bash
# Currently no automated tests configured
# Manual testing via Postman recommended
```

### Seeding Demo Data

The `scripts/seedDemo.js` script creates two demo users, their accounts, and an initial-funds transaction so you can explore the API without manual setup.

**All seed email addresses are dummy values** (`demo+alice@example.com`, `demo+bob@example.com`) — no real emails are used.

```bash
# Make sure MONGO_URI is set in your .env file, then:
npm run seed
# or equivalently:
node scripts/seedDemo.js
```

Expected output:
```
✔  Connected to MongoDB.
  ✔  Created user: demo+alice@example.com
  ✔  Created user: demo+bob@example.com
  ✔  Seeded 100,000 INR initial funds into Alice's account.

──── Seed Summary ──────────────────────────────────────
  User:    demo+alice@example.com
  Account: <accountId>
  Password: DemoPass123!  (demo only — change immediately)
...
```

> Re-running the seed removes and recreates demo data cleanly.

### Code Quality
- Use consistent indentation (2 spaces)
- Add JSDoc comments for complex functions
- Handle all async errors with try-catch

### Nodemon Configuration
Auto-restarts server on file changes during development:
```bash
npm run dev
```

### Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure `JWT_SECRET` (min 32 chars)
- [ ] Set up MongoDB Atlas or secure MongoDB instance
- [ ] Configure SMTP credentials for email service
- [ ] Enable HTTPS/TLS
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Enable CORS appropriately

### Production Best Practices
```javascript
// Use environment-based config
const isProduction = process.env.NODE_ENV === 'production';

// Enable CORS selectively
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// Use connection pooling for MongoDB
```

---

## 📝 Example Usage

### Complete Transaction Workflow

```bash
# 1. Register User
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "securePass123"
  }'

# 2. Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePass123"
  }'
# Response contains: token

# 3. Create Account
curl -X POST http://localhost:3000/api/account/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"currency": "INR"}'

# 4. Create another account (for transfer recipient)
# ... repeated POST to /api/account/

# 5. Add initial funds
curl -X POST http://localhost:3000/api/transactions/system/initial-funds \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "toAccount": "<ACCOUNT_ID>",
    "amount": 50000,
    "idempotencyKey": "fund-1"
  }'

# 6. Transfer funds
curl -X POST http://localhost:3000/api/transactions/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "<FROM_ACCOUNT_ID>",
    "toAccount": "<TO_ACCOUNT_ID>",
    "amount": 1000,
    "idempotencyKey": "transfer-1"
  }'

# 7. Check balance
curl -X GET http://localhost:3000/api/account/balance/<ACCOUNT_ID> \
  -H "Authorization: Bearer <TOKEN>"

# 8. View transaction history with filters
curl -X GET "http://localhost:3000/api/transactions?type=debit&startDate=2026-01-01&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"

# 9. Export transactions as CSV
curl -X GET "http://localhost:3000/api/transactions/export?type=credit" \
  -H "Authorization: Bearer <TOKEN>" \
  --output transactions.csv

# 10. Update profile
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210", "address": "Mumbai", "dateOfBirth": "1992-08-20"}'

# 11. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🐛 Troubleshooting

### Server won't start
- Check MongoDB connection: `MONGO_URI` in `.env`
- Verify port 3000 is not in use: `lsof -i :3000`
- Check Node.js version: `node --version`

### "Insufficient funds" error with valid balance
- Verify ledger entries: `db.ledgers.find({account: ObjectId("...")}).pretty()`
- Check transaction status: `db.transactions.find({}).pretty()`
- Trace balance calculation by adding logs to `account.model.js` `getBalance()` method

### Email not sending
- If `DISABLE_EMAILS=true` in `.env`, emails are intentionally suppressed — check console logs instead
- Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are set correctly in `.env`
- For Gmail: use an app-specific password (not your account password); enable 2FA first
- Check `[Email]` prefixed lines in server console output

### Rate limit hit unexpectedly
- Default limits: auth routes 20 req / 15 min, transfer 30 req / 15 min
- Adjust `AUTH_RATE_LIMIT_MAX` / `TRANSFER_RATE_LIMIT_MAX` in `.env` for development
- The `RateLimit-Reset` response header tells you when the window resets

### Audit log entries not appearing
- Confirm MongoDB is reachable — the middleware writes to the same connection
- Collection is named `auditlogs` (check with `db.auditlogs.find().pretty()`)
- Failures are non-fatal; check console for `[AuditLog] Failed to write` messages

### MongoDB connection timeout
- Ensure MongoDB is running locally or Atlas cluster is accessible
- Whitelist your IP in MongoDB Atlas
- Check network connectivity

---

## 📞 Support & Contact

For issues, questions, or contributions:
- GitHub Issues: [Create an issue](https://github.com/Ywatch15/Bank-Transaction-Sys/issues)
- Email: [Project Owner](mailto:ywatch15@example.com)

---

## 📄 License

ISC License - See package.json for details

---

**Last Updated:** February 21, 2026  
**Version:** 1.1.0  
**Author:** Ywatch15
