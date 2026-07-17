"use client"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

/**
 * Portal-logout button. Lives in the portal header so the patient can
 * always close their session. `signOut` posts to /api/auth/signout and
 * clears the `__Secure-authjs.session-token` cookie, so the next request
 * from this browser lands on /portal/login (not /portal).
 *
 * callbackUrl is the destination after logout. We send the patient to
 * `/portal/login` directly so they don't bounce through `/` and then
 * get role-redirected back to `/portal` (which would be confusing).
 */
export function PortalLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/portal/login" })}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
      aria-label="Cerrar sesión del portal"
    >
      <LogOut size={14} />
      <span>Salir</span>
    </button>
  )
}