import { db } from "@/lib/db"
import { differenceInYears } from "date-fns"
import { ShieldCheck, CheckCircle2, FileDown, Calendar, User, Building, Syringe } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ patientRegId: string }>
}

export const metadata = {
  title: "Verificación de Carné de Vacunación | MedSysVE",
  description: "Portal Oficial de Verificación de Inmunizaciones y Vacunas MedSysVE",
}

export default async function VerifyVaccinesPage({ params }: Props) {
  const { patientRegId } = await params

  if (patientRegId === "sandbox-demo-pat") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Certificado Auténtico Verificado
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Carné de Vacunación Digital</h1>
            <p className="text-slate-400 text-xs sm:text-sm">Demostración en Vivo en Sandbox MedSysVE</p>
          </div>

          {/* Patient Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Camila Pérez</h3>
                <p className="text-xs text-slate-400">C.I. V-33123456 · 5 años (Femenino)</p>
              </div>
              <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1 rounded-md text-xs font-semibold">
                6 Vacunas Registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-semibold">Vacuna</th>
                    <th className="p-2.5 font-semibold">Fecha</th>
                    <th className="p-2.5 font-semibold">Dosis</th>
                    <th className="p-2.5 font-semibold">Lote</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr><td className="p-2.5 font-medium text-white">BCG (Tuberculosis)</td><td className="p-2.5 text-slate-300">16/05/2021</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">BCG-99</td></tr>
                  <tr><td className="p-2.5 font-medium text-white">Hepatitis B (RN)</td><td className="p-2.5 text-slate-300">16/05/2021</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">HB-01</td></tr>
                  <tr><td className="p-2.5 font-medium text-white">Pentavalente (DPT+HepB+Hib)</td><td className="p-2.5 text-slate-300">15/07/2021</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">PENTA-44</td></tr>
                  <tr><td className="p-2.5 font-medium text-white">Polio IPV</td><td className="p-2.5 text-slate-300">15/07/2021</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">POL-12</td></tr>
                  <tr><td className="p-2.5 font-medium text-white">Rotavirus</td><td className="p-2.5 text-slate-300">15/07/2021</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">ROTA-88</td></tr>
                  <tr><td className="p-2.5 font-medium text-white">Trivalente Viral (SRP)</td><td className="p-2.5 text-slate-300">15/05/2022</td><td className="p-2.5 text-slate-300">1ra Dosis</td><td className="p-2.5 text-slate-400 font-mono">SRP-77</td></tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-center">
              <a
                href="/api/pdf/vaccine-carnet/sandbox-demo-pat"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md"
              >
                <FileDown className="w-4 h-4" /> Descargar Carné Oficial en PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const reg = await db.patientRegistration.findUnique({
    where: { id: patientRegId },
    include: {
      patient: true,
      vaccines: { orderBy: { fechaAplicacion: "asc" } },
      workspace: {
        include: { clinic: true, doctor: true },
      },
    },
  })

  if (!reg) {
    notFound()
  }

  const pat = reg.patient
  const doc = reg.workspace.doctor
  const clinic = reg.workspace.clinic
  const edad = differenceInYears(new Date(), new Date(pat.fechaNacimiento))

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Verification Status Card */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500" />

          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> CERTIFICADO OFICIAL VÁLIDO & AUTÉNTICO
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Carné Digital de Inmunización</h1>
            <p className="text-xs sm:text-sm text-slate-400">Verificado en la Red Oficial de Historia Clínica MedSysVE</p>
          </div>

          {/* Patient Details */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Paciente:</span>
              <span className="font-bold text-white text-sm">{pat.nombre} {pat.apellido}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Edad / Sexo:</span>
              <span className="font-semibold text-slate-200">{edad} años · {pat.sexo}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Médico Pediatra Emisor:</span>
              <span className="font-semibold text-slate-200">Dr. {doc.nombre} {doc.apellido}</span>
              {doc.mppsMatricula && <span className="block text-[10px] text-slate-400">MPPS: {doc.mppsMatricula}</span>}
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Centro de Salud / Clínica:</span>
              <span className="font-semibold text-slate-200">{clinic?.nombre || "Consultorio Médico Privado"}</span>
            </div>
          </div>

          {/* Vaccines Table */}
          <div className="space-y-2 text-left">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Syringe className="w-4 h-4 text-sky-400" /> Historial de Vacunas Aplicadas ({reg.vaccines.length})
            </h3>

            {reg.vaccines.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950 p-4 rounded-lg text-center">
                No hay vacunas registradas formalmente aún.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 font-semibold">Vacuna</th>
                      <th className="p-2.5 font-semibold">Fecha Aplicación</th>
                      <th className="p-2.5 font-semibold">Dosis</th>
                      <th className="p-2.5 font-semibold">Lote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reg.vaccines.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 font-medium text-white">{v.vacuna}</td>
                        <td className="p-2.5 text-slate-300 font-mono">
                          {new Date(v.fechaAplicacion).toLocaleDateString("es-VE", { year: "numeric", month: "2-digit", day: "2-digit" })}
                        </td>
                        <td className="p-2.5 text-slate-300">{v.dosis || "—"}</td>
                        <td className="p-2.5 text-slate-400 font-mono">{v.lote || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href={`/api/pdf/vaccine-carnet/${patientRegId}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              <FileDown className="w-4 h-4" /> Descargar Carné Oficial en PDF
            </a>
            <span className="text-[10px] text-slate-500">Emisión Electrónica MedSysVE · Verificación QR Segura</span>
          </div>
        </div>
      </div>
    </div>
  )
}
