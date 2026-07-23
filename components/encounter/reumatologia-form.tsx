"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Award,
  ShieldAlert,
  Bug,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calculator,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const JOINTS_28 = [
  { id: "mcp1_right", name: "MCP 1 Der" }, { id: "mcp1_left", name: "MCP 1 Izq" },
  { id: "mcp2_right", name: "MCP 2 Der" }, { id: "mcp2_left", name: "MCP 2 Izq" },
  { id: "mcp3_right", name: "MCP 3 Der" }, { id: "mcp3_left", name: "MCP 3 Izq" },
  { id: "mcp4_right", name: "MCP 4 Der" }, { id: "mcp4_left", name: "MCP 4 Izq" },
  { id: "mcp5_right", name: "MCP 5 Der" }, { id: "mcp5_left", name: "MCP 5 Izq" },
  { id: "pip1_right", name: "IFP 1 Der" }, { id: "pip1_left", name: "IFP 1 Izq" },
  { id: "pip2_right", name: "IFP 2 Der" }, { id: "pip2_left", name: "IFP 2 Izq" },
  { id: "pip3_right", name: "IFP 3 Der" }, { id: "pip3_left", name: "IFP 3 Izq" },
  { id: "pip4_right", name: "IFP 4 Der" }, { id: "pip4_left", name: "IFP 4 Izq" },
  { id: "pip5_right", name: "IFP 5 Der" }, { id: "pip5_left", name: "IFP 5 Izq" },
  { id: "wrist_right", name: "Muñeca Der" }, { id: "wrist_left", name: "Muñeca Izq" },
  { id: "elbow_right", name: "Codo Der" }, { id: "elbow_left", name: "Codo Izq" },
  { id: "shoulder_right", name: "Hombro Der" }, { id: "shoulder_left", name: "Hombro Izq" },
  { id: "knee_right", name: "Rodilla Der" }, { id: "knee_left", name: "Rodilla Izq" },
];

const VIRAL_ETIOLOGIES = [
  "Chikungunya (Serología positiva IgG/IgM o Brote Histórico)",
  "Zika Virus (Artralgias y rash conjuntival)",
  "Dengue Virus (Síndrome poliarticular post-dengue)",
  "Mayaro Virus (Artritis febril endémica de selva/llanos)",
  "Artropatía Post-Viral No Especificada",
];

export function ReumatologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"HOMUNCULO" | "SCORES" | "POSTVIRAL">("HOMUNCULO");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbJoints, refetch: refetchJoints } = (trpc.rheuma.getJointMapper.useQuery as any)({ encounterId });
  const { data: dbScores, refetch: refetchScores } = (trpc.rheuma.getActivityScores.useQuery as any)({ encounterId });
  const { data: dbViral, refetch: refetchViral } = (trpc.rheuma.getPostViralArthritis.useQuery as any)({ encounterId });

  const saveJointsMut = (trpc.rheuma.saveJointMapper.useMutation as any)({ onSuccess: () => refetchJoints() });
  const saveScoresMut = (trpc.rheuma.saveActivityScores.useMutation as any)({ onSuccess: () => refetchScores() });
  const saveViralMut = (trpc.rheuma.savePostViralArthritis.useMutation as any)({ onSuccess: () => refetchViral() });

  // Joint Mapper State
  const [tenderJoints, setTenderJoints] = useState<string[]>(["mcp2_right", "mcp3_right", "pip2_left", "pip3_left", "wrist_right", "knee_left"]);
  const [swollenJoints, setSwollenJoints] = useState<string[]>(["mcp2_right", "mcp3_right", "wrist_right", "knee_left"]);
  const [patientVas, setPatientVas] = useState(65);
  const [evaluatorVas, setEvaluatorVas] = useState(50);

  // Scores State
  const [crp, setCrp] = useState(14.5);
  const [esr, setEsr] = useState(38.0);

  const tjc28 = tenderJoints.length;
  const sjc28 = swollenJoints.length;

  const cdai = useMemo(() => {
    return Number((tjc28 + sjc28 + (patientVas / 10) + (evaluatorVas / 10)).toFixed(1));
  }, [tjc28, sjc28, patientVas, evaluatorVas]);

  const activityCategory = useMemo(() => {
    if (cdai <= 2.8) return "Remisión Clínica (CDAI <= 2.8)";
    if (cdai <= 10.0) return "Baja Actividad (2.9 <= CDAI <= 10.0)";
    if (cdai <= 22.0) return "Moderada Actividad (10.1 <= CDAI <= 22.0)";
    return "Alta Actividad de la Enfermedad (CDAI > 22.0)";
  }, [cdai]);

  const das28Estimate = useMemo(() => {
    // Calculo aproximado DAS28-PCR
    const lnCrp = Math.log(crp + 1);
    const score = 0.56 * Math.sqrt(tjc28) + 0.28 * Math.sqrt(sjc28) + 0.36 * lnCrp + 0.014 * patientVas + 0.96;
    return Number(score.toFixed(2));
  }, [tjc28, sjc28, crp, patientVas]);

  // Post-Viral State
  const [etiology, setEtiology] = useState("Chikungunya (Serología positiva IgG/IgM o Brote Histórico)");
  const [fase, setFase] = useState("Crónica (>12 semanas post-infección)");
  const [patron, setPatron] = useState("Poliartritis simétrica de pequeñas articulaciones de manos y tobillos con tenosinovitis de flexores.");
  const [tratamPrev, setTratamPrev] = useState("AINEs (Ibuprofeno) + Prednisona 5mg/día.");
  const [respTratam, setRespTratam] = useState("Respuesta Parcial con rigidez matutina persistente >45 min.");

  useEffect(() => {
    if (dbJoints) {
      setPatientVas(dbJoints.patientGlobalVasMm);
      if (dbJoints.evaluatorGlobalVasMm !== null) setEvaluatorVas(dbJoints.evaluatorGlobalVasMm);
      if (dbJoints.jointDetailsJson) {
        try {
          const parsed = JSON.parse(dbJoints.jointDetailsJson);
          if (parsed.tender) setTenderJoints(parsed.tender);
          if (parsed.swollen) setSwollenJoints(parsed.swollen);
        } catch (e) {}
      }
    }
  }, [dbJoints]);

  useEffect(() => {
    if (dbScores) {
      if (dbScores.crpMgL !== null) setCrp(dbScores.crpMgL);
      if (dbScores.esrMmHr !== null) setEsr(dbScores.esrMmHr);
    }
  }, [dbScores]);

  useEffect(() => {
    if (dbViral) {
      setEtiology(dbViral.viralEtiology);
      setFase(dbViral.faseEvolucion);
      setPatron(dbViral.patronArticular);
      if (dbViral.tratamientoPrevio) setTratamPrev(dbViral.tratamientoPrevio);
      if (dbViral.respuestaTratamiento) setRespTratam(dbViral.respuestaTratamiento);
    }
  }, [dbViral]);

  const toggleJoint = (id: string, type: "tender" | "swollen") => {
    if (type === "tender") {
      setTenderJoints((prev) =>
        prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
      );
    } else {
      setSwollenJoints((prev) =>
        prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
      );
    }
  };

  const handleSaveJoints = () => {
    saveJointsMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tenderJointCount28: tjc28,
      swollenJointCount28: sjc28,
      patientGlobalVasMm: patientVas,
      evaluatorGlobalVasMm: evaluatorVas,
      jointDetailsJson: JSON.stringify({ tender: tenderJoints, swollen: swollenJoints }),
    });
  };

  const handleSaveScores = () => {
    saveScoresMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      crpMgL: crp,
      esrMmHr: esr,
      das28Score: das28Estimate,
      cdaiScore: cdai,
      activityCategory,
    });
  };

  const handleSaveViral = () => {
    saveViralMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      viralEtiology: etiology,
      faseEvolucion: fase,
      patronArticular: patron,
      tratamientoPrevio: tratamPrev,
      respuestaTratamiento: respTratam,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Reumatología & Artropatías Inflamatorias</h3>
            <p className="text-xs text-slate-400">Homúnculo Articular 28-Joint Mapper, Índices DAS28/CDAI & Artropatías Virales Endémicas (Chikungunya/Zika)</p>
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
          onClick={() => setActiveTab("HOMUNCULO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "HOMUNCULO"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Joint Mapper 28 Articulaciones
        </button>

        <button
          onClick={() => setActiveTab("SCORES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "SCORES"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Índices de Actividad (DAS28 / CDAI)
        </button>

        <button
          onClick={() => setActiveTab("POSTVIRAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "POSTVIRAL"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Bug className="w-3.5 h-3.5" /> Artropatía Tropical Post-Chikungunya/Zika
        </button>
      </div>

      {/* Tab 1: Homúnculo Articular (Joint Mapper 28) */}
      {activeTab === "HOMUNCULO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Mapeador de Articulaciones 28 (TJC28 Dolorosas / SJC28 Tumefactas)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Selección interactiva de articulaciones comprometidas y escala VAS de severidad.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveJoints}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Articulaciones
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
              <span className="font-bold text-purple-300 block text-xs uppercase tracking-wider">
                Selección de Articulaciones (28 totales)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {JOINTS_28.map((j) => {
                  const isTender = tenderJoints.includes(j.id);
                  const isSwollen = swollenJoints.includes(j.id);

                  return (
                    <div key={j.id} className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
                      <span className="text-[11px] text-slate-300 font-medium">{j.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleJoint(j.id, "tender")}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isTender ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          D
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleJoint(j.id, "swollen")}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSwollen ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          I
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-amber-500/30 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">TJC28 (Dolorosas)</span>
                  <span className="text-2xl font-bold text-amber-400">{tjc28} / 28</span>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-rose-500/30 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">SJC28 (Tumefactas)</span>
                  <span className="text-2xl font-bold text-rose-400">{sjc28} / 28</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="font-semibold text-slate-300 block">VAS Global del Paciente (0 - 100 mm)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patientVas}
                  onChange={(e) => setPatientVas(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[11px] text-purple-300 font-bold">
                  <span>0 mm (Remisión)</span>
                  <span>{patientVas} mm</span>
                  <span>100 mm (Máximo)</span>
                </div>
              </div>

              <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="font-semibold text-slate-300 block">VAS Global del Evaluador/Médico (0 - 100 mm)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={evaluatorVas}
                  onChange={(e) => setEvaluatorVas(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[11px] text-purple-300 font-bold">
                  <span>0 mm</span>
                  <span>{evaluatorVas} mm</span>
                  <span>100 mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scores DAS28 / CDAI */}
      {activeTab === "SCORES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de Actividad Autocomputada (CDAI & DAS28-PCR)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Clasificación de severidad y seguimiento de respuesta a FAMEs / Biológicos.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScores}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Scores
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Proteína C Reactiva PCR (mg/L)</label>
              <input
                type="number"
                step="0.1"
                value={crp}
                onChange={(e) => setCrp(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Velocidad de Sedimentación Globular VSG (mm/h)</label>
              <input
                type="number"
                step="1"
                value={esr}
                onChange={(e) => setEsr(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-purple-500/30 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold block">CDAI Score (Clinical Disease Activity Index)</span>
              <span className="text-2xl font-bold text-purple-300">{cdai} / 76 pts</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-purple-500/30 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Estimación DAS28-PCR</span>
              <span className="text-2xl font-bold text-emerald-300">{das28Estimate} pts</span>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300">Categoría de Actividad Clínica:</span>
              <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-xs">
                {activityCategory}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Artropatía Tropical Post-Viral */}
      {activeTab === "POSTVIRAL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bug className="w-4 h-4" /> Módulo de Seguimiento de Artropatía Post-Viral Tropical (Venezuela)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Diagnóstico y estadificación de artritis crónicas por Chikungunya, Zika o Dengue.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveViral}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Registro Viral
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Etiología Viral Endémica</label>
              <select
                value={etiology}
                onChange={(e) => setEtiology(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {VIRAL_ETIOLOGIES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fase de Evolución Reumatológica</label>
              <input
                type="text"
                value={fase}
                onChange={(e) => setFase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Patrón de Compromiso Articular & Tenosinovial</label>
              <textarea
                value={patron}
                onChange={(e) => setPatron(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tratamiento Previo Administrado (AINEs/Corticoides/FAMEs)</label>
              <input
                type="text"
                value={tratamPrev}
                onChange={(e) => setTratamPrev(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Respuesta al Tratamiento & Rigidez Matutina</label>
              <input
                type="text"
                value={respTratam}
                onChange={(e) => setRespTratam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
