"use client"

import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { ClinicCard, LocationForm } from "@/components/clinic/clinic-card"
import { JoinClinicForm } from "@/components/clinic/join-clinic-form"
import { SubscriptionCard } from "@/components/workspace/subscription-card"
import { Lock, ShieldCheck, FileText, Building2, User, Stethoscope, CheckCircle2 } from "lucide-react"
import { getDoctorPrefix } from "@/lib/doctor-utils"

interface WorkspaceData {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  rif: string | null
  razonSocial: string | null
  direccionFiscal: string | null
  logoUrl: string | null
  estado: string | null
  ciudad: string | null
  doctorId: string
  clinic: {
    id: string
    nombre: string
    estado: string | null
    ciudad: string | null
    invitationCodes?: Array<{
      id: string
      code: string
      used: boolean
      createdAt: Date | string
    }>
  } | null
}

interface Props {
  workspace: WorkspaceData
}

export function WorkspaceSettingsClient({ workspace }: Props) {
  const [form, setForm] = useState({
    nombre: workspace.nombre ?? "",
    direccion: workspace.direccion ?? "",
    telefono: workspace.telefono ?? "",
    rif: workspace.rif ?? "",
    razonSocial: workspace.razonSocial ?? "",
    direccionFiscal: workspace.direccionFiscal ?? "",
    logoUrl: workspace.logoUrl ?? "",
  })
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = trpc.workspace.updateSettings.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [key]: e.target.value }))
        setSaved(false)
      },
    }
  }

  async function handleLogoUpload(file: File) {
    setLogoError(null)
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setLogoError(data.error ?? "Error al subir logo.")
        return
      }
      setForm((f) => ({ ...f, logoUrl: data.url as string }))
      setSaved(false)
    } catch {
      setLogoError("Error de red al subir logo.")
    } finally {
      setLogoUploading(false)
    }
  }

  function handleSave() {
    update.mutate({
      nombre: form.nombre || undefined,
      direccion: form.direccion || undefined,
      telefono: form.telefono || undefined,
      rif: form.rif || undefined,
      razonSocial: form.razonSocial || undefined,
      direccionFiscal: form.direccionFiscal || undefined,
      logoUrl: form.logoUrl || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Ubicación (estado + ciudad) — required for referral doctor picker */}
      <LocationForm
        initialEstado={workspace.estado}
        initialCiudad={workspace.ciudad}
      />

      {/* Suscripción — manage, cancel, change plan via Stripe Customer Portal */}
      <SubscriptionCard />

      {/* Clínica a la que pertenecés */}
      <ClinicCard
        clinic={
          workspace.clinic
            ? {
                id: workspace.clinic.id,
                nombre: workspace.clinic.nombre,
                estado: workspace.clinic.estado,
                ciudad: workspace.clinic.ciudad,
                invitationCodes: workspace.clinic.invitationCodes,
              }
            : null
        }
        isOwner={workspace.clinic?.invitationCodes != null}
      />

      {/* Si no pertenece a una clínica, opción de unirse */}
      {!workspace.clinic && <JoinClinicForm />}

      {/* Información del consultorio */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Información del consultorio
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del consultorio" required>
            <input
              type="text"
              {...field("nombre")}
              className="input-dark"
              placeholder="Ej: Consultorio Dr. García"
            />
          </Field>
          <Field label="Teléfono">
            <input type="tel" {...field("telefono")} className="input-dark" placeholder="+58 412 000 0000" />
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <input
              type="text"
              {...field("direccion")}
              className="input-dark"
              placeholder="Av. Principal, Piso 2, Consultorio 5..."
            />
          </Field>
        </div>
      </section>

      {/* Datos fiscales */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Datos fiscales (para facturas)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="RIF">
            <input type="text" {...field("rif")} className="input-dark" placeholder="J-12345678-9" />
          </Field>
          <Field label="Razón social">
            <input
              type="text"
              {...field("razonSocial")}
              className="input-dark"
              placeholder="Nombre legal para facturas"
            />
          </Field>
          <Field label="Dirección fiscal" className="sm:col-span-2">
            <input
              type="text"
              {...field("direccionFiscal")}
              className="input-dark"
              placeholder="Dirección fiscal registrada ante el SENIAT"
            />
          </Field>
        </div>
      </section>

      {/* Apariencia */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Apariencia — Logo
        </h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {form.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt="Logo del consultorio"
                className="h-20 w-20 rounded-lg border border-slate-700 object-contain bg-white p-1"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-500 text-xs text-center">
                Sin logo
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              El logo aparece en los encabezados de recetas, facturas y documentos generados.
            </p>
            <button
              type="button"
              disabled={logoUploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 hover:text-white disabled:opacity-50"
            >
              {logoUploading ? "Subiendo..." : "Cambiar logo"}
            </button>
            <p className="text-xs text-slate-500">JPG, PNG o WebP · Máximo 2 MB</p>
            {logoError && <p className="text-xs text-red-400">{logoError}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleLogoUpload(f)
              }}
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {update.isPending ? "Guardando..." : "Guardar cambios"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Guardado.</span>}
        {update.error && <span className="text-sm text-red-400">{update.error.message}</span>}
      </div>

      {/* Doctor public profile */}
      <DoctorProfileSection />

      {/* Announcements for patients */}
      <AnnouncementsSection />

      {/* Create new workspace */}
      <NewWorkspaceSection />

      <style>{`
        .input-dark {
          width: 100%;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #0f172a;
          padding: 8px 12px;
          font-size: 14px;
          color: white;
          outline: none;
        }
        .input-dark:focus { border-color: #3b82f6; }
        .input-dark::placeholder { color: #64748b; }
      `}</style>
    </div>
  )
}

function DoctorProfileSection() {
  const { data: profile } = trpc.doctor.myProfile.useQuery()
  const [prefijo, setPrefijo] = useState<"Dr." | "Dra.">("Dr.")
  const [bio, setBio] = useState("")
  const [idiomas, setIdiomas] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setPrefijo(getDoctorPrefix(profile))
      setBio(profile.bio ?? "")
      setIdiomas(profile.idiomas ?? [])
    }
  }, [profile])

  const update = trpc.doctor.updateProfile.useMutation({
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500) },
  })

  const LANGS = ["Español", "Inglés", "Portugués", "Francés", "Italiano", "Alemán"]

  function toggleLang(l: string) {
    setIdiomas((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l])
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      {/* Credenciales Sanitarias e Identificación Médica Oficial (Protegidas) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Credenciales Sanitarias & Identificación Oficial (MPPS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Información oficial validada ante el Ministerio de Salud. Protegida e inmutable.
            </p>
          </div>
          {profile?.isSacsVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 shrink-0 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verificado SACS MPPS
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400 shrink-0 self-start sm:self-auto">
              Registro Oficial
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cédula de Identidad */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Cédula de Identidad
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Lock className="w-3 h-3 text-amber-400" /> Protegido
              </span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={profile?.cedula ? `${profile.nacionalidad ?? "V"}-${profile.cedula}` : "Sin registrar"}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 font-mono cursor-not-allowed select-none opacity-85"
            />
          </div>

          {/* Matrícula MPPS */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Matrícula MPPS (Ministerio de Salud)
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Lock className="w-3 h-3 text-amber-400" /> Protegido
              </span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={profile?.mppsMatricula ? profile.mppsMatricula : "Sin registrar"}
              className="w-full rounded-md border border-amber-500/30 bg-slate-950 px-3 py-2 text-sm text-amber-300 font-mono font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
            />
          </div>

          {/* Especialidad Médica Principal */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Especialidad Principal MPPS
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Lock className="w-3 h-3 text-amber-400" /> Protegido
              </span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={profile?.especialidadPrincipal ?? "Medicina General"}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 cursor-not-allowed select-none opacity-85"
            />
          </div>

          {/* RIF Fiscal */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> RIF Fiscal
              </span>
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                <Lock className="w-3 h-3 text-amber-400" /> Protegido
              </span>
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={profile?.rif ?? "Sin registrar"}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 font-mono cursor-not-allowed select-none opacity-85"
            />
          </div>
        </div>
      </section>

      {/* Perfil público editable */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Perfil público del médico
        </h2>
        <p className="text-xs text-slate-500">
          Esta información puede aparecer en la página pública de la clínica.
        </p>
        <div className="space-y-4">
          {/* Trato u Honorífico Profesional */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Trato / Honorífico Profesional (Aparece en recetas, sellos e informes)
            </label>
            <div className="flex items-center gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => { setPrefijo("Dr."); setSaved(false); }}
                className={`flex-1 rounded-md border py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  prefijo === "Dr."
                    ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span>Dr.</span>
                <span className="text-[10px] font-normal opacity-80">(Doctor)</span>
              </button>
              <button
                type="button"
                onClick={() => { setPrefijo("Dra."); setSaved(false); }}
                className={`flex-1 rounded-md border py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  prefijo === "Dra."
                    ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span>Dra.</span>
                <span className="text-[10px] font-normal opacity-80">(Doctora)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Biografía profesional</label>
            <textarea
              value={bio}
              onChange={(e) => { setBio(e.target.value); setSaved(false) }}
              rows={4}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Describe tu formación, experiencia y especialidades..."
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-slate-400">Idiomas</label>
            <div className="flex flex-wrap gap-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLang(l)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    idiomas.includes(l)
                      ? "border-blue-600 bg-blue-600/20 text-blue-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={update.isPending}
              onClick={() => update.mutate({ prefijo, bio: bio || undefined, idiomas })}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {update.isPending ? "Guardando..." : "Guardar perfil"}
            </button>
            {saved && <span className="text-sm text-emerald-400">Guardado.</span>}
            {update.error && <span className="text-sm text-red-400">{update.error.message}</span>}
          </div>
        </div>
      </section>
    </div>
  )
}

function NewWorkspaceSection() {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [done, setDone] = useState(false)

  const create = trpc.workspace.create.useMutation({
    onSuccess: () => {
      setDone(true)
      setNombre("")
      setOpen(false)
      // workspaces refetch happens automatically via workspace switcher's query
    },
  })

  return (
    <section id="new-workspace" className="rounded-lg border border-dashed border-slate-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Múltiples consultorios
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra varios consultorios con una sola cuenta de médico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setDone(false) }}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 hover:text-white"
        >
          + Nuevo consultorio
        </button>
      </div>
      {done && (
        <p className="mt-3 text-sm text-emerald-400">
          Consultorio creado. Puedes cambiarte en el selector de la barra lateral.
        </p>
      )}
      {open && (
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">Nombre del nuevo consultorio</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-dark"
              placeholder="Ej: Consultorio Norte"
            />
          </div>
          <button
            type="button"
            disabled={!nombre.trim() || create.isPending}
            onClick={() => create.mutate({ nombre: nombre.trim() })}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {create.isPending ? "Creando..." : "Crear"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
        </div>
      )}
      {create.error && (
        <p className="mt-2 text-sm text-red-400">{create.error.message}</p>
      )}
    </section>
  )
}

function AnnouncementsSection() {
  const [titulo, setTitulo] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [showForm, setShowForm] = useState(false)

  const utils = trpc.useUtils()
  const { data: rawAnns = [] } = (trpc as any).announcement.list.useQuery()
  const anns = rawAnns as any[]

  const create = (trpc as any).announcement.create.useMutation({
    onSuccess: () => {
      utils.invalidate()
      setTitulo("")
      setMensaje("")
      setShowForm(false)
    },
  })
  const toggle = (trpc as any).announcement.toggle.useMutation({ onSuccess: () => utils.invalidate() })
  const del = (trpc as any).announcement.delete.useMutation({ onSuccess: () => utils.invalidate() })

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Anuncios para pacientes
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((o) => !o)}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 hover:text-white"
        >
          + Nuevo anuncio
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Los anuncios activos son visibles para sus pacientes en el portal.
      </p>

      {showForm && (
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
              placeholder="Ej: Horario especial de diciembre"
              className="input-dark"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Mensaje</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Texto del anuncio..."
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={create.isPending || !titulo.trim() || !mensaje.trim()}
              onClick={() => create.mutate({ titulo: titulo.trim(), mensaje: mensaje.trim() })}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {create.isPending ? "Publicando..." : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-slate-700 px-4 py-1.5 text-sm text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {anns.length === 0 ? (
        <p className="text-xs text-slate-500">Sin anuncios publicados.</p>
      ) : (
        <ul className="space-y-2">
          {anns.map((a: any) => (
            <li key={a.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{a.titulo}</p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        a.activo
                          ? "bg-emerald-900/40 text-emerald-400"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {a.activo ? "Activo" : "Oculto"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{a.mensaje}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggle.mutate({ id: a.id })}
                    disabled={toggle.isPending}
                    className="text-xs text-slate-500 hover:text-blue-400"
                  >
                    {a.activo ? "Ocultar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => del.mutate({ id: a.id })}
                    disabled={del.isPending}
                    className="text-xs text-slate-600 hover:text-red-400"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
