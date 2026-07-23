"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { DicomViewer } from "@/components/dicom/dicom-viewer";
import {
  Heart,
  Activity,
  Calculator,
  LineChart,
  CheckCircle2,
  Zap,
  TrendingDown,
  AlertTriangle,
  Stethoscope,
  Pill,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  disabled?: boolean;
  initialData?: any;
}

export function CardiologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId = "sandbox-demo-pat" }: Props) {
  const [activeTab, setActiveTab] = useState<"LONGITUDINAL" | "EKG" | "ECOCARDIOGRAMA" | "CALCULADORAS">("LONGITUDINAL");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbEkg, refetch: refetchEkg } = (trpc.cardio.getEkg.useQuery as any)({ encounterId });
  const { data: dbEcho, refetch: refetchEcho } = (trpc.cardio.getEcho.useQuery as any)({ encounterId });
  const { data: dbRisk, refetch: refetchRisk } = (trpc.cardio.getRiskScores.useQuery as any)({ encounterId });
  const { data: dbLongitudinal } = (trpc.cardio.getPatientLongitudinalData.useQuery as any)({ patientRegistrationId });

  const saveEkgMut = (trpc.cardio.saveEkg.useMutation as any)({ onSuccess: () => refetchEkg() });
  const saveEchoMut = (trpc.cardio.saveEcho.useMutation as any)({ onSuccess: () => refetchEcho() });
  const saveRiskMut = (trpc.cardio.saveRiskScores.useMutation as any)({ onSuccess: () => refetchRisk() });

  // EKG State
  const [ritmo, setRitmo] = useState("Sinusal Normal");
  const [fc, setFc] = useState(72);
  const [eje, setEje] = useState(45);
  const [pr, setPr] = useState(160);
  const [qrs, setQrs] = useState(88);
  const [qtc, setQtc] = useState(410);
  const [stSegment, setStSegment] = useState("Isoeléctrico");
  const [ondaT, setOndaT] = useState("Positiva en derivaciones izquierdas");
  const [ekgConclusion, setEkgConclusion] = useState("EKG dentro de límites normales.");

  // Echo State
  const [fevi, setFevi] = useState(62);
  const [metodoFevi, setMetodoFevi] = useState("Simpson Biplano");
  const [ddvi, setDdvi] = useState(48);
  const [dsvi, setDsvi] = useState(30);
  const [septum, setSeptum] = useState(10);
  const [paredPosterior, setParedPosterior] = useState(9);
  const [auriculaIzquierda, setAuriculaIzquierda] = useState(34);
  const [psap, setPsap] = useState(22);
  const [motilidadPared, setMotilidadPared] = useState("Normocinesia parietal global");
  const [echoConclusion, setEchoConclusion] = useState("Ecocardiograma Doppler normal.");

  // Calculadoras State
  const [score2Val, setScore2Val] = useState(6.8);
  const [ascvdVal, setAscvdVal] = useState(8.5);
  const [cha2ds2Score, setCha2ds2Score] = useState(2);
  const [hasBledScore, setHasBledScore] = useState(1);
  const [riskObs, setRiskObs] = useState("Fumador, Hipertensión controlada.");

  useEffect(() => {
    if (dbEkg) {
      setRitmo(dbEkg.ritmo);
      setFc(dbEkg.frecuenciaCardiaca);
      if (dbEkg.ejeQrs) setEje(dbEkg.ejeQrs);
      if (dbEkg.intervaloPr) setPr(dbEkg.intervaloPr);
      if (dbEkg.duracionQrs) setQrs(dbEkg.duracionQrs);
      if (dbEkg.intervaloQtc) setQtc(dbEkg.intervaloQtc);
      if (dbEkg.segmentoSt) setStSegment(dbEkg.segmentoSt);
      if (dbEkg.ondaT) setOndaT(dbEkg.ondaT);
      if (dbEkg.conclusion) setEkgConclusion(dbEkg.conclusion);
    }
  }, [dbEkg]);

  useEffect(() => {
    if (dbEcho) {
      setFevi(dbEcho.fevi);
      if (dbEcho.metodoFevi) setMetodoFevi(dbEcho.metodoFevi);
      if (dbEcho.ddvi) setDdvi(dbEcho.ddvi);
      if (dbEcho.dsvi) setDsvi(dbEcho.dsvi);
      if (dbEcho.septum) setSeptum(dbEcho.septum);
      if (dbEcho.paredPosterior) setParedPosterior(dbEcho.paredPosterior);
      if (dbEcho.auriculaIzquierda) setAuriculaIzquierda(dbEcho.auriculaIzquierda);
      if (dbEcho.presionArterialPulmonar) setPsap(dbEcho.presionArterialPulmonar);
      if (dbEcho.motilidadPared) setMotilidadPared(dbEcho.motilidadPared);
      if (dbEcho.conclusion) setEchoConclusion(dbEcho.conclusion);
    }
  }, [dbEcho]);

  useEffect(() => {
    if (dbRisk) {
      if (dbRisk.score2Value) setScore2Val(dbRisk.score2Value);
      if (dbRisk.ascvdValue) setAscvdVal(dbRisk.ascvdValue);
      if (dbRisk.cha2ds2VascScore !== null) setCha2ds2Score(dbRisk.cha2ds2VascScore);
      if (dbRisk.hasBledScore !== null) setHasBledScore(dbRisk.hasBledScore);
      if (dbRisk.observaciones) setRiskObs(dbRisk.observaciones);
    }
  }, [dbRisk]);

  const handleSaveEkg = () => {
    saveEkgMut.mutate({
      encounterId,
      patientRegistrationId,
      ritmo,
      frecuenciaCardiaca: fc,
      ejeQrs: eje,
      intervaloPr: pr,
      duracionQrs: qrs,
      intervaloQtc: qtc,
      segmentoSt: stSegment,
      ondaT,
      conclusion: ekgConclusion,
    });
  };

  const handleSaveEcho = () => {
    saveEchoMut.mutate({
      encounterId,
      patientRegistrationId,
      fevi,
      metodoFevi,
      ddvi,
      dsvi,
      septum,
      paredPosterior,
      auriculaIzquierda,
      presionArterialPulmonar: psap,
      motilidadPared,
      conclusion: echoConclusion,
    });
  };

  const handleSaveRisk = () => {
    const score2Category = score2Val > 10 ? "Muy Alto" : score2Val > 5 ? "Alto" : "Moderado";
    const ascvdCategory = ascvdVal > 20 ? "Alto" : ascvdVal > 7.5 ? "Intermedio" : "Bajo";
    const cha2ds2Risk = cha2ds2Score >= 2 ? "Riesgo Alto (Anticoagulación ACOD Indicada)" : "Riesgo Bajo";

    saveRiskMut.mutate({
      encounterId,
      patientRegistrationId,
      score2Value: score2Val,
      score2Category,
      ascvdValue: ascvdVal,
      ascvdCategory,
      cha2ds2VascScore: cha2ds2Score,
      cha2ds2VascRisk: cha2ds2Risk,
      hasBledScore,
      observaciones: riskObs,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Cardiología</h3>
            <p className="text-xs text-slate-400">Flujograma Longitudinal, Calculadoras de Riesgo (SCORE2/ASCVD), EKG & Ecocardiograma</p>
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
          onClick={() => setActiveTab("LONGITUDINAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "LONGITUDINAL"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <LineChart className="w-3.5 h-3.5" /> Flujograma Longitudinal Comparativo
        </button>

        <button
          onClick={() => setActiveTab("CALCULADORAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CALCULADORAS"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadoras de Riesgo (SCORE2/ASCVD)
        </button>

        <button
          onClick={() => setActiveTab("EKG")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "EKG"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> EKG 12 Derivaciones
        </button>

        <button
          onClick={() => setActiveTab("ECOCARDIOGRAMA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ECOCARDIOGRAMA"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Ecocardiograma Doppler
        </button>
      </div>

      {/* Tab 1: Flujograma Longitudinal Comparativo */}
      {activeTab === "LONGITUDINAL" && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <LineChart className="w-4 h-4" /> Evolución Longitudinal (PA, Peso, Perfil Lipídico & Medicación)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Seguimiento comparativo temporal para evaluar respuesta al tratamiento antihipertensivo e hipolipemiante.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Presión Arterial vs Medicación */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                📈 Presión Arterial (mmHg) & Peso (kg)
              </h5>
              <div className="space-y-2">
                {dbLongitudinal?.vitalsHistory?.map((vh: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded border border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono">{vh.fecha}</span>
                    <div className="flex items-center gap-4 font-bold">
                      <span className="text-red-400">{vh.paSistolica}/{vh.paDiastolica} mmHg</span>
                      <span className="text-blue-400">{vh.peso} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perfil Lipídico */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                🧪 Perfil Lipídico Comparativo (mg/dL)
              </h5>
              <div className="space-y-2">
                {dbLongitudinal?.lipidsHistory?.map((lh: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded border border-slate-800 text-xs">
                    <span className="text-slate-400 font-mono">{lh.fecha}</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400 font-bold">LDL: {lh.ldl}</span>
                      <span className="text-slate-300">HDL: {lh.hdl}</span>
                      <span className="text-purple-400">TG: {lh.trigliceridos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Calculadoras de Riesgo */}
      {activeTab === "CALCULADORAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadoras de Riesgo Cardiovascular Integradas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estadificación SCORE2 ESC 2021, ASCVD AHA/ACC 10-yr y CHA₂DS₂-VASc para FA.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveRisk}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
            >
              Guardar Riesgo Cardiovascular
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {/* SCORE2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-amber-400">SCORE2 (ESC 2021) — 10 años</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Riesgo Calculado (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={score2Val}
                  onChange={(e) => setScore2Val(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {score2Val > 10 ? "🔴 Riesgo Muy Alto (Meta LDL < 55 mg/dL)" : "🟡 Riesgo Alto (Meta LDL < 70 mg/dL)"}
              </span>
            </div>

            {/* ASCVD */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-blue-400">ASCVD 10-Year (AHA/ACC)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Riesgo Aterosclerótico (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={ascvdVal}
                  onChange={(e) => setAscvdVal(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-blue-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {ascvdVal >= 7.5 ? "⚡ Indicación de Estatinas de Moderada/Alta Intensidad" : "🟢 Riesgo Limítrofe/Bajo"}
              </span>
            </div>

            {/* CHA2DS2-VASc */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-purple-400">CHA₂DS₂-VASc (Fibrilación Auricular)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Puntuación (0 - 9 pts):</label>
                <input
                  type="number"
                  value={cha2ds2Score}
                  onChange={(e) => setCha2ds2Score(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-purple-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {cha2ds2Score >= 2 ? "🩸 Anticoagulación Oral Recomendada (ACOD)" : "🟢 Sin necesidad de anticoagulación"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: EKG 12 Derivaciones */}
      {activeTab === "EKG" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Electrocardiograma de 12 Derivaciones
            </h4>
            <Button
              size="sm"
              onClick={handleSaveEkg}
              disabled={saveEkgMut.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs disabled:opacity-50"
            >
              {saveEkgMut.isPending ? "Guardando..." : "Guardar EKG"}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Ritmo Cardíaco</label>
              <select
                value={ritmo}
                onChange={(e) => setRitmo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Sinusal Normal">Sinusal Normal</option>
                <option value="Fibrilación Auricular (FA)">Fibrilación Auricular (FA)</option>
                <option value="Flutter Auricular">Flutter Auricular</option>
                <option value="Taquicardia Supraventricular">Taquicardia Supraventricular</option>
                <option value="Ritmo de Marcapasos">Ritmo de Marcapasos</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Frecuencia Cardíaca (bpm)</label>
              <input
                type="number"
                value={fc}
                onChange={(e) => setFc(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Eje QRS (grados °)</label>
              <input
                type="number"
                value={eje}
                onChange={(e) => setEje(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Intervalo PR (ms)</label>
              <input
                type="number"
                value={pr}
                onChange={(e) => setPr(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Duración QRS (ms)</label>
              <input
                type="number"
                value={qrs}
                onChange={(e) => setQrs(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Intervalo QTc (Bazett ms)</label>
              <input
                type="number"
                value={qtc}
                onChange={(e) => setQtc(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1 pt-2">
              <label className="font-semibold text-slate-300">Conclusión Diagnóstica EKG</label>
              <textarea
                value={ekgConclusion}
                onChange={(e) => setEkgConclusion(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Ecocardiograma Doppler */}
      {activeTab === "ECOCARDIOGRAMA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Ecocardiograma Transtorácico Doppler
            </h4>
            <Button
              size="sm"
              onClick={handleSaveEcho}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
            >
              Guardar Ecocardiograma
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-emerald-400">FEVI (%) - Fracción Eyección</label>
              <input
                type="number"
                value={fevi}
                onChange={(e) => setFevi(Number(e.target.value))}
                className="w-full bg-slate-900 border border-emerald-500/50 text-emerald-400 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Método de Medición</label>
              <input
                type="text"
                value={metodoFevi}
                onChange={(e) => setMetodoFevi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Diámetro Diastólico VI (DDVI mm)</label>
              <input
                type="number"
                value={ddvi}
                onChange={(e) => setDdvi(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grosor Septum (mm)</label>
              <input
                type="number"
                value={septum}
                onChange={(e) => setSeptum(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grosor Pared Posterior (mm)</label>
              <input
                type="number"
                value={paredPosterior}
                onChange={(e) => setParedPosterior(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">PSAP - Presión Pulmonar (mmHg)</label>
              <input
                type="number"
                value={psap}
                onChange={(e) => setPsap(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1 pt-2">
              <label className="font-semibold text-slate-300">Conclusión Ecocardiográfica</label>
              <textarea
                value={echoConclusion}
                onChange={(e) => setEchoConclusion(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PACS Native DICOM Viewer with CINE Multiframe */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Heart className="w-4 h-4" /> Visor DICOM PACS: Ecocardiogramas & Cateterismos (CINE Multiframe)
        </h4>
        <DicomViewer patientRegistrationId={patientRegistrationId} encounterId={encounterId} enableMultiframe={true} />
      </div>
    </div>
  );
}
