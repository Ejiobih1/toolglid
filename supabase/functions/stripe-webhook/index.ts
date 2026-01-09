// Supabase Edge Function: Stripe Webhook Handler
// Handles Stripe payment events and updates user premium status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-11-17.clover',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.text()

    // Verify the webhook signature (async version for Deno/Edge Functions)
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    console.log(`✅ Webhook received: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log(`🎯 Checkout completed event received`)
        console.log(`Session metadata:`, session.metadata)

        // Get user ID from metadata (more reliable than email lookup)
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('❌ No supabase_user_id in session metadata')
          // Fallback to email lookup
          const customerEmail = session.customer_email || session.customer_details?.email

          if (!customerEmail) {
            console.error('❌ No customer email found either')
            break
          }

          console.log(`⚠️ Falling back to email lookup for: ${customerEmail}`)

          // Find user by email in Supabase Auth
          const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

          if (userError) {
            console.error('❌ Error fetching users:', userError)
            break
          }

          const user = userData.users.find(u => u.email === customerEmail)

          if (!user) {
            console.error(`❌ User not found: ${customerEmail}`)
            break
          }

          console.log(`✅ Found user by email: ${user.id}`)

          // Update using found user ID
          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_since: new Date().toISOString(),
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('❌ Error updating user:', updateError)
            break
          }

          console.log(`✅ User ${customerEmail} activated as premium`)
        } else {
          // Direct update using metadata user ID (preferred method)
          console.log(`💳 Processing checkout for user: ${userId}`)

          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_since: new Date().toISOString(),
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (updateError) {
            console.error('❌ Error updating user:', updateError)
            console.error('Error details:', updateError)
            break
          }

          console.log(`✅ User ${userId} activated as premium`)

          // Record payment (optional - won't fail if this errors)
          try {
            await supabase
              .from('payments')
              .insert({
                user_id: userId,
                stripe_payment_intent_id: session.payment_intent as string,
                amount: (session.amount_total || 0) / 100,
                currency: session.currency || 'usd',
                status: 'succeeded',
                payment_date: new Date().toISOString()
              })
          } catch (paymentError) {
            console.error('⚠️ Error recording payment (non-critical):', paymentError)
          }
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for customer:', customerId)
          break
        }

        // Update subscription status
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError)
          break
        }

        console.log(`✅ Subscription updated for ${users.email}: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for customer:', customerId)
          break
        }

        // Deactivate premium
        const { error: updateError } = await supabase
          .from('users')
          .update({
            is_premium: false,
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('❌ Error deactivating premium:', updateError)
          break
        }

        console.log(`✅ Premium deactivated for ${users.email}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find user by Stripe customer ID
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (userError || !users) {
          console.error('❌ User not found for customer:', customerId)
          break
        }

        // Record payment
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: users.id,
            stripe_payment_intent_id: invoice.payment_intent as string,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency,
            status: 'succeeded',
            payment_date: new Date().toISOString()
          })

        if (paymentError) {
          console.error('⚠️ Error recording payment:', paymentError)
        }

        console.log(`✅ Payment recorded: $${invoice.amount_paid / 100}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Update subscription status to past_due
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', customerId)

        if (updateError) {
          console.error('❌ Error updating status:', updateError)
        }

        console.log(`⚠️ Payment failed for customer: ${customerId}`)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
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
