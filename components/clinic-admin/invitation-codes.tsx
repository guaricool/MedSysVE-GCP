"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Copy, Check, Users } from "lucide-react"

export function InvitationCodes() {
  const { data: codes, refetch, isLoading } = trpc.clinicAdmin.listInvitationCodes.useQuery()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const generateCode = trpc.clinicAdmin.generateInvitationCode.useMutation({
    onSuccess: () => {
      refetch()
      setError(null)
    },
    onError: (err) => {
      setError(err.message)
    },
    onSettled: () => setIsGenerating(false)
  })

  const freeCodes = codes?.filter(c => !c.isExtraSeat) || []
  const extraCodes = codes?.filter(c => c.isExtraSeat) || []

  const handleGenerate = () => {
    if (freeCodes.length >= 2) {
      if (!window.confirm("Ya has generado los 2 códigos gratuitos incluidos. Cualquier código adicional será un ASIENTO EXTRA y el médico deberá pagar su propia suscripción individual.\n\n¿Deseas generar un código extra de todos modos?")) {
        return
      }
    }
    setIsGenerating(true)
    generateCode.mutate()
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Códigos de Invitación</h2>
          <p className="text-sm text-slate-400">Genera códigos para que los médicos se unan a tu clínica.</p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
          Generar Código
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-white">Resumen de Asientos</CardTitle>
            <CardDescription className="text-slate-400">Límites y uso actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-sm text-slate-400">Doctores Incluidos (Gratis)</span>
              <span className="text-lg font-bold text-white">{freeCodes.filter(c => c.used).length} / 2</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-sm text-slate-400">Códigos Gratis Disponibles</span>
              <span className="text-lg font-bold text-amber-400">{freeCodes.filter(c => !c.used).length}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
              <span className="text-sm text-slate-400">Médicos Extra (Pago Individual)</span>
              <span className="text-lg font-bold text-emerald-400">{extraCodes.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white">Códigos Generados</CardTitle>
            <CardDescription className="text-slate-400">Historial de invitaciones creadas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : !codes || codes.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-800 rounded-lg">
                <Users className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No has generado ningún código de invitación aún.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map(code => (
                  <div key={code.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950 p-3 rounded border border-slate-800 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-white text-lg tracking-wider">{code.code}</span>
                        {code.used ? (
                          <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">USADO</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">DISPONIBLE</Badge>
                        )}
                        {code.isExtraSeat ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">ASIENTO EXTRA (PAGO)</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">INCLUIDO (GRATIS)</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Generado el {new Date(code.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {code.used && code.usedBy ? (
                        <p className="text-sm text-emerald-400 bg-emerald-950 px-2 py-1 rounded">
                          Dr. {code.usedBy.nombre} {code.usedBy.apellido}
                        </p>
                      ) : (
                        <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white" onClick={() => copyToClipboard(code.code)}>
                          {copiedCode === code.code ? (
                            <><Check className="mr-2 h-4 w-4 text-emerald-400" /> Copiado</>
                          ) : (
                            <><Copy className="mr-2 h-4 w-4" /> Copiar código</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
