"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { DicomViewer } from "@/components/dicom/dicom-viewer";
import {
  Droplet,
  Activity,
  Award,
  Calculator,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const IPSS_QUESTIONS = [
  { id: 1, key: "vaciadoIncompleto", label: "1. Vaciado incompleto (sensación de no vaciar la vejiga al orinar)" },
  { id: 2, key: "frecuenciaUrinaria", label: "2. Frecuencia urinaria (necesidad de volver a orinar antes de 2 horas)" },
  { id: 3, key: "intermitencia", label: "3. Intermitencia (parar y recomenzar varias veces al orinar)" },
  { id: 4, key: "urgenciaUrinaria", label: "4. Urgencia miccional (dificultad para aguantar las ganas de orinar)" },
  { id: 5, key: "chorroDebil", label: "5. Chorro débil (fuerza o potencia del chorro miccional reducida)" },
  { id: 6, key: "esfuerzoUrinario", label: "6. Esfuerzo miccional (necesidad de apretar o empujar para empezar)" },
  { id: 7, key: "nicturia", label: "7. Nicturia (número de veces promedio que se levanta a orinar por la noche)" },
];

const QOL_OPTIONS = [
  "0: Encantado (Disfrutaría plenamente de la vida)",
  "1: Satisfecho (Bastante conforme)",
  "2: Generalmente satisfecho (Aceptable)",
  "3: Mixto (Tanto satisfecho como insatisfecho)",
  "4: Generalmente insatisfecho (Incómodo)",
  "5: Infeliz (Muy molesto)",
  "6: Pésimo (Insoportable)",
];

export function UrologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"IPSS" | "PSA" | "UROFLUJO">("IPSS");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbIpss, refetch: refetchIpss } = (trpc.uro.getIpssScore.useQuery as any)({ encounterId });
  const { data: dbPsa, refetch: refetchPsa } = (trpc.uro.getPsaCalculator.useQuery as any)({ encounterId });
  const { data: dbFlow, refetch: refetchFlow } = (trpc.uro.getUroflowmetry.useQuery as any)({ encounterId });

  const saveIpssMut = (trpc.uro.saveIpssScore.useMutation as any)({ onSuccess: () => refetchIpss() });
  const savePsaMut = (trpc.uro.savePsaCalculator.useMutation as any)({ onSuccess: () => refetchPsa() });
  const saveFlowMut = (trpc.uro.saveUroflowmetry.useMutation as any)({ onSuccess: () => refetchFlow() });

  // IPSS State
  const [ipssValues, setIpssValues] = useState<Record<string, number>>({
    vaciadoIncompleto: 3,
    frecuenciaUrinaria: 3,
    intermitencia: 2,
    urgenciaUrinaria: 4,
    chorroDebil: 4,
    esfuerzoUrinario: 2,
    nicturia: 3,
  });
  const [qol, setQol] = useState(4);

  const ipssTotal = useMemo(() => {
    return Object.values(ipssValues).reduce((acc, val) => acc + val, 0);
  }, [ipssValues]);

  const ipssCategory = useMemo(() => {
    if (ipssTotal <= 7) return "Sintomatología Leve (0-7 pts)";
    if (ipssTotal <= 19) return "Sintomatología Moderada (8-19 pts)";
    return "Sintomatología Severa (20-35 pts)";
  }, [ipssTotal]);

  // PSA Calculator State
  const [psaTotal, setPsaTotal] = useState(6.8);
  const [psaLibre, setPsaLibre] = useState(0.95);
  const [volProstateCc, setVolProstateCc] = useState(45.0);
  const [interpPsa, setInterpPsa] = useState("PSA Total elevado en 'Zona Gris' (4-10 ng/mL). Ratio Libre/Total <15% sugiere mayor riesgo. Indicada Biopsia Prostática Dirigida.");

  const ratioLibreTotal = useMemo(() => {
    if (psaTotal > 0 && psaLibre > 0) {
      return Number(((psaLibre / psaTotal) * 100).toFixed(2));
    }
    return 0;
  }, [psaTotal, psaLibre]);

  const densidadPsa = useMemo(() => {
    if (psaTotal > 0 && volProstateCc > 0) {
      return Number((psaTotal / volProstateCc).toFixed(3));
    }
    return 0;
  }, [psaTotal, volProstateCc]);

  // Uroflowmetry State
  const [qmax, setQmax] = useState(9.5);
  const [qavg, setQavg] = useState(4.8);
  const [volEmitido, setVolEmitido] = useState(220.0);
  const [rpm, setRpm] = useState(85.0);
  const [interpFlow, setInterpFlow] = useState("Uroflujometría con Flujo Máximo disminuido (Qmax < 10 mL/s) y curva aplanada compatible con Obstrucción del Salida Vesical (STUI/HPB). RPM significativo (85 mL).");

  useEffect(() => {
    if (dbIpss) {
      setIpssValues({
        vaciadoIncompleto: dbIpss.vaciadoIncompleto,
        frecuenciaUrinaria: dbIpss.frecuenciaUrinaria,
        intermitencia: dbIpss.intermitencia,
        urgenciaUrinaria: dbIpss.urgenciaUrinaria,
        chorroDebil: dbIpss.chorroDebil,
        esfuerzoUrinario: dbIpss.esfuerzoUrinario,
        nicturia: dbIpss.nicturia,
      });
      setQol(dbIpss.qolScore);
    }
  }, [dbIpss]);

  useEffect(() => {
    if (dbPsa) {
      setPsaTotal(dbPsa.psaTotal);
      if (dbPsa.psaLibre !== null) setPsaLibre(dbPsa.psaLibre);
      if (dbPsa.volumenProstaticoCc !== null) setVolProstateCc(dbPsa.volumenProstaticoCc);
      if (dbPsa.interpretacionPsa) setInterpPsa(dbPsa.interpretacionPsa);
    }
  }, [dbPsa]);

  useEffect(() => {
    if (dbFlow) {
      setQmax(dbFlow.qmaxMlSec);
      if (dbFlow.qavgMlSec !== null) setQavg(dbFlow.qavgMlSec);
      setVolEmitido(dbFlow.volumenEmitidoMl);
      setRpm(dbFlow.residuoPostMiccionalMl);
      if (dbFlow.interpretacionUroflujo) setInterpFlow(dbFlow.interpretacionUroflujo);
    }
  }, [dbFlow]);

  const handleSaveIpss = () => {
    saveIpssMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      ...ipssValues,
      ipssTotalScore: ipssTotal,
      qolScore: qol,
    });
  };

  const handleSavePsa = () => {
    savePsaMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      psaTotal,
      psaLibre,
      ratioPsaLibreTotal: ratioLibreTotal,
      volumenProstaticoCc: volProstateCc,
      densidadPsa,
      interpretacionPsa: interpPsa,
    });
  };

  const handleSaveFlow = () => {
    saveFlowMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      qmaxMlSec: qmax,
      qavgMlSec: qavg,
      volumenEmitidoMl: volEmitido,
      residuoPostMiccionalMl: rpm,
      interpretacionUroflujo: interpFlow,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Urología & Síntomas del Trato Urinario Inferior (STUI)</h3>
            <p className="text-xs text-slate-400">Puntuación IPSS / QoL, Calculadora PSA / Densidad & Uroflujometría con RPM</p>
          </div>
        </div>
        {encounterId && encounterId !== "sandbox-demo-enc" && (
          <a
            href={`/api/pdf/encounter/${encounterId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all shadow-sm"
          >
            <FileDown size={14} />
            Ver / Exportar Informe PDF (con QR)
          </a>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("IPSS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "IPSS"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Puntuación IPSS & Calidad de Vida
        </button>

        <button
          onClick={() => setActiveTab("PSA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PSA"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadora PSA & Densidad
        </button>

        <button
          onClick={() => setActiveTab("UROFLUJO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "UROFLUJO"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Uroflujometría & RPM
        </button>
      </div>

      {/* Tab 1: Puntuación IPSS */}
      {activeTab === "IPSS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Cuestionario Internacional IPSS & Escala de Calidad de Vida (QoL)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Cuantificación estandarizada de severidad sintomática prostática (0-35 pts).</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveIpss}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar IPSS
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {IPSS_QUESTIONS.map((q) => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950 p-2.5 rounded border border-slate-800">
                <label className="font-semibold text-slate-300">{q.label}</label>
                <select
                  value={ipssValues[q.key] || 0}
                  onChange={(e) => setIpssValues((prev) => ({ ...prev, [q.key]: Number(e.target.value) }))}
                  className="bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 sm:w-48"
                >
                  <option value={0}>0 - Ninguna vez</option>
                  <option value={1}>1 - Menos de 1 de 5 veces</option>
                  <option value={2}>2 - Menos de la mitad</option>
                  <option value={3}>3 - Aproximadamente la mitad</option>
                  <option value={4}>4 - Más de la mitad</option>
                  <option value={5}>5 - Casi siempre (5/5)</option>
                </select>
              </div>
            ))}

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-3 rounded border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Puntaje IPSS Total</span>
                  <span className="text-xl font-bold text-blue-300">{ipssTotal} / 35 pts</span>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded">
                  {ipssCategory}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Calidad de Vida Debida a Síntomas Urinarios (QoL)</label>
                <select
                  value={qol}
                  onChange={(e) => setQol(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
                >
                  {QOL_OPTIONS.map((desc, idx) => (
                    <option key={idx} value={idx}>{desc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Calculadora PSA */}
      {activeTab === "PSA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de PSA, Ratio Libre/Total & Densidad Prostática
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Marcadores tumorales, estimación de riesgo prostático y ajuste por volumen glandular.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePsa}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar PSA
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">PSA Total (ng/mL)</label>
              <input
                type="number"
                step="0.01"
                value={psaTotal}
                onChange={(e) => setPsaTotal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">PSA Libre (ng/mL)</label>
              <input
                type="number"
                step="0.01"
                value={psaLibre}
                onChange={(e) => setPsaLibre(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Volumen Prostático ECO (cc / cm³)</label>
              <input
                type="number"
                step="0.1"
                value={volProstateCc}
                onChange={(e) => setVolProstateCc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-xs">Relación PSA Libre / Total</span>
              <span className="text-lg font-bold text-blue-300">{ratioLibreTotal} %</span>
              <span className="text-[10px] text-slate-500 block">Corte de riesgo: &lt;15% alto riesgo</span>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-0.5 md:col-span-2">
              <span className="text-slate-400 block text-xs">Densidad de PSA (PSAD)</span>
              <span className="text-lg font-bold text-emerald-300">{densidadPsa} ng/mL/cc</span>
              <span className="text-[10px] text-slate-500 block">Corte de sospecha: &gt;0.15 ng/mL/cc</span>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Interpretación Diagnóstica Prostática</label>
              <textarea
                value={interpPsa}
                onChange={(e) => setInterpPsa(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Uroflujometría & RPM */}
      {activeTab === "UROFLUJO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Uroflujometría Computarizada & Residuo Post-Miccional (RPM)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Evaluación urodinámica no invasiva de flujo miccional y capacidad de vaciado vesical.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveFlow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Uroflujometría
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Flujo Máximo Qmax (mL/s)</label>
              <input
                type="number"
                step="0.1"
                value={qmax}
                onChange={(e) => setQmax(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-blue-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Flujo Medio Qavg (mL/s)</label>
              <input
                type="number"
                step="0.1"
                value={qavg}
                onChange={(e) => setQavg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Volumen Urinario Emitido (mL)</label>
              <input
                type="number"
                step="1"
                value={volEmitido}
                onChange={(e) => setVolEmitido(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Residuo Post-Miccional RPM por Ecografía (mL)</label>
              <input
                type="number"
                step="1"
                value={rpm}
                onChange={(e) => setRpm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Interpretación Urodinámica del Trazado</label>
              <textarea
                value={interpFlow}
                onChange={(e) => setInterpFlow(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PACS Native DICOM Viewer with Hounsfield Units */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Visor DICOM PACS: Uro-TAC & Densidad de Litiasis (Unidades Hounsfield HU)
        </h4>
        <DicomViewer patientRegistrationId={effectivePatId} encounterId={encounterId} enableHounsfield={true} />
      </div>
    </div>
  );
}
