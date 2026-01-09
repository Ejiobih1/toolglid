# PDF to Word Conversion Setup Guide

Your PDF to Word feature now uses **ConvertAPI** for SmallPDF-quality conversions! This preserves:
- ✅ Text formatting (fonts, sizes, styles)
- ✅ Images and graphics
- ✅ Tables and layouts
- ✅ Headers and footers
- ✅ Page structure

## Step 1: Get ConvertAPI Free Account

1. Go to [https://www.convertapi.com/a/signup](https://www.convertapi.com/a/signup)
2. Sign up for a **FREE account** (includes 250 free conversions/month)
3. After signup, go to [https://www.convertapi.com/a](https://www.convertapi.com/a) (your dashboard)
4. Copy your **Secret** key (looks like: `abc123def456...`)

**Free Plan Includes:**
- 250 conversions per month (free forever)
- PDF to Word with full formatting preservation
- No credit card required

## Step 2: Set Supabase Secret

Run this command in your terminal:

```bash
npx supabase secrets set CONVERTAPI_SECRET=your_secret_key_here
```

Replace `your_secret_key_here` with the secret you copied from ConvertAPI.

## Step 3: Deploy the Edge Function

Deploy the new `pdf-to-word` edge function:

```bash
npx supabase functions deploy pdf-to-word
```

## Step 4: Test It Out!

1. Start your app: `npm start`
2. Log in to your account
3. **If you're premium**: Select "PDF to Word" tool
4. **If you're NOT premium**: You'll see a message asking you to upgrade

### Make Yourself Premium (For Testing)

If you want to test without subscribing:

```bash
npx supabase db execute --file - <<SQL
UPDATE users
SET is_premium = true
WHERE email = 'your-email@example.com';
SQL
```

Replace `your-email@example.com` with your test account email.

## How It Works

1. User selects a PDF file
2. Frontend checks if user is premium
3. If premium, uploads PDF to Supabase Edge Function
4. Edge Function calls ConvertAPI
5. ConvertAPI converts PDF → DOCX (high quality)
6. Edge Function returns DOCX file
7. User gets preview and can download

## Cost Breakdown

**Free Tier (250 conversions/month):**
- Perfect for testing and light usage
- Enough for ~8 conversions per day

**Paid Plan ($9/month for 1500 conversions):**
- If you have many users
- Covers ~50 conversions per day
- Still cheaper than building your own!

## Why Premium-Only?

- ConvertAPI costs money per conversion
- Free users can't use this feature (like SmallPDF)
- Premium users get SmallPDF-quality results
- This justifies the premium subscription

## Troubleshooting

### Error: "ConvertAPI secret not configured"
- Make sure you ran: `npx supabase secrets set CONVERTAPI_SECRET=...`
- Check secret is set: `npx supabase secrets list`

### Error: "Premium subscription required"
- User must be logged in with a premium account
- For testing, manually set `is_premium = true` in database

### Error: "Conversion failed"
- Check ConvertAPI dashboard for usage limits
- Verify your secret key is correct
- Check Supabase function logs: `npx supabase functions logs pdf-to-word`

## Next Steps

Want to add more conversion types?
- PDF to Excel
- PDF to PowerPoint
- Image to PDF
- Excel to PDF

All available with ConvertAPI! Just create new edge functions following the same pattern.
