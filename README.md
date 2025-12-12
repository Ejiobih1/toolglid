# PDF Tools App with Premium Subscription

A full-stack web application for PDF manipulation with a premium subscription system powered by Stripe.

## Features

### PDF Tools (Free with Video Watching)
- Merge multiple PDFs
- Split PDFs by pages
- Compress PDF files
- Convert images to PDF
- Rotate PDF pages
- Extract pages from PDF
- Add watermarks
- Encrypt/decrypt PDFs (password protection)

### Premium Subscription
- Skip video watching requirement
- Unlimited access to all PDF tools
- $4.99/month subscription via Stripe
- Automatic premium activation via webhooks

### Authentication System
- JWT-based authentication
- Secure user registration and login
- Anonymous free users (no login required)
- Premium users with accounts

## Tech Stack

### Frontend
- React 18
- PDF-lib for PDF manipulation
- Tailwind CSS for styling
- Lucide React for icons
- Fetch API for backend communication

### Backend
- Node.js with Express
- PostgreSQL database (Supabase)
- JWT authentication
- Stripe payment integration
- bcrypt for password hashing
- Helmet for security headers
- Express rate limiting

### Database
- PostgreSQL (via Supabase cloud)
- Tables: users, videos, payments
- Automated timestamps with triggers

## Project Structure

```
pdf-tools-app/
├── src/                        # Frontend React code
│   ├── components/
│   │   └── AuthModal.js       # Login/Register modal
│   ├── services/
│   │   └── api.js             # API service layer
│   ├── App.js                 # Main app component
│   ├── pdfUtils.js            # PDF manipulation functions
│   └── index.js               # React entry point
│
├── server/                     # Backend Express code
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── videoController.js # Video management
│   │   └── paymentController.js # Stripe integration
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── videoRoutes.js
│   │   └── paymentRoutes.js
│   ├── database/
│   │   ├── db.js              # Database connection
│   │   ├── schema.sql         # Database schema
│   │   └── initDatabase.js    # Database initialization
│   ├── server.js              # Main Express server
│   ├── .env                   # Environment variables (not committed)
│   └── .env.example           # Environment template
│
├── public/                     # Static files
│
├── Helper Scripts/
│   ├── verifyProduction.js    # Verify production setup
│   ├── changeAdminPassword.js # Change admin password
│   ├── viewUsers.js           # View database users
│   ├── makePremium.js         # Manually activate premium
│   └── quickDeploy.js         # Quick deploy helper
│
└── Documentation/
    ├── DEPLOYMENT_GUIDE.md    # Complete deployment guide
    ├── PRODUCTION_SCRIPTS_READY.md
    ├── PRODUCTION_LAUNCH_CHECKLIST.md
    └── PREMIUM_SYSTEM_READY.md
```

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Setup Environment Variables

**Backend (`server/.env`):**
```env
DATABASE_URL=postgresql://...your_supabase_url
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
PREMIUM_MONTHLY_PRICE=4.99
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend (`.env`):**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Copy from templates:
```bash
cp server/.env.example server/.env
cp .env.example .env
```

### 3. Initialize Database

```bash
cd server
node database/initDatabase.js
```

This creates the database schema and default admin user:
- Email: `admin@pdftools.com`
- Password: `admin123` (change this!)

### 4. Start Development Servers

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
npm start
```

Visit `http://localhost:3000`

## Testing

### Test Login
- Email: `admin@pdftools.com`
- Password: `admin123`

### Test Stripe Payment (Development)
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

## Deployment

### Quick Deploy to Production

1. **Generate Production Secrets:**
```bash
cd server
node quickDeploy.js
```

2. **Follow the deployment guide:**
- See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions

3. **Deploy Backend to Railway:**
```bash
cd server
railway init
railway up
```

4. **Deploy Frontend to Vercel:**
```bash
vercel
```

## Helper Scripts

All scripts are in the `server/` directory:

```bash
# Verify production environment
node verifyProduction.js

# View all users in database
node viewUsers.js

# Change admin password
node changeAdminPassword.js YOUR_NEW_PASSWORD

# Manually activate premium (testing)
node makePremium.js user@example.com

# Quick deployment helper
node quickDeploy.js
```

## Environment Variables

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret for JWT tokens (64+ chars) | `abc123...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `PREMIUM_MONTHLY_PRICE` | Subscription price | `4.99` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000/api` |

## Documentation

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment guide
- **[PRODUCTION_SCRIPTS_READY.md](PRODUCTION_SCRIPTS_READY.md)** - Helper scripts documentation
- **[PRODUCTION_LAUNCH_CHECKLIST.md](PRODUCTION_LAUNCH_CHECKLIST.md)** - Full production checklist
- **[PREMIUM_SYSTEM_READY.md](PREMIUM_SYSTEM_READY.md)** - Premium system overview

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/check-premium` - Check premium status

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/cancel-subscription` - Cancel subscription

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add video (admin only)
- `PUT /api/videos/:id` - Update video (admin only)
- `DELETE /api/videos/:id` - Delete video (admin only)

### PDF Processing
- `POST /api/encrypt-pdf` - Encrypt PDF with password
- `POST /api/decrypt-pdf` - Remove PDF password

## Database Schema

### Users Table
```sql
- id (serial primary key)
- email (varchar, unique)
- password_hash (varchar)
- is_premium (boolean)
- premium_since (timestamp)
- stripe_customer_id (varchar)
- stripe_subscription_id (varchar)
- subscription_status (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

### Videos Table
```sql
- id (serial primary key)
- title (varchar)
- url (text)
- duration (integer, seconds)
- access_hours (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### Payments Table
```sql
- id (serial primary key)
- user_id (integer, foreign key)
- stripe_payment_id (varchar)
- amount (decimal)
- currency (varchar)
- status (varchar)
- created_at (timestamp)
```

## Security Features

- JWT token authentication with 30-day expiration
- Password hashing with bcrypt (10 rounds)
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- SQL injection prevention with parameterized queries
- XSS protection
- Environment variable protection

## Known Issues & Workarounds

### Stripe Webhooks on Localhost
Webhooks don't work on localhost. Use manual premium activation for testing:
```bash
node makePremium.js user@example.com
```

In production, webhooks work automatically.

### Database Connection Drops (Supabase)
Free tier may have connection limits. Restart backend if needed:
```bash
cd server
npm start
```

## Cost Estimate

### Development (Free Tier)
- Supabase: Free
- Stripe: Free (test mode)
- **Total: $0/month**

### Production
- Supabase: Free or $25/month (Pro)
- Railway: $5-10/month
- Vercel: Free
- Stripe: 2.9% + $0.30 per transaction
- **Total: $5-35/month + transaction fees**

## Support & Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Supabase Dashboard:** https://app.supabase.com
- **Railway Dashboard:** https://railway.app
- **Vercel Dashboard:** https://vercel.com/dashboard

## License

Private project - All rights reserved

## Contributing

This is a private project. Contact the owner for contribution guidelines.

---

**Status: Production Ready**

All features implemented and tested. Ready for deployment to production.

For deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
