"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  TestTube,
  Syringe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Layers,
  FileDown,
  Grid,
  Info,
  Trash2,
  Calendar,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

export interface CustomPrickItem {
  id: string;
  label: string;
  category: string;
  papuleMm: number;
  erythemaMm: number;
}

export interface PatchTestItem {
  id: string;
  hapteno: string;
  fuente?: string;
  resultado: "Neg" | "?" | "+" | "++" | "+++" | "++++" | "IR";
}

const DEFAULT_PRICK_ITEMS = [
  // Aeroalérgenos / Ambientales
  { key: "D_pteronyssinus", category: "Aeroalérgenos", label: "Dermatophagoides pteronyssinus" },
  { key: "D_farinae", category: "Aeroalérgenos", label: "Dermatophagoides farinae" },
  { key: "Blomia_tropicalis", category: "Aeroalérgenos", label: "Blomia tropicalis" },
  { key: "Epitelio_Gato", category: "Epitelios", label: "Epitelio de Gato" },
  { key: "Epitelio_Perro", category: "Epitelios", label: "Epitelio de Perro" },
  { key: "Mosquito", category: "Insectos", label: "Mosquito" },
  { key: "Cucaracha", category: "Insectos", label: "Cucaracha (Periplaneta americana)" },
  { key: "Penicillium", category: "Hongos", label: "Penicillium notatum" },
  { key: "Aspergillus", category: "Hongos", label: "Aspergillus fumigatus" },
  { key: "Candida", category: "Hongos", label: "Candida albicans" },
  { key: "Plumas", category: "Aeroalérgenos", label: "Mezcla de Plumas" },
  { key: "Gramineas", category: "Pólenes", label: "Mezcla de Gramíneas" },
  { key: "Malezas", category: "Pólenes", label: "Mezcla de Malezas" },
  { key: "Latex", category: "Contacto / Látex", label: "Látex (Hevea brasiliensis)" },
  { key: "Algodon", category: "Contacto", label: "Algodón" },
  // Alimentos
  { key: "Caseina", category: "Alimentos", label: "Caseína / Leche de Vaca" },
  { key: "Huevo", category: "Alimentos", label: "Huevo Entero" },
  { key: "Almendras", category: "Alimentos", label: "Almendras" },
  { key: "Cacao", category: "Alimentos", label: "Cacao / Chocolate" },
  { key: "Mani", category: "Alimentos", label: "Maní / Cacahuete" },
  { key: "Maiz", category: "Alimentos", label: "Maíz" },
  { key: "Avena", category: "Alimentos", label: "Avena" },
  { key: "Trigo", category: "Alimentos", label: "Trigo / Gluten" },
  { key: "Soja", category: "Alimentos", label: "Soja / Soya" },
  { key: "PescadoBlanco", category: "Alimentos", label: "Pescado Blanco" },
  { key: "Mariscos", category: "Alimentos", label: "Mariscos / Camarón" },
  { key: "Naranja", category: "Alimentos", label: "Naranja / Cítricos" },
  { key: "Cerdo", category: "Alimentos", label: "Carne de Cerdo" },
  { key: "Tomate", category: "Alimentos", label: "Tomate" },
];

const STANDARD_HAPTEN_KIT: PatchTestItem[] = [
  { id: "h1", hapteno: "Níquel Sulfato 5%", fuente: "Metales, bisutería, botones", resultado: "Neg" },
  { id: "h2", hapteno: "Alcoholes de Lana Lanolina 30%", fuente: "Cremas, cosméticos, ungüentos", resultado: "Neg" },
  { id: "h3", hapteno: "Neomicina Sulfato 20%", fuente: "Fármacos tópicos, gotas", resultado: "Neg" },
  { id: "h4", hapteno: "Potasio Dicromato 0.5%", fuente: "Cuero curtido, cemento, metales", resultado: "Neg" },
  { id: "h5", hapteno: "Caínas Mix 5%", fuente: "Anestésicos locales (Benzocaína)", resultado: "Neg" },
  { id: "h6", hapteno: "Mezcla de Fragancias I 18%", fuente: "Perfumes, jabones, cosméticos", resultado: "Neg" },
  { id: "h7", hapteno: "Colofonia 20%", fuente: "Pegamentos, resinas, papel", resultado: "Neg" },
  { id: "h8", hapteno: "Resina Epoxi 1%", fuente: "Plásticos, adhesivos industriales", resultado: "Neg" },
  { id: "h9", hapteno: "Clioquinol 5%", fuente: "Medicamentos tópicos dermatológicos", resultado: "Neg" },
  { id: "h10", hapteno: "Bálsamo del Perú 25%", fuente: "Perfumes, saborizantes", resultado: "Neg" },
  { id: "h11", hapteno: "Formaldehído 1%", fuente: "Plásticos, desinfectantes, ropa", resultado: "Neg" },
  { id: "h12", hapteno: "Cloruro de Cobalto 1%", fuente: "Metales, pigmentos azules", resultado: "Neg" },
  { id: "h13", hapteno: "Parábenos Mezcla 16%", fuente: "Conservantes cosméticos/farmacéuticos", resultado: "Neg" },
  { id: "h14", hapteno: "Parafenilendiamina (PPD) 1%", fuente: "Tintes de cabello, tinte negro", resultado: "Neg" },
  { id: "h15", hapteno: "Kathon CG (Isotiazolinonas) 0.01%", fuente: "Conservantes en champús y toallitas", resultado: "Neg" },
  { id: "h16", hapteno: "Mercapto Mix 2%", fuente: "Aceleradores de caucho, goma", resultado: "Neg" },
  { id: "h17", hapteno: "Tiuram Mix 1%", fuente: "Guantes de goma, caucho industrial", resultado: "Neg" },
  { id: "h18", hapteno: "Budesonida 0.01%", fuente: "Corticoides tópicos e inhalados", resultado: "Neg" },
  { id: "h19", hapteno: "Tixocortol Pivalato 0.1%", fuente: "Corticoides dermatológicos", resultado: "Neg" },
  { id: "h20", hapteno: "Mezcla de Lactonas Sesquiterpénicas 0.1%", fuente: "Plantas, cosméticos naturales", resultado: "Neg" },
];

export function AlergologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"PRICK" | "PARCHE" | "INMUNOTERAPIA" | "PANEL">("PRICK");
  const [showLegend, setShowLegend] = useState(true);

  const utils = trpc.useUtils();
  const [addedAllergies, setAddedAllergies] = useState<Record<string, boolean>>({});

  // tRPC Queries & Mutations
  const { data: dbPrick, refetch: refetchPrick } = (trpc.allergy.getPrickTest.useQuery as any)({ encounterId });
  const { data: dbPatch, refetch: refetchPatch } = (trpc.allergy.getPatchTest.useQuery as any)({ encounterId });
  const { data: dbImmunotherapies = [], refetch: refetchImmu } = (trpc.allergy.listImmunotherapies.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbIgPanel, refetch: refetchIg } = (trpc.allergy.getIgPanel.useQuery as any)({ encounterId });

  const savePrickMut = (trpc.allergy.savePrickTest.useMutation as any)({ onSuccess: () => refetchPrick() });
  const savePatchMut = (trpc.allergy.savePatchTest.useMutation as any)({ onSuccess: () => refetchPatch() });
  const saveImmuMut = (trpc.allergy.saveImmunotherapy.useMutation as any)({ onSuccess: () => refetchImmu() });
  const saveIgMut = (trpc.allergy.saveIgPanel.useMutation as any)({ onSuccess: () => refetchIg() });

  const addPatientAllergyMut = trpc.alergia.add.useMutation({
    onSuccess: () => {
      utils.alergia.list.invalidate({ patientRegistrationId: effectivePatId });
    },
  });

  const isSandbox = encounterId === "sandbox-demo";

  // ─── 1. PRICK TEST STATE ───
  const [histamineMm, setHistamineMm] = useState(isSandbox ? 7.0 : 0.0);
  const [salineMm, setSalineMm] = useState(0.0);
  const [papuleMm, setPapuleMm] = useState<Record<string, number>>(
    isSandbox
      ? {
          D_pteronyssinus: 8.0,
          D_farinae: 6.0,
          Blomia_tropicalis: 9.0,
          Huevo: 4.0,
        }
      : {}
  );
  const [erythemaMm, setErythemaMm] = useState<Record<string, number>>(
    isSandbox
      ? {
          D_pteronyssinus: 15.0,
          D_farinae: 12.0,
          Blomia_tropicalis: 18.0,
          Huevo: 8.0,
        }
      : {}
  );
  const [customPrickItems, setCustomPrickItems] = useState<CustomPrickItem[]>([]);
  const [newPrickLabel, setNewPrickLabel] = useState("");
  const [newPrickCategory, setNewPrickCategory] = useState("Aeroalérgenos");
  const [newPrickPapule, setNewPrickPapule] = useState(0.0);
  const [newPrickErythema, setNewPrickErythema] = useState(0.0);

  // ─── 2. PATCH TEST STATE ───
  const [patchFechaAplicacion, setPatchFechaAplicacion] = useState(new Date().toISOString().substring(0, 10));
  const [patchFechaLectura, setPatchFechaLectura] = useState(new Date(Date.now() + 48 * 3600 * 1000).toISOString().substring(0, 10));
  const [patchDiagnostico, setPatchDiagnostico] = useState(isSandbox ? "Dermatitis de Contacto Alérgica" : "");
  const [patchComentarios, setPatchComentarios] = useState("");
  const [patchItems, setPatchItems] = useState<PatchTestItem[]>(STANDARD_HAPTEN_KIT);
  const [newHaptenName, setNewHaptenName] = useState("");
  const [newHaptenSource, setNewHaptenSource] = useState("");

  // ─── 3. INMUNOTERAPIA STATE ───
  const [therapyRoute, setTherapyRoute] = useState("SLIT Sublingual (Gotas bajo la lengua)");
  const [extract, setExtract] = useState(isSandbox ? "Mezcla Ácaros (D.pteronyssinus 50% + Blomia 50%)" : "");
  const [phase, setPhase] = useState(isSandbox ? "Fase de Mantenimiento (Frasco Concentrado Rojo)" : "");
  const [vial, setVial] = useState(isSandbox ? "Concentración Máxima 100.000 DPT/ml" : "");
  const [dose, setDose] = useState(isSandbox ? "5 gotas diarias por 3 años" : "");
  const [localReaction, setLocalReaction] = useState(0);
  const [systemicReaction, setSystemicReaction] = useState(isSandbox ? "Sin reacciones adversas / Tolerancia excelente" : "");

  // ─── 4. PANEL IG STATE ───
  const [ige, setIge] = useState(isSandbox ? 850.0 : 0);
  const [igg, setIgg] = useState(isSandbox ? 1120.0 : 0);
  const [iga, setIga] = useState(isSandbox ? 210.0 : 0);
  const [igm, setIgm] = useState(isSandbox ? 145.0 : 0);
  const [c3, setC3] = useState(isSandbox ? 115.0 : 0);
  const [c4, setC4] = useState(isSandbox ? 28.0 : 0);
  const [immunodeficiency, setImmunodeficiency] = useState(isSandbox ? "Atopia Severa Hiper-IgE (Rinitis & Asma Alérgica)" : "");

  // Sync from DB: Prick Test
  useEffect(() => {
    if (dbPrick) {
      setHistamineMm(dbPrick.histamineControlMm);
      setSalineMm(dbPrick.salineControlMm);
      if (dbPrick.dustMitesJson) {
        try {
          const parsed = JSON.parse(dbPrick.dustMitesJson);
          setPapuleMm((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
      if (dbPrick.customItemsJson) {
        try {
          const parsed = JSON.parse(dbPrick.customItemsJson);
          setCustomPrickItems(parsed);
        } catch (e) {}
      }
    }
  }, [dbPrick]);

  // Sync from DB: Patch Test
  useEffect(() => {
    if (dbPatch) {
      if (dbPatch.fechaAplicacion) setPatchFechaAplicacion(new Date(dbPatch.fechaAplicacion).toISOString().substring(0, 10));
      if (dbPatch.fechaLectura) setPatchFechaLectura(new Date(dbPatch.fechaLectura).toISOString().substring(0, 10));
      if (dbPatch.diagnostico) setPatchDiagnostico(dbPatch.diagnostico);
      if (dbPatch.comentarios) setPatchComentarios(dbPatch.comentarios);
      if (dbPatch.itemsJson) {
        try {
          const parsed = JSON.parse(dbPatch.itemsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPatchItems(parsed);
          }
        } catch (e) {}
      }
    }
  }, [dbPatch]);

  // Sync from DB: Ig Panel
  useEffect(() => {
    if (dbIgPanel) {
      if (dbIgPanel.totalIgEKuiL !== null) setIge(dbIgPanel.totalIgEKuiL);
      if (dbIgPanel.totalIgGMgDl !== null) setIgg(dbIgPanel.totalIgGMgDl);
      if (dbIgPanel.totalIgAMgDl !== null) setIga(dbIgPanel.totalIgAMgDl);
      if (dbIgPanel.totalIgMMgDl !== null) setIgm(dbIgPanel.totalIgMMgDl);
      if (dbIgPanel.c3ComplementMgDl !== null) setC3(dbIgPanel.c3ComplementMgDl);
      if (dbIgPanel.c4ComplementMgDl !== null) setC4(dbIgPanel.c4ComplementMgDl);
      if (dbIgPanel.immunodeficiencyDiagnosis) setImmunodeficiency(dbIgPanel.immunodeficiencyDiagnosis);
    }
  }, [dbIgPanel]);

  // Calculadores de reacciones positivas
  const prickPositiveCount = useMemo(() => {
    const stdPos = Object.values(papuleMm).filter((mm) => mm >= 3.0).length;
    const customPos = customPrickItems.filter((i) => i.papuleMm >= 3.0).length;
    return stdPos + customPos;
  }, [papuleMm, customPrickItems]);

  const patchPositiveCount = useMemo(() => {
    return patchItems.filter((i) => i.resultado !== "Neg" && i.resultado !== "?").length;
  }, [patchItems]);

  // Handlers
  const handleSavePrick = () => {
    savePrickMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      histamineControlMm: histamineMm,
      salineControlMm: salineMm,
      dustMitesJson: JSON.stringify(papuleMm),
      customItemsJson: JSON.stringify(customPrickItems),
      positiveReactionsCount: prickPositiveCount,
    });
  };

  const handleAddCustomPrick = () => {
    if (!newPrickLabel.trim()) return;
    const newItem: CustomPrickItem = {
      id: "prick_custom_" + Date.now(),
      label: newPrickLabel.trim(),
      category: newPrickCategory,
      papuleMm: newPrickPapule,
      erythemaMm: newPrickErythema,
    };
    setCustomPrickItems([...customPrickItems, newItem]);
    setNewPrickLabel("");
  };

  const handleRemoveCustomPrick = (id: string) => {
    setCustomPrickItems(customPrickItems.filter((item) => item.id !== id));
  };

  const handleSavePatch = () => {
    savePatchMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      fechaAplicacion: patchFechaAplicacion,
      fechaLectura: patchFechaLectura,
      diagnostico: patchDiagnostico,
      comentarios: patchComentarios,
      itemsJson: JSON.stringify(patchItems),
      positiveCount: patchPositiveCount,
    });
  };

  const handleUpdateHaptenResult = (id: string, resultado: PatchTestItem["resultado"]) => {
    setPatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resultado } : item))
    );
  };

  const handleAddCustomHapten = () => {
    if (!newHaptenName.trim()) return;
    const newItem: PatchTestItem = {
      id: "patch_custom_" + Date.now(),
      hapteno: newHaptenName.trim(),
      fuente: newHaptenSource.trim() || "Sustancia traída por paciente / trabajo",
      resultado: "Neg",
    };
    setPatchItems([...patchItems, newItem]);
    setNewHaptenName("");
    setNewHaptenSource("");
  };

  const handleRemoveHapten = (id: string) => {
    setPatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddImmunotherapy = () => {
    saveImmuMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      therapyRoute,
      allergenicExtract: extract,
      phase,
      vialConcentration: vial,
      doseAmount: dose,
      localReactionMm: localReaction,
      systemicReaction,
    });
  };

  const handleSaveIg = () => {
    saveIgMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      totalIgEKuiL: ige,
      totalIgGMgDl: igg,
      totalIgAMgDl: iga,
      totalIgMMgDl: igm,
      c3ComplementMgDl: c3,
      c4ComplementMgDl: c4,
      immunodeficiencyDiagnosis: immunodeficiency,
    });
  };

  const getPatchBadgeStyle = (res: PatchTestItem["resultado"]) => {
    switch (res) {
      case "Neg":
        return "bg-slate-900 text-slate-400 border-slate-700";
      case "?":
        return "bg-amber-950/80 text-amber-300 border-amber-500/50";
      case "+":
        return "bg-amber-600 text-white font-bold border-amber-500";
      case "++":
        return "bg-orange-600 text-white font-bold border-orange-500";
      case "+++":
        return "bg-red-600 text-white font-bold border-red-500";
      case "++++":
        return "bg-red-800 text-white font-bold border-red-400 shadow-md animate-pulse";
      case "IR":
        return "bg-purple-900 text-purple-200 border-purple-500 font-bold";
      default:
        return "bg-slate-900 text-slate-400";
    }
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Alergología e Inmunología Clínica</h3>
            <p className="text-xs text-slate-400">Prick Test Cutáneo, Prueba de Parche (Haptenos), Inmunoterapia & Panel IgE/IgG</p>
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
          type="button"
          onClick={() => setActiveTab("PRICK")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "PRICK"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TestTube className="w-3.5 h-3.5" /> Prick Test Cutáneo ({prickPositiveCount} +)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PARCHE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "PARCHE"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Grid className="w-3.5 h-3.5" /> Prueba de Parche ({patchPositiveCount} +)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("INMUNOTERAPIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "INMUNOTERAPIA"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Syringe className="w-3.5 h-3.5" /> Inmunoterapia ({dbImmunotherapies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PANEL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "PANEL"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Inmunoglobulinas (IgE)
        </button>
      </div>

      {/* TAB 1: PRICK TEST CUTÁNEO */}
      {activeTab === "PRICK" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <TestTube className="w-4 h-4" /> Medición de Pápulas y Eritema en Prick Test Cutáneo (mm)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Control positivo (Histamina 10mg/ml) y negativo (Salino). Reacciones ≥ 3mm corresponden a respuesta positiva.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePrick}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Guardar Prick Test
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-teal-300 block">Histamina (Control +)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={histamineMm}
                  onChange={(e) => setHistamineMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-teal-300 font-bold rounded p-1.5 text-center"
                />
                <span className="text-slate-400 font-bold">mm</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-slate-400 block">Salino (Control -)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  value={salineMm}
                  onChange={(e) => setSalineMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-400 font-bold rounded p-1.5 text-center"
                />
                <span className="text-slate-400 font-bold">mm</span>
              </div>
            </div>

            <div className="sm:col-span-2 bg-slate-950 p-3 rounded-lg border border-teal-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Alérgenos Positivos (≥ 3mm)</span>
                <span className="text-xl font-bold text-teal-300">{prickPositiveCount} Alérgenos Reactivos</span>
              </div>
              <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-xs">
                Sensibilización Cutánea Positiva
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-400" /> Agregar Alérgeno Personalizado al Prick Test
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nombre del alérgeno (ej: Mandarina, Moho especifico...)"
                value={newPrickLabel}
                onChange={(e) => setNewPrickLabel(e.target.value)}
                className="sm:col-span-2 bg-slate-900 border border-slate-700 text-white rounded p-1.5"
              />
              <select
                value={newPrickCategory}
                onChange={(e) => setNewPrickCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded p-1.5"
              >
                <option value="Aeroalérgenos">Aeroalérgenos</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Hongos">Hongos</option>
                <option value="Epitelios">Epitelios</option>
                <option value="Insectos">Insectos</option>
                <option value="Contacto">Contacto / Otro</option>
              </select>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400">Pápula:</span>
                <input
                  type="number"
                  step="0.5"
                  value={newPrickPapule}
                  onChange={(e) => setNewPrickPapule(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-teal-300 font-bold rounded p-1 text-center"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomPrick}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
              >
                + Añadir Prick
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {DEFAULT_PRICK_ITEMS.map((item) => {
              const mmP = papuleMm[item.key] || 0;
              const mmE = erythemaMm[item.key] || 0;
              const isPositive = mmP >= 3.0;
              const isAdded = addedAllergies[item.key];
              return (
                <div key={item.key} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">{item.category}</span>
                      <span className="font-semibold text-slate-200">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">P:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={mmP}
                          onChange={(e) => setPapuleMm({ ...papuleMm, [item.key]: Number(e.target.value) })}
                          className={`w-14 text-center font-bold rounded p-1 border ${
                            isPositive
                              ? "bg-amber-950/80 border-amber-500 text-amber-200"
                              : "bg-slate-900 border-slate-700 text-slate-400"
                          }`}
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">E:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={mmE}
                          onChange={(e) => setErythemaMm({ ...erythemaMm, [item.key]: Number(e.target.value) })}
                          className="w-14 bg-slate-900 border border-slate-700 text-slate-300 text-center font-semibold rounded p-1"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                    </div>
                  </div>

                  {isPositive && (
                    <div className="flex justify-end pt-1 border-t border-slate-900">
                      {isAdded ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Registrada en Alergias del Paciente
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addPatientAllergyMut.mutate({
                              patientRegistrationId: effectivePatId,
                              sustancia: item.label,
                              categoria: item.category.includes("Alimentos") ? "ALIMENTO" : "AEROALERGENO",
                              gravedad: mmP >= 7 ? "SEVERA" : mmP >= 4 ? "MODERADA" : "LEVE",
                              reaccion: `Prick Test Positivo: Pápula ${mmP}mm / Eritema ${mmE}mm`,
                            });
                            setAddedAllergies({ ...addedAllergies, [item.key]: true });
                          }}
                          disabled={addPatientAllergyMut.isPending}
                          className="text-[10px] bg-teal-950/80 hover:bg-teal-900 border border-teal-600/50 text-teal-300 font-semibold px-2 py-0.5 rounded transition-all cursor-pointer"
                        >
                          + Guardar en Alergias del Paciente
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {customPrickItems.map((item) => {
              const isPositive = item.papuleMm >= 3.0;
              const isAdded = addedAllergies[item.id];
              return (
                <div key={item.id} className="bg-slate-950 p-2.5 rounded-lg border border-teal-500/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-teal-400 text-[10px] uppercase font-bold block">{item.category} (Personalizado)</span>
                      <span className="font-semibold text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">P:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.papuleMm}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomPrickItems((prev) =>
                              prev.map((ci) => (ci.id === item.id ? { ...ci, papuleMm: val } : ci))
                            );
                          }}
                          className={`w-14 text-center font-bold rounded p-1 border ${
                            isPositive
                              ? "bg-amber-950/80 border-amber-500 text-amber-200"
                              : "bg-slate-900 border-slate-700 text-slate-400"
                          }`}
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">E:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.erythemaMm}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCustomPrickItems((prev) =>
                              prev.map((ci) => (ci.id === item.id ? { ...ci, erythemaMm: val } : ci))
                            );
                          }}
                          className="w-14 bg-slate-900 border border-slate-700 text-slate-300 text-center font-semibold rounded p-1"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPrick(item.id)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isPositive && (
                    <div className="flex justify-end pt-1 border-t border-slate-900">
                      {isAdded ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Registrada en Alergias del Paciente
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addPatientAllergyMut.mutate({
                              patientRegistrationId: effectivePatId,
                              sustancia: item.label,
                              categoria: "OTRO",
                              gravedad: item.papuleMm >= 7 ? "SEVERA" : item.papuleMm >= 4 ? "MODERADA" : "LEVE",
                              reaccion: `Prick Test Positivo: Pápula ${item.papuleMm}mm / Eritema ${item.erythemaMm}mm`,
                            });
                            setAddedAllergies({ ...addedAllergies, [item.id]: true });
                          }}
                          disabled={addPatientAllergyMut.isPending}
                          className="text-[10px] bg-teal-950/80 hover:bg-teal-900 border border-teal-600/50 text-teal-300 font-semibold px-2 py-0.5 rounded transition-all cursor-pointer"
                        >
                          + Guardar en Alergias del Paciente
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PRUEBA DE PARCHE / HAPTENOS DE CONTACTO (PATCH TEST) */}
      {activeTab === "PARCHE" && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-4 h-4" /> Prueba de Parche (Patch Test - Alérgenos de Contacto / Haptenos)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Lectura de dermatitis alérgica de contacto por graduación de cruces (Neg a ++++ e IR).</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="border-slate-700 text-slate-300 text-xs gap-1 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" /> Leyenda de Cruces
              </Button>
              <Button
                size="sm"
                onClick={handleSavePatch}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
              >
                Guardar Prueba Parche
              </Button>
            </div>
          </div>

          {showLegend && (
            <div className="bg-slate-950 p-3 rounded-lg border border-teal-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-teal-300 border-b border-slate-800 pb-1">
                <span>Escala de Lectura Internacional de Prueba de Parche (ICDRG / CEEAC)</span>
                <span className="text-[10px] text-slate-400 font-normal">Interpretación clínica</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="font-bold text-slate-300">Neg (Negativo):</span> Sin cambios dermatológicos.
                </div>
                <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30">
                  <span className="font-bold text-amber-300">? (Dudoso):</span> Solo eritema macular tenue.
                </div>
                <div className="p-2 rounded bg-amber-900/50 border border-amber-500">
                  <span className="font-bold text-amber-200">+ (Débil):</span> Eritema y papulación leve.
                </div>
                <div className="p-2 rounded bg-orange-950/60 border border-orange-500">
                  <span className="font-bold text-orange-200">++ (Moderada):</span> Eritema, pápulas y pequeñas vesículas.
                </div>
                <div className="p-2 rounded bg-red-950/70 border border-red-500 sm:col-span-2">
                  <span className="font-bold text-red-200">+++ / ++++ (Fuerte / Extrema):</span> Eritema intenso, vesículas coalescentes, ampollas o lesión ulcerativa tipo quemadura.
                </div>
                <div className="p-2 rounded bg-purple-950/70 border border-purple-500 sm:col-span-2">
                  <span className="font-bold text-purple-200">IR (Irritativa):</span> Quemadura por alta concentración química / no alérgica.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" /> Fecha de Aplicación Parche
              </label>
              <input
                type="date"
                value={patchFechaAplicacion}
                onChange={(e) => setPatchFechaAplicacion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-semibold rounded p-1.5 text-center"
              />
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" /> Fecha de Lectura (48h / 72h / 96h)
              </label>
              <input
                type="date"
                value={patchFechaLectura}
                onChange={(e) => setPatchFechaLectura(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-semibold rounded p-1.5 text-center"
              />
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-slate-300 block">Diagnóstico Cutáneo de Contacto</label>
              <input
                type="text"
                value={patchDiagnostico}
                onChange={(e) => setPatchDiagnostico(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-teal-300 font-bold rounded p-1.5"
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2">
            <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-400" /> Agregar Hapteno o Elemento Específico del Paciente
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                placeholder="Nombre del alérgeno (ej: Jabón industrial, Ácido Acético...)"
                value={newHaptenName}
                onChange={(e) => setNewHaptenName(e.target.value)}
                className="sm:col-span-2 bg-slate-900 border border-slate-700 text-white rounded p-1.5"
              />
              <input
                type="text"
                placeholder="Fuente / Origen (ej: Productos de trabajo, tinte...)"
                value={newHaptenSource}
                onChange={(e) => setNewHaptenSource(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 rounded p-1.5"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomHapten}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
              >
                + Añadir Hapteno
              </Button>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2 px-1">
              <span>Alérgeno / Hapteno de Contacto</span>
              <span className="pr-4">Reactividad en Cruces</span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto pr-1">
              {patchItems.map((item, idx) => (
                <div key={item.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">
                      {idx + 1}. {item.hapteno}
                    </span>
                    {item.fuente && <span className="text-[10px] text-slate-400 block">{item.fuente}</span>}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(["Neg", "?", "+", "++", "+++", "++++", "IR"] as const).map((grade) => {
                      const isSelected = item.resultado === grade;
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => handleUpdateHaptenResult(item.id, grade)}
                          className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? getPatchBadgeStyle(grade)
                              : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleRemoveHapten(item.id)}
                      className="text-slate-600 hover:text-red-400 ml-1 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-teal-300 block">Comentarios / Conclusión Diagnóstica del Alergólogo</label>
            <textarea
              rows={3}
              placeholder="Ej: Se evidencia reacción moderada contra Níquel y Mezcla de Fragancias. Se sugiere evitación de bisutería de bajo costo y cosméticos perfumados. Ver anexo informativo."
              value={patchComentarios}
              onChange={(e) => setPatchComentarios(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded p-2.5 text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
      )}

      {/* TAB 3: INMUNOTERAPIA & ESQUEMA DE VACUNAS */}
      {activeTab === "INMUNOTERAPIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-4 h-4" /> Registro & Esquema de Vacunas de Inmunoterapia
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Trazabilidad de desensibilización por vía sublingual (SLIT) o subcutánea (SCIT).</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddImmunotherapy}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Prescribir Vacuna
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Vía de Administración</label>
              <input
                type="text"
                value={therapyRoute}
                onChange={(e) => setTherapyRoute(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Extracto Alergénico Específico</label>
              <input
                type="text"
                value={extract}
                onChange={(e) => setExtract(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-teal-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fase del Esquema</label>
              <input
                type="text"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Concentración / Dilución del Frasco</label>
              <input
                type="text"
                value={vial}
                onChange={(e) => setVial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Dosis e Pauta Posológica</label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Monitoreo de Reacción Adversa o Tolerancia</label>
              <input
                type="text"
                value={systemicReaction}
                onChange={(e) => setSystemicReaction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PANEL DE INMUNOGLOBULINAS */}
      {activeTab === "PANEL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Panel de Inmunoglobulinas & Complemento
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Niveles serológicos de IgE total, IgG, IgA, IgM y complemento C3/C4.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveIg}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs cursor-pointer"
            >
              Guardar Panel Ig
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgE Total (KUI/L)</label>
              <input
                type="number"
                step="10"
                value={ige}
                onChange={(e) => setIge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgG Total (mg/dL)</label>
              <input
                type="number"
                step="10"
                value={igg}
                onChange={(e) => setIgg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgA Total (mg/dL)</label>
              <input
                type="number"
                step="5"
                value={iga}
                onChange={(e) => setIga(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgM Total (mg/dL)</label>
              <input
                type="number"
                step="5"
                value={igm}
                onChange={(e) => setIgm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Complemento C3 (mg/dL)</label>
              <input
                type="number"
                step="1"
                value={c3}
                onChange={(e) => setC3(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Complemento C4 (mg/dL)</label>
              <input
                type="number"
                step="1"
                value={c4}
                onChange={(e) => setC4(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Diagnóstico Inmunológico / Fenotipo de Atopia</label>
              <input
                type="text"
                value={immunodeficiency}
                onChange={(e) => setImmunodeficiency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-teal-300 font-bold rounded p-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
