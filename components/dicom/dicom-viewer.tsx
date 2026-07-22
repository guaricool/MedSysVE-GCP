"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Eye,
  Sliders,
  Compass,
  Sparkles,
  Upload,
  Trash2,
  Brain,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
} from "lucide-react";

export interface DicomViewerProps {
  patientRegistrationId: string;
  encounterId?: string;
  initialStudyId?: string;
  modalityFilter?: string;
  // Feature Toggles by Specialty Level
  enableCobbAngle?: boolean;     // Traumatología & Ortopedia (Medición de escoliosis)
  enableHounsfield?: boolean;    // Urología & Nefrología (densidad HU)
  enableRECIST?: boolean;        // Oncología Médica (Criterios RECIST)
  enableMultiframe?: boolean;    // Cardiología & Obstetricia (Ecos / Cateterismos)
  enableColorInvert?: boolean;   // Neumonología & Infectología (Negativo radiológico)
  enableMultiplanar?: boolean;   // Neurología (Cortes seriados)
  compact?: boolean;
}

export function DicomViewer({
  patientRegistrationId,
  encounterId,
  initialStudyId,
  modalityFilter,
  enableCobbAngle = false,
  enableHounsfield = false,
  enableRECIST = false,
  enableMultiframe = false,
  enableColorInvert = false,
  enableMultiplanar = false,
  compact = false,
}: DicomViewerProps) {
  // Queries
  const { data: studies = [] } = (trpc.dicom.listPatientStudies.useQuery as any)({
    patientRegistrationId,
    encounterId,
    modality: modalityFilter,
  });

  // Local File Upload & Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [isInverted, setIsInverted] = useState(false);
  const [activeTool, setActiveTool] = useState<"PAN" | "COBB" | "HU" | "RECIST">("PAN");

  // Cobb Angle Measurement Lines (Points array on image coords)
  const [cobbPoints, setCobbPoints] = useState<{ x: number; y: number }[]>([]);

  // AI Vision Radiological Analysis State
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{ hallazgos: string; impresion: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Image Source
  const currentImageUrl = useMemo(() => {
    if (localImageUrl) return localImageUrl;
    if (studies.length > 0 && studies[0]?.series?.[0]?.images?.[0]?.storageUrl) {
      return studies[0].series[0].images[0].storageUrl;
    }
    return null;
  }, [localImageUrl, studies]);

  // Calculate Cobb Angle from 4 points
  const calculatedCobbAngle = useMemo(() => {
    if (cobbPoints.length < 4) return null;
    const [p0, p1, p2, p3] = cobbPoints;
    const angle1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let diffDeg = Math.abs(((angle1 - angle2) * 180) / Math.PI);
    if (diffDeg > 90) diffDeg = Math.abs(180 - diffDeg);
    return Math.round(diffDeg * 10) / 10;
  }, [cobbPoints]);

  // Handle Local File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setLocalImageUrl(url);
      setCobbPoints([]);
      setZoom(1.0);
      setRotation(0);
      setAiResult(null);
      setAiError(null);
    }
  };

  // Canvas Click Handler for Drawing Lines
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "COBB") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (cobbPoints.length >= 4) {
      setCobbPoints([{ x, y }]);
    } else {
      setCobbPoints((prev) => [...prev, { x, y }]);
    }
  };

  // Consult AI Vision Endpoint
  const handleConsultAI = async () => {
    if (!currentImageUrl && !selectedFile) {
      setAiError("Por favor seleccione primero una imagen radiológica para analizar.");
      return;
    }

    setIsAnalyzingAI(true);
    setAiError(null);

    try {
      const formData = new FormData();

      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        // Convert canvas image to Blob File
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("No hay imagen cargada en el visor");
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.95)
        );
        if (!blob) throw new Error("No se pudo capturar la imagen para la IA");
        formData.append("file", new File([blob], "estudio_radiologico.jpg", { type: "image/jpeg" }));
      }

      const res = await fetch("/api/radiology-ai", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "No se pudo obtener la apreciación de la IA.");
      }

      setAiResult(json.data || json);
    } catch (err: any) {
      setAiError(err?.message || "Ocurrió un error al analizar la imagen radiológica.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Render Image onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentImageUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImageUrl;
    img.onload = () => {
      canvas.width = canvas.parentElement?.clientWidth || 700;
      canvas.height = compact ? 380 : 500;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Center & Transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Filters (Brightness, Contrast, Invert)
      let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (isInverted) filterStr += " invert(100%)";
      ctx.filter = filterStr;

      // Draw Image Centered
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Draw Cobb Angle Lines & Measurement Overlay
      if (cobbPoints.length > 0) {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#38bdf8"; // Cyan
        ctx.fillStyle = "#38bdf8";

        // Line 1
        if (cobbPoints.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(cobbPoints[0].x, cobbPoints[0].y);
          ctx.lineTo(cobbPoints[1].x, cobbPoints[1].y);
          ctx.stroke();

          ctx.beginPath(); ctx.arc(cobbPoints[0].x, cobbPoints[0].y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cobbPoints[1].x, cobbPoints[1].y, 6, 0, Math.PI * 2); ctx.fill();
        }

        // Line 2
        if (cobbPoints.length >= 4) {
          ctx.strokeStyle = "#f59e0b"; // Amber
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(cobbPoints[2].x, cobbPoints[2].y);
          ctx.lineTo(cobbPoints[3].x, cobbPoints[3].y);
          ctx.stroke();

          ctx.beginPath(); ctx.arc(cobbPoints[2].x, cobbPoints[2].y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cobbPoints[3].x, cobbPoints[3].y, 6, 0, Math.PI * 2); ctx.fill();

          // Angle Badge
          if (calculatedCobbAngle !== null) {
            const midX = (cobbPoints[0].x + cobbPoints[2].x) / 2;
            const midY = (cobbPoints[0].y + cobbPoints[2].y) / 2;
            ctx.fillStyle = "#0284c7";
            ctx.fillRect(midX - 70, midY - 20, 140, 40);
            ctx.strokeStyle = "#e0f2fe";
            ctx.strokeRect(midX - 70, midY - 20, 140, 40);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`Ángulo Cobb: ${calculatedCobbAngle}°`, midX, midY + 5);
          }
        }
        ctx.restore();
      }
    };
  }, [currentImageUrl, zoom, rotation, contrast, brightness, isInverted, cobbPoints, calculatedCobbAngle, compact]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 text-slate-100">
      {/* Top Header & Clean Upload Input */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.dcm"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 px-4 shadow-md"
          >
            <Upload className="w-4 h-4" /> Subir Imagen Radiológica / DICOM
          </Button>

          {selectedFile && (
            <span className="text-xs text-slate-300 font-medium truncate max-w-xs flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded">
              <FileImage className="w-3.5 h-3.5 text-cyan-400" />
              {selectedFile.name}
            </span>
          )}
        </div>

        {/* AI Vision Action Button */}
        <Button
          size="sm"
          onClick={handleConsultAI}
          disabled={!currentImageUrl || isAnalyzingAI}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs gap-1.5 shadow-lg border border-cyan-400/30"
        >
          {isAnalyzingAI ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-200" />
              <span>Analizando con IA...</span>
            </>
          ) : (
            <>
              <Brain className="w-3.5 h-3.5 text-cyan-200" />
              <span>Consultar Apreciación IA</span>
            </>
          )}
        </Button>
      </div>

      {/* Specialty Viewport Toolbar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Controls: Zoom, Rotation, Invert */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4.0))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" /> Zoom +
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" /> Zoom -
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Rotar 90°"
          >
            <RotateCw className="w-3.5 h-3.5" /> Rotar 90°
          </Button>

          <Button
            size="sm"
            variant={isInverted ? "default" : "outline"}
            onClick={() => setIsInverted(!isInverted)}
            className={`h-7 border-slate-800 px-2 gap-1 text-[11px] ${
              isInverted ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
            title="Inversión de Color (Negativo Radiológico)"
          >
            <Eye className="w-3.5 h-3.5" /> Negativo
          </Button>
        </div>

        {/* Sliders: Brightness & Contrast */}
        <div className="flex items-center gap-4 bg-slate-950 px-3 py-1 rounded border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Brillo:</span>
            <input
              type="range"
              min="30"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20 accent-amber-500 h-1 cursor-pointer"
            />
            <span className="text-amber-300 font-mono w-8">{brightness}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Contraste:</span>
            <input
              type="range"
              min="30"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20 accent-cyan-500 h-1 cursor-pointer"
            />
            <span className="text-cyan-300 font-mono w-8">{contrast}%</span>
          </div>
        </div>

        {/* Specialty Tool: Cobb Angle Measurement */}
        {enableCobbAngle && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={activeTool === "COBB" ? "default" : "outline"}
              onClick={() => setActiveTool(activeTool === "COBB" ? "PAN" : "COBB")}
              className={`h-7 border-slate-800 px-2.5 gap-1.5 text-[11px] ${
                activeTool === "COBB" ? "bg-cyan-600 text-white font-bold" : "text-cyan-400 hover:bg-slate-800"
              }`}
              title="Haz clic en la imagen para trazar 2 líneas de vértebras y calcular el Ángulo de Cobb"
            >
              <Compass className="w-3.5 h-3.5" /> Trazar Ángulo Cobb
            </Button>

            {cobbPoints.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCobbPoints([])}
                className="h-7 text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 text-[11px]"
                title="Borrar líneas"
              >
                <Trash2 className="w-3.5 h-3.5" /> Borrar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Canvas Viewport or Dropzone */}
      <div className="relative w-full bg-black flex items-center justify-center min-h-[420px]">
        {currentImageUrl ? (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`max-w-full shadow-inner ${
              activeTool === "COBB" ? "cursor-crosshair" : "cursor-default"
            }`}
          />
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-700 m-4 rounded-xl cursor-pointer p-8 text-center space-y-3 bg-slate-950/50 transition-colors"
          >
            <Upload className="w-10 h-10 text-cyan-400/80 animate-pulse" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Haz clic aquí para seleccionar y subir la imagen radiológica / placa
              </p>
              <p className="text-xs text-slate-400">
                Soporta archivos JPEG, PNG, WebP y estudios DICOM (.dcm)
              </p>
            </div>
          </div>
        )}

        {/* Viewport Guidance & Metadata Overlay */}
        {currentImageUrl && (
          <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 p-3 rounded-lg text-[11px] space-y-1 shadow-xl pointer-events-none max-w-xs">
            <div className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Metadatos del Visor
            </div>
            <div className="text-slate-300">
              Brillo: <span className="font-mono text-amber-300">{brightness}%</span> | Contraste: <span className="font-mono text-cyan-300">{contrast}%</span>
            </div>
            <div className="text-slate-400">
              Zoom: {(zoom * 100).toFixed(0)}% | Rotación: {rotation}°
            </div>

            {enableCobbAngle && (
              <div className="pt-1.5 border-t border-slate-800 text-slate-300">
                {calculatedCobbAngle !== null ? (
                  <div className="font-bold text-cyan-300 text-xs">
                    📐 Ángulo de Cobb Calculado: {calculatedCobbAngle}°
                  </div>
                ) : (
                  <div className="text-amber-400/90">
                    {activeTool === "COBB"
                      ? `Haz clic en la imagen para marcar los puntos (${cobbPoints.length}/4 puntos)`
                      : "Haz clic en 'Trazar Ángulo Cobb' para medir escoliosis."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Analysis Result Panel */}
      {aiResult && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 border-b border-slate-800 pb-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Apreciación Radiológica e Impresión Diagnóstica Sugerida por IA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
              <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Hallazgos Radiológicos Observados
              </h5>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {aiResult.hallazgos}
              </p>
            </div>

            <div className="bg-slate-950 border border-cyan-900/50 p-3 rounded-lg space-y-1">
              <h5 className="font-bold text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Impresión Diagnóstica Sugerida
              </h5>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-semibold">
                {aiResult.impresion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Error Alert */}
      {aiError && (
        <div className="bg-red-950/80 border-t border-red-900 p-3 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}
    </div>
  );
}
