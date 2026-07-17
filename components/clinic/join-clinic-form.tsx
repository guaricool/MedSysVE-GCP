"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Building2, KeyRound, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react"
import { ESTADOS_VENEZUELA, getCiudadesByEstado } from "@/lib/venezuela-locations"

/**
 * Form for a doctor who ALREADY HAS a solo workspace to join an existing
 * clinic by invitation code. Creates a NEW workspace under the clinic
 * (the doctor keeps their solo workspace; this adds a clinic workspace).
 *
 * Separate from register-form.tsx because the join flow happens post-signup,
 * not at account creation.
 */
export function JoinClinicForm() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [peekedClinic, setPeekedClinic] = useState<{
    id: string
    nombre: string
    estado: string
    ciudad: string
  } | null>(null)
  const [workspaceNombre, setWorkspaceNombre] = useState("")
  const [estado, setEstado] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [step, setStep] = useState<"code" | "details">("code")

  const peek = trpc.workspace.peekClinicByCode.useQuery(
    { code: code.trim().toUpperCase() },
    {
      enabled: code.trim().length >= 8,
      retry: false,
    },
  )

  const join = trpc.workspace.joinClinicByCode.useMutation({
    onSuccess: (data) => {
      // Force a refresh so the workspace switcher picks up the new workspace.
      router.refresh()
    },
  })

  function handlePeek() {
    // Just trigger refetch if not already loading
    if (!peek.error && !peek.isLoading) {
      if (peek.data) {
        // peek returns estado/ciudad as nullable for legacy clinics; fall back
        // to empty strings in the UI form state (user can pick from dropdown).
        setPeekedClinic({
          id: peek.data.id,
          nombre: peek.data.nombre,
          estado: peek.data.estado ?? "",
          ciudad: peek.data.ciudad ?? "",
        })
        setEstado(peek.data.estado ?? "")
        setCiudad(peek.data.ciudad ?? "")
        setWorkspaceNombre(`Consultorio en ${peek.data.nombre}`)
        setStep("details")
      }
    }
  }

  function handleJoin() {
    if (!peekedClinic) return
    join.mutate({
      code: code.trim().toUpperCase(),
      workspaceNombre,
      estado,
      ciudad,
    })
  }

  if (join.isSuccess) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4 text-sm text-emerald-200">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} /> Te uniste a la clínica exitosamente.
        </p>
        <p className="mt-1 text-emerald-300/80">
          Tu nuevo consultorio bajo esta clínica ya está activo. Usa el selector de
          la barra lateral para cambiarte entre consultorios.
        </p>
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 size={16} className="text-blue-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Unirse a una clínica existente
        </h2>
      </div>

      {step === "code" && (
        <div className="space-y-2">
          <label className="mb-1 block text-xs text-slate-400">
            Código de invitación
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CLINIC-XXXXXX"
                maxLength={40}
                className="w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 font-mono text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handlePeek}
              disabled={code.trim().length < 8 || peek.isLoading}
              className="flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {peek.isLoading ? "Buscando..." : "Buscar"}
              <ArrowRight size={14} />
            </button>
          </div>

          {peek.error && (
            <div className="flex items-start gap-2 rounded-md border border-red-800 bg-red-950/30 p-2 text-xs text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>Código inválido o clínica inactiva. Verifica con el administrador.</p>
            </div>
          )}

          {peek.data === null && !peek.isLoading && code.trim().length >= 8 && !peek.error && (
            <div className="flex items-start gap-2 rounded-md border border-amber-800 bg-amber-950/30 p-2 text-xs text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>No se encontró ninguna clínica con ese código.</p>
            </div>
          )}
        </div>
      )}

      {step === "details" && peekedClinic && (
        <div className="space-y-4">
          <div className="rounded-md border border-blue-800 bg-blue-950/30 p-3">
            <p className="text-xs uppercase tracking-wide text-blue-300">Te vas a unir a</p>
            <p className="mt-1 text-base font-semibold text-white">{peekedClinic.nombre}</p>
            <p className="text-xs text-slate-400">
              {peekedClinic.ciudad}, {peekedClinic.estado}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">
              Nombre de tu consultorio dentro de esta clínica
            </label>
            <input
              value={workspaceNombre}
              onChange={(e) => setWorkspaceNombre(e.target.value)}
              placeholder={`Consultorio en ${peekedClinic.nombre}`}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Estado donde trabajás <span className="text-red-400">*</span>
              </label>
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value)
                  setCiudad("")
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {ESTADOS_VENEZUELA.map((e) => (
                  <option key={e.codigo} value={e.nombre}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">
                Ciudad <span className="text-red-400">*</span>
              </label>
              <select
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                disabled={!estado}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{estado ? "Seleccionar..." : "Primero un estado"}</option>
                {estado &&
                  getCiudadesByEstado(estado).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleJoin}
              disabled={join.isPending || !workspaceNombre.trim() || !estado || !ciudad}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {join.isPending ? "Uniéndome..." : "Unirme a la clínica"}
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("code")
                setPeekedClinic(null)
                setCode("")
              }}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
          {join.error && (
            <p className="text-xs text-red-400">{join.error.message}</p>
          )}
        </div>
      )}
    </section>
  )
}
