import { db } from "@/lib/db"
import { DoctorPlanManager } from "@/components/admin/doctorPlanManager"

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; plan?: string }>
}) {
  const { search, plan } = await searchParams

  const raw = await db.doctor.findMany({
    where: {
      ...(plan ? { plan } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { apellido: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      especialidadPrincipal: true,
      plan: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { workspaces: true } },
      workspaces: {
        take: 1,
        select: {
          _count: { select: { patientRegs: true, encounters: true } },
        },
      },
    },
  })

  const doctors = raw.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    apellido: d.apellido,
    email: d.email,
    especialidad: d.especialidadPrincipal ?? "",
    plan: d.plan,
    isAdmin: d.isAdmin,
    createdAt: d.createdAt,
    workspaces: d._count.workspaces,
    pacientes: d.workspaces[0]?._count.patientRegs ?? 0,
    encuentros: d.workspaces[0]?._count.encounters ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Gestión de Doctores</h2>
        <p className="text-slate-400 text-sm">{doctors.length} doctores registrados</p>
      </div>
      <DoctorPlanManager doctors={doctors} />
    </div>
  )
}
