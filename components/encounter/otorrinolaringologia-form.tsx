"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Ear,
  Wind,
  Mic,
  Activity,
  CheckCircle2,
  Stethoscope,
  Volume2,
  FileText,
  ShieldAlert,
} from "lucide-react";

interface Props {
  encounterId: string;
  disabled?: boolean;
  initialData?: any;
}

const SINTOMAS_OTOLOGICOS = [
  "Otalgia Derecha",
  "Otalgia Izquierda",
  "Otorrea",
  "Otorragia",
  "Hipoacusia Progresiva",
  "Hipoacusia Súbita",
  "Acúfenos / Tinnitus",
  "Plenitud Ótica",
  "Vértigo Rotatorio",
  "Mareo e Inestabilidad",
];

const SINTOMAS_RINOLOGICOS = [
  "Obstrucción Nasal Derecha",
  "Obstrucción Nasal Izquierda",
  "Obstrucción Bilateral",
  "Rinorrea Hialina",
  "Rinorrea Mucopurulenta",
  "Epistaxis",
  "Anosmia / Hiposmia",
  "Prurito Nasal",
  "Estornudos en Salva",
  "Dolor Sinusal / Facial",
];

const SINTOMAS_LARINGOLOGICOS = [
  "Disfonía / Ronquera",
  "Afonía",
  "Odinofagia",
  "Disfagia",
  "Globus Faríngeo",
  "Roncopatía Nocturna",
  "Pausas Apneicas (SAOS)",
  "Tos Crónica",
  "Carraspera Frecuente",
];

const PROCEDIMIENTOS_ORL = [
  "Lavado Ótico / Extracción Cerumen OD",
  "Lavado Ótico / Extracción Cerumen OI",
  "Extracción de Cuerpo Extraño (Ótico/Nasal)",
  "Nasofibrolaringoscopia Flexible",
  "Cauterización de Epistaxis",
  "Taponamiento Nasal Anterior",
  "Aspiración y Limpieza Micro-Ótica",
  "Cureta / Aspiración Sinusal",
];

export function OtorrinolaringologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [activeTab, setActiveTab] = useState<"OTOLOGIA" | "RINOLOGIA" | "LARINGOLOGIA" | "PROCEDIMIENTOS">("OTOLOGIA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  const [data, setData] = useState({
    // Otología
    sintomasOtologicos: initialData.sintomasOtologicos || [],
    otoscopiaOD: initialData.otoscopiaOD || "Íntegra, triángulo luminoso conservado, CAE libre",
    otoscopiaOI: initialData.otoscopiaOI || "Íntegra, triángulo luminoso conservado, CAE libre",
    weberTest: initialData.weberTest || "Centrado",
    rinneOD: initialData.rinneOD || "Positivo (+)",
    rinneOI: initialData.rinneOI || "Positivo (+)",
    hipoacusiaTipoOD: initialData.hipoacusiaTipoOD || "Normal",
    hipoacusiaTipoOI: initialData.hipoacusiaTipoOI || "Normal",
    timpanometria: initialData.timpanometria || "Tipo A (Normal)",

    // Rinología
    sintomasRinologicos: initialData.sintomasRinologicos || [],
    tabiqueNasal: initialData.tabiqueNasal || "Centrado",
    cornetes: initialData.cornetes || "Tróficos y normocoloreados",
    secrecionNasal: initialData.secrecionNasal || "Ausente",
    poliposMasas: initialData.poliposMasas || "Sin lesiones ni pólipos visibles",

    // Laringología
    sintomasLaringologicos: initialData.sintomasLaringologicos || [],
    brodskyAmigdalas: initialData.brodskyAmigdalas || "Grado I (< 25%)",
    mallampatiScore: initialData.mallampatiScore || "Clase I",
    paredFaringea: initialData.paredFaringea || "Normocoloreada, sin exudados",
    cuerdasVocales: initialData.cuerdasVocales || "Movilidad bilateral conservada, bordes libres",

    // Procedimientos y Notas
    procedimientosRealizados: initialData.procedimientosRealizados || [],
    observacionesORL: initialData.observacionesORL || "",
  });

  const isDirty = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData);
  }, [data, initialData]);

  useEffect(() => {
    setDirty("otorrinolaringologia", isDirty);
  }, [isDirty, setDirty]);

  const utils = trpc.useUtils();
  const saveMutation = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSave() {
    saveMutation.mutate({
      id: encounterId,
      datosEspecialidad: data,
    });
  }

  const toggleArrayItem = (key: "sintomasOtologicos" | "sintomasRinologicos" | "sintomasLaringologicos" | "procedimientosRealizados", item: string) => {
    setData((prev) => {
      const arr = prev[key] as string[];
      const exists = arr.includes(item);
      return {
        ...prev,
        [key]: exists ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Ear className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Otorrinolaringología (ORL)</h3>
            <p className="text-xs text-slate-400">Otología, Rinología, Laringología y Procedimientos Especializados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled || saveMutation.isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
          >
            {saveMutation.isLoading ? "Guardando..." : "Guardar Ficha ORL"}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("OTOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "OTOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Ear className="w-3.5 h-3.5" /> Otología (Oídos)
        </button>

        <button
          onClick={() => setActiveTab("RINOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "RINOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> Rinología (Nariz)
        </button>

        <button
          onClick={() => setActiveTab("LARINGOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "LARINGOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> Laringología (Garganta/Voz)
        </button>

        <button
          onClick={() => setActiveTab("PROCEDIMIENTOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PROCEDIMIENTOS"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" /> Procedimientos & Notas
        </button>
      </div>

      {/* Tab 1: Otología */}
      {activeTab === "OTOLOGIA" && (
        <div className="space-y-5 pt-2">
          {/* Symptoms chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Sintomatología Otológica
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_OTOLOGICOS.map((sintoma) => {
                const active = data.sintomasOtologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasOtologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Otoscopia Bilateral */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Otoscopia Oído Derecho (OD)
              </label>
              <textarea
                value={data.otoscopiaOD}
                onChange={(e) => setData({ ...data, otoscopiaOD: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Conducto Auditivo Externo (CAE), Membrana Timpánica, Triángulo luminoso..."
              />
              <div className="flex flex-wrap gap-1">
                {["Íntegra", "Abombada", "Retraída", "Perforada", "Cerumen Impactado"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setData({ ...data, otoscopiaOD: `${data.otoscopiaOD}, ${preset}` })}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Otoscopia Oído Izquierdo (OI)
              </label>
              <textarea
                value={data.otoscopiaOI}
                onChange={(e) => setData({ ...data, otoscopiaOI: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Conducto Auditivo Externo (CAE), Membrana Timpánica, Triángulo luminoso..."
              />
              <div className="flex flex-wrap gap-1">
                {["Íntegra", "Abombada", "Retraída", "Perforada", "Cerumen Impactado"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setData({ ...data, otoscopiaOI: `${data.otoscopiaOI}, ${preset}` })}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Acumetría & Audiometría Sintética */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" /> Acumetría por Diapasón & Timpanometría
            </h4>

            <div className="grid md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Test de Weber (512 Hz)</label>
                <select
                  value={data.weberTest}
                  onChange={(e) => setData({ ...data, weberTest: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Centrado">Centrado (Sin lateralización)</option>
                  <option value="Lateralizado a OD">Lateralizado a OD</option>
                  <option value="Lateralizado a OI">Lateralizado a OI</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Test de Rinne OD</label>
                <select
                  value={data.rinneOD}
                  onChange={(e) => setData({ ...data, rinneOD: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Positivo (+)">Positivo (+) (Normal / Neurosensorial)</option>
                  <option value="Negativo (-)">Negativo (-) (Conductiva)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Test de Rinne OI</label>
                <select
                  value={data.rinneOI}
                  onChange={(e) => setData({ ...data, rinneOI: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Positivo (+)">Positivo (+) (Normal / Neurosensorial)</option>
                  <option value="Negativo (-)">Negativo (-) (Conductiva)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Hipoacusia OD</label>
                <select
                  value={data.hipoacusiaTipoOD}
                  onChange={(e) => setData({ ...data, hipoacusiaTipoOD: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Normal">Normal</option>
                  <option value="Conductiva Leve">Conductiva Leve</option>
                  <option value="Conductiva Moderada">Conductiva Moderada</option>
                  <option value="Neurosensorial Leve">Neurosensorial Leve</option>
                  <option value="Neurosensorial Severa">Neurosensorial Severa</option>
                  <option value="Mixta">Mixta</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Hipoacusia OI</label>
                <select
                  value={data.hipoacusiaTipoOI}
                  onChange={(e) => setData({ ...data, hipoacusiaTipoOI: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Normal">Normal</option>
                  <option value="Conductiva Leve">Conductiva Leve</option>
                  <option value="Conductiva Moderada">Conductiva Moderada</option>
                  <option value="Neurosensorial Leve">Neurosensorial Leve</option>
                  <option value="Neurosensorial Severa">Neurosensorial Severa</option>
                  <option value="Mixta">Mixta</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Timpanometría</label>
                <select
                  value={data.timpanometria}
                  onChange={(e) => setData({ ...data, timpanometria: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5"
                >
                  <option value="Tipo A (Normal)">Tipo A (Compliance Normal)</option>
                  <option value="Tipo B (Efusio/Líquido)">Tipo B (Curva Plana / Efusión)</option>
                  <option value="Tipo C (Disfunción Tubárica)">Tipo C (Presión Negativa / Trompa)</option>
                  <option value="Tipo As (Rigidez)">Tipo As (Otoesclerosis / Otosclerosis)</option>
                  <option value="Tipo Ad (Hipermóvil)">Tipo Ad (Disyunción de cadena)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rinología */}
      {activeTab === "RINOLOGIA" && (
        <div className="space-y-5 pt-2">
          {/* Symptoms chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5" /> Sintomatología Rinológica
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_RINOLOGICOS.map((sintoma) => {
                const active = data.sintomasRinologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasRinologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rinoscopia & Endoscopia Nasal */}
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Tabique Nasal (Septum)
              </label>
              <select
                value={data.tabiqueNasal}
                onChange={(e) => setData({ ...data, tabiqueNasal: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Centrado">Centrado sin espolones</option>
                <option value="Desviación Izquierda">Desviación Septal Izquierda</option>
                <option value="Desviación Derecha">Desviación Septal Derecha</option>
                <option value="Desviación en S">Desviación Septal en "S" (Bilateral)</option>
                <option value="Espolón Septal">Espolón Septal relevante</option>
                <option value="Perforación Septal">Perforación Septal</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Estado de Cornetes Nasales
              </label>
              <select
                value={data.cornetes}
                onChange={(e) => setData({ ...data, cornetes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Tróficos y normocoloreados">Tróficos y normocoloreados</option>
                <option value="Hipertróficos Moderados">Hipertróficos Moderados</option>
                <option value="Hipertrofia Severa / Oclusivos">Hipertrofia Severa / Oclusivos</option>
                <option value="Pálidos y Edematosos (Rinitis Alérgica)">Pálidos y Edematosos (Rinitis Alérgica)</option>
                <option value="Violáceos / Congestivos">Violáceos / Congestivos</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Secreción Nasal / Meatos
              </label>
              <select
                value={data.secrecionNasal}
                onChange={(e) => setData({ ...data, secrecionNasal: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Ausente">Ausente / Fosas secas</option>
                <option value="Hialina Anterior">Hialina Anterior</option>
                <option value="Mucopurulenta en Meato Medio">Mucopurulenta en Meato Medio (Sinusitis)</option>
                <option value="Hemática / Costrosa">Hemática / Costrosa</option>
                <option value="Descarga Posterior">Descarga Posterior Frecuente</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Pólipos o Masas Sinusales
              </label>
              <input
                type="text"
                value={data.poliposMasas}
                onChange={(e) => setData({ ...data, poliposMasas: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                placeholder="Sin pólipos / Pólipo Grado II Meato Medio..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Laringología & Vía Aérea */}
      {activeTab === "LARINGOLOGIA" && (
        <div className="space-y-5 pt-2">
          {/* Symptoms chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Sintomatología Laringológica & Faringe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_LARINGOLOGICOS.map((sintoma) => {
                const active = data.sintomasLaringologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasLaringologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Escalas & Exploración Orofaringea */}
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-amber-400 uppercase tracking-wider">
                Grado Amigdalino (Clasificación de Brodsky)
              </label>
              <select
                value={data.brodskyAmigdalas}
                onChange={(e) => setData({ ...data, brodskyAmigdalas: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Grado 0 (Amigdalectomizado)">Grado 0 (Amigdalectomizado)</option>
                <option value="Grado I (< 25%)">{"Grado I (< 25% del pilar amigdalino)"}</option>
                <option value="Grado II (25-50%)">Grado II (25% a 50% de la orofaringe)</option>
                <option value="Grado III (50-75%)">Grado III (50% a 75% de la orofaringe)</option>
                <option value="Grado IV (> 75%)">{"Grado IV (> 75% / Amígdalas besándose)"}</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-amber-400 uppercase tracking-wider">
                Escala de Mallampati (Vía Aérea / Roncopatía)
              </label>
              <select
                value={data.mallampatiScore}
                onChange={(e) => setData({ ...data, mallampatiScore: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Clase I">Clase I (Visibilidad total de paladar blando, úvula, pilares)</option>
                <option value="Clase II">Clase II (Visibilidad de paladar blando, úvula y fauces)</option>
                <option value="Clase III">Clase III (Visibilidad de paladar blando y base de úvula)</option>
                <option value="Clase IV">Clase IV (Solo paladar duro visible)</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Pared Faríngea Posterior
              </label>
              <input
                type="text"
                value={data.paredFaringea}
                onChange={(e) => setData({ ...data, paredFaringea: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                placeholder="Normocoloreada / Granulosa (Faringitis Crónica) / Exudado..."
              />
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="font-semibold text-blue-400 uppercase tracking-wider">
                Nasofibrolaringoscopia / Cuerdas Vocales
              </label>
              <input
                type="text"
                value={data.cuerdasVocales}
                onChange={(e) => setData({ ...data, cuerdasVocales: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                placeholder="Movilidad bilateral conservada, nódulos en tercio anterior..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Procedimientos & Notas */}
      {activeTab === "PROCEDIMIENTOS" && (
        <div className="space-y-5 pt-2">
          {/* Procedures checklist */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Procedimientos ORL Realizados en Esta Consulta
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {PROCEDIMIENTOS_ORL.map((proc) => {
                const active = data.procedimientosRealizados.includes(proc);
                return (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => toggleArrayItem("procedimientosRealizados", proc)}
                    className={`text-xs p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{proc}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Observaciones y Plan ORL Especializado
            </label>
            <textarea
              value={data.observacionesORL}
              onChange={(e) => setData({ ...data, observacionesORL: e.target.value })}
              rows={3}
              className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Indicaciones de irrigaciones nasales, tratamiento corticoideo, estudios audiométricos indicados..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
