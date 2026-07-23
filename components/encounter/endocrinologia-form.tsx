"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  Flame,
  Percent,
  ShieldAlert,
  Award,
  Calendar,
  Calculator,
  LineChart,
  Plus,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const TIRADS_OPTIONS = [
  "TI-RADS 1 (Benigno / Glándula Normal)",
  "TI-RADS 2 (No Sospechoso / Benigno)",
  "TI-RADS 3 (Levemente Sospechoso - BAFN si >= 2.5cm)",
  "TI-RADS 4 (Moderadamente Sospechoso - BAFN si >= 1.5cm)",
  "TI-RADS 5 (Altamente Sugestivo de Malignidad - BAFN si >= 1.0cm)",
];

const BETHESDA_THYROID_OPTIONS = [
  "Bethesda I (No Diagnóstica / Insatisfecha)",
  "Bethesda II (Benigno - Riesgo Malignidad 0-3%)",
  "Bethesda III (Atipia de Significado Incierto - AUS/FLUS)",
  "Bethesda IV (Neoplasia Folicular / Sospecha de N. Folicular)",
  "Bethesda V (Sospechoso de Malignidad)",
  "Bethesda VI (Maligno - Carcinoma Papilar/Folicular)",
];

export function EndocrinologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"GLUCEMICO" | "INSULINA" | "TIROIDES" | "FOOT">("GLUCEMICO");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbGlycemic = [], refetch: refetchGlycemic } = (trpc.endo.listGlycemicLogs.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbInsulin, refetch: refetchInsulin } = (trpc.endo.getInsulinTitration.useQuery as any)({ encounterId });
  const { data: dbNodules = [], refetch: refetchNodules } = (trpc.endo.listThyroidNodules.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveGlycemicMut = (trpc.endo.saveGlycemicLog.useMutation as any)({ onSuccess: () => refetchGlycemic() });
  const calcInsulinMut = (trpc.endo.calculateAndSaveInsulin.useMutation as any)({ onSuccess: () => refetchInsulin() });
  const saveNoduleMut = (trpc.endo.saveThyroidNodule.useMutation as any)({ onSuccess: () => refetchNodules() });

  // Glycemic State
  const [hba1cVal, setHba1cVal] = useState(6.8);
  const [glucAyunas, setGlucAyunas] = useState(108);
  const [glucPost, setGlucPost] = useState(138);
  const [glyObs, setGlyObs] = useState("Meta de control glucémico lograda (HbA1c < 7.0%).");

  // Insulin Titration State
  const [pesoKg, setPesoKg] = useState(70.0);
  const [uPerKg, setUPerKg] = useState(0.4);
  const [ratioCarb, setRatioCarb] = useState(15);
  const [factorSens, setFactorSens] = useState(50);

  // Thyroid Nodule State
  const [localizacion, setLocalizacion] = useState("Lóbulo Derecho (Tercio Medio)");
  const [diametroMm, setDiametroMm] = useState(14.5);
  const [composicion, setComposicion] = useState("Sólido");
  const [ecogenicidad, setEcogenicidad] = useState("Hipoecoico");
  const [margenes, setMargenes] = useState("Lisos");
  const [focos, setFocos] = useState("Microcalcificaciones punteadas");
  const [tiRads, setTiRads] = useState("TI-RADS 4 (Moderadamente Sospechoso)");
  const [bethesdaTiroides, setBethesdaTiroides] = useState("Bethesda II (Benigno - Riesgo Malignidad 0-3%)");

  useEffect(() => {
    if (dbInsulin) {
      if (dbInsulin.pesoKg) setPesoKg(dbInsulin.pesoKg);
      if (dbInsulin.ratioCarbohidratos) setRatioCarb(dbInsulin.ratioCarbohidratos);
      if (dbInsulin.factorSensibilidad) setFactorSens(dbInsulin.factorSensibilidad);
    }
  }, [dbInsulin]);

  const handleAddGlycemic = () => {
    saveGlycemicMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      hba1cPorcentaje: hba1cVal,
      glucemiaAyunasMgDl: glucAyunas,
      glucemiaPostprandialMgDl: glucPost,
      observaciones: glyObs,
    });
  };

  const handleCalculateInsulin = () => {
    calcInsulinMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      pesoKg,
      uPerKg,
      ratioCarbohidratos: ratioCarb,
      factorSensibilidad: factorSens,
    });
  };

  const handleAddNodule = () => {
    saveNoduleMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      localizacion,
      diametroMayorMm: diametroMm,
      composicion,
      ecogenicidad,
      margenes,
      focosEcogenicos: focos,
      tiRadsCategory: tiRads,
      bafnBethesdaCategory: bethesdaTiroides,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Endocrinología</h3>
            <p className="text-xs text-slate-400">Perfil Glucémico / HbA1c, Titulación Basal-Bolus & Nódulos Tiroideos (TI-RADS)</p>
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
          onClick={() => setActiveTab("GLUCEMICO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "GLUCEMICO"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <LineChart className="w-3.5 h-3.5" /> Perfil Glucémico / HbA1c ({dbGlycemic.length})
        </button>

        <button
          onClick={() => setActiveTab("INSULINA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "INSULINA"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Titulación Insulina Basal-Bolus
        </button>

        <button
          onClick={() => setActiveTab("TIROIDES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "TIROIDES"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Ecografía Tiroides & TI-RADS ({dbNodules.length})
        </button>
      </div>

      {/* Tab 1: Perfil Glucémico & HbA1c */}
      {activeTab === "GLUCEMICO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <LineChart className="w-4 h-4" /> Historial de HbA1c (%) & Perfil Glucémico Capilar
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Seguimiento comparativo de Hemoglobina Glicosilada y automonitoreo.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddGlycemic}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Control Glucémico
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">HbA1c (%):</label>
              <input
                type="number"
                step="0.1"
                value={hba1cVal}
                onChange={(e) => setHba1cVal(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded p-1.5 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400">Glucemia Ayunas (mg/dL):</label>
              <input
                type="number"
                value={glucAyunas}
                onChange={(e) => setGlucAyunas(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-400">Glucemia Postprandial (mg/dL):</label>
              <input
                type="number"
                value={glucPost}
                onChange={(e) => setGlucPost(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1 text-sm"
              />
            </div>
          </div>

          {/* Tabla Histórica */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">HbA1c (%)</th>
                  <th className="px-3 py-2">Ayunas (mg/dL)</th>
                  <th className="px-3 py-2">Postprandial (mg/dL)</th>
                  <th className="px-3 py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbGlycemic.map((g: any) => (
                  <tr key={g.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {new Date(g.createdAt).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-emerald-400">{g.hba1cPorcentaje ? `${g.hba1cPorcentaje} %` : "-"}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{g.glucemiaAyunasMgDl ? `${g.glucemiaAyunasMgDl} mg/dL` : "-"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{g.glucemiaPostprandialMgDl ? `${g.glucemiaPostprandialMgDl} mg/dL` : "-"}</td>
                    <td className="px-3 py-2.5 text-slate-400">{g.observaciones || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Titulación de Insulina */}
      {activeTab === "INSULINA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de Régimen Basal-Bolus de Insulina
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Distribución 50% Insulina Basal (Glargina/Degludec) y 50% Bolos Prandiales (Lispro/Aspart).</p>
            </div>
            <Button
              size="sm"
              onClick={handleCalculateInsulin}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Calcular & Guardar Dosis
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Peso Paciente (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Dosis (UI/kg/día):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={uPerKg}
                    onChange={(e) => setUPerKg(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded p-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-slate-400">Ratio Carbohidratos (g/UI):</label>
                  <input
                    type="number"
                    value={ratioCarb}
                    onChange={(e) => setRatioCarb(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Factor Sensibilidad (mg/dL/UI):</label>
                  <input
                    type="number"
                    value={factorSens}
                    onChange={(e) => setFactorSens(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Resultado Esquema */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-xs">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300 block text-center">Esquema Recomendado:</span>

              <div className="flex justify-around items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px]">Dosis Total Diaria:</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{(pesoKg * uPerKg).toFixed(1)} UI</span>
                </div>

                <div className="text-center border-l border-slate-800 pl-4">
                  <span className="text-slate-400 block text-[10px]">Insulina Basal (50%):</span>
                  <span className="text-xl font-bold text-blue-400">{((pesoKg * uPerKg) * 0.5).toFixed(1)} UI</span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">Bolos Ultrarrápidos antes de comidas (Desayuno / Almuerzo / Cena):</span>
                <span className="text-white font-bold block text-center">
                  {(((pesoKg * uPerKg) * 0.5) / 3).toFixed(1)} UI cada comida
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Nódulos Tiroideos */}
      {activeTab === "TIROIDES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Ecografía de Tiroides & Estratificación TI-RADS / Bethesda
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Clasificación de riesgo de malignidad nodular y biopsia PAAF.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddNodule}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Registrar Nódulo Tiroideo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {/* TI-RADS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-amber-400">🩺 Criterios EU-TIRADS / ACR TI-RADS</h5>
              <select
                value={tiRads}
                onChange={(e) => setTiRads(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {TIRADS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Bethesda Tiroideo */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-blue-400">🔬 Biopsia PAAF (Sistema Bethesda Tiroideo)</h5>
              <select
                value={bethesdaTiroides}
                onChange={(e) => setBethesdaTiroides(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {BETHESDA_THYROID_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
