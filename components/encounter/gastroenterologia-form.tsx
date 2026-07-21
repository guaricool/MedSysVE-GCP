"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Database,
  Activity,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const FORREST_OPTIONS = [
  "Sin sangrado activo ni ulceración relevante",
  "Forrest Ia (Sangrado arterial activo en chorro)",
  "Forrest Ib (Sangrado activo rezumante en napa)",
  "Forrest IIa (Vaso visible no sangrante en lecho ulceroso)",
  "Forrest IIb (Coágulo adherido sobre úlcera)",
  "Forrest IIc (Mancha de hematina / pigmento oscuro)",
  "Forrest III (Úlcera con base limpia de fibrina)",
];

const LOS_ANGELES_OPTIONS = [
  "Sin esofagitis péptica",
  "Grado A (1 o más erosiones < 5mm que no se extienden entre pliegues)",
  "Grado B (1 o más erosiones > 5mm que no se extienden entre pliegues)",
  "Grado C (Erosiones confluentes entre 2 o más pliegues, < 75% del perímetro)",
  "Grado D (Erosiones confluentes que comprometen >= 75% del perímetro)",
];

export function GastroenterologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"ENDOSCOPIA" | "SANGRADO" | "MAYO">("ENDOSCOPIA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbReports = [], refetch: refetchReports } = (trpc.gastro.listEndoscopyReports.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbBleed, refetch: refetchBleed } = (trpc.gastro.getBleedingScale.useQuery as any)({ encounterId });
  const { data: dbIbd, refetch: refetchIbd } = (trpc.gastro.getIbdScore.useQuery as any)({ encounterId });

  const saveReportMut = (trpc.gastro.saveEndoscopyReport.useMutation as any)({ onSuccess: () => refetchReports() });
  const saveBleedMut = (trpc.gastro.saveBleedingScale.useMutation as any)({ onSuccess: () => refetchBleed() });
  const saveIbdMut = (trpc.gastro.saveIbdScore.useMutation as any)({ onSuccess: () => refetchIbd() });

  // Endoscopy State
  const [tipoProc, setTipoProc] = useState("Colonoscopia Total");
  const [hallazgos, setHallazgos] = useState("Mucosa de colon de características normales. Adecuado patrón vascular.");
  const [bostonDer, setBostonDer] = useState(3);
  const [bostonTrans, setBostonTrans] = useState(3);
  const [bostonIzq, setBostonIzq] = useState(2);
  const [biopsias, setBiopsias] = useState("Pólipo colon ascendente (Frasco 1)");

  // Bleeding / Esophagitis State
  const [forrest, setForrest] = useState("Forrest III (Úlcera con base limpia de fibrina)");
  const [losAngeles, setLosAngeles] = useState("Grado A (1 o más erosiones < 5mm que no se extienden entre pliegues)");
  const [hemostasia, setHemostasia] = useState("Ninguna requerida");

  // Mayo IBD State
  const [diagEii, setDiagEii] = useState("Colitis Ulcerosa (CU)");
  const [mayoEvac, setMayoEvac] = useState(1);
  const [mayoSangre, setMayoSangre] = useState(0);
  const [mayoEndo, setMayoEndo] = useState(1);
  const [mayoMed, setMayoMed] = useState(1);

  useEffect(() => {
    if (dbBleed) {
      if (dbBleed.forrestClassification) setForrest(dbBleed.forrestClassification);
      if (dbBleed.losAngelesEsofagitis) setLosAngeles(dbBleed.losAngelesEsofagitis);
      if (dbBleed.hemostasiaEndoscopica) setHemostasia(dbBleed.hemostasiaEndoscopica);
    }
  }, [dbBleed]);

  useEffect(() => {
    if (dbIbd) {
      setDiagEii(dbIbd.diagnosticoEii);
      if (dbIbd.mayoFrecuenciaDeposiciones !== null) setMayoEvac(dbIbd.mayoFrecuenciaDeposiciones);
      if (dbIbd.mayoSangradoRectal !== null) setMayoSangre(dbIbd.mayoSangradoRectal);
      if (dbIbd.mayoHallazgosEndoscopicos !== null) setMayoEndo(dbIbd.mayoHallazgosEndoscopicos);
      if (dbIbd.mayoEvaluacionGlobalMedico !== null) setMayoMed(dbIbd.mayoEvaluacionGlobalMedico);
    }
  }, [dbIbd]);

  const handleAddReport = () => {
    saveReportMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tipoProcedimiento: tipoProc,
      hallazgos,
      bostonScoreColonDerecho: bostonDer,
      bostonScoreColonTransverso: bostonTrans,
      bostonScoreColonIzquierdo: bostonIzq,
      biopsiasTomadas: biopsias,
    });
  };

  const handleSaveBleed = () => {
    saveBleedMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      forrestClassification: forrest,
      losAngelesEsofagitis: losAngeles,
      hemostasiaEndoscopica: hemostasia,
    });
  };

  const handleSaveIbd = () => {
    saveIbdMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      diagnosticoEii: diagEii,
      mayoFrecuenciaDeposiciones: mayoEvac,
      mayoSangradoRectal: mayoSangre,
      mayoHallazgosEndoscopicos: mayoEndo,
      mayoEvaluacionGlobalMedico: mayoMed,
    });
  };

  const totalBoston = bostonDer + bostonTrans + bostonIzq;
  const totalMayo = mayoEvac + mayoSangre + mayoEndo + mayoMed;

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Gastroenterología & Endoscopia Digestive</h3>
            <p className="text-xs text-slate-400">Reportes Endoscópicos (BBPS Boston), Clasificación Forrest / Los Ángeles & Índice Mayo EII</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("ENDOSCOPIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ENDOSCOPIA"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Endoscopia & Boston BBPS ({dbReports.length})
        </button>

        <button
          onClick={() => setActiveTab("SANGRADO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "SANGRADO"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Forrest (Sangrado) & Los Ángeles (Esofagitis)
        </button>

        <button
          onClick={() => setActiveTab("MAYO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "MAYO"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Índice Mayo (Colitis Ulcerosa)
        </button>
      </div>

      {/* Tab 1: Endoscopia & Boston Score */}
      {activeTab === "ENDOSCOPIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Reporte Endoscópico & Escala de Preparación Colónica de Boston (BBPS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Puntuación Boston (0-3 por segmento) para adecuada visualización mucosal.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddReport}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Procedimiento
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-300">Tipo de Procedimiento Endoscópico</label>
                <input
                  type="text"
                  value={tipoProc}
                  onChange={(e) => setTipoProc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Biopsias / Muestras Histológicas</label>
                <input
                  type="text"
                  value={biopsias}
                  onChange={(e) => setBiopsias(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300">Hallazgos Endoscópicos</label>
                <textarea
                  value={hallazgos}
                  onChange={(e) => setHallazgos(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 mt-1"
                />
              </div>
            </div>

            {/* Boston BBPS Score */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-emerald-400">🧹 Escala de Boston (BBPS 0-9 pts)</h5>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px]">Colon Derecho (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={bostonDer}
                    onChange={(e) => setBostonDer(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Transverso (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={bostonTrans}
                    onChange={(e) => setBostonTrans(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Colon Izquierdo (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={bostonIzq}
                    onChange={(e) => setBostonIzq(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Puntuación Total Boston (BBPS):</span>
                <span className={`text-xl font-extrabold ${totalBoston >= 6 ? "text-emerald-400" : "text-amber-400"}`}>
                  {totalBoston} / 9 Puntos {totalBoston >= 6 ? "(Preparación Excelente)" : "(Preparación Inadecuada)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Forrest & Los Ángeles */}
      {activeTab === "SANGRADO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Clasificación de Forrest & Esofagitis de Los Ángeles
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Riesgo de resangrado ulceroso y severidad de esofagitis péptica.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveBleed}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
            >
              Guardar Clasificaciones
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-red-400">🩸 Clasificación de Forrest (Úlceras Pépticas)</h5>
              <select
                value={forrest}
                onChange={(e) => setForrest(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {FORREST_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-blue-400">🧪 Esofagitis (Clasificación de Los Ángeles)</h5>
              <select
                value={losAngeles}
                onChange={(e) => setLosAngeles(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {LOS_ANGELES_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Índice Mayo (EII) */}
      {activeTab === "MAYO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Índice de Mayo (Colitis Ulcerosa 0-12 pts)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Puntuación clínica y endoscópica de severidad en Enfermedad Inflamatoria Intestinal.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveIbd}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
            >
              Guardar Índice Mayo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-amber-400">📊 Desglose de Puntuación Mayo</h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Deposiciones (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={mayoEvac}
                    onChange={(e) => setMayoEvac(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Sangrado Rectal (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={mayoSangre}
                    onChange={(e) => setMayoSangre(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Endoscopia (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={mayoEndo}
                    onChange={(e) => setMayoEndo(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Eval. Médica (0-3):</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={mayoMed}
                    onChange={(e) => setMayoMed(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-center text-center">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Resultado Total Mayo:</span>
              <span className="text-3xl font-extrabold text-amber-400">{totalMayo} / 12 Puntos</span>
              <span className="text-xs text-slate-300 font-semibold">
                {totalMayo <= 2 ? "🟢 Remisión Clínica (0-2 pts)" : totalMayo <= 5 ? "🟡 Colitis Ulcerosa Leve (3-5 pts)" : totalMayo <= 10 ? "🟠 Colitis Ulcerosa Moderada (6-10 pts)" : "🔴 Colitis Ulcerosa Grave (11-12 pts)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
