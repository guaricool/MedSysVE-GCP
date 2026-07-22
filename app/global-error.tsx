"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Error Crítico del Sistema</h1>
          <p className="text-sm text-slate-400">
            Se produjo un error global en la raíz de la aplicación. Por favor recarga la página.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar Aplicación
          </button>
        </div>
      </body>
    </html>
  );
}
