// Supabase Edge Function: Paystack Webhook Handler
// Handles Paystack webhook events (subscriptions, charges, etc.)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') || ''
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Verify Paystack webhook signature
async function verifyPaystackSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  )

  const hash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return hash === signature
}

serve(async (req) => {
  // Get signature from headers
  const signature = req.headers.get('x-paystack-signature')

  if (!signature) {
    console.error('❌ No signature provided')
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.text()

    // Verify webhook signature
    const isValid = await verifyPaystackSignature(body, signature)

    if (!isValid) {
      console.error('❌ Invalid signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const event = JSON.parse(body)

    console.log(`✅ Webhook received: ${event.event}`)

    // Handle the event
    switch (event.event) {
      case 'charge.success': {
        // Successful one-time charge or subscription payment
        const data = event.data

        console.log(`💳 Charge success event received`)
        console.log(`Reference: ${data.reference}`)
        console.log(`Amount: ₦${data.amount / 100}`)
        console.log(`Customer: ${data.customer.email}`)

        // Get user ID from metadata
        const userId = data.metadata?.user_id

        if (!userId) {
          console.error('❌ No user_id in metadata')
          // Try to find user by email
          const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

          if (userError) {
            console.error('❌ Error fetching users:', userError)
            break
          }

          const user = userData.users.find(u => u.email === data.customer.email)

          if (!user) {
            console.error(`❌ User not found: ${data.customer.email}`)
            break
          }

          console.log(`✅ Found user by email: ${user.id}`)

          // Update user to premium
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              is_premium: true,
              premium_since: new Date().toISOString(),
              paystack_customer_code: data.customer.customer_code,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
            })

          if (updateError) {
            console.error('❌ Error updating user:', updateError)
            break
          }

          console.log(`✅ User ${user.email} activated as premium`)
        } else {
          // Update user with user_id from metadata
          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_since: new Date().toISOString(),
              paystack_customer_code: data.customer.customer_code,
              paystack_subscription_code: data.plan_object?.subscription_code || null,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user:', updateError)
            break
          }

          console.log(`✅ User ${userId} activated as premium`)

          // Record payment
          try {
            await supabase
              .from('payments')
              .insert({
                user_id: userId,
                paystack_reference: data.reference,
                amount: data.amount / 100,
                currency: data.currency,
                status: 'succeeded',
                payment_date: new Date().toISOString(),
              })
            console.log('✅ Payment recorded')
          } catch (paymentError) {
            console.error('⚠️ Error recording payment (non-critical):', paymentError)
          }
        }

        break
      }

      case 'subscription.create': {
        // New subscription created
        const subscription = event.data

        console.log(`🔔 Subscription created`)
        console.log(`Subscription Code: ${subscription.subscription_code}`)
        console.log(`Customer: ${subscription.customer.email}`)

        // Find user by email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

        if (userError) {
          console.error('❌ Error fetching users:', userError)
          break
        }

        const user = userData.users.find(u => u.email === subscription.customer.email)

        if (!user) {
          console.error(`❌ User not found: ${subscription.customer.email}`)
          break
        }

        // Update user with subscription info
        const { error: updateError } = await supabase
          .from('users')
          .update({
            paystack_subscription_code: subscription.subscription_code,
            paystack_customer_code: subscription.customer.customer_code,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
          break
        }

        console.log(`✅ Subscription created for ${user.email}`)
        break
      }

      case 'subscription.disable': {
        // Subscription cancelled/disabled
        const subscription = event.data

        console.log(`❌ Subscription disabled`)
        console.log(`Subscription Code: ${subscription.subscription_code}`)

        // Find user by subscription code
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('paystack_subscription_code', subscription.subscription_code)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for subscription:', subscription.subscription_code)
          break
        }

        // Deactivate premium
        const { error: updateError } = await supabase
          .from('users')
          .update({
            is_premium: false,
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', users.id)

        if (updateError) {
          console.error('❌ Error deactivating premium:', updateError)
          break
        }

        console.log(`✅ Premium deactivated for ${users.email}`)
        break
      }

      case 'subscription.not_renew': {
        // Subscription will not renew (user cancelled but still active until end of period)
        const subscription = event.data

        console.log(`⚠️ Subscription set to not renew`)
        console.log(`Subscription Code: ${subscription.subscription_code}`)

        // Find user by subscription code
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('paystack_subscription_code', subscription.subscription_code)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for subscription:', subscription.subscription_code)
          break
        }

        // Update status to not_renewing (keep premium active until expiry)
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'not_renewing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', users.id)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
          break
        }

        console.log(`✅ Subscription set to not renew for ${users.email}`)
        break
      }

      case 'invoice.payment_failed': {
        // Subscription payment failed
        const invoice = event.data

        console.log(`❌ Invoice payment failed`)
        console.log(`Subscription Code: ${invoice.subscription.subscription_code}`)

        // Find user by subscription code
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('paystack_subscription_code', invoice.subscription.subscription_code)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for subscription')
          break
        }

        // Update status to past_due
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', users.id)

        if (updateError) {
          console.error('❌ Error updating status:', updateError)
          break
        }

        console.log(`⚠️ Payment failed for ${users.email} - status set to past_due`)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.event}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
