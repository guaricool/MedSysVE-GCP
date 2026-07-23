"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

interface CompleteProfileBannerProps {
  doctorName?: string;
  hasMpps?: boolean;
  hasRif?: boolean;
}

export function CompleteProfileBanner({
  doctorName,
  hasMpps = false,
  hasRif = false,
}: CompleteProfileBannerProps) {
  if (hasMpps && hasRif) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg shrink-0 mt-0.5 md:mt-0">
          <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            Perfil Médico Pendiente por Completar
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {doctorName ? `Estimado(a) Dr(a). ${doctorName}: ` : ""}
            Para emitir récipe médico digital, órdenes de laboratorio/imágenes e informes firmados conforme al MPPS, debes registrar tu{" "}
            {!hasMpps && <strong className="text-amber-200">Matrícula MPPS</strong>}
            {!hasMpps && !hasRif && " y "}
            {!hasRif && <strong className="text-amber-200">RIF Fiscal</strong>}.
          </p>
        </div>
      </div>

      <Link
        href="/doctor/complete-profile"
        className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 shadow-md hover:shadow-amber-500/20"
      >
        <span>Completar mi perfil</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
