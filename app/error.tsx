"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Error captured in App Router Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-lg">
        <AlertTriangle className="w-8 h-8 animate-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Ocurrió una interrupción inesperada
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          El sistema ha capturado este evento de forma segura. No se ha perdido información de sesión. Puedes reintentar la acción o volver al inicio.
        </p>
      </div>

      {error.digest && (
        <div className="bg-slate-900 border border-slate-800 rounded px-3 py-1 text-[11px] font-mono text-slate-500">
          ID Error: {error.digest}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar acción
        </button>

        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-all border border-slate-700"
        >
          <Home className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
