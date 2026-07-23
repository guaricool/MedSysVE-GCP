"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Zap,
  Dumbbell,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const MUSCLE_GROUPS = [
  "Deltoides Medio / Anterior",
  "Bíceps Braquial",
  "Tríceps Braquial",
  "Cuádriceps Femoral",
  "Isquiotibiales (Bíceps Femoral)",
  "Gastrocnemios / Sóleo",
  "Psoas Ilíaco / Flexores de Cadera",
  "Glúteo Mayor / Extensores de Cadera",
];

const ASHWORTH_SCORES = [
  { score: "0", label: "Grado 0: Tono muscular normal (Sin aumento del tono)" },
  { score: "1", label: "Grado 1: Aumento leve al final del arco articular (Resistencia mínima)" },
  { score: "1+", label: "Grado 1+: Aumento leve en menos de la mitad del arco articular" },
  { score: "2", label: "Grado 2: Aumento pronunciado en la mayor parte del arco (Se mueve fácil)" },
  { score: "3", label: "Grado 3: Aumento considerable; movimiento pasivo difícil" },
  { score: "4", label: "Grado 4: Parte afectada rígida en flexión o extensión" },
];

const THERAPY_MODALITIES = [
  "TENS Analgésico 100Hz / 20 min",
  "EMS Electroestimulación Muscular FES",
  "Ultrasonido Terapéutico 1MHz Pulsado 1.5 W/cm2",
  "Láser Terapéutico de Baja Potencia LLLT",
  "Cinesiterapia Pasiva & Estiramientos Miotendinosos",
  "Reeducación Neuromuscular de la Marcha en Barras Paralelas",
  "Hidroterapia / Tanque de Hubbart",
  "Compresas Húmedo-Calientes CHC / Parafina",
];

export function FisiatriaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"DANIELS" | "ASHWORTH" | "PLAN">("DANIELS");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbMuscles = [], refetch: refetchMuscles } = (trpc.physiatry.listMuscleGonio.useQuery as any)({ encounterId });
  const { data: dbAshworth, refetch: refetchAshworth } = (trpc.physiatry.getAshworthScale.useQuery as any)({ encounterId });
  const { data: dbPlan, refetch: refetchPlan } = (trpc.physiatry.getPrescriptionPlan.useQuery as any)({ encounterId });

  const saveMuscleMut = (trpc.physiatry.saveMuscleGonio.useMutation as any)({ onSuccess: () => refetchMuscles() });
  const saveAshworthMut = (trpc.physiatry.saveAshworthScale.useMutation as any)({ onSuccess: () => refetchAshworth() });
  const savePlanMut = (trpc.physiatry.savePrescriptionPlan.useMutation as any)({ onSuccess: () => refetchPlan() });

  // Muscle & Gonio State
  const [muscleGroup, setMuscleGroup] = useState("Cuádriceps Femoral");
  const [danielsScore, setDanielsScore] = useState(3);
  const [flexionRom, setFlexionRom] = useState(110);
  const [extensionRom, setExtensionRom] = useState(0);
  const [rotationRom, setRotationRom] = useState(0);

  // Ashworth State
  const [segment, setSegment] = useState("Miembro Inferior Izquierdo (Patrón Hemiparético post-ACV)");
  const [ashworthScore, setAshworthScore] = useState("2");
  const [clonus, setClonus] = useState(true);
  const [posturalPattern, setPosturalPattern] = useState("Patrón flexor en miembro superior / extensor en miembro inferior");

  // Plan State
  const [selectedModalities, setSelectedModalities] = useState<string[]>([
    "TENS Analgésico 100Hz / 20 min",
    "Ultrasonido Terapéutico 1MHz Pulsado 1.5 W/cm2",
    "Cinesiterapia Pasiva & Estiramientos Miotendinosos",
    "Reeducación Neuromuscular de la Marcha en Barras Paralelas",
  ]);
  const [durationMin, setDurationMin] = useState(45);
  const [sessionsWeek, setSessionsWeek] = useState(3);
  const [totalWeeks, setTotalWeeks] = useState(6);
  const [goals, setGoals] = useState("Ganancia de fuerza muscular (Daniels 3 -> 4), modulación del dolor miotendinoso e independencia en la marcha autónoma");

  useEffect(() => {
    if (dbAshworth) {
      setSegment(dbAshworth.bodySegment);
      setAshworthScore(dbAshworth.ashworthScore.charAt(0));
      setClonus(dbAshworth.clonusPresent);
      if (dbAshworth.posturalPattern) setPosturalPattern(dbAshworth.posturalPattern);
    }
  }, [dbAshworth]);

  useEffect(() => {
    if (dbPlan) {
      setDurationMin(dbPlan.sessionDurationMin);
      setSessionsWeek(dbPlan.sessionsPerWeek);
      setTotalWeeks(dbPlan.totalWeeks);
      if (dbPlan.physiotherapyGoals) setGoals(dbPlan.physiotherapyGoals);
      if (dbPlan.modalitiesJson) {
        try {
          setSelectedModalities(JSON.parse(dbPlan.modalitiesJson));
        } catch (e) {}
      }
    }
  }, [dbPlan]);

  const toggleModality = (modality: string) => {
    setSelectedModalities((prev) =>
      prev.includes(modality) ? prev.filter((m) => m !== modality) : [...prev, modality]
    );
  };

  const handleAddMuscle = () => {
    saveMuscleMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      muscleGroup,
      danielsScore,
      flexionRomDegrees: flexionRom,
      extensionRomDegrees: extensionRom,
      rotationRomDegrees: rotationRom,
    });
  };

  const handleSaveAshworth = () => {
    saveAshworthMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      bodySegment: segment,
      ashworthScore,
      clonusPresent: clonus,
      posturalPattern,
    });
  };

  const handleSavePlan = () => {
    savePlanMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      modalitiesJson: JSON.stringify(selectedModalities),
      sessionDurationMin: durationMin,
      sessionsPerWeek: sessionsWeek,
      totalWeeks,
      physiotherapyGoals: goals,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Medicina Física, Rehabilitación & Fisiatría</h3>
            <p className="text-xs text-slate-400">Fuerza Muscular MMT (Daniels 0-5), Espasticidad (Ashworth) & Electroterapia TENS/EMS</p>
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
          onClick={() => setActiveTab("DANIELS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DANIELS"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" /> Fuerza & Goniometría ({dbMuscles.length})
        </button>

        <button
          onClick={() => setActiveTab("ASHWORTH")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ASHWORTH"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Espasticidad (Ashworth)
        </button>

        <button
          onClick={() => setActiveTab("PLAN")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PLAN"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Prescripción Fisioterapéutica
        </button>
      </div>

      {/* Tab 1: Fuerza & Goniometría */}
      {activeTab === "DANIELS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" /> Graduación de Fuerza Muscular MMT (Daniels) & Goniometría Articular (ROM)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Escala de Daniels (0 a 5 pts) y arcos de movimiento pasivo/activo en grados (°).</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddMuscle}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Evaluar Músculo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grupo Muscular / Articulación Evaluada</label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fuerza Muscular MMT (Daniels 0 a 5 pts)</label>
              <select
                value={danielsScore}
                onChange={(e) => setDanielsScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-sm"
              >
                <option value={0}>0 - Parálisis total (Sin contracción)</option>
                <option value={1}>1 - Palpable (Contracción visible sin movimiento)</option>
                <option value={2}>2 - Deficiente (Movimiento elimina gravedad)</option>
                <option value={3}>3 - Aceptable (Movimiento contra gravedad)</option>
                <option value={4}>4 - Bueno (Movimiento contra resistencia moderada)</option>
                <option value={5}>5 - Normal (Movimiento contra resistencia máxima)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Goniometría - Flexión (°)</label>
              <input
                type="number"
                step="5"
                value={flexionRom}
                onChange={(e) => setFlexionRom(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Goniometría - Extensión (°)</label>
              <input
                type="number"
                step="5"
                value={extensionRom}
                onChange={(e) => setExtensionRom(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Espasticidad (Ashworth) */}
      {activeTab === "ASHWORTH" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Evaluador de Tono Muscular & Espasticidad (Ashworth Modificada)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estadificación de la hipertonía espástica en parálisis cerebral o post-ACV.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAshworth}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar Ashworth
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Segmento Corporal Evaluado</label>
              <input
                type="text"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Grado de Espasticidad (Escala Modificada de Ashworth)</label>
              <select
                value={ashworthScore}
                onChange={(e) => setAshworthScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              >
                {ASHWORTH_SCORES.map((a) => (
                  <option key={a.score} value={a.score}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Patrón Postural Predominante</label>
              <input
                type="text"
                value={posturalPattern}
                onChange={(e) => setPosturalPattern(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Presencia de Clonus</span>
                <span className="text-xs text-slate-400">Reflejo miotático hiperactivo continuo/exhaustible</span>
              </div>
              <button
                type="button"
                onClick={() => setClonus(!clonus)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                  clonus
                    ? "bg-rose-600 text-white shadow"
                    : "bg-slate-900 border border-slate-700 text-slate-400"
                }`}
              >
                {clonus ? "Clonus Presente" : "Sin Clonus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Prescripción Fisioterapéutica */}
      {activeTab === "PLAN" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Plan de Prescripción Fisioterapéutica & Agentes Físicos
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Indicación de electroterapia (TENS/EMS), ultrasonido, láser y cinesiterapia.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar Prescripción
            </Button>
          </div>

          <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <span className="font-bold text-emerald-300 block">Modalidades de Tratamiento Fisioterapéutico Prescriptas:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {THERAPY_MODALITIES.map((mod) => {
                const isSelected = selectedModalities.includes(mod);
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => toggleModality(mod)}
                    className={`p-2 rounded text-left transition-all font-semibold ${
                      isSelected
                        ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {isSelected ? "✓ " : ""}{mod}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Duración por Sesión (min)</label>
              <input
                type="number"
                step="5"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Frecuencia (Sesiones/Semana)</label>
              <input
                type="number"
                min="1"
                max="7"
                value={sessionsWeek}
                onChange={(e) => setSessionsWeek(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-center text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Duración Total (Semanas)</label>
              <input
                type="number"
                min="1"
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-center text-sm"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Objetivos Funcionales de la Rehabilitación</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white font-medium rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
