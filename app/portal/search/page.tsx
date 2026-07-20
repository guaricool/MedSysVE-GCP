"use client"

import { useState, useRef, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Stethoscope, Search, User, MapPinIcon } from "lucide-react"
import { ESTADOS_VENEZUELA, getCiudadesByEstado } from "@/lib/venezuela-locations"
import { ESPECIALIDADES_VE } from "@/lib/venezuela-specialties"

function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export default function DoctorSearchPage() {
  const [especialidad, setEspecialidad] = useState("")
  const [estado, setEstado] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const { data: doctors, refetch, isFetching } = trpc.marketplace.searchDoctors.useQuery(
    { especialidad, estado, ciudad },
    { enabled: false }
  )

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    refetch()
  }

  // Filter specialties based on input
  const filteredSpecialties = ESPECIALIDADES_VE.filter((spec) =>
    normalizeString(spec).includes(normalizeString(especialidad))
  )

  return (
    <div className="mx-auto mt-8 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Encuentra a tu Especialista</h1>
        <p className="text-slate-400">Busca por especialidad y ubicación en toda Venezuela</p>
      </div>

      <form onSubmit={handleSearch} className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-end relative">
        <div className="flex-1 space-y-2 w-full relative" ref={suggestionsRef}>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" /> Especialidad
          </label>
          <Input 
            placeholder="Ej. Cardiología"
            value={especialidad}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setEspecialidad(e.target.value)
              setShowSuggestions(true)
            }}
            className="bg-slate-800 border-slate-700 text-white"
          />
          {showSuggestions && filteredSpecialties.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-md shadow-2xl z-50">
              {filteredSpecialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => {
                    setEspecialidad(spec)
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Estado
          </label>
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value)
              setCiudad("")
            }}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm h-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccione Estado</option>
            {ESTADOS_VENEZUELA.map((est) => (
              <option key={est.codigo} value={est.nombre}>
                {est.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" /> Ciudad
          </label>
          <select
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            disabled={!estado}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm h-10 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seleccione Ciudad</option>
            {estado &&
              getCiudadesByEstado(estado).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>
        <Button type="submit" disabled={isFetching} className="w-full md:w-auto h-10">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </form>

      <div className="space-y-4 mt-8">
        {isFetching && <p className="text-center text-slate-400">Buscando especialistas...</p>}
        {!isFetching && doctors?.length === 0 && (
          <p className="text-center text-slate-400">No se encontraron doctores con esos criterios.</p>
        )}
        {doctors?.map(doctor => (
          <div key={doctor.id} className="bg-slate-900 rounded-lg border border-slate-800 p-6 flex flex-col md:flex-row gap-6 shadow-md">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-blue-500/30 overflow-hidden">
                {doctor.fotoUrl ? (
                  <img src={doctor.fotoUrl} alt={doctor.nombre} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white">Dr. {doctor.nombre} {doctor.apellido}</h3>
                <p className="text-blue-400 font-medium">{doctor.especialidadPrincipal}</p>
                {doctor.bio && <p className="text-slate-400 text-sm mt-2 line-clamp-2">{doctor.bio}</p>}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Consultorios Disponibles:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctor.workspaces.map(ws => (
                    <div key={ws.id} className="bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-200">{ws.nombre}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {ws.ciudad}, {ws.estado}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <a href={`/portal/schedule?workspaceId=${ws.id}`}>
                          Agendar aquí
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
