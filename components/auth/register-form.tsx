"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { ESTADOS_VENEZUELA, getCiudadesByEstado } from "@/lib/venezuela-locations"

type Step = "idle" | "code-sent" | "verified"

function parseTRPCError(message: string): string {
  try {
    const parsed = JSON.parse(message)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
      return parsed.map((e: any) => e.message).join(", ")
    }
  } catch {
    // not JSON
  }
  return message
}

/**
 * Three account types:
 *
 * - "doctor": solo doctor — registers own Doctor record + own Workspace. No
 *   clinic affiliation.
 *
 * - "doctor-under-clinic": doctor who has been invited by a ClinicAdmin via
 *   the clinic's invitation code (e.g. "CLINIC-A3F8K2"). The form asks for
 *   that code in Step 0, then proceeds to the standard doctor data form.
 *   The new doctor joins the existing clinic (creates
 *   DoctorClinicAffiliation row) and their workspace is bound to the clinic.
 *
 * - "clinic-admin": non-doctor user who manages a Clinic's dashboard. They
 *   create a Clinic + become the OWNER ClinicAdmin. Doctors will join later
 *   via the clinic's invitation code. They CANNOT practice medicine — they
 *   only manage the clinic's staff, billing, and audit log.
 */
type AccountType = "doctor" | "doctor-under-clinic" | "clinic-admin"

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [otpExpiresIn, setOtpExpiresIn] = useState(0)
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [consentTerminos, setConsentTerminos] = useState(false)
  const [consentPrivacidad, setConsentPrivacidad] = useState(false)
  const [consentLopdp, setConsentLopdp] = useState(false)
  const [consentCookies, setConsentCookies] = useState(false)

  // Account type: doctor solo, doctor joining a clinic, or clinic admin.
  // Chosen BEFORE the OTP step so the email is associated with the right
  // entity from the start (Doctor or ClinicAdmin lookup is by email).
  const [accountType, setAccountType] = useState<AccountType>("doctor")

  // For "doctor-under-clinic" flow: invitation code entered before the OTP
  // step. We validate format visually but the real check happens server-side
  // in doctor.register.
  const [clinicCode, setClinicCode] = useState("")

  // Location of the new doctor's workspace (required so the doctor appears
  // in the referral picker of nearby colleagues).
  const [workspaceEstado, setWorkspaceEstado] = useState("")
  const [workspaceCiudad, setWorkspaceCiudad] = useState("")
  const [selectedClinicId, setSelectedClinicId] = useState("")

  // For "clinic-admin" flow: clinic + admin personal info.
  const [clinicNombre, setClinicNombre] = useState("")
  const [clinicRif, setClinicRif] = useState("")
  const [clinicRazonSocial, setClinicRazonSocial] = useState("")
  const [clinicDireccion, setClinicDireccion] = useState("")
  const [clinicTelefono, setClinicTelefono] = useState("")
  const [clinicWebsite, setClinicWebsite] = useState("")
  const [clinicEstado, setClinicEstado] = useState("")
  const [clinicCiudad, setClinicCiudad] = useState("")

  // SACS MPPS verification state before Email OTP (for Doctors)
  const [sacsNacionalidad, setSacsNacionalidad] = useState<"V" | "E">("V")
  const [sacsCedula, setSacsCedula] = useState("")
  const [isSacsVerified, setIsSacsVerified] = useState(false)
  const [sacsMessage, setSacsMessage] = useState<string | null>(null)

  // Doctor Form controlled inputs (autocompleted by SACS)
  const [formNombre, setFormNombre] = useState("")
  const [formApellido, setFormApellido] = useState("")
  const [formCedula, setFormCedula] = useState("")
  const [formEspecialidad, setFormEspecialidad] = useState("")

  const { data: especialidades = [] } = trpc.doctor.especialidades.useQuery()

  const verifySacsMutation = trpc.doctor.verifySacs.useMutation({
    onSuccess: (data) => {
      if (data.encontrado) {
        setIsSacsVerified(true)
        if (data.nombre) setFormNombre(data.nombre)
        if (data.apellido) setFormApellido(data.apellido)
        setFormCedula(data.cedula)
        if (data.especialidades && data.especialidades.length > 0) {
          const matchedSpec = especialidades.find((e) =>
            data.especialidades?.some((s) => s.toLowerCase().includes(e.toLowerCase()))
          )
          if (matchedSpec) setFormEspecialidad(matchedSpec)
        }
        setSacsMessage(`✅ Credenciales verificadas en SACS MPPS: Dr(a). ${data.nombreCompleto || data.nombre || ''} ${data.matriculaMpps ? `(Matrícula MPPS: ${data.matriculaMpps})` : ''}`)
        setError("")
      } else if (data.origen === "MOCK_FALLBACK") {
        setIsSacsVerified(true)
        setFormCedula(sacsCedula)
        setSacsMessage(`⚠️ Servicio SACS temporalmente fuera de línea. Puedes continuar e ingresar tus datos de médico manualmente.`)
        setError("")
      } else {
        setIsSacsVerified(false)
        setSacsMessage(null)
        setError("La cédula ingresada no aparece registrada como profesional de la salud en el SACS (Ministerio de Salud).")
      }
    },
    onError: () => {
      setIsSacsVerified(true)
      setFormCedula(sacsCedula)
      setSacsMessage(`⚠️ No se pudo conectar con el SACS MPPS. Ingrese sus datos manualmente.`)
    },
  })

  const handleVerifySacsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    if (!sacsCedula.trim()) {
      setError("Ingresa tu número de cédula para verificar ante el Ministerio de Salud (SACS).")
      return
    }
    verifySacsMutation.mutate({ cedula: sacsCedula.trim(), nacionalidad: sacsNacionalidad })
  }

  // For doctors without an invite code, fetch clinics in their selected city
  const { data: publicClinics = [], isFetching: isFetchingClinics } = trpc.doctor.searchPublicClinics.useQuery(
    { estado: workspaceEstado, ciudad: workspaceCiudad },
    { enabled: accountType === "doctor" && !!workspaceEstado && !!workspaceCiudad }
  )

  // Countdown timers for OTP expiry + resend cooldown
  useEffect(() => {
    if (otpExpiresIn <= 0 && resendCooldown <= 0) return
    const t = setInterval(() => {
      setOtpExpiresIn((v) => (v > 0 ? v - 1 : 0))
      setResendCooldown((v) => (v > 0 ? v - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [otpExpiresIn, resendCooldown])

  const requestOtp = trpc.auth.requestEmailOtp.useMutation({
    onSuccess: (data) => {
      setStep("code-sent")
      setOtpExpiresIn(data.expiresInSeconds)
      setResendCooldown(60) // 60s cooldown before resend
      setError("")
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  const verifyOtp = trpc.auth.verifyEmailOtp.useMutation({
    onSuccess: (data) => {
      setVerifiedToken(data.verifiedToken)
      setStep("verified")
      setError("")
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  // Doctor registration (used by both "doctor" and "doctor-under-clinic").
  const registerDoctor = trpc.doctor.register.useMutation({
    onSuccess: async (_data, variables) => {
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      })
      if (result?.ok) {
        router.push("/doctor")
      } else {
        setError("Cuenta creada. Por favor inicia sesión manualmente.")
        router.push("/login")
      }
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  // ClinicAdmin registration (used by "clinic-admin" account type).
  // Creates Clinic + OWNER ClinicAdmin. After success, the admin signs in
  // and is routed to the clinic dashboard.
  const registerClinicAdmin = trpc.clinicAdmin.register.useMutation({
    onSuccess: async (_data, variables) => {
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      })
      if (result?.ok) {
        // After successful login as CLINIC_ADMIN, route to clinic dashboard.
        router.push("/clinica")
      } else {
        setError("Clínica creada. Por favor inicia sesión manualmente.")
        router.push("/login")
      }
    },
    onError: (e) => setError(parseTRPCError(e.message)),
  })

  const allRequiredConsents = consentTerminos && consentPrivacidad && consentLopdp
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmitRegister = step === "verified" && allRequiredConsents && !!verifiedToken

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (accountType !== "clinic-admin" && !isSacsVerified) {
      setError("Por favor verifica tu Cédula ante el Ministerio de Salud (SACS MPPS) en el Paso 1 antes de solicitar el código por correo.")
      return
    }
    if (!emailValid) {
      setError("Ingresa un correo válido.")
      return
    }
    if (accountType === "doctor-under-clinic" && !/^CLINIC-[A-Z0-9]{6}$/.test(clinicCode.trim())) {
      setError("Ingresa un código de invitación válido (formato CLINIC-XXXXXX).")
      return
    }
    requestOtp.mutate({ email: email.trim().toLowerCase() })
  }

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (otpCode.length !== 6) {
      setError("El código debe ser de 6 dígitos.")
      return
    }
    verifyOtp.mutate({ email: email.trim().toLowerCase(), code: otpCode })
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    requestOtp.mutate({ email: email.trim().toLowerCase() })
  }

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    if (!verifiedToken) {
      setError("Verifica tu correo antes de crear la cuenta.")
      return
    }
    if (!allRequiredConsents) {
      setError("Debes aceptar los documentos legales obligatorios.")
      return
    }
    const fd = new FormData(e.currentTarget)

    if (accountType === "doctor" || accountType === "doctor-under-clinic") {
      // ─── Doctor registration ──────────────────────────────────────
      // Both "doctor" (solo) and "doctor-under-clinic" go through this
      // same mutation. The difference: when joining an existing clinic,
      // clinicInvitationCode is included so the new doctor is affiliated
      // with that clinic from day 1.
      registerDoctor.mutate({
        cedula: fd.get("cedula") as string,
        nombre: fd.get("nombre") as string,
        apellido: fd.get("apellido") as string,
        email: email.trim().toLowerCase(),
        password: fd.get("password") as string,
        telefono: (fd.get("telefono") as string) || undefined,
        especialidadPrincipal: fd.get("especialidad") as string,
        workspaceNombre: fd.get("workspaceNombre") as string,
        workspaceEstado,
        workspaceCiudad,
        workspaceDireccion: (fd.get("workspaceDireccion") as string) || undefined,
        workspaceTelefono: (fd.get("workspaceTelefono") as string) || undefined,
        // Optional — only set for "doctor-under-clinic" account type.
        clinicInvitationCode:
          accountType === "doctor-under-clinic" ? clinicCode.trim() : undefined,
        clinicId: accountType === "doctor" && selectedClinicId ? selectedClinicId : undefined,
        consent: {
          terminos: consentTerminos,
          privacidad: consentPrivacidad,
          lopdp: consentLopdp,
          cookies: consentCookies,
        },
        verifiedToken,
      })
    } else {
      // ─── ClinicAdmin registration ─────────────────────────────────
      // Creates a new Clinic + OWNER ClinicAdmin in a single transaction.
      // Doctors join this clinic later via its invitation code.
      registerClinicAdmin.mutate({
        nombre: fd.get("nombre") as string,
        apellido: fd.get("apellido") as string,
        email: email.trim().toLowerCase(),
        password: fd.get("password") as string,
        telefono: (fd.get("telefono") as string) || undefined,
        clinicNombre,
        clinicRif: clinicRif || undefined,
        clinicRazonSocial: clinicRazonSocial || undefined,
        clinicDireccion: clinicDireccion || undefined,
        clinicTelefono: clinicTelefono || undefined,
        clinicWebsite: clinicWebsite || undefined,
        clinicEstado,
        clinicCiudad,
        consent: {
          terminos: consentTerminos,
          privacidad: consentPrivacidad,
          lopdp: consentLopdp,
          cookies: consentCookies,
        },
        verifiedToken,
      })
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  const cardTitle =
    accountType === "doctor"
      ? "Registro de Doctor"
      : accountType === "doctor-under-clinic"
      ? "Registro de Doctor (vinculado a clínica)"
      : "Registro de Administrador de Clínica"

  const cardSubtitle =
    accountType === "doctor-under-clinic"
      ? "Te unís a una clínica existente con tu código de invitación."
      : accountType === "clinic-admin"
      ? "Vas a crear una clínica y ser su administrador principal."
      : "Registro personal con cédula, especialidad y tu consultorio."

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">{cardTitle}</CardTitle>
        <p className="text-xs text-slate-400 mt-1">{cardSubtitle}</p>
      </CardHeader>
      <CardContent>
        {/* ─── Step 0: Choose account type (only shown before OTP is sent) ─── */}
        {step === "idle" && (
          <div className="mb-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              ¿Qué vas a registrar?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setAccountType("doctor")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  accountType === "doctor"
                    ? "border-amber-500 bg-amber-950/30"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                <p className={`text-sm font-semibold ${accountType === "doctor" ? "text-amber-300" : "text-white"}`}>
                  Soy doctor
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Registro personal con cédula, especialidad y mi consultorio.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("doctor-under-clinic")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  accountType === "doctor-under-clinic"
                    ? "border-amber-500 bg-amber-950/30"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                <p className={`text-sm font-semibold ${accountType === "doctor-under-clinic" ? "text-amber-300" : "text-white"}`}>
                  Tengo código de clínica
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Soy doctor y me invitaron con un código a unirme a una clínica.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("clinic-admin")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  accountType === "clinic-admin"
                    ? "border-amber-500 bg-amber-950/30"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                <p className={`text-sm font-semibold ${accountType === "clinic-admin" ? "text-amber-300" : "text-white"}`}>
                  Soy admin de clínica
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  No soy médico. Administro el dashboard, staff y facturación.
                </p>
              </button>
            </div>

            {/* For doctor-under-clinic flow, capture the invitation code BEFORE
                requesting OTP so we can fail fast on bad codes. */}
            {accountType === "doctor-under-clinic" && (
              <div className="space-y-1 pt-2">
                <Label className="text-slate-300">
                  Código de invitación de la clínica
                </Label>
                <Input
                  value={clinicCode}
                  onChange={(e) => setClinicCode(e.target.value.toUpperCase().trim())}
                  placeholder="CLINIC-A3F8K2"
                  className="bg-slate-800 border-slate-700 text-white font-mono"
                  maxLength={13}
                />
                <p className="text-[10px] text-slate-500">
                  El código lo entrega el administrador de la clínica (formato CLINIC-XXXXXX).
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 1 (Doctors Only): SACS MPPS Cédula Verification ─── */}
        {accountType !== "clinic-admin" && (
          <div className="space-y-3 mb-5 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isSacsVerified ? "bg-emerald-500 text-white" : "bg-amber-500 text-slate-900"
                }`}
              >
                1
              </span>
              <span className="text-sm font-semibold text-slate-200">
                Verifica tu Cédula en el Ministerio de Salud (SACS)
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={sacsNacionalidad}
                onChange={(e) => setSacsNacionalidad(e.target.value as "V" | "E")}
                disabled={isSacsVerified}
                className="bg-slate-800 border-slate-700 text-white font-bold rounded-md px-2.5 text-xs"
              >
                <option value="V">V</option>
                <option value="E">E</option>
              </select>

              <Input
                type="text"
                placeholder="Ingresa tu cédula (ej. 12345678)"
                value={sacsCedula}
                onChange={(e) => setSacsCedula(e.target.value.replace(/\D/g, ""))}
                disabled={isSacsVerified || verifySacsMutation.isPending}
                className="bg-slate-800 border-slate-700 text-white text-sm font-mono"
              />

              <Button
                type="button"
                onClick={handleVerifySacsClick}
                disabled={!sacsCedula || isSacsVerified || verifySacsMutation.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold shrink-0 text-xs px-3"
              >
                {verifySacsMutation.isPending ? "Verificando…" : isSacsVerified ? "✓ Verificado" : "Verificar SACS"}
              </Button>
            </div>

            {sacsMessage && (
              <div className="text-xs bg-slate-800/80 border border-slate-700 p-2.5 rounded text-slate-200 font-medium">
                {sacsMessage}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Email + send code ─── */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step !== "idle" ? "bg-emerald-500 text-white" : "bg-amber-500 text-slate-900"
              }`}
            >
              {accountType !== "clinic-admin" ? "2" : "1"}
            </span>
            <span className="text-sm font-semibold text-slate-200">Verifica tu correo</span>
          </div>
          {step === "idle" && (
            <form onSubmit={handleSendCode} className="flex gap-2">
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requestOtp.isPending}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button type="submit" disabled={!emailValid || requestOtp.isPending}>
                {requestOtp.isPending ? "Enviando…" : "Enviar código"}
              </Button>
            </form>
          )}
          {step !== "idle" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm">
                <span className="text-slate-300">
                  Código enviado a <span className="font-mono text-amber-300">{email}</span>
                </span>
                {otpExpiresIn > 0 ? (
                  <span className="text-xs text-slate-400">
                    Caduca en <span className="font-mono text-amber-300">{formatTime(otpExpiresIn)}</span>
                  </span>
                ) : (
                  <span className="text-xs text-red-400">Expirado</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Step 3: 6-digit code ─── */}
        {step === "code-sent" && (
          <form onSubmit={handleVerifyCode} className="space-y-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-900">
                {accountType !== "clinic-admin" ? "3" : "2"}
              </span>
              <span className="text-sm font-semibold text-slate-200">Ingresa el código</span>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                disabled={verifyOtp.isPending}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || requestOtp.isPending}
                className="text-slate-400 hover:text-amber-300"
              >
                {resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : "Reenviar código"}
              </Button>
              <Button type="submit" disabled={otpCode.length !== 6 || verifyOtp.isPending}>
                {verifyOtp.isPending ? "Verificando…" : "Verificar"}
              </Button>
            </div>
          </form>
        )}

        {step === "verified" && (
          <div className="mb-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            ✓ Correo verificado. Ahora completa los datos de tu cuenta.
          </div>
        )}

        {/* ─── Step 4: full registration form (only enabled after verification) ─── */}
        <form
          onSubmit={handleRegisterSubmit}
          className={`space-y-4 ${step !== "verified" ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={step !== "verified"}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input
                name="nombre"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input
                name="apellido"
                value={formApellido}
                onChange={(e) => setFormApellido(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          {/* Cédula is required only for doctors (admin doesn't have one — they
              are non-medical staff). */}
          {accountType !== "clinic-admin" && (
            <div className="space-y-1">
              <Label className="text-slate-300">Cédula</Label>
              <Input
                name="cedula"
                value={formCedula || sacsCedula}
                onChange={(e) => setFormCedula(e.target.value)}
                placeholder="12345678"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-slate-300">Contraseña</Label>
            <PasswordInput
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">
              Mínimo 8 caracteres, con mayúsculas, minúsculas, números y un símbolo.
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Teléfono (opcional)</Label>
            <Input name="telefono" className="bg-slate-800 border-slate-700 text-white" />
          </div>

          {(accountType === "doctor" || accountType === "doctor-under-clinic") && (
            <>
              <div className="space-y-1">
                <Label className="text-slate-300">Especialidad Principal</Label>
                <select
                  name="especialidad"
                  value={formEspecialidad}
                  onChange={(e) => setFormEspecialidad(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar especialidad...</option>
                  {especialidades.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <hr className="border-slate-700" />
              <p className="text-slate-400 text-sm font-medium">
                Datos de tu consultorio principal
                {accountType === "doctor-under-clinic" && (
                  <span className="ml-2 text-[11px] text-amber-400">
                    (queda vinculado a la clínica del código)
                  </span>
                )}
              </p>
              <div className="space-y-1">
                <Label className="text-slate-300">Nombre del Consultorio</Label>
                <Input
                  name="workspaceNombre"
                  placeholder="Ej: Consultorio Dr. García"
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              {/* Estado + Ciudad: required so doctor appears in referral picker of
                  nearby colleagues. Without it, the doctor picker filters them
                  out (no match in any estado/ciudad). */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">
                    Estado <span className="text-red-400">*</span>
                  </Label>
                  <select
                    value={workspaceEstado}
                    onChange={(e) => {
                      setWorkspaceEstado(e.target.value)
                      setWorkspaceCiudad("") // reset ciudad when estado changes
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {ESTADOS_VENEZUELA.map((e) => (
                      <option key={e.codigo} value={e.nombre}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">
                    Ciudad <span className="text-red-400">*</span>
                  </Label>
                  <select
                    value={workspaceCiudad}
                    onChange={(e) => {
                      setWorkspaceCiudad(e.target.value)
                      setSelectedClinicId("")
                    }}
                    required
                    disabled={!workspaceEstado}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">{workspaceEstado ? "Seleccionar..." : "Primero elige un estado"}</option>
                    {workspaceEstado &&
                      getCiudadesByEstado(workspaceEstado).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Si tu ciudad no aparece, edita después en Configuración del consultorio.
                  </p>
                </div>
              </div>
              
              {accountType === "doctor" && workspaceEstado && workspaceCiudad && (
                <div className="space-y-1">
                  <Label className="text-slate-300">
                    ¿Asociar a una Clínica? (opcional)
                  </Label>
                  <select
                    value={selectedClinicId}
                    onChange={(e) => setSelectedClinicId(e.target.value)}
                    disabled={isFetchingClinics}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">No, tendré un consultorio independiente</option>
                    {publicClinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.nombre}
                      </option>
                    ))}
                  </select>
                  {isFetchingClinics && (
                    <p className="text-[10px] text-amber-400">Buscando clínicas...</p>
                  )}
                  {publicClinics.length === 0 && !isFetchingClinics && (
                    <p className="text-[10px] text-slate-500">
                      No se encontraron clínicas en esta ciudad.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-slate-300">Dirección (opcional)</Label>
                <Input name="workspaceDireccion" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Teléfono del Consultorio (opcional)</Label>
                <Input name="workspaceTelefono" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </>
          )}

          {accountType === "clinic-admin" && (
            <>
              <hr className="border-slate-700" />
              <p className="text-slate-400 text-sm font-medium">Datos de la clínica</p>
              <p className="text-[11px] text-slate-500">
                La clínica se crea con tu cuenta como administradora (OWNER).
                Luego podés invitar médicos con el código de invitación que se
                genera automáticamente.
              </p>
              <div className="space-y-1">
                <Label className="text-slate-300">
                  Nombre de la clínica <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={clinicNombre}
                  onChange={(e) => setClinicNombre(e.target.value)}
                  placeholder="Ej: Centro Médico San Rafael"
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">RIF (opcional)</Label>
                  <Input
                    value={clinicRif}
                    onChange={(e) => setClinicRif(e.target.value)}
                    placeholder="J-12345678-9"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Razón social (opcional)</Label>
                  <Input
                    value={clinicRazonSocial}
                    onChange={(e) => setClinicRazonSocial(e.target.value)}
                    placeholder="Centro Médico San Rafael CA"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Dirección (opcional)</Label>
                <Input
                  value={clinicDireccion}
                  onChange={(e) => setClinicDireccion(e.target.value)}
                  placeholder="Av. Principal, Piso 2, Consultorio 5..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">Teléfono de la clínica (opcional)</Label>
                  <Input
                    value={clinicTelefono}
                    onChange={(e) => setClinicTelefono(e.target.value)}
                    placeholder="+58 212 555 0000"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Sitio web (opcional)</Label>
                  <Input
                    value={clinicWebsite}
                    onChange={(e) => setClinicWebsite(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              {/* Ubicación de la clínica (required para referidos) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">
                    Estado <span className="text-red-400">*</span>
                  </Label>
                  <select
                    value={clinicEstado}
                    onChange={(e) => {
                      setClinicEstado(e.target.value)
                      setClinicCiudad("")
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {ESTADOS_VENEZUELA.map((e) => (
                      <option key={e.codigo} value={e.nombre}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">
                    Ciudad <span className="text-red-400">*</span>
                  </Label>
                  <select
                    value={clinicCiudad}
                    onChange={(e) => setClinicCiudad(e.target.value)}
                    required
                    disabled={!clinicEstado}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">{clinicEstado ? "Seleccionar..." : "Primero un estado"}</option>
                    {clinicEstado &&
                      getCiudadesByEstado(clinicEstado).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* LOPDP Art. 25 — Consentimiento expreso */}
          <hr className="border-slate-700" />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
              Consentimiento Legal (obligatorio)
            </p>
            <ConsentCheckbox
              id="c-terminos"
              required
              checked={consentTerminos}
              onChange={setConsentTerminos}
              label={
                <>
                  He leído y acepto los{" "}
                  <Link href="/legal/terminos" target="_blank" className="text-amber-400 underline">
                    Términos y Condiciones
                  </Link>{" "}
                  de MedSysVE.
                </>
              }
            />
            <ConsentCheckbox
              id="c-privacidad"
              required
              checked={consentPrivacidad}
              onChange={setConsentPrivacidad}
              label={
                <>
                  He leído y acepto la{" "}
                  <Link href="/legal/privacidad" target="_blank" className="text-amber-400 underline">
                    Política de Privacidad
                  </Link>
                  , incluyendo el tratamiento de mis datos conforme a la LOPDP.
                </>
              }
            />
            <ConsentCheckbox
              id="c-lopdp"
              required
              checked={consentLopdp}
              onChange={setConsentLopdp}
              label={
                <>
                  He leído y otorgo mi{" "}
                  <Link href="/legal/lopdp-consentimiento" target="_blank" className="text-amber-400 underline">
                    consentimiento expreso (LOPDP Art. 25)
                  </Link>{" "}
                  para el tratamiento de mis datos personales por Yoguitech.LLC.
                </>
              }
            />
            <ConsentCheckbox
              id="c-cookies"
              checked={consentCookies}
              onChange={setConsentCookies}
              label={
                <>
                  Acepto el uso de cookies funcionales y analíticas conforme a la{" "}
                  <Link href="/legal/cookies" target="_blank" className="text-amber-400 underline">
                    Política de Cookies
                  </Link>
                  . (Opcional — puedes cambiarlo luego.)
                </>
              }
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={
              !canSubmitRegister ||
              registerDoctor.isPending ||
              registerClinicAdmin.isPending
            }
          >
            {registerDoctor.isPending || registerClinicAdmin.isPending
              ? "Creando cuenta…"
              : accountType === "clinic-admin"
              ? "Crear clínica y mi cuenta"
              : "Crear cuenta"}
          </Button>
          <p className="text-center text-slate-400 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Iniciar sesión
            </Link>
          </p>
          <div className="pt-4 mt-2 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              ¿Eres paciente?{" "}
              <Link href="/portal/register" className="text-blue-400 hover:underline">
                Regístrate en el Portal del Paciente
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  required,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-900/60 transition-colors"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
      />
      <span className="text-xs leading-relaxed text-slate-300">{label}</span>
    </label>
  )
}