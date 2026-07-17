"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, MoreVertical, Edit, ShieldAlert, KeyRound, Loader2, Play, Pause, X } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu"

const rolLabels: Record<string, string> = {
  SECRETARY: "Secretaria",
  ASSISTANT: "Asistente",
  NURSE: "Enfermera",
}

export function StaffManagement() {
  const { data: staff, refetch, isLoading } = trpc.clinicAdmin.listClinicStaff.useQuery()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [globalMessage, setGlobalMessage] = useState<{type: "error" | "success", text: string} | null>(null)

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Personal de la Clínica</h2>
          <p className="text-sm text-slate-400">Gestiona al equipo de apoyo que trabaja con los doctores en tu clínica.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <UserPlus size={16} />
          Agregar Personal
        </Button>
      </div>

      {globalMessage && (
        <div className={`p-4 rounded-md ${globalMessage.type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"} flex items-center justify-between`}>
          <p className="text-sm">{globalMessage.text}</p>
          <button onClick={() => setGlobalMessage(null)} className="hover:opacity-70"><X size={16} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : !staff || staff.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No hay personal registrado</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Aún no has agregado a nadie a tu equipo. Puedes agregar secretarias, asistentes o enfermeras.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>Agregar Personal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <StaffCard 
              key={member.email} 
              member={member} 
              onUpdate={() => refetch()} 
              showMessage={(t, m) => setGlobalMessage({ type: t, text: m })} 
            />
          ))}
        </div>
      )}

      {isAddOpen && (
        <AddStaffModal 
          onClose={() => setIsAddOpen(false)} 
          onSuccess={() => {
            setIsAddOpen(false)
            setGlobalMessage({ type: "success", text: "Personal agregado exitosamente." })
            refetch()
          }} 
        />
      )}
    </div>
  )
}

function StaffCard({ member, onUpdate, showMessage }: { member: any, onUpdate: () => void, showMessage: (t: "success"|"error", m: string) => void }) {
  const [isStatusLoading, setIsStatusLoading] = useState(false)
  const updateStaff = trpc.clinicAdmin.updateClinicStaff.useMutation({
    onSuccess: () => {
      showMessage("success", "Los cambios se han guardado correctamente.")
      onUpdate()
    },
    onError: (err) => {
      showMessage("error", err.message)
    },
    onSettled: () => setIsStatusLoading(false),
  })

  const toggleStatus = () => {
    setIsStatusLoading(true)
    updateStaff.mutate({
      email: member.email,
      activo: !member.activo,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 overflow-hidden pr-2">
          <CardTitle className="text-lg text-white flex items-center gap-2 flex-wrap">
            <span className="truncate">{member.nombre} {member.apellido}</span>
            {!member.activo && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/20 shrink-0">INACTIVO</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-1 truncate">{member.email}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200 w-48">
            <DropdownMenuItem onClick={toggleStatus} disabled={isStatusLoading} className="focus:bg-slate-700 cursor-pointer text-amber-400">
              {member.activo ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {member.activo ? "Suspender" : "Reactivar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50">
            {rolLabels[member.rol] ?? member.rol}
          </Badge>
          <span className="text-xs text-slate-500 font-mono" title="Cédula">
            {member.cedula}
          </span>
        </div>
        
        <div className="bg-slate-950 rounded-md p-3 border border-slate-800/50">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Asignado a {member.workspaces.length} consultorios</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {member.workspaces.map((ws: any) => (
              <div key={ws.id} className="text-xs flex flex-col">
                <span className="text-slate-300 truncate">Dr. {ws.doctorName}</span>
                {ws.nombre !== "Consultorio Principal" && (
                  <span className="text-slate-500 truncate text-[10px]">{ws.nombre}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddStaffModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const createStaff = trpc.clinicAdmin.createClinicStaff.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err.message)
      setLoading(false)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    
    createStaff.mutate({
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      cedula: fd.get("cedula") as string,
      email: fd.get("email") as string,
      rol: fd.get("rol") as "SECRETARY" | "ASSISTANT" | "NURSE",
      password: fd.get("password") as string,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-lg shadow-xl border border-slate-800 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Agregar Personal a la Clínica</h2>
          <p className="text-sm text-slate-400 mb-6">Este miembro será asignado a todos los consultorios médicos asociados a la clínica automáticamente.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="nombre" className="text-slate-300">Nombre</Label>
                <Input id="nombre" name="nombre" required className="bg-slate-950 border-slate-800 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="apellido" className="text-slate-300">Apellido</Label>
                <Input id="apellido" name="apellido" required className="bg-slate-950 border-slate-800 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="cedula" className="text-slate-300">Cédula</Label>
              <Input id="cedula" name="cedula" required className="bg-slate-950 border-slate-800 text-white" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input id="email" name="email" type="email" required className="bg-slate-950 border-slate-800 text-white" />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="rol" className="text-slate-300">Rol</Label>
              <select
                name="rol"
                required
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="SECRETARY">Secretaria (Acceso total menos HC)</option>
                <option value="ASSISTANT">Asistente (Lectura y agenda)</option>
                <option value="NURSE">Enfermera (Sala de espera)</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-300">Contraseña temporal (mínimo 6 caracteres)</Label>
              <Input id="password" name="password" type="text" required minLength={6} className="bg-slate-950 border-slate-800 text-white font-mono" />
              <p className="text-[10px] text-slate-500 mt-1">El empleado usará esta contraseña para iniciar sesión por primera vez.</p>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">{error}</p>}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-slate-400 hover:text-white">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white min-w-24">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Personal"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
