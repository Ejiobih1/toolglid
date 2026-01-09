@echo off
REM ============================================
REM Supabase + Stripe Deployment Script (Windows)
REM ============================================

echo.
echo ^🚀 Supabase + Stripe Deployment Script
echo ========================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Please install it first:
    echo    npm install -g supabase
    pause
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Step 1: Link project
echo 📍 Step 1: Link Supabase Project
echo --------------------------------
echo Enter your Supabase project reference ID:
echo ^(Find it at: https://app.supabase.com/project/_/settings/general^)
set /p PROJECT_REF="Project Ref: "

if "%PROJECT_REF%"=="" (
    echo ❌ Project ref is required
    pause
    exit /b 1
)

echo Linking project...
supabase link --project-ref %PROJECT_REF%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to link project
    pause
    exit /b 1
)

echo ✅ Project linked
echo.

REM Step 2: Set environment secrets
echo 🔐 Step 2: Configure Environment Secrets
echo ---------------------------------------

set /p STRIPE_SECRET_KEY="Enter your Stripe Secret Key (sk_test_... or sk_live_...): "

if "%STRIPE_SECRET_KEY%"=="" (
    echo ❌ Stripe secret key is required
    pause
    exit /b 1
)

set /p WEBHOOK_SECRET="Enter your Stripe Webhook Secret (whsec_...) [or press Enter to skip]: "

set /p SUPABASE_URL="Enter your Supabase URL (https://xxxxx.supabase.co): "

if "%SUPABASE_URL%"=="" (
    echo ❌ Supabase URL is required
    pause
    exit /b 1
)

set /p SERVICE_ROLE_KEY="Enter your Supabase Service Role Key: "

if "%SERVICE_ROLE_KEY%"=="" (
    echo ❌ Service role key is required
    pause
    exit /b 1
)

set /p ANON_KEY="Enter your Supabase Anon Key: "

if "%ANON_KEY%"=="" (
    echo ❌ Anon key is required
    pause
    exit /b 1
)

echo.
echo Setting secrets...

supabase secrets set STRIPE_SECRET_KEY="%STRIPE_SECRET_KEY%"
supabase secrets set SUPABASE_URL="%SUPABASE_URL%"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="%SERVICE_ROLE_KEY%"
supabase secrets set SUPABASE_ANON_KEY="%ANON_KEY%"

if NOT "%WEBHOOK_SECRET%"=="" (
    supabase secrets set STRIPE_WEBHOOK_SECRET="%WEBHOOK_SECRET%"
)

echo ✅ Secrets configured
echo.

REM Step 3: Deploy Edge Functions
echo 🚀 Step 3: Deploy Edge Functions
echo --------------------------------

echo Deploying stripe-webhook function...
supabase functions deploy stripe-webhook

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to deploy stripe-webhook
    pause
    exit /b 1
)

echo Deploying create-checkout function...
supabase functions deploy create-checkout

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to deploy create-checkout
    pause
    exit /b 1
)

echo ✅ Edge Functions deployed
echo.

REM Step 4: Display next steps
echo ✅ Deployment Complete!
echo ======================
echo.
echo 📋 Next Steps:
echo.
echo 1. Set up Stripe Webhook:
echo    - Go to: https://dashboard.stripe.com/webhooks
echo    - Click 'Add endpoint'
echo    - URL: %SUPABASE_URL%/functions/v1/stripe-webhook
echo    - Events: checkout.session.completed, customer.subscription.*,
echo             invoice.payment_succeeded, invoice.payment_failed
echo    - Copy the webhook secret and update it:
echo      supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
echo.
echo 2. Create Stripe Product:
echo    - Go to: https://dashboard.stripe.com/products
echo    - Create 'PDF Tools Premium' at $4.99/month
echo    - Copy the Price ID (price_...)
echo.
echo 3. Update Frontend .env:
echo    REACT_APP_SUPABASE_URL=%SUPABASE_URL%
echo    REACT_APP_SUPABASE_ANON_KEY=your_anon_key
echo    REACT_APP_STRIPE_PRICE_ID=price_from_step_2
echo.
echo 4. Run Database Migration:
echo    - Go to: %SUPABASE_URL%/project/default/sql
echo    - Run: server/database/migration_supabase_auth.sql
echo.
echo 5. Test Payment Flow:
echo    - Use test card: 4242 4242 4242 4242
echo    - Any future expiry, any CVC
echo.
echo 📖 Full documentation: SUPABASE_STRIPE_SETUP.md
echo.
echo 🎉 Happy coding!
echo.
pause
