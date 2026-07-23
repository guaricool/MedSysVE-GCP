"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Scissors,
  CheckSquare,
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Award,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const CLAVIEN_DINDO_GRADES = [
  "Grado I (Desviación menor del curso normal sin necesidad de tratamiento farmacológico/quirúrgico)",
  "Grado II (Requiere tratamiento farmacológico con drogas distintas a Grado I, transfusiones o NPT)",
  "Grado IIIa (Requiere intervención quirúrgica, endoscópica o radiológica SIN anestesia general)",
  "Grado IIIb (Requiere intervención quirúrgica, endoscópica o radiológica CON anestesia general)",
  "Grado IVa (Complicación potencialmente mortal: disfunción de un solo órgano en UCI)",
  "Grado IVb (Complicación potencialmente mortal: disfunción multiorgánica en UCI)",
  "Grado V (Fallecimiento del paciente)",
];

export function CirugiaGeneralForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"CHECKLIST" | "REPORTE" | "COMPLICACIONES">("CHECKLIST");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbChk, refetch: refetchChk } = (trpc.surgery.getChecklist.useQuery as any)({ encounterId });
  const { data: dbReports = [], refetch: refetchReports } = (trpc.surgery.listOperativeReports.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbComps = [], refetch: refetchComps } = (trpc.surgery.listComplications.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveChkMut = (trpc.surgery.saveChecklist.useMutation as any)({ onSuccess: () => refetchChk() });
  const saveReportMut = (trpc.surgery.saveOperativeReport.useMutation as any)({ onSuccess: () => refetchReports() });
  const saveCompMut = (trpc.surgery.saveComplication.useMutation as any)({ onSuccess: () => refetchComps() });

  // Checklist State
  const [signIn, setSignIn] = useState(true);
  const [timeOut, setTimeOut] = useState(true);
  const [signOut, setSignOut] = useState(true);
  const [chkObs, setChkObs] = useState("Lista de chequeo de seguridad OMS completada sin novedades.");

  // Operative Report State
  const [diagPre, setDiagPre] = useState("Apendicitis Aguda Flegmonosa");
  const [diagPost, setDiagPost] = useState("Apendicitis Aguda Gangrenosa no perforada");
  const [cirujano, setCirujano] = useState("Dr. Carlos Pierluissi");
  const [ayudante, setAyudante] = useState("Dr. Roberto Mendoza");
  const [procedimiento, setProcedimiento] = useState("Apendicectomía Laparoscópica");
  const [hallazgos, setHallazgos] = useState("Apéndice cecal subcecal edematoso y gangrenoso. Escaso líquido libre claro.");
  const [sangreMl, setSangreMl] = useState(30);
  const [conteoGasasOk, setConteoGasasOk] = useState(true);
  const [patologia, setPatologia] = useState("Pieza de apendicectomía enviada a biopsia histopatológica.");

  // Complications State
  const [gradeClass, setGradeClass] = useState("Grado I (Desviación menor del curso normal sin necesidad de tratamiento farmacológico/quirúrgico)");
  const [descComp, setDescComp] = useState("Seroma menor en puerto umbilical, manejado con drenaje espontáneo.");
  const [reintervencion, setReintervencion] = useState(false);

  useEffect(() => {
    if (dbChk) {
      setSignIn(dbChk.signInConfirmado);
      setTimeOut(dbChk.timeOutPausaQuirurgica);
      setSignOut(dbChk.signOutConteoCorrecto);
      if (dbChk.observacionesChecklist) setChkObs(dbChk.observacionesChecklist);
    }
  }, [dbChk]);

  const handleSaveChk = () => {
    saveChkMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      signInConfirmado: signIn,
      timeOutPausaQuirurgica: timeOut,
      signOutConteoCorrecto: signOut,
      observacionesChecklist: chkObs,
    });
  };

  const handleAddReport = () => {
    saveReportMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      diagnosticoPreoperatorio: diagPre,
      diagnosticoPostoperatorio: diagPost,
      cirujanoPrincipal: cirujano,
      primerAyudante: ayudante,
      procedimientoRealizado: procedimiento,
      hallazgosQuirurgicos: hallazgos,
      perdidaSangreMl: sangreMl,
      conteoGasasCompresasOk: conteoGasasOk,
      hallazgosAnatomopatologicos: patologia,
    });
  };

  const handleAddComp = () => {
    saveCompMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      gradeClass,
      descripcionComplicacion: descComp,
      requirioReintervencion: reintervencion,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Cirugía General & Protocolo Quirúrgico</h3>
            <p className="text-xs text-slate-400">Seguridad OMS, Reporte Operatorio & Clasificación Clavien-Dindo</p>
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
          onClick={() => setActiveTab("CHECKLIST")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CHECKLIST"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Lista de Chequeo OMS
        </button>

        <button
          onClick={() => setActiveTab("REPORTE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "REPORTE"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Protocolo Quirúrgico ({dbReports.length})
        </button>

        <button
          onClick={() => setActiveTab("COMPLICACIONES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "COMPLICACIONES"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Clavien-Dindo Complicaciones ({dbComps.length})
        </button>
      </div>

      {/* Tab 1: Checklist OMS */}
      {activeTab === "CHECKLIST" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Lista de Chequeo de Seguridad Quirúrgica OMS
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Verificación obligatoria de 3 fases: Entrada, Pausa Quirúrgica y Salida.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveChk}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar Checklist OMS
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 text-slate-200 font-bold">
                <input type="checkbox" checked={signIn} onChange={(e) => setSignIn(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                1. Sign-In (Pre-Anestesia)
              </label>
              <p className="text-[10px] text-slate-400">Identidad, sitio quirúrgico, consentimiento y pulsioximetría verficados.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 text-slate-200 font-bold">
                <input type="checkbox" checked={timeOut} onChange={(e) => setTimeOut(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                2. Time-Out (Pausa Pre-Incisión)
              </label>
              <p className="text-[10px] text-slate-400">Presentación del equipo, antibiótico profiláctico e imágenes visibles.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 text-slate-200 font-bold">
                <input type="checkbox" checked={signOut} onChange={(e) => setSignOut(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                3. Sign-Out (Pre-Salida)
              </label>
              <p className="text-[10px] text-slate-400">Conteo completo de gasas, compresas e instrumental. Etiquetado de muestras.</p>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Observaciones del Checklist de Seguridad</label>
            <input
              type="text"
              value={chkObs}
              onChange={(e) => setChkObs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Protocolo Quirúrgico */}
      {activeTab === "REPORTE" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Protocolo Quirúrgico Operatorio
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Reporte formal de la técnica, cirujanos, sangrado y hallazgos.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddReport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Protocolo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Diagnóstico Preoperatorio</label>
              <input
                type="text"
                value={diagPre}
                onChange={(e) => setDiagPre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Diagnóstico Postoperatorio</label>
              <input
                type="text"
                value={diagPost}
                onChange={(e) => setDiagPost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Cirujano Principal</label>
              <input
                type="text"
                value={cirujano}
                onChange={(e) => setCirujano(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Procedimiento Realizado</label>
              <input
                type="text"
                value={procedimiento}
                onChange={(e) => setProcedimiento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Hallazgos Quirúrgicos & Descripción de Técnica</label>
              <textarea
                value={hallazgos}
                onChange={(e) => setHallazgos(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="text-slate-400 font-semibold">Pérdida Hemática Estimada (mL):</label>
              <input
                type="number"
                value={sangreMl}
                onChange={(e) => setSangreMl(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="conteoGasasOk"
                checked={conteoGasasOk}
                onChange={(e) => setConteoGasasOk(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <label htmlFor="conteoGasasOk" className="text-slate-300 font-semibold cursor-pointer">
                Conteo Completo de Gasas, Compresas e Instrumental Verificado OK
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Clavien-Dindo Complicaciones */}
      {activeTab === "COMPLICACIONES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Clasificación Clavien-Dindo de Complicaciones Quirúrgicas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Categorización estándar internacional de eventos adversos postoperatorios.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddComp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Complicación
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Grado Clavien-Dindo (I al V)</label>
              <select
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {CLAVIEN_DINDO_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Descripción de la Complicación & Manejo</label>
              <textarea
                value={descComp}
                onChange={(e) => setDescComp(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="reintervencion"
                checked={reintervencion}
                onChange={(e) => setReintervencion(e.target.checked)}
                className="w-4 h-4 accent-red-500 rounded"
              />
              <label htmlFor="reintervencion" className="text-slate-300 font-semibold cursor-pointer">
                Requirió Reintervención Quirúrgica o Endoscópica
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
