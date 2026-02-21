# Bank Transaction System

A robust, production-ready backend API for managing bank accounts and financial transactions with secure authentication, transaction ledger tracking, and email notifications.

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
- [How It Works](#how-it-works)
- [Key Components](#key-components)
- [Error Handling](#error-handling)
- [Development & Deployment](#development--deployment)

---

## 🎯 Overview

The **Bank Transaction System** is a Node.js/Express backend API designed to manage:
- **User Authentication**: Secure registration, login, and logout with JWT tokens
- **Account Management**: Create and manage multiple accounts per user with different currencies
- **Transactions**: Transfer funds between accounts with ledger-based balance tracking
- **Security**: Token blacklisting, password hashing, middleware-based authorization
- **Notifications**: Email alerts for transaction completions

This system uses a **double-entry ledger accounting model** to ensure financial accuracy and auditability of all transactions.

---

## ✨ Features

### Core Features
- ✅ **User Registration & Authentication** - Secure JWT-based authentication with bcrypt password hashing
- ✅ **Multi-Account Support** - Users can create and manage multiple accounts in different currencies
- ✅ **Fund Transfers** - Transfer money between accounts with balance validation
- ✅ **Ledger System** - Every transaction creates immutable DEBIT/CREDIT entries for audit trails
- ✅ **Idempotency** - Duplicate requests with same idempotency key return cached responses
- ✅ **Token Blacklisting** - Logout invalidates tokens permanently
- ✅ **Email Notifications** - Transaction confirmations sent to user email
- ✅ **MongoDB Transactions** - ACID compliance with atomic operations

### Security Features
- 🔐 Password hashing with bcrypt
- 🔐 JWT token-based authentication
- 🔐 Token blacklist on logout
- 🔐 Protected middleware for authorized routes
- 🔐 Immutable ledger entries (cannot be modified/deleted)
- 🔐 Account status validation (only ACTIVE accounts can transact)

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
| **Nodemailer** | Email service |
| **Dotenv** | Environment variable management |
| **Cookie-Parser** | Cookie parsing middleware |

**Dev Dependencies:**
- Nodemon (auto-reload on file changes)

---

## 📁 Project Structure

```
bank-transaction-system/
├── server.js                          # Application entry point
├── package.json                       # Dependencies & scripts
├── .env                               # Environment variables (git-ignored)
├── .gitignore                         # Git ignore rules
│
├── src/
│   ├── app.js                        # Express app setup & middleware
│   │
│   ├── config/
│   │   └── db.js                     # MongoDB connection config
│   │
│   ├── routes/
│   │   ├── auth.routes.js            # Authentication endpoints
│   │   ├── account.routes.js         # Account management endpoints
│   │   └── transaction.routes.js     # Transaction endpoints
│   │
│   ├── controllers/
│   │   ├── auth.controller.js        # Auth logic (register, login, logout)
│   │   ├── account.controller.js     # Account business logic
│   │   └── transaction.controller.js # Transaction business logic
│   │
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT verification & authorization
│   │
│   ├── models/
│   │   ├── user.model.js             # User schema
│   │   ├── account.model.js          # Account schema & methods
│   │   ├── transaction.model.js      # Transaction schema
│   │   ├── ledger.model.js           # Ledger entry schema
│   │   └── blackList.model.js        # Token blacklist schema
│   │
│   └── services/
│       └── email.service.js          # Email sending service
│
└── README.md                          # This file
```

---

## 🏗 Architecture & Data Flow

### High-Level Architecture Diagram

```
User Request
    ↓
Express Server (port 3000)
    ↓
Routes (auth/account/transaction)
    ↓
Middleware (auth verification)
    ↓
Controller (business logic)
    ↓
Models (database operations)
    ↓
MongoDB (data persistence)
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
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd bank-transaction-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create `.env` File
```bash
touch .env
```

### Step 4: Configure Environment Variables
See [Environment Configuration](#environment-configuration) below.

### Step 5: Start MongoDB
```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas (connection string in .env)
```

### Step 6: Run the Application

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Server will start on `http://localhost:3000`

---

## 🔧 Environment Configuration

Create a `.env` file in the project root:

```env
# Server
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/bank-transaction-system
# OR use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bank-transaction-system

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Email Service (using Gmail as example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@banksystem.com

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- `JWT_SECRET`: Generate a strong random string (min 32 characters)
- `EMAIL_PASSWORD`: Use Gmail app-specific password (not your regular password)
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
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
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  phone: String (optional),
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

---

## 🔄 How It Works

### Authentication Flow
1. User registers with email and password
2. Password is hashed with bcrypt
3. User logs in with credentials
4. JWT token is issued and stored in cookies/header
5. Protected routes verify token validity
6. Logout blacklists the token

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

### Middleware (`src/middleware/auth.middleware.js`)
- **authMiddleware**: Verifies JWT token, checks blacklist, attaches user to request
- **authSystemUserMiddleware**: Extends authMiddleware for system-level operations

### Controllers
- **auth.controller.js**: Handles user registration, login, logout
- **account.controller.js**: Manages account creation and retrieval
- **transaction.controller.js**: Processes fund transfers and ledger creation

### Models
- **Models**: Contain database schemas and custom methods
- **account.model.js**: Includes `getBalance()` aggregation method
- **ledger.model.js**: Prevents modification/deletion of entries

### Services
- **email.service.js**: Sends transaction confirmation emails via Nodemailer

---

## ⚠️ Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing required fields | 400 | Incomplete request body | Provide all required fields |
| Insufficient funds | 400 | Balance < amount | Add funds to account first |
| Account not found | 404 | Invalid account ID | Verify account ID |
| Unauthorized | 401 | Invalid/expired token | Login again to get new token |
| Token blacklisted | 401 | Token invalidated via logout | Cannot reuse, login again |
| Account not active | 400 | Account frozen/closed | Activate account first |
| Duplicate idempotency key | 400 | Same key used twice | Use unique idempotency key |

---

## 🛠 Development & Deployment

### Running Tests
```bash
# Currently no automated tests configured
# Manual testing via Postman recommended
```

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

# 8. Logout
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
- Verify SMTP credentials in `.env`
- For Gmail: use app-specific password, not regular password
- Check email service logs in console output

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
**Version:** 1.0.0  
**Author:** Ywatch15
