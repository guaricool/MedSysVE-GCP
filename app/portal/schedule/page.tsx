"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User } from "lucide-react"

function ScheduleForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const workspaceId = searchParams?.get("workspaceId")
  
  // Need to pick a date
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0] // default to today
  )
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [error, setError] = useState("")

  // Queries
  const { data: availability, isFetching } = trpc.marketplace.getDoctorAvailability.useQuery(
    { workspaceId: workspaceId || "", date: selectedDate },
    { enabled: !!workspaceId && !!selectedDate }
  )

  const scheduleMutation = trpc.appointment.requestFromPortal.useMutation()

  if (!workspaceId) {
    return <div className="text-center text-white mt-8">WorkspaceId no proporcionado.</div>
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setSelectedTime("") // Reset time when date changes
    setError("")
  }

  const handleSchedule = async () => {
    if (!selectedTime) {
      setError("Debes seleccionar una hora")
      return
    }
    setError("")

    try {
      await scheduleMutation.mutateAsync({
        workspaceId,
        fecha: selectedDate,
        hora: selectedTime,
      })
      // Success! 
      router.push("/portal/schedule/success")
    } catch (err: any) {
      setError(err.message || "Error al agendar la cita. Por favor intenta de nuevo.")
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-3xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Agendar Cita</h1>
        <p className="text-slate-400">Selecciona el día y la hora de tu preferencia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Date Selection Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Fecha
          </h2>
          
          <input 
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-4 py-3"
          />

          <h2 className="text-xl font-bold text-white flex items-center gap-2 pt-4">
            <Clock className="w-5 h-5 text-blue-400" /> Horarios Disponibles
          </h2>
          
          <div className="min-h-[150px]">
            {isFetching ? (
              <p className="text-slate-400 text-sm">Buscando horarios...</p>
            ) : availability?.slots && availability.slots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {availability.slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`
                      py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 border
                      ${selectedTime === time 
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/50" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                <p className="text-slate-400 text-sm">
                  No hay horarios disponibles para esta fecha.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Confirmar Cita
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Fecha seleccionada</p>
                <p className="text-white text-lg font-medium">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-VE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Hora seleccionada</p>
                {selectedTime ? (
                  <p className="text-white text-lg font-medium">{selectedTime}</p>
                ) : (
                  <p className="text-slate-500 text-sm italic">Ninguna</p>
                )}
              </div>
            </div>
            
            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
          </div>

          <Button 
            onClick={handleSchedule} 
            disabled={!selectedTime || scheduleMutation.isPending}
            className="w-full mt-8 h-12 text-lg font-medium"
          >
            {scheduleMutation.isPending ? "Agendando..." : "Confirmar Cita"}
          </Button>
        </div>

      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="text-center text-white mt-8">Cargando formulario de agendamiento...</div>}>
      <ScheduleForm />
    </Suspense>
  )
}
