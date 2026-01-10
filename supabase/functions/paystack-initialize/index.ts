import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { userId, email, amount, currency, planCode, callbackUrl } = await req.json()

    if (!userId || !email) {
      throw new Error('Missing required parameters: userId and email')
    }

    // Validate Paystack configuration
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY not configured')
    }

    // Generate unique reference
    const reference = `${Date.now()}-${userId}`

    // Prepare Paystack initialization request
    const paystackPayload: any = {
      email: email,
      amount: amount || 1500000, // ₦15,000 in kobo
      currency: currency || 'NGN',
      reference: reference,
      callback_url: callbackUrl,
      metadata: {
        user_id: userId,
        email: email,
        custom_fields: [
          {
            display_name: 'User ID',
            variable_name: 'user_id',
            value: userId,
          }
        ]
      }
    }

    // Add plan code if provided
    if (planCode) {
      paystackPayload.plan = planCode
    }

    console.log('Initializing Paystack transaction:', {
      email,
      amount: paystackPayload.amount,
      currency: paystackPayload.currency,
      reference,
    })

    // Initialize transaction with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload)
    })

    const paystackData = await paystackResponse.json()

    console.log('Paystack response:', paystackData)

    if (!paystackResponse.ok || !paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment')
    }

    // Return the authorization URL to the frontend
    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error initializing Paystack payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to initialize payment'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
