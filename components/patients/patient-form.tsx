"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SexoType, IdentificationType, ParentRelationship } from "@prisma/client"
import { CountryCodeSelect } from "@/components/ui/country-code-select"

export function PatientForm() {
  const router = useRouter()
  const [sinCedula, setSinCedula] = useState(false)
  const [codigoPais, setCodigoPais] = useState("+58")
  const [error, setError] = useState("")

  const register = (trpc.patient as any).register.useMutation({
    onSuccess: () => router.push("/doctor/patients"),
    onError: (e: Error) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)

    register.mutate({
      tipoIdentificacion: sinCedula
        ? undefined
        : (fd.get("tipoId") as IdentificationType),
      numeroIdentificacion: sinCedula
        ? undefined
        : (fd.get("numeroId") as string),
      sinCedula,
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      fechaNacimiento: fd.get("fechaNacimiento") as string,
      sexo: fd.get("sexo") as SexoType,
      telefono: (fd.get("telefono") as string) || undefined,
      codigoPais: codigoPais,
      email: (fd.get("email") as string) || undefined,
      representante: sinCedula
        ? {
            cedulaRepresentante: fd.get("repCedula") as string,
            nombreCompleto: fd.get("repNombre") as string,
            parentesco: fd.get("repParentesco") as ParentRelationship,
            telefono: (fd.get("repTelefono") as string) || undefined,
          }
        : undefined,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-white">Registrar Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identificación */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sinCedula"
                checked={sinCedula}
                onChange={(e) => setSinCedula(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sinCedula" className="text-slate-300 cursor-pointer">
                Sin cédula (menor de edad)
              </Label>
            </div>

            {!sinCedula && (
              <div className="flex flex-wrap gap-3">
                <select
                  name="tipoId"
                  defaultValue="CEDULA_V"
                  className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm w-36 shrink-0"
                >
                  <option value="CEDULA_V">V-</option>
                  <option value="CEDULA_E">E-</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <Input
                  name="numeroId"
                  placeholder="12345678"
                  required={!sinCedula}
                  className="bg-slate-800 border-slate-700 text-white flex-1 min-w-0"
                />
              </div>
            )}
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input name="nombre" required className="bg-slate-800 border-slate-700 text-white w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input name="apellido" required className="bg-slate-800 border-slate-700 text-white w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Fecha de Nacimiento</Label>
              <Input
                name="fechaNacimiento"
                type="date"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Sexo</Label>
              <select
                name="sexo"
                defaultValue="MASCULINO"
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Teléfono</Label>
              <div className="flex gap-2">
                <CountryCodeSelect value={codigoPais} onChange={setCodigoPais} />
                <Input name="telefono" className="bg-slate-800 border-slate-700 text-white w-full" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Email</Label>
              <Input name="email" type="email" className="bg-slate-800 border-slate-700 text-white w-full" />
            </div>
          </div>

          {/* Representante — solo si sin cédula */}
          {sinCedula && (
            <div className="border border-slate-700 rounded-lg p-4 space-y-3">
              <p className="text-slate-300 text-sm font-medium">Datos del Representante</p>
              <Input
                name="repCedula"
                placeholder="Cédula del representante"
                required={sinCedula}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                name="repNombre"
                placeholder="Nombre completo"
                required={sinCedula}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  name="repParentesco"
                  defaultValue="MADRE"
                  required={sinCedula}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                >
                  <option value="MADRE">Madre</option>
                  <option value="PADRE">Padre</option>
                  <option value="TUTOR_LEGAL">Tutor Legal</option>
                  <option value="OTRO">Otro</option>
                </select>
                <Input
                  name="repTelefono"
                  placeholder="Teléfono"
                  className="bg-slate-800 border-slate-700 text-white w-full"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Registrando..." : "Registrar paciente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
