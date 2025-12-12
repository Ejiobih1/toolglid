# ⚡ Quick Launch Checklist

Use this as a quick reference while deploying. Full details in [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md)

---

## ☑️ Pre-Launch (10 minutes)

```bash
# 1. Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output → Save for Railway

# 2. Change Admin Password
cd server
node changeAdminPassword.js YourSecurePassword2025!

# 3. Get Stripe Live Keys
# Go to: https://dashboard.stripe.com/apikeys
# Toggle to "Live mode" → Copy both keys
```

**Save These:**
- ✅ JWT Secret (64 characters)
- ✅ New admin password
- ✅ Stripe Publishable Key (pk_live_...)
- ✅ Stripe Secret Key (sk_live_...)

---

## ☑️ GitHub (5 minutes)

```bash
# Create repo at: https://github.com/new
# Name: pdf-tools-app

# Push code
git init
git add .
git commit -m "Ready for production"
git remote add origin https://github.com/YOUR_USERNAME/pdf-tools-app.git
git push -u origin main
```

---

## ☑️ Railway - Backend (10 minutes)

1. **Sign up:** https://railway.app → Login with GitHub
2. **New Project** → Deploy from GitHub → Select `pdf-tools-app`
3. **Settings:**
   - Root Directory: `server`
   - Start Command: `npm start`
4. **Variables:** Add these:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres.abgbzdsjavuhbnyrqdms:ejiobih5399@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=[YOUR_GENERATED_SECRET]
   STRIPE_SECRET_KEY=sk_live_[YOUR_KEY]
   STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_KEY]
   PREMIUM_MONTHLY_PRICE=4.99
   ```
5. **Generate Domain** → Copy URL (e.g., `pdf-tools.railway.app`)

**Save:** Backend URL

---

## ☑️ Vercel - Frontend (10 minutes)

1. **Sign up:** https://vercel.com → Login with GitHub
2. **New Project** → Import `pdf-tools-app`
3. **Settings:**
   - Framework: Create React App
   - Root: `./`
   - Build Command: `npm run build`
4. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://[YOUR-BACKEND].railway.app/api
   ```
   ⚠️ Don't forget `/api` at the end!
5. **Deploy** → Wait 3 min → Copy URL (e.g., `pdf-tools.vercel.app`)

**Save:** Frontend URL

---

## ☑️ Connect Frontend & Backend (2 minutes)

**Railway:**
1. Go to Variables
2. Add:
   ```
   FRONTEND_URL=https://[YOUR-FRONTEND].vercel.app
   ```
3. Save (auto-redeploys)

---

## ☑️ Stripe Webhook (5 minutes)

1. **Create:** https://dashboard.stripe.com/webhooks
2. **Toggle to "Live mode"**
3. **Add endpoint:**
   - URL: `https://[YOUR-BACKEND].railway.app/api/payments/webhook`
   - Events: Select all 5 events
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed
4. **Copy webhook secret** (whsec_...)

**Railway:**
1. Go to Variables
2. Add:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_[YOUR_SECRET]
   ```
3. Save

---

## ☑️ Test Production (15 minutes)

### Test Subscribe Flow:
1. ✅ Open: `https://[YOUR-FRONTEND].vercel.app`
2. ✅ Clear localStorage (F12 > Application)
3. ✅ Click locked PDF tool
4. ✅ Choose video
5. ✅ Subscribe to YouTube channel
6. ✅ Check box → Start video
7. ✅ Video plays (can't skip)
8. ✅ Wait for timer
9. ✅ Unlock access
10. ✅ Use PDF tool

### Test Premium:
1. ✅ Click "Upgrade to Premium"
2. ✅ Register account
3. ✅ Pay with REAL card ($4.99)
4. ✅ Should see crown badge
5. ✅ Tools unlocked permanently

---

## ☑️ Go Live! 🚀

### Final Checks:
- [ ] Subscribe flow works
- [ ] Video watching works
- [ ] Video skip prevention works
- [ ] Premium payment works
- [ ] Premium auto-activates
- [ ] All PDF tools work
- [ ] Mobile works

### Launch:
- [ ] Share on social media
- [ ] YouTube community post
- [ ] Email subscribers

---

## 📊 Monitor

**Daily:**
- Stripe dashboard for payments
- Railway logs for errors
- Supabase for database

**Weekly:**
- User count
- Revenue
- Conversion rate

---

## 🔗 Quick Links

| Service | Dashboard | Docs |
|---------|-----------|------|
| Railway | https://railway.app/dashboard | [Guide](LAUNCH_GUIDE.md#step-3-deploy-backend-railway) |
| Vercel | https://vercel.com/dashboard | [Guide](LAUNCH_GUIDE.md#step-4-deploy-frontend-vercel) |
| Stripe | https://dashboard.stripe.com | [Guide](LAUNCH_GUIDE.md#step-6-configure-stripe-webhooks) |
| Supabase | https://app.supabase.com | Already set up ✅ |

---

## 🆘 Common Issues

**"Failed to fetch"**
→ Check `REACT_APP_API_URL` ends with `/api`

**Premium not activating**
→ Check webhook secret in Railway

**Video not playing**
→ Update video IDs in admin panel

**Database error**
→ Check `DATABASE_URL` in Railway

---

## 💰 Costs

**Month 1:** $0 (free credits)
**Month 2+:** $5-35/month
**Revenue:** $4.99 per subscriber

**Break-even:** 2-8 subscribers

---

## ✅ Total Time: ~1 hour

- Pre-launch: 10 min
- GitHub: 5 min
- Railway: 10 min
- Vercel: 10 min
- Config: 7 min
- Testing: 15 min
- Launch: 5 min

---

**Full Guide:** [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md)

**You got this! 🚀**
