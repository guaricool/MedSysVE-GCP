"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Calculator,
  Droplets,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  HeartPulse,
  Syringe,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const ACCESS_TYPES = [
  "FAV Autóloga (Radiocefálica / Braquiocefálica)",
  "FAV Protésica PTF (Injerto sintético)",
  "Catéter Venoso Central Tunelizado (Permcath)",
  "Catéter Venoso Central Temporal (Mahurkar)",
];

const ACCESS_LOCATIONS = [
  "Antebrazo Izquierdo (Brazo no dominante)",
  "Antebrazo Derecho",
  "Pliegue del Codo Izquierdo",
  "Pliegue del Codo Derecho",
  "Vena Yugular Interna Derecha",
  "Vena Yugular Interna Izquierda",
  "Vena Femoral Derecha/Izquierda",
];

const ACCESS_STATUSES = [
  "Normofuncionante (Soplo audible y Trill palpable)",
  "Estenosis con disfunción de flujo (Qb < 250 mL/min)",
  "Trombosado / Sin flujo miccional",
  "Infección de orificio de salida / Bacteriemia por catéter",
];

export function NefrologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"EGFR" | "DIALISIS" | "ACCESOS">("EGFR");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbEgfr, refetch: refetchEgfr } = (trpc.nephro.getEgfrCalculator.useQuery as any)({ encounterId });
  const { data: dbDialysis, refetch: refetchDialysis } = (trpc.nephro.getDialysisSession.useQuery as any)({ encounterId });
  const { data: dbAccesses = [], refetch: refetchAccesses } = (trpc.nephro.listVascularAccesses.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveEgfrMut = (trpc.nephro.saveEgfrCalculator.useMutation as any)({ onSuccess: () => refetchEgfr() });
  const saveDialysisMut = (trpc.nephro.saveDialysisSession.useMutation as any)({ onSuccess: () => refetchDialysis() });
  const saveAccessMut = (trpc.nephro.saveVascularAccess.useMutation as any)({ onSuccess: () => refetchAccesses() });

  // eGFR Calculator State
  const [creat, setCreat] = useState(2.4);
  const [edad, setEdad] = useState(62);
  const [sexo, setSexo] = useState<"M" | "F">("M");

  const ckdEpi2021 = useMemo(() => {
    if (creat <= 0 || edad <= 0) return 0;
    const kappa = sexo === "F" ? 0.7 : 0.9;
    const alpha = sexo === "F" ? -0.241 : -0.302;
    const sexFactor = sexo === "F" ? 1.012 : 1.0;

    const minRatio = Math.min(creat / kappa, 1);
    const maxRatio = Math.max(creat / kappa, 1);

    const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.2) * Math.pow(0.9938, edad) * sexFactor;
    return Number(egfr.toFixed(1));
  }, [creat, edad, sexo]);

  const ckdStage = useMemo(() => {
    if (ckdEpi2021 >= 90) return "Estadio G1: Normal o Elevado (TFG >= 90 mL/min/1.73m²)";
    if (ckdEpi2021 >= 60) return "Estadio G2: Ligeramente Disminuido (TFG 60-89 mL/min/1.73m²)";
    if (ckdEpi2021 >= 45) return "Estadio G3a: Ligeramente a Moderadamente Disminuido (TFG 45-59)";
    if (ckdEpi2021 >= 30) return "Estadio G3b: Moderadamente a Severamente Disminuido (TFG 30-44)";
    if (ckdEpi2021 >= 15) return "Estadio G4: Severamente Disminuido (TFG 15-29 mL/min/1.73m²)";
    return "Estadio G5: Falla Renal / ERC Terminal (TFG < 15 mL/min/1.73m²)";
  }, [ckdEpi2021]);

  // Dialysis Session State
  const [pesoPre, setPesoPre] = useState(74.5);
  const [pesoPost, setPesoPost] = useState(71.8);
  const [pesoSeco, setPesoSeco] = useState(71.5);
  const [qb, setQb] = useState(350);
  const [qd, setQd] = useState(500);
  const [filtro, setFiltro] = useState("Fresenius FX80 High-Flux");
  const [heparina, setHeparina] = useState("Heparina Sódica en bolo 2,500 UI + Mantenimiento 1,000 UI/h");

  const ufLiters = useMemo(() => {
    return Number(Math.max(0, pesoPre - pesoPost).toFixed(2));
  }, [pesoPre, pesoPost]);

  // Vascular Access State
  const [tipoAcceso, setTipoAcceso] = useState("FAV Autóloga (Radiocefálica / Braquiocefálica)");
  const [locAcceso, setLocAcceso] = useState("Antebrazo Izquierdo (Brazo no dominante)");
  const [estadoAcceso, setEstadoAcceso] = useState("Normofuncionante (Soplo audible y Trill palpable)");

  useEffect(() => {
    if (dbEgfr) {
      setCreat(dbEgfr.creatininaSerica);
      setEdad(dbEgfr.edadAnos);
      setSexo(dbEgfr.sexo as "M" | "F");
    }
  }, [dbEgfr]);

  useEffect(() => {
    if (dbDialysis) {
      setPesoPre(dbDialysis.pesoPreDialisisKg);
      setPesoPost(dbDialysis.pesoPostDialisisKg);
      setPesoSeco(dbDialysis.pesoSecoObjetivoKg);
      setQb(dbDialysis.flujoSangreQbMlMin);
      setQd(dbDialysis.flujoDializadoQdMlMin);
      if (dbDialysis.filtroDializador) setFiltro(dbDialysis.filtroDializador);
      if (dbDialysis.anticoagulacionHeparina) setHeparina(dbDialysis.anticoagulacionHeparina);
    }
  }, [dbDialysis]);

  const handleSaveEgfr = () => {
    saveEgfrMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      creatininaSerica: creat,
      edadAnos: edad,
      sexo,
      ckdEpi2021Result: ckdEpi2021,
      estadioCkd: ckdStage,
    });
  };

  const handleSaveDialysis = () => {
    saveDialysisMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      pesoPreDialisisKg: pesoPre,
      pesoPostDialisisKg: pesoPost,
      pesoSecoObjetivoKg: pesoSeco,
      ultrafiltracionUfLiters: ufLiters,
      flujoSangreQbMlMin: qb,
      flujoDializadoQdMlMin: qd,
      filtroDializador: filtro,
      anticoagulacionHeparina: heparina,
    });
  };

  const handleAddAccess = () => {
    saveAccessMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tipoAcceso,
      localizacionAnatomica: locAcceso,
      estadoAcceso,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Nefrología & Terapia de Reemplazo Renal</h3>
            <p className="text-xs text-slate-400">Calculadora TFG CKD-EPI (2021), Hemodiálisis / Curva de Peso Seco & Accesos Vasculares</p>
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
          onClick={() => setActiveTab("EGFR")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "EGFR"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadora TFG (CKD-EPI)
        </button>

        <button
          onClick={() => setActiveTab("DIALISIS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DIALISIS"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" /> Sesión Hemodiálisis & Peso Seco
        </button>

        <button
          onClick={() => setActiveTab("ACCESOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ACCESOS"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Syringe className="w-3.5 h-3.5" /> Accesos Vasculares ({dbAccesses.length})
        </button>
      </div>

      {/* Tab 1: Calculadora TFG CKD-EPI */}
      {activeTab === "EGFR" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de Tasa de Filtración Glomerular CKD-EPI (2021 Semirracial)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estimación automatizada de TFG y clasificación de estadio de Enfermedad Renal Crónica.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveEgfr}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
            >
              Guardar TFG
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Creatinina Sérica (mg/dL)</label>
              <input
                type="number"
                step="0.01"
                value={creat}
                onChange={(e) => setCreat(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Edad del Paciente (Años)</label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 text-sm font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Sexo Biológico</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as "M" | "F")}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              >
                <option value="M">Masculino (M)</option>
                <option value="F">Femenino (F)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-sky-500/30 space-y-1 md:col-span-1">
              <span className="text-xs text-slate-400 font-semibold block uppercase">TFG Estimada CKD-EPI</span>
              <span className="text-2xl font-bold text-sky-300">{ckdEpi2021} mL/min/1.73m²</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 md:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Estadificación KDIGO de ERC</span>
                <span className="text-xs font-bold text-amber-300">{ckdStage}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sesión Hemodiálisis & Peso Seco */}
      {activeTab === "DIALISIS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4" /> Parámetros de Sesión de Hemodiálisis & Curva de Peso Seco
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Control de peso pre/post dialítico, ultrafiltración lograda e insumos de la unidad.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveDialysis}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs"
            >
              Guardar Hemodiálisis
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Peso Pre-Dialítico (Kg)</label>
              <input
                type="number"
                step="0.1"
                value={pesoPre}
                onChange={(e) => setPesoPre(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Peso Post-Dialítico (Kg)</label>
              <input
                type="number"
                step="0.1"
                value={pesoPost}
                onChange={(e) => setPesoPost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Peso Seco Objetivo (Kg)</label>
              <input
                type="number"
                step="0.1"
                value={pesoSeco}
                onChange={(e) => setPesoSeco(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Ultrafiltración Lograda (UF)</span>
              <span className="text-xl font-bold text-sky-300">{ufLiters} Litros</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Flujo de Sangre Qb (mL/min)</label>
              <input
                type="number"
                step="10"
                value={qb}
                onChange={(e) => setQb(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Flujo de Dializado Qd (mL/min)</label>
              <input
                type="number"
                step="50"
                value={qd}
                onChange={(e) => setQd(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Filtro Dializador & Membrana</label>
              <input
                type="text"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Esquema de Anticoagulacion</label>
              <input
                type="text"
                value={heparina}
                onChange={(e) => setHeparina(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Accesos Vasculares */}
      {activeTab === "ACCESOS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-4 h-4" /> Mapa Gráfico de Accesos Vasculares para Hemodiálisis
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Fístulas Arteriovenosas autólogas/protésicas y Catéteres venosos centrales.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddAccess}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Acceso
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Acceso Vascular</label>
              <select
                value={tipoAcceso}
                onChange={(e) => setTipoAcceso(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {ACCESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Localización Anatómica</label>
              <select
                value={locAcceso}
                onChange={(e) => setLocAcceso(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {ACCESS_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Estado de Funcionamiento & Exploración Física</label>
              <select
                value={estadoAcceso}
                onChange={(e) => setEstadoAcceso(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-semibold rounded p-2"
              >
                {ACCESS_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
