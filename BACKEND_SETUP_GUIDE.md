# Backend Setup Guide - Premium System with PostgreSQL & Stripe

## 🎯 What's Been Built

I've created a complete premium subscription system with:
- ✅ User registration & login (JWT authentication)
- ✅ PostgreSQL database for users, videos, payments
- ✅ Stripe payment integration
- ✅ Premium subscription management
- ✅ Admin video management (database-backed)
- ✅ Secure API endpoints

---

## 📁 Files Created

### Backend Structure:
```
server/
├── .env                          # Environment variables
├── .env.example                  # Example config
├── package.json                  # Dependencies (to be updated)
├── server-new.js                 # Main server file (UPDATED VERSION)
├── database/
│   ├── db.js                     # PostgreSQL connection
│   ├── schema.sql                # Database schema
│   └── initDatabase.js           # Database initialization script
├── controllers/
│   ├── authController.js         # Registration, login, user management
│   ├── paymentController.js      # Stripe checkout, webhooks
│   └── videosController.js       # Video CRUD operations
├── middleware/
│   └── auth.js                   # JWT verification, premium checks
└── routes/
    ├── auth.js                   # Auth endpoints
    ├── payments.js               # Payment endpoints
    └── videos.js                 # Video endpoints
```

---

## 🚀 Setup Instructions

### Step 1: Install PostgreSQL

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (keep default port 5432)
3. Set postgres password (remember this!)
4. Complete installation

**Verify installation:**
```bash
psql --version
```

### Step 2: Create Database

Open Command Prompt or PowerShell:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pdf_tools_db;

# Exit psql
\q
```

### Step 3: Install Backend Dependencies

```bash
cd c:\Users\TCG\Desktop\pdf-tools-app\server

# Update package.json first (see next section)
npm install
```

### Step 4: Update package.json

The server/package.json needs these additional dependencies. Run:

```bash
npm install dotenv pg bcrypt jsonwebtoken stripe express-validator helmet express-rate-limit
npm install --save-dev nodemon
```

### Step 5: Configure Environment Variables

Edit `server/.env` with your settings:

```env
# Database (use your PostgreSQL password)
DB_PASSWORD=your_postgres_password

# Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

**Where to get Stripe keys:**
1. Go to: https://dashboard.stripe.com/register
2. Create account (use test mode)
3. Go to: Developers → API Keys
4. Copy "Secret key" and "Publishable key"

### Step 6: Initialize Database

```bash
cd c:\Users\TCG\Desktop\pdf-tools-app\server
node database/initDatabase.js
```

You should see:
```
✅ Schema created successfully
✅ Admin user created/updated
✅ Tables created: users, videos, payments
✅ Default videos: 4 videos loaded
✅ Database initialization complete!
```

### Step 7: Replace server.js

```bash
# Backup old server.js
mv server.js server-old.js

# Use new server
mv server-new.js server.js
```

### Step 8: Start Backend Server

```bash
npm start
```

You should see:
```
🚀 PDF Tools Backend Server Started!
📍 Server running at: http://localhost:5000
✅ Connected to PostgreSQL database
```

---

## 🧪 Testing the Backend

### Test 1: Health Check

Open browser: http://localhost:5000/api/health

Should see:
```json
{
  "status": "Server is running",
  "port": 5000,
  "environment": "development"
}
```

### Test 2: Get Videos

http://localhost:5000/api/videos

Should return your 4 default videos.

### Test 3: User Registration

Use Postman or curl:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Should return:
```json
{
  "message": "Registration successful",
  "user": { "id": 1, "email": "test@example.com", "isPremium": false },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📋 API Endpoints

### Authentication:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)
- `GET /api/auth/check-premium` - Check premium status

### Payments:
- `POST /api/payments/create-checkout-session` - Start Stripe checkout
- `POST /api/payments/webhook` - Stripe webhooks (Stripe calls this)
- `POST /api/payments/cancel-subscription` - Cancel subscription

### Videos:
- `GET /api/videos` - Get all videos (public)
- `POST /api/videos` - Add video (admin only)
- `PUT /api/videos/:id` - Update video (admin only)
- `DELETE /api/videos/:id` - Delete video (admin only)

---

## 🔧 Next Steps

### 1. Update Frontend to Use Backend

I need to create frontend components for:
- Login/Register forms
- Premium checkout button
- API integration layer

### 2. Set Up Stripe Webhooks

When deploying:
1. Deploy backend to server (Heroku, Railway, etc.)
2. Get public URL
3. Add webhook in Stripe Dashboard:
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, etc.

### 3. Test Payment Flow

1. User registers
2. User clicks "Upgrade to Premium"
3. Redirected to Stripe Checkout
4. Enters test card: `4242 4242 4242 4242`
5. Completes payment
6. Webhook activates premium
7. User has unlimited access!

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
# Windows: Services → PostgreSQL

# Test connection manually
psql -U postgres -d pdf_tools_db

# If password wrong, update .env
```

### "npm install fails"
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps
```

### "Port 5000 already in use"
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

---

## 📝 Database Schema

**Users Table:**
- id, email, password_hash
- is_premium, premium_since
- stripe_customer_id, stripe_subscription_id
- subscription_status

**Videos Table:**
- id (YouTube video ID)
- title, duration, access_hours
- created_at, updated_at

**Payments Table:**
- user_id, stripe_payment_intent_id
- amount, currency, status
- payment_date

---

## 🔒 Security Features

✅ Passwords hashed with bcrypt
✅ JWT tokens for authentication
✅ Rate limiting (100 requests/15min)
✅ Helmet.js security headers
✅ CORS protection
✅ SQL injection prevention (parameterized queries)
✅ Stripe webhook signature verification

---

## 💡 Admin Credentials

**Email:** admin@pdftools.com
**Password:** admin123

**⚠️ Change this in production!**

---

## ✅ What's Working

After setup:
- ✅ User registration & login
- ✅ JWT authentication
- ✅ Database storage (users, videos, payments)
- ✅ Premium subscription via Stripe
- ✅ Video management API
- ✅ Secure endpoints

**Status:** Backend complete! Ready for frontend integration.

Would you like me to:
1. Create frontend login/register components?
2. Set up payment checkout UI?
3. Integrate backend API with existing frontend?
