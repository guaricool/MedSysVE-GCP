"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { ESPECIALIDADES_VE } from "@/lib/venezuela-specialties";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  Stethoscope,
  Search,
  ArrowRight,
} from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();

  // State
  const [nacionalidad, setNacionalidad] = useState<"V" | "E">("V");
  const [cedula, setCedula] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [rif, setRif] = useState("");
  const [mppsMatricula, setMppsMatricula] = useState("");
  const [especialidadPrincipal, setEspecialidadPrincipal] = useState(ESPECIALIDADES_VE[0] || "Medicina General");
  const [nombreCompletoSacs, setNombreCompletoSacs] = useState<string | null>(null);

  // Status & Validation
  const [isSacsVerified, setIsSacsVerified] = useState(false);
  const [sacsMessage, setSacsMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // tRPC Mutations
  const verifySacsMutation = trpc.doctor.verifySacs.useMutation({
    onSuccess: (data) => {
      if (data.encontrado) {
        setIsSacsVerified(true);
        if (data.segundoNombre) setSegundoNombre(data.segundoNombre);
        if (data.segundoApellido) setSegundoApellido(data.segundoApellido);
        if (data.matriculaMpps) setMppsMatricula(data.matriculaMpps);
        if (data.nombreCompleto) setNombreCompletoSacs(data.nombreCompleto);
        if (data.especialidades && data.especialidades.length > 0) {
          const matchedSpec = ESPECIALIDADES_VE.find((e) =>
            data.especialidades?.some((s) => s.toLowerCase().includes(e.toLowerCase()))
          );
          if (matchedSpec) setEspecialidadPrincipal(matchedSpec);
        }
        setSacsMessage(`✅ Credenciales verificadas con éxito en el SACS MPPS.`);
      } else {
        setIsSacsVerified(false);
        setSacsMessage(null);
        setFormError("⛔ Registro no permitido: La Cédula no figura en el Registro de Profesionales de la Salud del Ministerio de Salud (SACS MPPS).");
      }
    },
    onError: () => {
      setIsSacsVerified(false);
      setSacsMessage(null);
      setFormError("⛔ No se pudo conectar con el SACS MPPS para validar la cédula.");
    },
  });

  const completeOnboardingMutation = trpc.doctor.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push("/doctor/workspace");
    },
    onError: (err) => {
      setFormError(err.message || "Error al actualizar su perfil.");
    },
  });

  const handleVerifySacs = () => {
    if (!cedula.trim()) {
      setFieldErrors((prev) => ({ ...prev, cedula: true }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, cedula: false }));
    setSacsMessage(null);
    setFormError(null);
    verifySacsMutation.mutate({ cedula: cedula.trim(), nacionalidad });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: Record<string, boolean> = {};
    if (!rif.trim() || !/^[VJEGvjeg]-?\d{7,9}-?\d$|^[VJEGvjeg]\d{8,9}$/.test(rif.trim())) {
      errors.rif = true;
    }
    if (!mppsMatricula.trim()) {
      errors.mppsMatricula = true;
    }
    if (!especialidadPrincipal.trim()) {
      errors.especialidad = true;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Por favor complete todos los campos resaltados en rojo correctamente.");
      return;
    }

    setFieldErrors({});
    completeOnboardingMutation.mutate({
      nacionalidad,
      segundoNombre: segundoNombre.trim() || undefined,
      segundoApellido: segundoApellido.trim() || undefined,
      rif: rif.trim().toUpperCase(),
      mppsMatricula: mppsMatricula.trim(),
      especialidadPrincipal,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="space-y-3 text-center border-b border-slate-800 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Validación Sanitaria MPPS & Perfil Médico
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Para garantizar la seguridad de la historia clínica en Venezuela, valide su cédula ante el Ministerio de Salud (SACS MPPS) e ingrese su RIF fiscal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Verificación SACS MPPS */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              1. Verificación de Cédula ante el MPPS (SACS)
            </label>

            <div className="flex gap-2">
              <select
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value as "V" | "E")}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 font-bold focus:border-amber-400 focus:outline-none"
              >
                <option value="V">V - Venezolano</option>
                <option value="E">E - Extranjero</option>
              </select>

              <input
                type="text"
                placeholder="Ej. 12345678"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono ${
                  fieldErrors.cedula ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" : "border-slate-700 focus:border-amber-400"
                }`}
              />

              <button
                type="button"
                onClick={handleVerifySacs}
                disabled={verifySacsMutation.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {verifySacsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Verificar SACS
              </button>
            </div>

            {sacsMessage && (
              <div className="text-xs font-medium bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-300">
                {sacsMessage}
              </div>
            )}

            {nombreCompletoSacs && (
              <div className="text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-900/50 p-2.5 rounded-lg flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Nombre Oficial SACS: <strong>{nombreCompletoSacs}</strong></span>
              </div>
            )}
          </div>

          {/* 2. Nombres Adicionales (Opcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Segundo Nombre (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. María"
                value={segundoNombre}
                onChange={(e) => setSegundoNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Segundo Apellido (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Pérez"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Matrícula MPPS y RIF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Matrícula MPPS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" /> Matrícula MPPS (*)
              </label>
              <input
                type="text"
                placeholder="Ej. MPPS-88492 O 88492"
                value={mppsMatricula}
                onChange={(e) => setMppsMatricula(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono ${
                  fieldErrors.mppsMatricula ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "border-slate-700 focus:border-amber-400"
                }`}
              />
            </div>

            {/* RIF Fiscal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" /> RIF Fiscal (*)
              </label>
              <input
                type="text"
                placeholder="Ej. V-12345678-0 ó J-12345678-0"
                value={rif}
                onChange={(e) => setRif(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono ${
                  fieldErrors.rif ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "border-slate-700 focus:border-amber-400"
                }`}
              />
            </div>
          </div>

          {/* 3. Especialidad Médica */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-amber-400" /> Especialidad Médica Principal (*)
            </label>
            <select
              value={especialidadPrincipal}
              onChange={(e) => setEspecialidadPrincipal(e.target.value)}
              className={`w-full bg-slate-900 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none ${
                fieldErrors.especialidad ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "border-slate-700 focus:border-amber-400"
              }`}
            >
              {ESPECIALIDADES_VE.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>

          {/* Form Error Alert */}
          {formError && (
            <div className="bg-red-950/80 border border-red-900/80 p-3 rounded-lg text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={completeOnboardingMutation.isPending}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {completeOnboardingMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Completar Perfil y Activar Historia Clínica</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
