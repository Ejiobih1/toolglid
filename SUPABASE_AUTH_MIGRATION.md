# 🔄 Migration to Supabase Auth - Complete Guide

## What We're Changing

**BEFORE (Current):**
```
Frontend → Custom Backend Auth (JWT) → Supabase (DB only)
```

**AFTER (New Hybrid):**
```
Frontend → Supabase Auth → Backend (Stripe + PDF only) → Supabase (DB + Auth)
```

---

## Benefits

✅ **No more custom auth code** - Supabase handles it
✅ **Built-in features** - Password reset, email verification, OAuth
✅ **Better security** - Industry-standard JWT handling
✅ **Simpler backend** - Only handles Stripe and PDF processing
✅ **Easier maintenance** - Less code to maintain

---

## Step-by-Step Migration

### **STEP 1: Get Supabase Credentials** ✅ (DO THIS FIRST)

1. Go to: https://app.supabase.com
2. Open your project
3. Click Settings (⚙️) → API
4. Copy these two values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### **STEP 2: Enable Supabase Auth**

In your Supabase dashboard:

1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled ✓
3. **Optional:** Enable OAuth providers (Google, GitHub, etc.)
4. Go to **Authentication** → **Email Templates**
5. Customize confirmation email if needed

---

### **STEP 3: Update Database Schema**

Your current `users` table needs to match Supabase Auth:

```sql
-- Run this in Supabase SQL Editor
-- Update users table to use Supabase auth.users ID

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_pkey,
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ADD PRIMARY KEY (id),
  ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Remove password_hash since Supabase handles it
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
```

---

### **STEP 4: Create Environment File**

Create `.env` in your project root:

```bash
# Copy from .env.example.supabase
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_URL=http://localhost:5000
```

**Replace** `your_supabase_project_url` and `your_supabase_anon_key` with your actual values.

---

### **STEP 5: Switch to Supabase AuthContext**

Replace the old AuthContext:

```bash
# Backup old file
mv src/context/AuthContext.js src/context/AuthContext.old.js

# Use new Supabase version
mv src/context/AuthContext.supabase.js src/context/AuthContext.js
```

---

### **STEP 6: Update Backend (Simplified)**

The backend will now:
- ❌ NO MORE: Custom auth routes (/api/auth/register, /api/auth/login)
- ❌ NO MORE: Password hashing, JWT generation
- ✅ ONLY: Verify Supabase tokens for protected routes
- ✅ ONLY: Handle Stripe payments
- ✅ ONLY: Process PDFs

Backend changes needed:
1. Install Supabase library in backend
2. Update middleware to verify Supabase JWTs
3. Remove auth routes
4. Keep payment and PDF routes

---

### **STEP 7: Test Locally**

```bash
# Start backend
cd server
npm start

# Start frontend (in new terminal)
cd ..
npm start
```

Test:
1. ✓ Register new account
2. ✓ Check email for confirmation
3. ✓ Confirm email
4. ✓ Login
5. ✓ Access PDF tools
6. ✓ Watch video
7. ✓ Unlock tools

---

### **STEP 8: Deploy**

**Backend (Railway):**
- No Supabase env vars needed in backend
- Backend just verifies JWT signatures
- Keep: PORT, NODE_ENV, DATABASE_URL, JWT_SECRET (for Supabase JWT verification)

**Frontend (Vercel):**
- Add: REACT_APP_SUPABASE_URL
- Add: REACT_APP_SUPABASE_ANON_KEY
- Add: REACT_APP_API_URL (your Railway URL)

---

## What Gets Removed

### From Backend:
- ❌ `server/controllers/authController.js` - Delete entire file
- ❌ `server/routes/auth.js` - Delete entire file
- ❌ Password hashing logic with bcrypt
- ❌ Custom JWT generation
- ❌ User registration/login endpoints

### What Stays:
- ✅ `server/controllers/paymentController.js` - Stripe payments
- ✅ `server/routes/payments.js` - Payment routes
- ✅ `server/routes/videos.js` - Video management
- ✅ `server/middleware/auth.js` - Updated to verify Supabase tokens
- ✅ Database connection

---

## Rollback Plan

If something goes wrong:

```bash
# Restore old AuthContext
mv src/context/AuthContext.old.js src/context/AuthContext.js
```

Your database and backend will still work with the old system.

---

## Timeline

- ⏱️ **Setup Supabase Auth**: 10 minutes
- ⏱️ **Update Frontend**: 5 minutes
- ⏱️ **Update Backend**: 15 minutes
- ⏱️ **Testing**: 10 minutes
- ⏱️ **Deployment**: 15 minutes

**Total: ~1 hour**

---

## Next Steps

1. **Get your Supabase credentials** (Project URL + Anon Key)
2. **Tell me when you have them** and I'll complete the migration
3. **Test locally** before deploying
4. **Deploy** to Railway + Vercel

---

## Need Help?

If you get stuck:
1. Check Supabase Auth logs: Supabase Dashboard → Authentication → Logs
2. Check browser console for errors
3. Check backend logs for JWT verification errors

---

**Ready to proceed?** Get your Supabase credentials and paste them here!
