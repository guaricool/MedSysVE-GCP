import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Find who initiated the checkout session
        const entityType = session.metadata?.entityType // 'doctor' or 'clinic'
        const entityId = session.client_reference_id
        
        if (!entityId || !entityType) {
          throw new Error("Missing entityType or client_reference_id in metadata")
        }

        // We assume the user bought a subscription
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = session.subscription as string
          // Retrieve the subscription to get the priceId and period end
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = sub.items.data[0].price.id
          
          let plan = "premium"
          if (priceId === process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || priceId === process.env.STRIPE_PRICE_INDIVIDUAL_QUARTERLY) {
             plan = "premium"
          } else if (priceId === process.env.STRIPE_PRICE_CLINIC_MONTHLY || priceId === process.env.STRIPE_PRICE_CLINIC_QUARTERLY) {
             plan = "clinic"
          }

          if (entityType === "doctor") {
            await db.doctor.update({
              where: { id: entityId },
              data: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                plan: plan,
              }
            })
          } else if (entityType === "clinic") {
            await db.clinic.update({
              where: { id: entityId },
              data: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
                plan: plan,
              }
            })
          }
        }
        break
      }
      
      case "customer.subscription.updated": {
        // Find whether it's a doctor or a clinic
        const subscriptionId = subscription.id
        const priceId = subscription.items.data[0].price.id
        const customerId = subscription.customer as string
        
        let plan = "premium"
        if (priceId === process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || priceId === process.env.STRIPE_PRICE_INDIVIDUAL_QUARTERLY) {
           plan = "premium"
        } else if (priceId === process.env.STRIPE_PRICE_CLINIC_MONTHLY || priceId === process.env.STRIPE_PRICE_CLINIC_QUARTERLY) {
           plan = "clinic"
        }
        
        // Update either doctor or clinic
        const doc = await db.doctor.findUnique({ where: { stripeCustomerId: customerId } })
        if (doc) {
          await db.doctor.update({
            where: { id: doc.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              plan: plan,
            }
          })
        } else {
          const clinic = await db.clinic.findUnique({ where: { stripeCustomerId: customerId } })
          if (clinic) {
            await db.clinic.update({
              where: { id: clinic.id },
              data: {
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                plan: plan,
              }
            })
          }
        }
        break
      }
      
      case "customer.subscription.deleted": {
        const customerId = subscription.customer as string
        
        const doc = await db.doctor.findUnique({ where: { stripeCustomerId: customerId } })
        if (doc) {
          await db.doctor.update({
            where: { id: doc.id },
            data: {
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
              plan: "free",
            }
          })
        } else {
          const clinic = await db.clinic.findUnique({ where: { stripeCustomerId: customerId } })
          if (clinic) {
            await db.clinic.update({
              where: { id: clinic.id },
              data: {
                stripeSubscriptionId: null,
                stripePriceId: null,
                stripeCurrentPeriodEnd: null,
                plan: "free",
              }
            })
          }
        }
        break
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error("Error processing webhook", error)
    return new NextResponse("Webhook handler failed", { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
