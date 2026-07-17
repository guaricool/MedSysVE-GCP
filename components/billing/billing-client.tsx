"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, X, CheckCircle, User, RefreshCw, Mail, Package, Shield } from "lucide-react"

type InvoiceStatus = "PENDING" | "PAID" | "CANCELLED"
type PaymentMethod = "EFECTIVO_USD" | "EFECTIVO_BS" | "TRANSFERENCIA_BS" | "ZELLE" | "BINANCE_USDT" | "PAGOMOVIL"

const STATUS_LABELS: Record<InvoiceStatus, string> = { PENDING: "Pendiente", PAID: "Pagado", CANCELLED: "Cancelado" }
const STATUS_COLORS: Record<InvoiceStatus, string> = {
  PENDING: "text-amber-400",
  PAID: "text-emerald-400",
  CANCELLED: "text-slate-500 line-through",
}
const METODO_LABELS: Record<string, string> = {
  EFECTIVO_USD: "Efectivo USD",
  EFECTIVO_BS: "Efectivo Bs",
  TRANSFERENCIA_BS: "Transferencia Bs",
  ZELLE: "Zelle",
  BINANCE_USDT: "Binance USDT",
  PAGOMOVIL: "Pago Móvil",
}

function montoTotal(inv: { pagos?: { monto: string | number }[] }, montoUsd: number) {
  const abonado = (inv.pagos ?? []).reduce((s, p) => s + Number(p.monto), 0)
  return { abonado, pendiente: Math.max(0, montoUsd - abonado) }
}

export function BillingClient() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("")
  const [fetchingBcv, setFetchingBcv] = useState(false)

  const utils = trpc.useUtils()
  const { data: invoices = [], refetch } = trpc.invoice.list.useQuery({
    status: statusFilter || undefined,
  })
  const { data: workspace, refetch: refetchWs } = trpc.workspace.current.useQuery()
  const [tasaInput, setTasaInput] = useState("")

  const updateBcv = trpc.workspace.updateBcvRate.useMutation({
    onSuccess: () => { refetchWs(); setTasaInput("") },
  })

  async function autoFetchBcv() {
    setFetchingBcv(true)
    try {
      const res = await fetch("/api/bcv-rate")
      const data = await res.json() as { precio?: number; error?: string }
      if (!res.ok || !data.precio) throw new Error(data.error ?? "Error desconocido")
      updateBcv.mutate({ tasa: data.precio })
    } catch (err) {
      alert(`No se pudo obtener la tasa BCV: ${err instanceof Error ? err.message : "error"}`)
    } finally {
      setFetchingBcv(false)
    }
  }
  const markPaid = trpc.invoice.markPaid.useMutation({ onSuccess: () => refetch() })
  const cancel = trpc.invoice.cancel.useMutation({ onSuccess: () => refetch() })
  const emailInvoice = trpc.invoice.emailInvoice.useMutation({
    onSuccess: () => alert("Email enviado correctamente."),
    onError: (e) => alert(e.message),
  })
  const addPago = trpc.invoice.addPago.useMutation({ onSuccess: () => utils.invoice.list.invalidate() })
  const deletePago = trpc.invoice.deletePago.useMutation({ onSuccess: () => utils.invoice.list.invalidate() })
  const addLineItem = (trpc as any).invoice.addLineItem.useMutation({ onSuccess: () => utils.invoice.list.invalidate() })
  const removeLineItem = (trpc as any).invoice.removeLineItem.useMutation({ onSuccess: () => utils.invoice.list.invalidate() })
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState(() => new Date().getMonth() + 1)

  const tasaBcv = workspace?.tasaBcvActual ? Number(workspace.tasaBcvActual) : null
  const tasaBcvAt = workspace?.tasaBcvAt ? new Date(workspace.tasaBcvAt) : null

  const totalUsd = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.montoUsd), 0)

  return (
    <div className="space-y-6">
      {/* BCV Rate widget */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tasa BCV actual</p>
            {tasaBcv ? (
              <p className="text-2xl font-bold text-white">
                Bs {tasaBcv.toFixed(2)}{" "}
                <span className="text-sm font-normal text-slate-400">/ USD</span>
              </p>
            ) : (
              <p className="text-slate-500 text-sm">No configurada</p>
            )}
            {tasaBcvAt && (
              <p className="text-xs text-slate-600 mt-0.5">
                Actualizada: {tasaBcvAt.toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
              </p>
            )}
          </div>

          <div className="flex items-end gap-2 ml-auto">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Nueva tasa</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ej: 95.50"
                value={tasaInput}
                onChange={(e) => setTasaInput(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white w-32"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={!tasaInput || updateBcv.isPending}
              onClick={() => updateBcv.mutate({ tasa: Number(tasaInput) })}
            >
              <RefreshCw size={13} className="mr-1.5" />
              Actualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-800 text-blue-400 hover:bg-blue-900/30"
              disabled={fetchingBcv || updateBcv.isPending}
              onClick={autoFetchBcv}
              title="Obtener tasa oficial del BCV automáticamente"
            >
              <RefreshCw size={13} className={`mr-1.5 ${fetchingBcv ? "animate-spin" : ""}`} />
              Auto BCV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary + filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4 text-sm">
          <span className="text-slate-400">
            Cobrado hoy:{" "}
            <span className="text-emerald-400 font-semibold">${totalUsd.toFixed(2)}</span>
          </span>
          <span className="text-slate-400">
            Total facturas:{" "}
            <span className="text-white font-semibold">{invoices.length}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "")}
            className="rounded-md bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="PAID">Pagados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus size={14} className="mr-1.5" />
            Nueva factura
          </Button>
        </div>
      </div>

      {/* Monthly report */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-400 font-medium">Reporte mensual:</p>
        <select
          value={reportMonth}
          onChange={(e) => setReportMonth(Number(e.target.value))}
          className="rounded bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 text-sm"
        >
          {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          value={reportYear}
          min={2020}
          max={2100}
          onChange={(e) => setReportYear(Number(e.target.value))}
          className="rounded bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 text-sm w-20"
        />
        <a
          href={`/api/pdf/report/${reportYear}/${reportMonth}`}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-emerald-700 px-3 py-1 text-sm text-emerald-400 hover:bg-emerald-900/20"
        >
          Generar reporte
        </a>
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No hay facturas registradas.</p>
        )}
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 flex flex-wrap items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-blue-400 font-mono text-sm">{inv.numero}</span>
                <span className={`text-xs font-medium ${STATUS_COLORS[inv.status as InvoiceStatus]}`}>
                  {STATUS_LABELS[inv.status as InvoiceStatus]}
                </span>
              </div>
              <p className="text-white font-medium mt-0.5">
                {inv.patientRegistration.patient.nombre} {inv.patientRegistration.patient.apellido}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {inv.descripcion ?? "Consulta médica"} · {METODO_LABELS[inv.metodoPago as PaymentMethod]}
              </p>
              {(inv as any).insuranceProvider && (
                <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                  <Shield size={10} />
                  {(inv as any).insuranceProvider.nombre}
                  {(inv as any).montoSeguro != null && (
                    <span className="text-slate-500">
                      · cubre ${Number((inv as any).montoSeguro).toFixed(2)}
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-white font-bold text-lg">${Number(inv.montoUsd).toFixed(2)}</p>
              {Number(inv.tasaBcv) > 0 && (
                <p className="text-slate-400 text-xs">Bs {Number(inv.montoBs).toFixed(2)}</p>
              )}
              <p className="text-slate-600 text-xs">
                {new Date(inv.createdAt).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {inv.status === "PENDING" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/30 h-7 px-2"
                    disabled={markPaid.isPending}
                    onClick={() => markPaid.mutate({ id: inv.id })}
                    title="Marcar como pagado"
                  >
                    <CheckCircle size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-800 h-7 px-2"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate({ id: inv.id })}
                    title="Cancelar"
                  >
                    <X size={13} />
                  </Button>
                </>
              )}
              <a
                href={`/api/pdf/invoice/${inv.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs h-7"
                title="Descargar PDF"
              >
                <FileText size={12} />
                PDF
              </a>
              {inv.patientRegistration.patient.email && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-400 hover:bg-slate-800 h-7 px-2"
                  disabled={emailInvoice.isPending}
                  onClick={() => emailInvoice.mutate({ id: inv.id })}
                  title="Enviar recibo por email"
                >
                  <Mail size={12} />
                </Button>
              )}
            </div>

            {/* Line items: visible for all invoices that have items, or PENDING to add more */}
            {(((inv as any).items ?? []).length > 0 || inv.status === "PENDING") && (
              <div className="basis-full border-t border-slate-800 pt-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Package size={10} />
                  Ítems de factura
                </p>
                {((inv as any).items ?? []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span className="text-white flex-1 min-w-0 truncate">{item.descripcion}</span>
                    <span className="text-slate-500 shrink-0">{item.cantidad}×</span>
                    <span className="shrink-0">${Number(item.precioUnitarioUsd).toFixed(2)}</span>
                    <span className="text-emerald-400 w-16 text-right shrink-0">
                      ${(item.cantidad * Number(item.precioUnitarioUsd)).toFixed(2)}
                    </span>
                    {inv.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => removeLineItem.mutate({ itemId: item.id })}
                        disabled={removeLineItem.isPending}
                        className="text-red-700 hover:text-red-400 shrink-0 ml-1"
                        title="Eliminar ítem"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {inv.status === "PENDING" && (
                  <LineItemForm
                    invoiceId={inv.id}
                    onAdd={(d) => addLineItem.mutate(d)}
                    isPending={addLineItem.isPending}
                  />
                )}
              </div>
            )}

            {inv.status === "PENDING" && (
              <div className="basis-full mt-1 border-t border-slate-800 pt-2">
                {((inv as any).pagos ?? []).length > 0 && (
                  <div className="mb-2 space-y-1">
                    {((inv as any).pagos as { id: string; monto: string | number; metodoPago: string; fecha: string; notas?: string | null }[]).map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400">${Number(p.monto).toFixed(2)}</span>
                        <span>{METODO_LABELS[p.metodoPago] ?? p.metodoPago}</span>
                        <span className="text-slate-600">{new Date(p.fecha).toLocaleDateString("es-VE", { timeZone: 'America/Caracas' })}</span>
                        {p.notas && <span className="text-slate-600">· {p.notas}</span>}
                        <button
                          onClick={() => deletePago.mutate({ pagoId: p.id })}
                          className="ml-auto text-red-600 hover:text-red-400 text-xs"
                          title="Eliminar abono"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {(() => {
                      const { abonado, pendiente } = montoTotal(inv as any, Number(inv.montoUsd))
                      return (
                        <div className="flex gap-4 text-xs mt-1 pt-1 border-t border-slate-800">
                          <span className="text-slate-500">Abonado: <span className="text-emerald-400">${abonado.toFixed(2)}</span></span>
                          <span className="text-slate-500">Pendiente: <span className="text-amber-400">${pendiente.toFixed(2)}</span></span>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <AbonoForm invoiceId={inv.id} onAdd={(data) => addPago.mutate(data)} isPending={addPago.isPending} />
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <NewInvoiceForm
          tasaBcv={tasaBcv}
          onClose={() => setShowForm(false)}
          onCreated={() => { refetch(); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function NewInvoiceForm({
  tasaBcv,
  onClose,
  onCreated,
}: {
  tasaBcv: number | null
  onClose: () => void
  onCreated: () => void
}) {
  const [patientQuery, setPatientQuery] = useState("")
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [descripcion, setDescripcion] = useState("Consulta médica")
  const [montoUsd, setMontoUsd] = useState("")
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>("EFECTIVO_USD")
  const [insuranceProviderId, setInsuranceProviderId] = useState("")
  const [coberturaPct, setCoberturaPct] = useState(100)

  const patientSearch = trpc.patient.search.useQuery(
    { query: patientQuery },
    { enabled: patientQuery.trim().length >= 2 },
  )
  const { data: providers = [] } = (trpc.insurance as any).listProviders.useQuery()
  const create = trpc.invoice.create.useMutation({ onSuccess: onCreated })

  const montoBs = tasaBcv && montoUsd ? (Number(montoUsd) * tasaBcv).toFixed(2) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Nueva Factura</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Paciente *</Label>
            {selectedName ? (
              <div className="flex items-center justify-between rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm">
                <span className="text-white flex items-center gap-2">
                  <User size={13} className="text-slate-400" />
                  {selectedName}
                </span>
                <button
                  onClick={() => { setSelectedRegId(null); setSelectedName(""); setPatientQuery("") }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Buscar paciente..."
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {patientSearch.data && patientSearch.data.length > 0 && patientQuery.length >= 2 && (
                  <ul className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md border border-slate-700 bg-slate-800 shadow-xl">
                    {(patientSearch.data as any[]).map((r) => (
                      <li key={r.id}>
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                          onClick={() => {
                            setSelectedRegId(r.id)
                            setSelectedName(`${r.patient.nombre} ${r.patient.apellido}`)
                            setPatientQuery("")
                          }}
                        >
                          <span className="text-blue-400 font-mono text-xs mr-2">#{r.idDisplay}</span>
                          {r.patient.nombre} {r.patient.apellido}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Monto USD *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={montoUsd}
                onChange={(e) => setMontoUsd(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Método de pago</Label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as PaymentMethod)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
              >
                {Object.entries(METODO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {montoBs && (
            <p className="text-sm text-slate-400">
              Equivalente en Bs:{" "}
              <span className="text-white font-medium">Bs {montoBs}</span>
              {" "}(tasa BCV: {tasaBcv?.toFixed(2)})
            </p>
          )}

          <div className="space-y-1 border-t border-slate-800 pt-3">
            <Label className="flex items-center gap-1.5 text-slate-300 text-xs">
              <Shield size={11} className="text-blue-400" />
              Seguro / HMO (opcional)
            </Label>
            <select
              value={insuranceProviderId}
              onChange={(e) => setInsuranceProviderId(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 text-white px-3 py-2 text-sm"
            >
              <option value="">Sin seguro</option>
              {(providers as any[]).map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` (${p.codigo})` : ""}</option>
              ))}
            </select>
            {insuranceProviderId && (
              <div className="flex items-center gap-2 mt-1">
                <Label className="text-slate-400 text-xs whitespace-nowrap">Cobertura %:</Label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coberturaPct}
                  onChange={(e) => setCoberturaPct(Number(e.target.value))}
                  className="w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                />
                {montoUsd && (
                  <p className="text-xs text-blue-400">
                    Seguro cubre: ${(Number(montoUsd) * coberturaPct / 100).toFixed(2)}
                    {" · "}Paciente paga: ${(Number(montoUsd) * (100 - coberturaPct) / 100).toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>
          {!tasaBcv && (
            <p className="text-xs text-amber-400">
              ⚠ No hay tasa BCV configurada. Configure la tasa en el panel de Facturación.
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={create.isPending || !selectedRegId || !montoUsd}
            onClick={() =>
              create.mutate({
                patientRegistrationId: selectedRegId!,
                descripcion: descripcion || undefined,
                montoUsd: Number(montoUsd),
                metodoPago,
                insuranceProviderId: insuranceProviderId || undefined,
                montoSeguro: insuranceProviderId && montoUsd
                  ? Number(montoUsd) * coberturaPct / 100
                  : undefined,
              })
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {create.isPending ? "Creando..." : "Crear factura"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const METODO_OPTIONS = [
  { value: "EFECTIVO_USD", label: "Efectivo USD" },
  { value: "EFECTIVO_BS", label: "Efectivo Bs" },
  { value: "TRANSFERENCIA_BS", label: "Transferencia Bs" },
  { value: "ZELLE", label: "Zelle" },
  { value: "BINANCE_USDT", label: "Binance USDT" },
  { value: "PAGOMOVIL", label: "Pago Móvil" },
] as const

function AbonoForm({ invoiceId, onAdd, isPending }: {
  invoiceId: string
  onAdd: (data: { invoiceId: string; monto: number; metodoPago: PaymentMethod; notas?: string }) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState("")
  const [metodo, setMetodo] = useState<PaymentMethod>("EFECTIVO_USD")
  const [notas, setNotas] = useState("")

  function handleSubmit() {
    const m = parseFloat(monto)
    if (!m || m <= 0) return
    onAdd({ invoiceId, monto: m, metodoPago: metodo, notas: notas || undefined })
    setMonto("")
    setNotas("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-400 hover:text-blue-300"
      >
        + Registrar abono
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1">
      <input
        type="number"
        placeholder="Monto USD"
        value={monto}
        min="0.01"
        step="0.01"
        onChange={(e) => setMonto(e.target.value)}
        className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
      />
      <select
        value={metodo}
        onChange={(e) => setMetodo(e.target.value as PaymentMethod)}
        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
      >
        {METODO_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Notas (opcional)"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white w-32"
      />
      <button
        onClick={handleSubmit}
        disabled={isPending || !monto}
        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "..." : "Abonar"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        Cancelar
      </button>
    </div>
  )
}

function LineItemForm({
  invoiceId,
  onAdd,
  isPending,
}: {
  invoiceId: string
  onAdd: (data: { invoiceId: string; descripcion: string; cantidad: number; precioUnitarioUsd: number }) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)
  const [descripcion, setDescripcion] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [precio, setPrecio] = useState("")

  function handleSubmit() {
    const p = parseFloat(precio)
    const q = parseInt(cantidad, 10)
    if (!descripcion.trim() || !p || p <= 0 || !q || q <= 0) return
    onAdd({ invoiceId, descripcion: descripcion.trim(), cantidad: q, precioUnitarioUsd: p })
    setDescripcion("")
    setCantidad("1")
    setPrecio("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-blue-400 hover:text-blue-300 mt-1"
      >
        + Agregar ítem
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <input
        type="text"
        placeholder="Descripción del ítem"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white flex-1 min-w-32"
      />
      <input
        type="number"
        placeholder="Cant."
        value={cantidad}
        min="1"
        step="1"
        onChange={(e) => setCantidad(e.target.value)}
        className="w-14 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
      />
      <input
        type="number"
        placeholder="Precio USD"
        value={precio}
        min="0.01"
        step="0.01"
        onChange={(e) => setPrecio(e.target.value)}
        className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !descripcion.trim() || !precio}
        className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "..." : "Agregar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        Cancelar
      </button>
    </div>
  )
}
