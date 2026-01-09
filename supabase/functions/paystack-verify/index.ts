// Supabase Edge Function: Paystack Payment Verification
// Verifies Paystack payment and updates user premium status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Verify payment with Paystack API
async function verifyPayment(reference: string) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { reference, userId } = await req.json()

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Payment reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user ID matches authenticated user
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Verifying Paystack payment: ${reference}`)

    // Verify payment with Paystack
    const verificationResult = await verifyPayment(reference)

    console.log('Paystack verification result:', verificationResult)

    if (!verificationResult.status) {
      throw new Error('Payment verification failed')
    }

    const paymentData = verificationResult.data

    // Check payment status
    if (paymentData.status !== 'success') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment status: ${paymentData.status}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Payment successful - update user to premium
    console.log(`✅ Payment verified successfully for user: ${userId}`)
    console.log(`Amount: ₦${paymentData.amount / 100}`)
    console.log(`Customer: ${paymentData.customer.email}`)

    // Update user's premium status
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: user.email,
        is_premium: true,
        premium_since: new Date().toISOString(),
        paystack_customer_code: paymentData.customer.customer_code,
        paystack_subscription_code: paymentData.plan_object?.subscription_code || null,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      })

    if (updateError) {
      console.error('❌ Error updating user:', updateError)
      throw new Error(`Failed to update user: ${updateError.message}`)
    }

    console.log(`✅ User ${userId} activated as premium`)

    // Record payment in payments table (optional - non-critical)
    try {
      await supabase
        .from('payments')
        .insert({
          user_id: userId,
          paystack_reference: reference,
          amount: paymentData.amount / 100, // Convert from kobo to naira
          currency: paymentData.currency || 'NGN',
          status: 'succeeded',
          payment_date: new Date().toISOString(),
        })
      console.log('✅ Payment recorded in database')
    } catch (paymentError) {
      console.error('⚠️ Error recording payment (non-critical):', paymentError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and user upgraded to premium',
        data: {
          reference: paymentData.reference,
          amount: paymentData.amount / 100,
          currency: paymentData.currency,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Verification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment verification failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
