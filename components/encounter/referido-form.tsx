"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { trpc } from "@/lib/trpc-client"
import { MapPin, Search, Building2, Stethoscope, X } from "lucide-react"
import { ESTADOS_VENEZUELA, getCiudadesByEstado } from "@/lib/venezuela-locations"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { formatDoctorName } from "@/lib/doctor-utils"

interface ReferidoFormProps {
  encounterId: string
  patientRegistrationId: string
  disabled?: boolean
}

interface ReferidoDoctor {
  id: string
  nombre: string
  apellido: string
  especialidadPrincipal: string
  email: string
  telefono?: string | null
  workspaces?: Array<{
    estado: string | null
    ciudad: string | null
    clinic: { id: string; nombre: string } | null
  }>
}

export function ReferidoForm({ encounterId, patientRegistrationId, disabled }: ReferidoFormProps) {
  const [filterEstado, setFilterEstado] = useState("")
  const [filterCiudad, setFilterCiudad] = useState("")
  const [filterEspecialidad, setFilterEspecialidad] = useState("")
  const [query, setQuery] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<ReferidoDoctor | null>(null)
  const [motivo, setMotivo] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const { setDirty } = useUnsaved()

  const isDirty = useMemo(() => {
    return motivo.trim() !== "" || selectedDoctor !== null
  }, [motivo, selectedDoctor])

  useEffect(() => {
    setDirty("referido", isDirty)
  }, [isDirty, setDirty])

  // ─── Cascade: Estado → Ciudad → Especialidad → Doctor ─────────────────
  // Carlos pidió (2026-07-01):
  //   1. Dropdown debe cerrarse al seleccionar doctor (bug: quedaba flotando).
  //   2. Agregar Especialidad como 3er filtro antes del buscador.
  //   3. NO mostrar ningún doctor hasta que se haya seleccionado ESPECIALIDAD
  //      (con un override: si el usuario escribe ≥2 chars en el buscador,
  //      sí puede ver doctores sin especialidad — útil si conoce el nombre
  //      exacto del colega).
  //
  // Flujo:
  //   • Apenas hay Estado+Ciudad → auto-fetch silencioso de doctores de la
  //     zona. Eso nos permite derivar las especialidades disponibles
  //     en el <select>. PERO no se muestra ningún doctor todavía.
  //   • Cuando se elige Especialidad (o se escribe ≥2 chars) → fetch filtrado
  //     y se muestra la lista de doctores que coincide.
  //   • Al seleccionar doctor → "selectedDoctor" hace que el dropdown se oculte.

  // Auto-fetch silencioso: lista completa de doctores en Estado+Ciudad.
  // SOLO se usa para derivar las especialidades únicas disponibles en la zona.
  // NO se muestra al usuario hasta que elija especialidad.
  const { data: doctorsAll, isFetching: isFetchingAll } = trpc.doctor.searchForReferral.useQuery(
    {
      query: "",
      estado: filterEstado || undefined,
      ciudad: filterCiudad || undefined,
    },
    {
      enabled: !!filterEstado && !!filterCiudad,
    },
  )

  // Búsqueda filtrada: SOLO se muestra al usuario cuando hay especialidad
  // seleccionada O cuando escribió ≥2 chars en el buscador (búsqueda directa
  // por nombre — útil si conoce al colega). Sin ninguna de las dos, devuelve
  // undefined y la UI muestra el placeholder de "Selecciona una especialidad".
  const { data: doctorsFiltered, isFetching: isFetchingFiltered } =
    trpc.doctor.searchForReferral.useQuery(
      {
        query: debouncedQuery,
        estado: filterEstado || undefined,
        ciudad: filterCiudad || undefined,
        especialidad: filterEspecialidad || undefined,
      },
      {
        enabled:
          !!filterEstado &&
          !!filterCiudad &&
          (!!filterEspecialidad || debouncedQuery.length >= 2),
      },
    )

  // La lista activa es SOLO la filtrada. doctorsAll solo se usa para
  // derivar especialidades — nunca para mostrar.
  const doctors = doctorsFiltered
  const isFetching = isFetchingFiltered || (isFetchingAll && !doctorsFiltered)

  // ─── Especialidades únicas disponibles en esta zona ────────────────────
  // Derivamos del resultado completo (no del filtrado) para que el select
  // muestre TODAS las especialidades de la zona, no solo las del filtro
  // actual.
  const availableEspecialidades = useMemo(() => {
    if (!doctorsAll) return []
    const set = new Set<string>()
    for (const d of doctorsAll) {
      if (d.especialidadPrincipal) set.add(d.especialidadPrincipal)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [doctorsAll])

  const saveMut = trpc.document.save.useMutation({
    onSuccess: () => setSubmitted(true),
  })

  function handleQueryChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 300)
    if (!val) setSelectedDoctor(null)
  }

  // Al hacer click en un doctor: set selección Y limpia query/debounce
  // para que el dropdown se cierre de inmediato (el guard `!selectedDoctor`
  // en `showDoctorList` lo oculta).
  function handleSelectDoctor(d: ReferidoDoctor) {
    setSelectedDoctor(d)
    setQuery(formatDoctorName(d))
    setDebouncedQuery("")
  }

  function handleClearSelection() {
    setSelectedDoctor(null)
    setQuery("")
    setDebouncedQuery("")
  }

  // Reset ciudad+especialidad cuando cambia el estado.
  useEffect(() => {
    setFilterCiudad("")
    setFilterEspecialidad("")
    setSelectedDoctor(null)
    setQuery("")
    setDebouncedQuery("")
  }, [filterEstado])

  // Reset especialidad y selección cuando cambia la ciudad.
  useEffect(() => {
    setFilterEspecialidad("")
    setSelectedDoctor(null)
    setQuery("")
    setDebouncedQuery("")
  }, [filterCiudad])

  async function handleCreate() {
    if (!selectedDoctor) return

    let contenidoHtml = `<p>Se refiere al ${formatDoctorName(selectedDoctor)}, ${selectedDoctor.especialidadPrincipal}.</p>`
    if (motivo) contenidoHtml += `<p><strong>Motivo:</strong> ${motivo}</p>`

    await saveMut.mutateAsync({
      encounterId,
      patientRegistrationId,
      tipo: "REFERIDO",
      contenidoHtml,
      referidoANombre: `${selectedDoctor.nombre} ${selectedDoctor.apellido}`,
      referidoAEspecialidad: selectedDoctor.especialidadPrincipal,
      referidoATelefono: selectedDoctor.telefono ?? undefined,
      referidoADoctorId: selectedDoctor.id,
    })
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-emerald-800 bg-emerald-950 p-3 text-sm text-emerald-300">
        Referido creado exitosamente.
        <button
          className="ml-3 underline"
          onClick={() => {
            setSubmitted(false)
            setSelectedDoctor(null)
            setQuery("")
            setFilterEspecialidad("")
            setMotivo("")
          }}
        >
          Crear otro
        </button>
      </div>
    )
  }

  // ─── Dropdown visibility ─────────────────────────────────────────────
  // Carlos pidió (2026-07-01):
  //   • Bug original: el dropdown seguía abierto después de seleccionar
  //     doctor. Fix: guard `!selectedDoctor`.
  //   • 2da iteración: ni siquiera mostraba doctores sin especialidad.
  //     Fix: `doctors` ahora es solo la lista FILTRADA (deriva de la query
  //     que solo corre con especialidad o texto). Por lo tanto, cuando no
  //     hay especialidad ni texto, `doctors` es undefined y la lista NO
  //     se renderiza — el placeholder del buscador guía al usuario.
  const showDoctorList =
    !!filterEstado &&
    !!filterCiudad &&
    !selectedDoctor &&
    !!doctors &&
    doctors.length > 0

  return (
    <div className="space-y-3">
      {/* ─── Step 1: Estado → Ciudad → Especialidad ───────────────────── */}
      <div className="rounded-md border border-amber-800/40 bg-amber-950/20 p-3">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            Ubicación y especialidad del médico destinatario
          </p>
        </div>
        <p className="mt-1 text-[11px] text-amber-200/80">
          Selecciona estado, ciudad y especialidad. Esto filtra el buscador
          para que solo aparezcan colegas de tu zona y especialidad — un
          referido a otro extremo del país o especialidad distinta no tiene
          sentido clínico.
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            disabled={disabled}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Estado...</option>
            {ESTADOS_VENEZUELA.map((e) => (
              <option key={e.codigo} value={e.nombre}>
                {e.nombre}
              </option>
            ))}
          </select>
          <select
            value={filterCiudad}
            onChange={(e) => setFilterCiudad(e.target.value)}
            disabled={disabled || !filterEstado}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {filterEstado ? "Ciudad..." : "Primero un estado"}
            </option>
            {filterEstado &&
              getCiudadesByEstado(filterEstado).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <select
            value={filterEspecialidad}
            onChange={(e) => {
              setFilterEspecialidad(e.target.value)
              setSelectedDoctor(null)
              setQuery("")
              setDebouncedQuery("")
            }}
            disabled={
              disabled ||
              !filterCiudad ||
              isFetchingAll ||
              availableEspecialidades.length === 0
            }
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {!filterCiudad
                ? "Esp..."
                : isFetchingAll
                  ? "Cargando..."
                  : availableEspecialidades.length === 0
                    ? "Sin médicos en la zona"
                    : "Especialidad..."}
            </option>
            {availableEspecialidades.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Step 2: Buscador por nombre/apellido (opcional) ──────────── */}
      {filterEstado && filterCiudad && !selectedDoctor && (
        <div className="relative">
          <label className="mb-1 block text-xs text-slate-400">
            Buscar por nombre o apellido
            <span className="ml-1 text-slate-500">
              (opcional — o salta este paso si ya elegiste especialidad)
            </span>
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Dr. García, Pérez..."
              disabled={disabled}
              className="w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Hint: si no hay especialidad y no hay query, NO se muestran
              doctores (Carlos pidió esto el 2026-07-01). Guiamos al usuario
              con un mensaje explícito. */}
          {!filterEspecialidad && debouncedQuery.length < 2 && (
            <p className="mt-2 rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
              Selecciona una <strong className="text-amber-300">especialidad</strong> arriba
              para ver los médicos disponibles en {filterCiudad}. También puedes
              escribir al menos 2 letras del nombre del médico que buscas.
            </p>
          )}

          {showDoctorList && (
            <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-xl">
              {isFetching && doctors?.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">Buscando...</p>
              )}
              {!isFetching && doctors?.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">
                  Sin médicos
                  {filterEspecialidad ? ` de ${filterEspecialidad} ` : " "}
                  en {filterCiudad}, {filterEstado}.
                </p>
              )}
              {doctors?.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="flex w-full flex-col gap-0.5 border-b border-slate-800 px-3 py-2 text-left last:border-b-0 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
                  onClick={() => handleSelectDoctor(d)}
                >
                  <span className="text-sm font-medium text-white">
                    {formatDoctorName(d)}
                  </span>
                  <span className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
                    <Stethoscope size={11} className="text-slate-500" />
                    {d.especialidadPrincipal}
                    {d.workspaces?.[0]?.clinic && (
                      <>
                        <span className="text-slate-600">·</span>
                        <Building2 size={11} className="text-slate-500" />
                        <span>{d.workspaces[0].clinic.nombre}</span>
                      </>
                    )}
                  </span>
                  {d.telefono && (
                    <span className="text-[11px] text-slate-500">Tel: {d.telefono}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Step 3: Doctor seleccionado (con botón Cambiar) ─────────── */}
      {selectedDoctor && (
        <div className="relative rounded-md border border-blue-700 bg-blue-950/40 p-3 pr-10 text-sm">
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={disabled}
            className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            aria-label="Cambiar médico"
            title="Cambiar médico"
          >
            <X size={14} />
          </button>
          <p className="pr-6 font-semibold text-white">
            {formatDoctorName(selectedDoctor)}
          </p>
          <p className="flex items-center gap-1 text-slate-300">
            <Stethoscope size={12} className="text-slate-500" />
            {selectedDoctor.especialidadPrincipal}
          </p>
          {selectedDoctor.workspaces?.[0]?.clinic && (
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Building2 size={11} className="text-slate-500" />
              {selectedDoctor.workspaces[0].clinic.nombre}
              {selectedDoctor.workspaces[0].ciudad && (
                <span className="text-slate-500">
                  · {selectedDoctor.workspaces[0].ciudad},{" "}
                  {selectedDoctor.workspaces[0].estado}
                </span>
              )}
            </p>
          )}
          {selectedDoctor.telefono && (
            <p className="text-xs text-slate-500">Tel: {selectedDoctor.telefono}</p>
          )}
        </div>
      )}

      {/* ─── Step 4: Motivo del referido ─────────────────────────────── */}
      <div>
        <label className="mb-1 block text-xs text-slate-400">
          Motivo del referido
        </label>
        <textarea
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={disabled}
          placeholder="Descripción breve del motivo de referido..."
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        disabled={!selectedDoctor || saveMut.isPending || disabled}
        onClick={handleCreate}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saveMut.isPending ? "Creando referido..." : "Crear referido"}
      </button>
      {saveMut.error && (
        <p className="text-xs text-red-400">{saveMut.error.message}</p>
      )}
    </div>
  )
}