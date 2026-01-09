#!/bin/bash

# ============================================
# Supabase + Stripe Deployment Script
# ============================================
# This script helps you deploy Stripe integration to Supabase
# Run this after setting up your Stripe account

echo "🚀 Supabase + Stripe Deployment Script"
echo "========================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Step 1: Link project
echo "📍 Step 1: Link Supabase Project"
echo "--------------------------------"
echo "Enter your Supabase project reference ID:"
echo "(Find it at: https://app.supabase.com/project/_/settings/general)"
read -p "Project Ref: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project ref is required"
    exit 1
fi

echo "Linking project..."
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project"
    exit 1
fi

echo "✅ Project linked"
echo ""

# Step 2: Set environment secrets
echo "🔐 Step 2: Configure Environment Secrets"
echo "---------------------------------------"

echo "Enter your Stripe Secret Key (sk_test_... or sk_live_...):"
read -sp "Stripe Secret Key: " STRIPE_SECRET_KEY
echo ""

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ Stripe secret key is required"
    exit 1
fi

echo "Enter your Stripe Webhook Secret (whsec_...):"
echo "(You'll get this after creating webhook endpoint in Stripe Dashboard)"
echo "(You can also update this later)"
read -sp "Webhook Secret: " WEBHOOK_SECRET
echo ""

echo "Enter your Supabase URL (https://xxxxx.supabase.co):"
read -p "Supabase URL: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Supabase URL is required"
    exit 1
fi

echo "Enter your Supabase Service Role Key:"
echo "(Find it at: https://app.supabase.com/project/_/settings/api)"
read -sp "Service Role Key: " SERVICE_ROLE_KEY
echo ""

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ Service role key is required"
    exit 1
fi

echo "Enter your Supabase Anon Key:"
read -sp "Anon Key: " ANON_KEY
echo ""

if [ -z "$ANON_KEY" ]; then
    echo "❌ Anon key is required"
    exit 1
fi

echo ""
echo "Setting secrets..."

supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
supabase secrets set SUPABASE_URL="$SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
supabase secrets set SUPABASE_ANON_KEY="$ANON_KEY"

if [ ! -z "$WEBHOOK_SECRET" ]; then
    supabase secrets set STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET"
fi

echo "✅ Secrets configured"
echo ""

# Step 3: Deploy Edge Functions
echo "🚀 Step 3: Deploy Edge Functions"
echo "--------------------------------"

echo "Deploying stripe-webhook function..."
supabase functions deploy stripe-webhook

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy stripe-webhook"
    exit 1
fi

echo "Deploying create-checkout function..."
supabase functions deploy create-checkout

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy create-checkout"
    exit 1
fi

echo "✅ Edge Functions deployed"
echo ""

# Step 4: Display next steps
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Set up Stripe Webhook:"
echo "   - Go to: https://dashboard.stripe.com/webhooks"
echo "   - Click 'Add endpoint'"
echo "   - URL: ${SUPABASE_URL}/functions/v1/stripe-webhook"
echo "   - Events: checkout.session.completed, customer.subscription.*,"
echo "            invoice.payment_succeeded, invoice.payment_failed"
echo "   - Copy the webhook secret and update it:"
echo "     supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret"
echo ""
echo "2. Create Stripe Product:"
echo "   - Go to: https://dashboard.stripe.com/products"
echo "   - Create 'PDF Tools Premium' at \$4.99/month"
echo "   - Copy the Price ID (price_...)"
echo ""
echo "3. Update Frontend .env:"
echo "   REACT_APP_SUPABASE_URL=${SUPABASE_URL}"
echo "   REACT_APP_SUPABASE_ANON_KEY=your_anon_key"
echo "   REACT_APP_STRIPE_PRICE_ID=price_from_step_2"
echo ""
echo "4. Run Database Migration:"
echo "   - Go to: ${SUPABASE_URL}/project/default/sql"
echo "   - Run: server/database/migration_supabase_auth.sql"
echo ""
echo "5. Test Payment Flow:"
echo "   - Use test card: 4242 4242 4242 4242"
echo "   - Any future expiry, any CVC"
echo ""
echo "📖 Full documentation: SUPABASE_STRIPE_SETUP.md"
echo ""
echo "🎉 Happy coding!"
