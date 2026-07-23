"use client";

import { useMemo, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Activity,
  Calculator,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Sparkles,
  Layers,
  HeartHandshake,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

export function PsiquiatriaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"MSE" | "ESCALAS" | "MONITOREO">("MSE");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbMse, refetch: refetchMse } = (trpc.psych.getMSE.useQuery as any)({ encounterId });
  const { data: dbScales, refetch: refetchScales } = (trpc.psych.getScales.useQuery as any)({ encounterId });
  const { data: dbMed, refetch: refetchMed } = (trpc.psych.getMedicationMonitoring.useQuery as any)({ encounterId });

  const saveMseMut = (trpc.psych.saveMSE.useMutation as any)({ onSuccess: () => refetchMse() });
  const saveScalesMut = (trpc.psych.saveScales.useMutation as any)({ onSuccess: () => refetchScales() });
  const saveMedMut = (trpc.psych.saveMedicationMonitoring.useMutation as any)({ onSuccess: () => refetchMed() });

  // MSE State
  const [aspecto, setAspecto] = useState("Aliñado / Higiene adecuada");
  const [actitud, setActitud] = useState("Colaboradora y comunicativa");
  const [afecto, setAfecto] = useState("Eutímico con adecuada reactividad");
  const [curso, setCurso] = useState("Lógico, coherente y estructurado");
  const [contenido, setContenido] = useState("Sin ideas delirantes ni ideación suicida activa");
  const [sensorio, setSensorio] = useState("Orientado en espacio, tiempo y persona (3/3)");
  const [juicio, setJuicio] = useState("Juicio conservado. Conciencia de enfermedad.");
  const [mseObs, setMseObs] = useState("Sin alteraciones de la percepción ni alucinaciones.");

  // Scales State
  const [phq9, setPhq9] = useState(4);
  const [gad7, setGad7] = useState(3);
  const [cssrs, setCssrs] = useState<"BAJO" | "MODERADO" | "ALTO" | "EXTREMO">("BAJO");
  const [cssrsDetail, setCssrsDetail] = useState("Sin ideación suicida ni comportamiento autolesivo.");

  // Med Monitoring State
  const [medsText, setMedsText] = useState("Sertralina 50mg/día, Clonazepam 0.5mg/noche");
  const [prolactina, setProlactina] = useState(14.2);
  const [peso, setPeso] = useState(68.0);
  const [perimetro, setPerimetro] = useState(82.0);
  const [qtc, setQtc] = useState(410);
  const [efectos, setEfectos] = useState("Sin síntomas extrapiramidales ni somnolencia diurna.");

  useEffect(() => {
    if (dbMse) {
      setAspecto(dbMse.aspectoPorte);
      setActitud(dbMse.actitud);
      setAfecto(dbMse.afectoEstructura);
      setCurso(dbMse.cursoPensamiento);
      setContenido(dbMse.contenidoPensamiento);
      setSensorio(dbMse.sensorioOrientacion);
      setJuicio(dbMse.juicioIntrospeccion);
      if (dbMse.observaciones) setMseObs(dbMse.observaciones);
    }
  }, [dbMse]);

  useEffect(() => {
    if (dbScales) {
      if (dbScales.phq9Score !== null) setPhq9(dbScales.phq9Score);
      if (dbScales.gad7Score !== null) setGad7(dbScales.gad7Score);
      if (dbScales.cssrsRiskLevel) setCssrs(dbScales.cssrsRiskLevel);
      if (dbScales.cssrsDetail) setCssrsDetail(dbScales.cssrsDetail);
    }
  }, [dbScales]);

  useEffect(() => {
    if (dbMed) {
      setMedsText(dbMed.psicofarmacosActuales);
      if (dbMed.prolactinaNgMl) setProlactina(dbMed.prolactinaNgMl);
      if (dbMed.pesoKg) setPeso(dbMed.pesoKg);
      if (dbMed.perimetroAbdominalCm) setPerimetro(dbMed.perimetroAbdominalCm);
      if (dbMed.qtcIntervaloMs) setQtc(dbMed.qtcIntervaloMs);
      if (dbMed.efectosAdversos) setEfectos(dbMed.efectosAdversos);
    }
  }, [dbMed]);

  const handleSaveMse = () => {
    saveMseMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      aspectoPorte: aspecto,
      actitud,
      afectoEstructura: afecto,
      cursoPensamiento: curso,
      contenidoPensamiento: contenido,
      sensorioOrientacion: sensorio,
      juicioIntrospeccion: juicio,
      observaciones: mseObs,
    });
  };

  const handleSaveScales = () => {
    saveScalesMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      phq9Score: phq9,
      gad7Score: gad7,
      cssrsRiskLevel: cssrs,
      cssrsDetail,
    });
  };

  const handleSaveMed = () => {
    saveMedMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      psicofarmacosActuales: medsText,
      prolactinaNgMl: prolactina,
      pesoKg: peso,
      perimetroAbdominalCm: perimetro,
      qtcIntervaloMs: qtc,
      efectosAdversos: efectos,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Psiquiatría & Salud Mental</h3>
            <p className="text-xs text-slate-400">Examen del Estado Mental (MSE), Escalas PHQ-9 / GAD-7 / C-SSRS & Monitoreo de Psicofármacos</p>
          </div>
        </div>
        {encounterId && (
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
          onClick={() => setActiveTab("MSE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "MSE"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" /> Examen Estado Mental (EEM)
        </button>

        <button
          onClick={() => setActiveTab("ESCALAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ESCALAS"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Escalas (PHQ-9 / GAD-7 / C-SSRS)
        </button>

        <button
          onClick={() => setActiveTab("MONITOREO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "MONITOREO"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Pill className="w-3.5 h-3.5" /> Psicofármacos & Perfil Metabólico
        </button>
      </div>

      {/* Tab 1: Examen del Estado Mental */}
      {activeTab === "MSE" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" /> Examen Estandarizado del Estado Mental (EEM / MSE)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Exploración por esferas: Aspecto, Afecto, Pensamiento, Sensorio y Juicio.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveMse}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar EEM
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Aspecto / Porte / Higiene</label>
              <input
                type="text"
                value={aspecto}
                onChange={(e) => setAspecto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Actitud frente al Examinador</label>
              <input
                type="text"
                value={actitud}
                onChange={(e) => setActitud(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Afecto y Humor</label>
              <input
                type="text"
                value={afecto}
                onChange={(e) => setAfecto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Curso del Pensamiento</label>
              <input
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Contenido del Pensamiento (Ideación Delirante / Suicida)</label>
              <input
                type="text"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Sensorio / Orientación</label>
              <input
                type="text"
                value={sensorio}
                onChange={(e) => setSensorio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Juicio / Introspección (Conciencia de Enfermedad)</label>
              <input
                type="text"
                value={juicio}
                onChange={(e) => setJuicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Escalas Psicométricas */}
      {activeTab === "ESCALAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Escalas Psicométricas Estandarizadas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">PHQ-9 (Depresión), GAD-7 (Ansiedad) y C-SSRS (Riesgo Suicida Columbia).</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScales}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Escalas
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {/* PHQ-9 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-indigo-400">📊 PHQ-9 (Cuestionario de Salud / Depresión)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Puntuación (0 - 27 pts):</label>
                <input
                  type="number"
                  min="0"
                  max="27"
                  value={phq9}
                  onChange={(e) => setPhq9(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-indigo-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {phq9 <= 4 ? "🟢 Depresión Mínima" : phq9 <= 9 ? "🟡 Depresión Leve" : phq9 <= 14 ? "🟠 Depresión Moderada" : "🔴 Depresión Grave"}
              </span>
            </div>

            {/* GAD-7 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-blue-400">🌊 GAD-7 (Escala de Ansiedad Generalizada)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Puntuación (0 - 21 pts):</label>
                <input
                  type="number"
                  min="0"
                  max="21"
                  value={gad7}
                  onChange={(e) => setGad7(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-blue-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {gad7 <= 4 ? "🟢 Ansiedad Mínima" : gad7 <= 9 ? "🟡 Ansiedad Leve" : gad7 <= 14 ? "🟠 Ansiedad Moderada" : "🔴 Ansiedad Grave"}
              </span>
            </div>

            {/* C-SSRS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-red-400">🚨 C-SSRS (Riesgo Suicida Columbia)</h5>
              <select
                value={cssrs}
                onChange={(e: any) => setCssrs(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2"
              >
                <option value="BAJO">🟢 BAJO RIESGO</option>
                <option value="MODERADO">🟡 MODERADO RIESGO</option>
                <option value="ALTO">🟠 ALTO RIESGO</option>
                <option value="EXTREMO">🔴 RIESGO EXTREMO / URGENTE</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Psicofármacos & Perfil Metabólico */}
      {activeTab === "MONITOREO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4" /> Monitoreo de Psicofármacos & Efectos Metabólicos
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Vigilancia de Prolactina, QTc en EKG y Síndrome Metabólico por Antipsicóticos/Estabilizadores.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveMed}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Monitoreo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Esquema Psicofarmacológico Actual</label>
              <textarea
                value={medsText}
                onChange={(e) => setMedsText(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-emerald-400">🩸 Laboratorio & Metabolismo</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Prolactina (ng/mL):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={prolactina}
                    onChange={(e) => setProlactina(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Peso (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={peso}
                    onChange={(e) => setPeso(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-red-400">⚡ Seguridad Cardíaca & EKG</h5>
              <div>
                <label className="text-slate-400">Intervalo QTc Bazett (ms):</label>
                <input
                  type="number"
                  value={qtc}
                  onChange={(e) => setQtc(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {qtc > 470 ? "🔴 QTc Prolongado (>470ms) - Riesgo de Torsades de Pointes" : "🟢 QTc Normal"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
