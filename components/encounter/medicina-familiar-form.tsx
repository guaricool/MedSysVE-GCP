"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Users,
  HeartHandshake,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
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

const APGAR_QUESTIONS = [
  { key: "adaptability", label: "A - Adaptabilidad: ¿Satisfecho(a) con la ayuda que recibe de su familia cuando algo le perturba?" },
  { key: "partnership", label: "P - Participación: ¿Satisfecho(a) con la forma como su familia habla y comparte los problemas con usted?" },
  { key: "growth", label: "G - Crecimiento: ¿Satisfecho(a) con la forma como su familia acepta y apoya sus deseos de emprender nuevas actividades?" },
  { key: "affection", label: "A - Afectividad: ¿Satisfecho(a) con la forma como su familia expresa sus afectos y responde a sus emociones?" },
  { key: "resolve", label: "R - Resolución: ¿Satisfecho(a) con la forma como usted y su familia pasan el tiempo juntos?" },
];

const DUVALL_STAGES = [
  "Etapa I. Formación de la Pareja / Comienzo de la Familia (Sin hijos)",
  "Etapa II. Crianza Inicial (Hijo mayor de 0 a 30 meses)",
  "Etapa III. Familia con Hijos Preescolares (Hijo mayor 2.5 a 6 años)",
  "Etapa IV. Familia con Hijos Escolares (Hijo mayor 6 a 13 años)",
  "Etapa V. Familia con Hijos Adolescentes (Hijo mayor 13 a 20 años)",
  "Etapa VI. Familia como Centro de Despegue / Dispersión (Emancipación de hijos)",
  "Etapa VII. Familia de Edad Media / Nido Vacío (Hasta el retiro)",
  "Etapa VIII. Familia Anciana / Retiro y Vejez (Hasta el fallecimiento de ambos cónyuges)",
];

export function MedicinaFamiliarForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"GENOGRAMA" | "APGAR" | "CICLO">("GENOGRAMA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbGeno, refetch: refetchGeno } = (trpc.fammed.getGenogram.useQuery as any)({ encounterId });
  const { data: dbApgar, refetch: refetchApgar } = (trpc.fammed.getApgarScore.useQuery as any)({ encounterId });
  const { data: dbCycle, refetch: refetchCycle } = (trpc.fammed.getFamilyLifeCycle.useQuery as any)({ encounterId });

  const saveGenoMut = (trpc.fammed.saveGenogram.useMutation as any)({ onSuccess: () => refetchGeno() });
  const saveApgarMut = (trpc.fammed.saveApgarScore.useMutation as any)({ onSuccess: () => refetchApgar() });
  const saveCycleMut = (trpc.fammed.saveFamilyLifeCycle.useMutation as any)({ onSuccess: () => refetchCycle() });

  // Genogram State
  const [members, setMembers] = useState<Array<{ id: string; name: string; relation: string; age: number; diseases: string }>>([
    { id: "1", name: "Abuelo Paterno", relation: "Abuelo Paterno", age: 78, diseases: "Hipertensión Arterial, ACV" },
    { id: "2", name: "Abuela Paterna", relation: "Abuela Paterna", age: 74, diseases: "Diabetes Mellitus Tipo 2" },
    { id: "3", name: "Padre", relation: "Padre", age: 52, diseases: "Hipertensión Arterial" },
    { id: "4", name: "Madre", relation: "Madre", age: 49, diseases: "Sana" },
    { id: "5", name: "Paciente", relation: "Paciente Probandi", age: 24, diseases: "Asma Bronquial" },
    { id: "6", name: "Hermano", relation: "Hermano", age: 20, diseases: "Sano" },
  ]);

  // APGAR State
  const [apgarScores, setApgarScores] = useState<Record<string, number>>({
    adaptability: 2,
    partnership: 1,
    growth: 2,
    affection: 2,
    resolve: 1,
  });

  const totalApgar = useMemo(() => {
    return Object.values(apgarScores).reduce((acc, curr) => acc + curr, 0);
  }, [apgarScores]);

  const apgarCategory = useMemo(() => {
    if (totalApgar >= 7) return "Buena Funcionalidad Familiar (APGAR 7-10 pts)";
    if (totalApgar >= 4) return "Disfunción Familiar Leve a Moderada (APGAR 4-6 pts)";
    return "Disfunción Familiar Severa (APGAR 0-3 pts)";
  }, [totalApgar]);

  // Ciclo Vital State
  const [duvall, setDuvall] = useState("Etapa V. Familia con Hijos Adolescentes (Hijo mayor 13 a 20 años)");
  const [normative, setNormative] = useState("Reorganización de límites y autonomía juvenil");
  const [nonNormative, setNonNormative] = useState("Migración de familiar cercano / Duelo en pandemia");

  useEffect(() => {
    if (dbGeno && dbGeno.genogramDataJson) {
      try {
        const parsed = JSON.parse(dbGeno.genogramDataJson);
        if (parsed.members) setMembers(parsed.members);
      } catch (e) {}
    }
  }, [dbGeno]);

  useEffect(() => {
    if (dbApgar) {
      setApgarScores({
        adaptability: dbApgar.adaptabilityScore,
        partnership: dbApgar.partnershipScore,
        growth: dbApgar.growthScore,
        affection: dbApgar.affectionScore,
        resolve: dbApgar.resolveScore,
      });
    }
  }, [dbApgar]);

  useEffect(() => {
    if (dbCycle) {
      setDuvall(dbCycle.duvallStage);
      if (dbCycle.normativeCrises) setNormative(dbCycle.normativeCrises);
      if (dbCycle.nonNormativeCrises) setNonNormative(dbCycle.nonNormativeCrises);
    }
  }, [dbCycle]);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: String(Date.now()), name: "Nuevo Familiar", relation: "Familiar", age: 30, diseases: "Ninguna" },
    ]);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMember = (id: string, field: string, value: any) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSaveGeno = () => {
    saveGenoMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      generationsCount: 3,
      membersCount: members.length,
      genogramDataJson: JSON.stringify({ members }),
      hereditaryRisksJson: JSON.stringify(members.map((m) => m.diseases)),
    });
  };

  const handleSaveApgar = () => {
    saveApgarMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      adaptabilityScore: apgarScores.adaptability,
      partnershipScore: apgarScores.partnership,
      growthScore: apgarScores.growth,
      affectionScore: apgarScores.affection,
      resolveScore: apgarScores.resolve,
      totalApgarScore: totalApgar,
      functionalityCategory: apgarCategory,
    });
  };

  const handleSaveCycle = () => {
    saveCycleMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      duvallStage: duvall,
      normativeCrises: normative,
      nonNormativeCrises: nonNormative,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Medicina Familiar & Salud Comunitaria</h3>
            <p className="text-xs text-slate-400">Genograma de 3 Generaciones, APGAR Funcional Familiar & Ciclo Vital (Duvall)</p>
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
          onClick={() => setActiveTab("GENOGRAMA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "GENOGRAMA"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Genograma (3 Generaciones)
        </button>

        <button
          onClick={() => setActiveTab("APGAR")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "APGAR"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" /> APGAR Familiar
        </button>

        <button
          onClick={() => setActiveTab("CICLO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CICLO"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Ciclo Vital Familiar (Duvall)
        </button>
      </div>

      {/* Tab 1: Genograma (3 Generaciones) */}
      {activeTab === "GENOGRAMA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Mapeo Genográmico Familiar de 3 Generaciones
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Consolidación de red de parentesco y riesgo de patologías hereditarias.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={addMember}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Familiar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveGeno}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Guardar Genograma
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {members.map((m) => (
              <div key={m.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 items-center">
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => updateMember(m.id, "name", e.target.value)}
                  placeholder="Nombre / Parentesco"
                  className="sm:col-span-3 bg-slate-900 border border-slate-700 text-white font-semibold rounded p-1.5"
                />
                <input
                  type="text"
                  value={m.relation}
                  onChange={(e) => updateMember(m.id, "relation", e.target.value)}
                  placeholder="Rol / Posición"
                  className="sm:col-span-3 bg-slate-900 border border-slate-700 text-slate-300 rounded p-1.5"
                />
                <input
                  type="number"
                  value={m.age}
                  onChange={(e) => updateMember(m.id, "age", Number(e.target.value))}
                  placeholder="Edad"
                  className="sm:col-span-2 bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded p-1.5"
                />
                <input
                  type="text"
                  value={m.diseases}
                  onChange={(e) => updateMember(m.id, "diseases", e.target.value)}
                  placeholder="Antecedentes / Patologías"
                  className="sm:col-span-3 bg-slate-900 border border-slate-700 text-amber-300 rounded p-1.5"
                />
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="sm:col-span-1 p-1 text-slate-500 hover:text-rose-400 transition-colors flex justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: APGAR Familiar */}
      {activeTab === "APGAR" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" /> Evaluación de Funcionalidad APGAR Familiar (Smilkstein)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Diagnóstico de la percepción del paciente sobre la dinámica funcional de su núcleo.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveApgar}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar APGAR
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {APGAR_QUESTIONS.map((q) => (
              <div key={q.key} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="font-semibold text-slate-200 sm:w-2/3">{q.label}</span>
                <div className="flex items-center gap-2">
                  {[
                    { val: 0, label: "Casi Nunca (0)" },
                    { val: 1, label: "A Veces (1)" },
                    { val: 2, label: "Casi Siempre (2)" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setApgarScores({ ...apgarScores, [q.key]: opt.val })}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        apgarScores[q.key] === opt.val
                          ? "bg-indigo-600 text-white shadow"
                          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-slate-950 p-3.5 rounded-lg border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Puntaje APGAR Total</span>
                <span className="text-2xl font-bold text-indigo-300">{totalApgar} / 10 pts</span>
              </div>
              <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-xs">
                {apgarCategory}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ciclo Vital Familiar (Duvall) */}
      {activeTab === "CICLO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Estadificación del Ciclo Vital Familiar (Evelyn Duvall)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Identificación de crisis normativas y estresores paranormativos accesorias.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveCycle}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar Ciclo Vital
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Etapa del Ciclo Vital Familiar (Duvall)</label>
              <select
                value={duvall}
                onChange={(e) => setDuvall(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {DUVALL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Crisis Normativas del Desarrollo (Esperadas)</label>
              <textarea
                value={normative}
                onChange={(e) => setNormative(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Crisis Paranormativas / Estresores Accidentales</label>
              <textarea
                value={nonNormative}
                onChange={(e) => setNonNormative(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
