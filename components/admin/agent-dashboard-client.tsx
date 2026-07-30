"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  MessageSquare,
  Users,
  BrainCircuit,
  RefreshCw,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  BookOpen,
} from "lucide-react"
import { toast } from "sonner"

export function AgentDashboardClient() {
  const [isSeeding, setIsSeeding] = useState(false)
  const { data, isLoading, refetch } = trpc.admin.getAgentMetrics.useQuery(undefined, {
    refetchInterval: 10000, // Auto-refresh cada 10 segundos
  })

  async function handleReSeedKnowledge() {
    setIsSeeding(true)
    toast.info("Iniciando indexación de la base de conocimiento RAG...")
    try {
      const res = await fetch("/api/admin/seed-knowledge", { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        toast.success("✅ Base de conocimiento sembrada e indexada con éxito.")
        refetch()
      } else {
        toast.error(`❌ Error al sembrar: ${json.error || json.details}`)
      }
    } catch (err) {
      toast.error("❌ Error de red al comunicarse con el servidor.")
    } finally {
      setIsSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-sm">Cargando métricas del panel de Agentes Autónomos 24/7…</p>
      </div>
    )
  }

  const overview = data?.overview || {
    totalConversations: 0,
    marketingConversations: 0,
    customerServiceConversations: 0,
    techSupportConversations: 0,
    humanTakeoverCount: 0,
    totalLeads: 0,
    newLeads: 0,
    knowledgeChunksCount: 0,
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Panel de Control de Agentes Autónomos 24/7
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                ● 3 Agentes Activos
              </Badge>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Monitoreo en tiempo real de interacciones de Marketing, Atención al Cliente y Soporte Técnico RAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
          </Button>
          <Button
            onClick={handleReSeedKnowledge}
            disabled={isSeeding}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-600/25"
          >
            {isSeeding ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
            Indexar Base RAG
          </Button>
        </div>
      </div>

      {/* Agents Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent Marketing */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Agente Marketing & Prospectación
            </CardTitle>
            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30">WhatsApp / Web</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{overview.marketingConversations}</div>
            <p className="text-xs text-slate-400 mt-1">
              Conversaciones de ventas atendidas
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Leads Capturados:</span>
              <span className="font-semibold text-purple-400">{overview.totalLeads} médicos</span>
            </div>
          </CardContent>
        </Card>

        {/* Agent Customer Service */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              Agente Atención al Paciente (Citas)
            </CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">24/7 Disponible</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{overview.customerServiceConversations}</div>
            <p className="text-xs text-slate-400 mt-1">
              Consultas de horarios y agendamiento
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Verificación de agenda:</span>
              <span className="font-semibold text-emerald-400">Tiempo Real (0 overbooking)</span>
            </div>
          </CardContent>
        </Card>

        {/* Agent Tech Support */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              Agente Soporte Técnico RAG
            </CardTitle>
            <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30">Lectura Segura</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{overview.techSupportConversations}</div>
            <p className="text-xs text-slate-400 mt-1">
              Dudas operativas y resolución de fallas
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Bloques RAG indexados:</span>
              <span className="font-semibold text-cyan-400">{overview.knowledgeChunksCount} documentos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Leads & Active Chats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel 1: Alcance de Marketing y Leads */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Alcance de Marketing & Leads Capturados ({overview.totalLeads})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Médicos interesados registrados automáticamente por el Agente de Marketing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentLeads && data.recentLeads.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{lead.name || "Doctor sin nombre"}</span>
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-[10px]">
                          {lead.channel}
                        </Badge>
                      </div>
                      <p className="text-slate-400 font-mono">{lead.phone || "Sin teléfono"}</p>
                      {lead.notes && <p className="text-slate-500 italic line-clamp-1">"{lead.notes}"</p>}
                    </div>
                    <Badge
                      className={
                        lead.status === "NEW"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No hay leads capturados recientemente. El agente de marketing registrará automáticamente a los médicos interesados.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 2: Registro de Conversaciones en Vivo */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Conversaciones Recientes ({overview.totalConversations})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Historial de chats activos procesados 24/7 por el motor de la IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentConversations && data.recentConversations.length > 0 ? (
              <div className="space-y-3">
                {data.recentConversations.map((conv: any) => {
                  const lastMsg = conv.messages?.[0]
                  return (
                    <div
                      key={conv.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{conv.senderName || conv.senderId}</span>
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 text-[10px]">
                            {conv.botType}
                          </Badge>
                        </div>
                        <Badge
                          className={
                            conv.status === "HUMAN_TAKEOVER"
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }
                        >
                          {conv.status === "HUMAN_TAKEOVER" ? "Humano" : "IA Activa"}
                        </Badge>
                      </div>
                      {lastMsg && (
                        <p className="text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 line-clamp-2">
                          <span className="text-slate-500 font-semibold">{lastMsg.role === "user" ? "Usuario:" : "IA:"} </span>
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No hay conversaciones registradas aún en el sistema.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
