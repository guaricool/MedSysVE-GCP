"use client"
import { useState, useEffect } from "react"
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

  const [tipoId, setTipoId] = useState<IdentificationType>("CEDULA_V")
  const [numeroId, setNumeroId] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [sexo, setSexo] = useState<SexoType>("MASCULINO")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [globalProfile, setGlobalProfile] = useState<any>(null)
  
  const lookup = (trpc.patient as any).lookupByCedula.useQuery(
    { tipoIdentificacion: tipoId, numeroIdentificacion: numeroId },
    { enabled: numeroId.length >= 6 && !sinCedula, retry: false }
  )

  // Autofill form when lookup succeeds
  useEffect(() => {
    if (lookup.data) {
      if (lookup.data.nombre) setNombre(lookup.data.nombre)
      if (lookup.data.apellido) setApellido(lookup.data.apellido)
      if (lookup.data.fechaNacimiento) {
        setFechaNacimiento(new Date(lookup.data.fechaNacimiento).toISOString().split("T")[0])
      }
      if (lookup.data.sexo) setSexo(lookup.data.sexo)
      if (lookup.data.email) setEmail(lookup.data.email)
      if (lookup.data.telefono) setTelefono(lookup.data.telefono)
      if (lookup.data.codigoPais) setCodigoPais(lookup.data.codigoPais)
      if (lookup.data.globalProfileExists) setGlobalProfile(lookup.data)
    } else {
      setGlobalProfile(null)
    }
  }, [lookup.data])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)

    register.mutate({
      tipoIdentificacion: sinCedula ? undefined : tipoId,
      numeroIdentificacion: sinCedula ? undefined : numeroId,
      sinCedula,
      nombre,
      apellido,
      fechaNacimiento,
      sexo,
      telefono: telefono || undefined,
      codigoPais: codigoPais,
      email: email || undefined,
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
        {globalProfile && (
          <div className="mb-6 p-4 rounded-lg bg-blue-950/50 border border-blue-800 shadow-md">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">🌟</span> ¡Paciente encontrado en MedSysVE!
            </h3>
            <p className="text-sm text-blue-200 mb-3">
              Este paciente ya tiene un Perfil Global. Hemos autocompletado sus datos públicos. 
              Al registrarlo, quedará vinculado a tu consultorio.
            </p>
          </div>
        )}
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
                  value={tipoId}
                  onChange={(e) => setTipoId(e.target.value as IdentificationType)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm w-36 shrink-0"
                >
                  <option value="CEDULA_V">V-</option>
                  <option value="CEDULA_E">E-</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <Input
                  name="numeroId"
                  placeholder="12345678"
                  value={numeroId}
                  onChange={(e) => setNumeroId(e.target.value)}
                  required={!sinCedula}
                  className="bg-slate-800 border-slate-700 text-white flex-1 min-w-0"
                />
              </div>
            )}
            {lookup.isFetching && <p className="text-xs text-slate-400">Buscando paciente...</p>}
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input name="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required className="bg-slate-800 border-slate-700 text-white w-full" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input name="apellido" value={apellido} onChange={e => setApellido(e.target.value)} required className="bg-slate-800 border-slate-700 text-white w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Fecha de Nacimiento</Label>
              <Input
                name="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Sexo</Label>
              <select
                name="sexo"
                value={sexo}
                onChange={e => setSexo(e.target.value as SexoType)}
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
                <Input name="telefono" value={telefono} onChange={e => setTelefono(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-full" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Email</Label>
              <Input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-full" />
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
