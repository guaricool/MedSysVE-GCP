"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  Scissors,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  FileCheck,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const BODY_AREAS = [
  "Abdomen Superior/Inferior",
  "Flancos y Cintura",
  "Espalda Alta/Baja (Dorsal)",
  "Región Glútea / Cadera",
  "Mamas (Complejo Aréola-Pezón)",
  "Caras Internas de Muslos",
  "Brazos (Braquioplastia)",
  "Región Facial / Cervical",
];

const IMPLANT_BRANDS = [
  "Motiva Ergonomix / SilkSurface",
  "Mentor MemoryGel / CPX4",
  "Allergan Natrelle",
  "Polytech Sublime/Microthane",
  "Sebbin Sublimity",
  "Nagor Implants",
];

const PLACEMENT_PLANES = [
  "Plano Dual (Dual Plane I / II / III)",
  "Submuscular (Bajo el Pectoral Mayor)",
  "Subglandular (Sobre el Pectoral)",
  "Subfascial",
];

export function CirugiaPlasticaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"MAPEO" | "IMPLANTES" | "CICATRIZ">("MAPEO");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbMap, refetch: refetchMap } = (trpc.plastic.getBodyMapping.useQuery as any)({ encounterId });
  const { data: dbImplants = [], refetch: refetchImplants } = (trpc.plastic.listImplants.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbScar, refetch: refetchScar } = (trpc.plastic.getScarAssessment.useQuery as any)({ encounterId });

  const saveMapMut = (trpc.plastic.saveBodyMapping.useMutation as any)({ onSuccess: () => refetchMap() });
  const saveImplantMut = (trpc.plastic.saveImplant.useMutation as any)({ onSuccess: () => refetchImplants() });
  const saveScarMut = (trpc.plastic.saveScarAssessment.useMutation as any)({ onSuccess: () => refetchScar() });

  // Body Mapping State
  const [procedureTypes, setProcedureTypes] = useState("Liposucción HD + Lipotransferencia Glútea + Abdominoplastia");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Abdomen Superior/Inferior", "Flancos y Cintura", "Espalda Alta/Baja (Dorsal)", "Región Glútea / Cadera"]);
  const [lipoCc, setLipoCc] = useState(3200);
  const [graftCc, setGraftCc] = useState(450);

  // Implant State
  const [side, setSide] = useState("Mama Izquierda / Derecha (Bilateral)");
  const [brand, setBrand] = useState("Motiva Ergonomix / SilkSurface");
  const [volumeCc, setVolumeCc] = useState(375);
  const [profile, setProfile] = useState("Perfil Alto Corsé");
  const [plane, setPlane] = useState("Plano Dual (Dual Plane I / II / III)");
  const [incision, setIncision] = useState("Vía Surco Inframamario");
  const [lot, setLot] = useState("LOT-2025-9982");
  const [serial, setSerial] = useState("SN-MOT-889102-L / R");

  // Scar Assessment State (Vancouver Scar Scale VSS)
  const [pigmentation, setPigmentation] = useState("Hiperpigmentada (Leve incremento melanina)");
  const [vascularity, setVascularity] = useState("Rosada / Leve vasodilatación");
  const [pliability, setPliability] = useState("Flexible (Cede a la presión sin adherencias profundas)");
  const [heightMm, setHeightMm] = useState(1.5);
  const [scarType, setScarType] = useState("Normotrófica en proceso madurativo adecuado");

  const vssScore = useMemo(() => {
    let score = 0;
    if (pigmentation.includes("Hiperpigmentada") || pigmentation.includes("Hipopigmentada")) score += 1;
    if (vascularity.includes("Rosada")) score += 1;
    if (vascularity.includes("Roja")) score += 2;
    if (vascularity.includes("Púrpura")) score += 3;
    if (pliability.includes("Flexible")) score += 1;
    if (pliability.includes("Firme")) score += 2;
    if (pliability.includes("Adherida")) score += 3;
    if (heightMm > 0 && heightMm < 2) score += 1;
    if (heightMm >= 2 && heightMm <= 5) score += 2;
    if (heightMm > 5) score += 3;
    return score;
  }, [pigmentation, vascularity, pliability, heightMm]);

  useEffect(() => {
    if (dbMap) {
      setProcedureTypes(dbMap.procedureTypes);
      if (dbMap.estimatedLipoCc !== null) setLipoCc(dbMap.estimatedLipoCc);
      if (dbMap.graftVolumeCc !== null) setGraftCc(dbMap.graftVolumeCc);
      if (dbMap.targetAreasJson) {
        try {
          setSelectedAreas(JSON.parse(dbMap.targetAreasJson));
        } catch (e) {}
      }
    }
  }, [dbMap]);

  useEffect(() => {
    if (dbScar) {
      setPigmentation(dbScar.pigmentation);
      setVascularity(dbScar.vascularity);
      setPliability(dbScar.pliability);
      setHeightMm(dbScar.heightMm);
      setScarType(dbScar.scarType);
    }
  }, [dbScar]);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSaveMap = () => {
    saveMapMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      procedureTypes,
      targetAreasJson: JSON.stringify(selectedAreas),
      estimatedLipoCc: lipoCc,
      graftVolumeCc: graftCc,
    });
  };

  const handleAddImplant = () => {
    saveImplantMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      side,
      brand,
      volumeCc,
      profile,
      placementPlane: plane,
      incisionSite: incision,
      lotNumber: lot,
      serialNumber: serial,
    });
  };

  const handleSaveScar = () => {
    saveScarMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      vancouverVssScore: vssScore,
      pigmentation,
      vascularity,
      pliability,
      heightMm,
      scarType,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Cirugía Plástica, Estética & Reconstructiva</h3>
            <p className="text-xs text-slate-400">Mapeo Corporal Lipo HD, Carnet de Implantes Mamarios & Escala VSS de Vancouver</p>
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
          onClick={() => setActiveTab("MAPEO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "MAPEO"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" /> Mapeo Corporal Pre/Post
        </button>

        <button
          onClick={() => setActiveTab("IMPLANTES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "IMPLANTES"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Registro Implantes ({dbImplants.length})
        </button>

        <button
          onClick={() => setActiveTab("CICATRIZ")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CICATRIZ"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Cicatrización VSS (Vancouver)
        </button>
      </div>

      {/* Tab 1: Mapeo Corporal Pre/Post */}
      {activeTab === "MAPEO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-4 h-4" /> Marcaje de Zonas Quirúrgicas & Volúmenes Corporal
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Planificación estético-reconstructiva y volúmenes lipoaspirados / inyectados.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveMap}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs"
            >
              Guardar Mapeo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Procedimiento(s) Planificados o Ejecutados</label>
              <input
                type="text"
                value={procedureTypes}
                onChange={(e) => setProcedureTypes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800 md:col-span-2">
              <span className="font-bold text-pink-300 block">Zonas Anatómicas Marcadas para Intervención:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {BODY_AREAS.map((area) => {
                  const isSelected = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`p-2 rounded text-left transition-all font-semibold ${
                        isSelected
                          ? "bg-pink-950/80 border border-pink-500/50 text-pink-200"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {isSelected ? "✓ " : ""}{area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Volumen Estimado Lipoaspirado (cc)</label>
              <input
                type="number"
                step="50"
                value={lipoCc}
                onChange={(e) => setLipoCc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-pink-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Volumen Lipoinyectado / Injerto (cc)</label>
              <input
                type="number"
                step="50"
                value={graftCc}
                onChange={(e) => setGraftCc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Registro Implantes */}
      {activeTab === "IMPLANTES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Carnet Digital & Registro de Implantes Mamarios / Prótesis
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Trazabilidad de marca, seriales, lote y plano de colocación anatómico.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddImplant}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Implante
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Lateralidad / Posición</label>
              <input
                type="text"
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Marca Comercial de la Prótesis</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {IMPLANT_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Volumen en Centímetros Cúbicos (cc)</label>
              <input
                type="number"
                step="5"
                value={volumeCc}
                onChange={(e) => setVolumeCc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-pink-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Perfil del Implante</label>
              <input
                type="text"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Plano Anatómico de Colocación</label>
              <select
                value={plane}
                onChange={(e) => setPlane(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {PLACEMENT_PLANES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Vía de Incisión Quirúrgica</label>
              <input
                type="text"
                value={incision}
                onChange={(e) => setIncision(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Número de Lote (LOT)</label>
              <input
                type="text"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Número de Serie Único (Serial)</label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cicatrización VSS (Vancouver) */}
      {activeTab === "CICATRIZ" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Evaluador de Cicatrización (Escala de Vancouver VSS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Detección temprana de cicatrices hipertróficas y queloides.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScar}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs"
            >
              Guardar VSS
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Pigmentación de la Cicatriz</label>
              <input
                type="text"
                value={pigmentation}
                onChange={(e) => setPigmentation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Vascularización / Coloración</label>
              <input
                type="text"
                value={vascularity}
                onChange={(e) => setVascularity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Flexibilidad / Pliability</label>
              <input
                type="text"
                value={pliability}
                onChange={(e) => setPliability(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Elevación / Altura sobre la piel (mm)</label>
              <input
                type="number"
                step="0.5"
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-pink-300 font-bold rounded p-2"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-pink-500/30 flex items-center justify-between md:col-span-2">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Score Vancouver VSS</span>
                <span className="text-2xl font-bold text-pink-300">{vssScore} / 13 pts</span>
              </div>
              <span className="font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded text-xs">
                {scarType}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
