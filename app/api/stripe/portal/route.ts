import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let customerId: string | null = null
    let entityId: string | null = null
    
    // Check if the user is a clinic admin or a doctor
    if (session.user.role === "DOCTOR") {
      // Find doctor
      const doctor = await db.doctor.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true, id: true }
      })
      if (doctor) {
        customerId = doctor.stripeCustomerId
        entityId = doctor.id
      }
    } else if (session.user.role === "CLINIC_ADMIN") {
        // Clinic admins probably have some relation, but since we know it's a doctor with OWNER role:
        // Let's check DoctorClinicAffiliation
        const affiliation = await db.doctorClinicAffiliation.findFirst({
           where: { doctorId: session.user.id, rol: "OWNER" },
           select: { clinic: { select: { stripeCustomerId: true, id: true } } }
        })
        if (affiliation?.clinic) {
            customerId = affiliation.clinic.stripeCustomerId
            entityId = affiliation.clinic.id
        }
    }
    
    // Fallback: check if they are a clinic owner anyway
    if (!customerId) {
        const affiliation = await db.doctorClinicAffiliation.findFirst({
           where: { doctorId: session.user.id, rol: "OWNER" },
           select: { clinic: { select: { stripeCustomerId: true, id: true } } }
        })
        if (affiliation?.clinic) {
            customerId = affiliation.clinic.stripeCustomerId
            entityId = affiliation.clinic.id
        }
    }
    
    if (!customerId) {
      return new NextResponse("No Stripe customer found", { status: 400 })
    }
    
    const body = await req.json().catch(() => ({}))
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error("Stripe portal error", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
