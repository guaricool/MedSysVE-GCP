"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { DicomViewer } from "@/components/dicom/dicom-viewer";
import {
  Wind,
  Activity,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  Award,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const GINA_STEPS = [
  "Paso 1 GINA (Asma Intermitente - Dosis baja CI-formoterol según necesidad)",
  "Paso 2 GINA (Asma Persistente Leve - Dosis baja CI diaria o CI-formoterol a demanda)",
  "Paso 3 GINA (Asma Persistente Moderada - Dosis baja CI + LABA de mantenimiento)",
  "Paso 4 GINA (Asma Persistente Severa - Dosis media/alta CI + LABA)",
  "Paso 5 GINA (Asma Grave no controlada - Tratamiento biológico anti-IgE / anti-IL5)",
];

const GOLD_GRADES = [
  "GOLD 1: Leve (VEF1 >= 80% del teórico)",
  "GOLD 2: Moderado (50% <= VEF1 < 80% del teórico)",
  "GOLD 3: Grave (30% <= VEF1 < 50% del teórico)",
  "GOLD 4: Muy Grave (VEF1 < 30% del teórico)",
];

const MMRC_GRADES = [
  "Grado 0: Solo me ahogo al realizar ejercicio intenso.",
  "Grado 1: Me ahogo al andar de prisa en llano o al subir una pendiente ligera.",
  "Grado 2: Me detengo a tomar aire al caminar en llano al paso de otras personas.",
  "Grado 3: Me detengo a tomar aire tras caminar unos 100 metros o a los pocos minutos.",
  "Grado 4: No puedo salir de casa o me ahogo al vestirme / desvestirme.",
];

export function NeumonologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"ESPIROMETRIA" | "GINA_GOLD" | "DISNEA_CAT">("ESPIROMETRIA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbSpir, refetch: refetchSpir } = (trpc.pneumo.getSpirometry.useQuery as any)({ encounterId });
  const { data: dbGinaGold, refetch: refetchGinaGold } = (trpc.pneumo.getGinaGold.useQuery as any)({ encounterId });
  const { data: dbDyspnea, refetch: refetchDyspnea } = (trpc.pneumo.getDyspneaCat.useQuery as any)({ encounterId });

  const saveSpirMut = (trpc.pneumo.saveSpirometry.useMutation as any)({ onSuccess: () => refetchSpir() });
  const saveGinaGoldMut = (trpc.pneumo.saveGinaGold.useMutation as any)({ onSuccess: () => refetchGinaGold() });
  const saveDyspneaMut = (trpc.pneumo.saveDyspneaCat.useMutation as any)({ onSuccess: () => refetchDyspnea() });

  // Spirometry State
  const [vef1Pre, setVef1Pre] = useState(2.1);
  const [cvfPre, setCvfPre] = useState(3.8);
  const [vef1CvfRatio, setVef1CvfRatio] = useState(55.2);
  const [vef1Post, setVef1Post] = useState(2.5);
  const [deltaMl, setDeltaMl] = useState(400);
  const [deltaPercent, setDeltaPercent] = useState(19.0);
  const [interpSpir, setInterpSpir] = useState("Patrón Obstructivo Moderado con Respuesta Broncodilatadora Positiva (Reversibilidad)");

  // GINA / GOLD State
  const [gina, setGina] = useState("Paso 3 GINA (Asma Persistente Moderada - Dosis baja CI + LABA de mantenimiento)");
  const [goldGrade, setGoldGrade] = useState("GOLD 2: Moderado (50% <= VEF1 < 80% del teórico)");
  const [goldGroup, setGoldGroup] = useState("Grupo B (Sintomático, Bajo Riesgo Exacerbador)");
  const [exacerbaciones, setExacerbaciones] = useState(1);

  // mMRC / CAT / PaO2-FiO2 State
  const [mmrc, setMmrc] = useState(2);
  const [catScore, setCatScore] = useState(18);
  const [kirbyIndex, setKirbyIndex] = useState(320.0);

  useEffect(() => {
    if (dbSpir) {
      setVef1Pre(dbSpir.vef1PreLiters);
      setCvfPre(dbSpir.cvfPreLiters);
      setVef1CvfRatio(dbSpir.vef1CvfRatioPercent);
      if (dbSpir.vef1PostLiters) setVef1Post(dbSpir.vef1PostLiters);
      if (dbSpir.respuestaBroncodilatadoraMl) setDeltaMl(dbSpir.respuestaBroncodilatadoraMl);
      if (dbSpir.respuestaBroncodilatadoraPercent) setDeltaPercent(dbSpir.respuestaBroncodilatadoraPercent);
      setInterpSpir(dbSpir.interpretacionEspirometrica);
    }
  }, [dbSpir]);

  useEffect(() => {
    if (dbGinaGold) {
      if (dbGinaGold.clasificacionGinaAsma) setGina(dbGinaGold.clasificacionGinaAsma);
      if (dbGinaGold.goldGradeEpoc) setGoldGrade(dbGinaGold.goldGradeEpoc);
      if (dbGinaGold.goldGroupEpoc) setGoldGroup(dbGinaGold.goldGroupEpoc);
      if (dbGinaGold.exacerabacionesUltimoAno !== null) setExacerbaciones(dbGinaGold.exacerabacionesUltimoAno);
    }
  }, [dbGinaGold]);

  useEffect(() => {
    if (dbDyspnea) {
      setMmrc(dbDyspnea.mmrcDyspneaGrade);
      setCatScore(dbDyspnea.catScoreTotal);
      if (dbDyspnea.pao2Fio2KirbyIndex !== null) setKirbyIndex(dbDyspnea.pao2Fio2KirbyIndex);
    }
  }, [dbDyspnea]);

  const handleSaveSpir = () => {
    saveSpirMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      vef1PreLiters: vef1Pre,
      cvfPreLiters: cvfPre,
      vef1CvfRatioPercent: vef1CvfRatio,
      vef1PostLiters: vef1Post,
      respuestaBroncodilatadoraMl: deltaMl,
      respuestaBroncodilatadoraPercent: deltaPercent,
      interpretacionEspirometrica: interpSpir,
    });
  };

  const handleSaveGinaGold = () => {
    saveGinaGoldMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      clasificacionGinaAsma: gina,
      goldGradeEpoc: goldGrade,
      goldGroupEpoc: goldGroup,
      exacerabacionesUltimoAno: exacerbaciones,
    });
  };

  const handleSaveDyspnea = () => {
    saveDyspneaMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      mmrcDyspneaGrade: mmrc,
      catScoreTotal: catScore,
      pao2Fio2KirbyIndex: kirbyIndex,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Neumonología & Función Pulmonar</h3>
            <p className="text-xs text-slate-400">Espirometría (VEF1/CVF/BD), Guías Asma GINA & EPOC GOLD, Escala mMRC / CAT</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("ESPIROMETRIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ESPIROMETRIA"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Espirometría & Prueba BD
        </button>

        <button
          onClick={() => setActiveTab("GINA_GOLD")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "GINA_GOLD"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Asma GINA & EPOC GOLD
        </button>

        <button
          onClick={() => setActiveTab("DISNEA_CAT")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DISNEA_CAT"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> mMRC Disnea, CAT & PaO2/FiO2
        </button>
      </div>

      {/* Tab 1: Espirometría Completa */}
      {activeTab === "ESPIROMETRIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Panel de Espirometría Completa & Reversibilidad Post-BD
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Parámetros espirométricos Pre y Post Broncodilatador con Salbutamol.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveSpir}
              disabled={saveSpirMut.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs disabled:opacity-50"
            >
              {saveSpirMut.isPending ? "Guardando..." : "Guardar Espirometría"}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">VEF1 Pre-BD (Litros)</label>
              <input
                type="number"
                step="0.01"
                value={vef1Pre}
                onChange={(e) => setVef1Pre(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">CVF Pre-BD (Litros)</label>
              <input
                type="number"
                step="0.01"
                value={cvfPre}
                onChange={(e) => setCvfPre(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Relación VEF1 / CVF (%)</label>
              <input
                type="number"
                step="0.1"
                value={vef1CvfRatio}
                onChange={(e) => setVef1CvfRatio(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">VEF1 Post-BD (Litros)</label>
              <input
                type="number"
                step="0.01"
                value={vef1Post}
                onChange={(e) => setVef1Post(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Respuesta Post-BD ΔVEF1 (mL)</label>
              <input
                type="number"
                value={deltaMl}
                onChange={(e) => setDeltaMl(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Respuesta Post-BD ΔVEF1 (%)</label>
              <input
                type="number"
                step="0.1"
                value={deltaPercent}
                onChange={(e) => setDeltaPercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Interpretación Diagnóstica Espirométrica</label>
              <input
                type="text"
                value={interpSpir}
                onChange={(e) => setInterpSpir(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GINA / GOLD */}
      {activeTab === "GINA_GOLD" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Clasificación Guías Internacionales Asma GINA & EPOC GOLD
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estadificación por severidad, grupos de riesgo y escalonamiento terapéutico.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveGinaGold}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs"
            >
              Guardar GINA / GOLD
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Clasificación & Escescalonamiento Asma GINA (Pasos 1-5)</label>
              <select
                value={gina}
                onChange={(e) => setGina(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {GINA_STEPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grado EPOC GOLD (Obstrucción al Flujo Aéreo)</label>
              <select
                value={goldGrade}
                onChange={(e) => setGoldGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {GOLD_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grupo EPOC GOLD (A, B, E por Síntomas/Riesgo)</label>
              <input
                type="text"
                value={goldGroup}
                onChange={(e) => setGoldGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Exacerbaciones / Crisis en el Último Año</label>
              <input
                type="number"
                min="0"
                value={exacerbaciones}
                onChange={(e) => setExacerbaciones(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: mMRC, CAT & PaO2/FiO2 */}
      {activeTab === "DISNEA_CAT" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Escala de Disnea mMRC, Test CAT & PaO2/FiO2 (Kirby)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Evaluación sintomática de disnea, calidad de vida y oxigenación.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveDyspnea}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs"
            >
              Guardar Disnea & CAT
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Escala de Disnea Modificada del MRC (mMRC 0 a 4)</label>
              <select
                value={mmrc}
                onChange={(e) => setMmrc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {MMRC_GRADES.map((desc, idx) => (
                  <option key={idx} value={idx}>{desc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Test CAT - Cuestionario de Evaluación EPOC (0 a 40 pts)</label>
              <input
                type="number"
                min="0"
                max="40"
                value={catScore}
                onChange={(e) => setCatScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Índice de Kirby PaO2 / FiO2 (mmHg)</label>
              <input
                type="number"
                step="0.1"
                value={kirbyIndex}
                onChange={(e) => setKirbyIndex(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PACS Native DICOM Viewer with Inversion */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Wind className="w-4 h-4" /> Visor DICOM PACS: Radiografía de Tórax & TAC (Inversión de Color)
        </h4>
        <DicomViewer patientRegistrationId={effectivePatId} encounterId={encounterId} enableColorInvert={true} />
      </div>
    </div>
  );
}
