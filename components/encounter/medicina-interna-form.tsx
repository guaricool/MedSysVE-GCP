"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  Pill,
  HeartPulse,
  Award,
  CheckCircle2,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const CHARLSON_ITEMS = [
  { key: "infarto", label: "Infarto agudo de miocardio previo", pts: 1 },
  { key: "insuficienciaCardiaca", label: "Insuficiencia cardíaca congestiva", pts: 1 },
  { key: "arteriopatia", label: "Enfermedad arterial periférica", pts: 1 },
  { key: "cerebrovascular", label: "Enfermedad cerebrovascular / ACV", pts: 1 },
  { key: "demencia", label: "Demencia / Deterioro cognitivo", pts: 1 },
  { key: "pulmonarCronica", label: "Enfermedad pulmonar crónica (EPOC/Asma)", pts: 1 },
  { key: "conectivopatia", label: "Conectivopatía / Artritis reumatoide", pts: 1 },
  { key: "ulcera", label: "Enfermedad ulcerosa péptica", pts: 1 },
  { key: "hepatopatiaLeve", label: "Hepatopatía leve", pts: 1 },
  { key: "diabetesSinOrgano", label: "Diabetes sin daño de órgano blanco", pts: 1 },
  { key: "diabetesConOrgano", label: "Diabetes con daño de órgano blanco", pts: 2 },
  { key: "nefropatia", label: "Enfermedad renal moderada o severa", pts: 2 },
  { key: "tumorSolido", label: "Tumor sólido sin metástasis", pts: 2 },
  { key: "leucemia", label: "Leucemia o Linfoma", pts: 2 },
  { key: "hepatopatiaModerada", label: "Hepatopatía moderada o severa (Cirrosis)", pts: 3 },
  { key: "tumorMetastasis", label: "Tumor sólido metastásico", pts: 6 },
  { key: "sida", label: "SIDA / VIH sintomático", pts: 6 },
];

export function MedicinaInternaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"CHARLSON" | "SCORES" | "POLIFARMACIA">("CHARLSON");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbCci, refetch: refetchCci } = (trpc.internal.getCharlsonIndex.useQuery as any)({ encounterId });
  const { data: dbScores, refetch: refetchScores } = (trpc.internal.getClinicalScores.useQuery as any)({ encounterId });
  const { data: dbPoly, refetch: refetchPoly } = (trpc.internal.getPolypharmacyAlert.useQuery as any)({ encounterId });

  const saveCciMut = (trpc.internal.saveCharlsonIndex.useMutation as any)({ onSuccess: () => refetchCci() });
  const saveScoresMut = (trpc.internal.saveClinicalScores.useMutation as any)({ onSuccess: () => refetchScores() });
  const savePolyMut = (trpc.internal.savePolypharmacyAlert.useMutation as any)({ onSuccess: () => refetchPoly() });

  // Charlson State
  const [selectedCharlson, setSelectedCharlson] = useState<Record<string, boolean>>({
    diabetesSinOrgano: true,
    nefropatia: true,
    infarto: true,
  });

  // Scores State
  const [fourTScore, setFourTScore] = useState(2);
  const [fourTRisk, setFourTRisk] = useState("Probabilidad Baja de HIT (<= 3 pts)");
  const [childPughScore, setChildPughScore] = useState(6);
  const [childPughClass, setChildPughClass] = useState("Clase A (Cirrosis Compensada)");
  const [meldScore, setMeldScore] = useState(11.2);

  // Polypharmacy State
  const [numFármacos, setNumFarmacos] = useState(7);
  const [beers, setBeers] = useState("Uso de Benzodiazepina de vida media larga en adulto mayor (Riesgo de caídas).");
  const [stoppStart, setStoppStart] = useState("STOPP: AINE prolongado con ClCr < 50. START: Iniciar Estatina en prevención secundaria.");
  const [planDesprescripcion, setPlanDesprescripcion] = useState("Descontinuar alprazolam progresivamente. Sustituir AINE por paracetamol.");

  useEffect(() => {
    if (dbCci && Array.isArray(dbCci.comorbilidadesJson)) {
      const map: Record<string, boolean> = {};
      dbCci.comorbilidadesJson.forEach((c: any) => {
        const item = CHARLSON_ITEMS.find((it) => it.label === c.nombre);
        if (item) map[item.key] = true;
      });
      setSelectedCharlson(map);
    }
  }, [dbCci]);

  useEffect(() => {
    if (dbScores) {
      if (dbScores.fourTScoreHit !== null) setFourTScore(dbScores.fourTScoreHit);
      if (dbScores.fourTHitRiskCategory) setFourTRisk(dbScores.fourTHitRiskCategory);
      if (dbScores.childPughScore !== null) setChildPughScore(dbScores.childPughScore);
      if (dbScores.childPughClass) setChildPughClass(dbScores.childPughClass);
      if (dbScores.meldScore !== null) setMeldScore(dbScores.meldScore);
    }
  }, [dbScores]);

  useEffect(() => {
    if (dbPoly) {
      setNumFarmacos(dbPoly.conteoMedicamentosActivos);
      if (dbPoly.criteriosBeersAplicables) setBeers(dbPoly.criteriosBeersAplicables);
      if (dbPoly.criteriosStoppStartAplicables) setStoppStart(dbPoly.criteriosStoppStartAplicables);
      if (dbPoly.planDesprescripcion) setPlanDesprescripcion(dbPoly.planDesprescripcion);
    }
  }, [dbPoly]);

  const charlsonTotalScore = useMemo(() => {
    let pts = 0;
    CHARLSON_ITEMS.forEach((it) => {
      if (selectedCharlson[it.key]) pts += it.pts;
    });
    return pts;
  }, [selectedCharlson]);

  const survival10Years = useMemo(() => {
    // Estimación matemática estándar de Charlson survival: 0.983^(e^(CCI * 0.9))
    const s = Math.pow(0.983, Math.exp(charlsonTotalScore * 0.9)) * 100;
    return Math.max(1, Math.min(99, Math.round(s * 10) / 10));
  }, [charlsonTotalScore]);

  const handleToggleCharlson = (key: string) => {
    setSelectedCharlson((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveCharlson = () => {
    const list = CHARLSON_ITEMS.filter((it) => selectedCharlson[it.key]).map((it) => ({
      nombre: it.label,
      pts: it.pts,
    }));
    saveCciMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      charlsonTotalScore,
      estimated10YearSurvivalPercent: survival10Years,
      comorbilidadesJson: list,
    });
  };

  const handleSaveScores = () => {
    saveScoresMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      fourTScoreHit: fourTScore,
      fourTHitRiskCategory: fourTRisk,
      childPughScore,
      childPughClass,
      meldScore,
    });
  };

  const handleSavePoly = () => {
    savePolyMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      conteoMedicamentosActivos: numFármacos,
      criteriosBeersAplicables: beers,
      criteriosStoppStartAplicables: stoppStart,
      planDesprescripcion,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Medicina Interna & Evaluación Multiorgánica</h3>
            <p className="text-xs text-slate-400">Índice Charlson (CCI), HIT 4T / Child-Pugh / MELD & Polifarmacia (Beers / STOPP-START)</p>
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
          onClick={() => setActiveTab("CHARLSON")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CHARLSON"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Índice Charlson (CCI)
        </button>

        <button
          onClick={() => setActiveTab("SCORES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "SCORES"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Scores 4T HIT / Child-Pugh / MELD
        </button>

        <button
          onClick={() => setActiveTab("POLIFARMACIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "POLIFARMACIA"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Pill className="w-3.5 h-3.5" /> Polifarmacia & Desprescripción
        </button>
      </div>

      {/* Tab 1: Índice de Charlson (CCI) */}
      {activeTab === "CHARLSON" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Índice de Comorbilidad de Charlson (CCI)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Predicción de mortalidad a 10 años en pacientes con múltiples patologías de base.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveCharlson}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
            >
              Guardar Charlson CCI
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {/* Checklist of Charlson */}
            <div className="md:col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 max-h-72 overflow-y-auto">
              <span className="font-bold text-slate-200 block mb-1">Seleccionar Comorbilidades Activas:</span>
              <div className="grid sm:grid-cols-2 gap-2">
                {CHARLSON_ITEMS.map((it) => (
                  <label key={it.key} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 border border-slate-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedCharlson[it.key]}
                      onChange={() => handleToggleCharlson(it.key)}
                      className="w-3.5 h-3.5 accent-sky-500 rounded"
                    />
                    <span className="text-[11px] text-slate-300">{it.label} <strong className="text-sky-400">({it.pts} pt)</strong></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Score Output */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-center text-center">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Charlson CCI Total:</span>
                <p className="text-3xl font-extrabold text-sky-400 mt-1">{charlsonTotalScore} Puntos</p>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Supervivencia Estimada a 10 años:</span>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1">{survival10Years}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scores Internísticos */}
      {activeTab === "SCORES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadoras Clínicas (4T HIT, Child-Pugh & MELD)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Trombocitopenia por Heparina & Severidad de Hepatopatía Crónica.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScores}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
            >
              Guardar Scores
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <span className="font-bold text-sky-300 block border-b border-slate-800 pb-1">Score 4T (Trombocitopenia Inducida por Heparina HIT):</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Puntuación 4T (0 - 8 pts):</span>
                  <input
                    type="number"
                    min="0"
                    max="8"
                    value={fourTScore}
                    onChange={(e) => setFourTScore(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 text-white text-center font-bold rounded p-1"
                  />
                </div>
                <input
                  type="text"
                  value={fourTRisk}
                  onChange={(e) => setFourTRisk(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
              <span className="font-bold text-sky-300 block border-b border-slate-800 pb-1">Escala Child-Pugh & Score MELD (Cirrosis):</span>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px]">Child-Pugh (5-15):</span>
                    <input
                      type="number"
                      min="5"
                      max="15"
                      value={childPughScore}
                      onChange={(e) => setChildPughScore(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-center font-bold rounded p-1 mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Score MELD:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={meldScore}
                      onChange={(e) => setMeldScore(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-center font-bold rounded p-1 mt-0.5"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={childPughClass}
                  onChange={(e) => setChildPughClass(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Polifarmacia & Desprescripción */}
      {activeTab === "POLIFARMACIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4" /> Polifarmacia & Criterios Beers / STOPP-START
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Monitoreo de interacciones, fármacos inapropiados y desprescripción segura.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePoly}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
            >
              Guardar Polifarmacia
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Número Total de Fármacos Activos Prescritos</label>
              <input
                type="number"
                min="0"
                value={numFármacos}
                onChange={(e) => setNumFarmacos(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Alertas de Criterios de Beers (Fármacos Inapropiados)</label>
              <input
                type="text"
                value={beers}
                onChange={(e) => setBeers(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-semibold rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Criterios STOPP / START Aplicables</label>
              <textarea
                value={stoppStart}
                onChange={(e) => setStoppStart(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Plan Específico de Desprescripción Progresiva</label>
              <textarea
                value={planDesprescripcion}
                onChange={(e) => setPlanDesprescripcion(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
