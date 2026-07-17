import { notFound } from "next/navigation"
import { createServerCaller } from "@/server/caller"

interface Props {
  params: Promise<{ slug: string }>
}

const DAYS: Record<string, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params
  const caller = await createServerCaller()

  let clinic: Awaited<ReturnType<typeof caller.clinicPublic.getBySlug>>
  try {
    clinic = await caller.clinicPublic.getBySlug({ slug })
  } catch {
    notFound()
  }

  const posts = await (caller.clinicPublic as any).getPosts({ clinicId: clinic.id }).catch(() => [] as any[])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center gap-4">
            {clinic.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.logoUrl}
                alt={clinic.nombre}
                className="h-16 w-16 rounded-lg object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{clinic.nombre}</h1>
              {clinic.descripcion && (
                <p className="mt-1 text-slate-400">{clinic.descripcion}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Contact info */}
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Información de contacto
          </h2>
          <dl className="space-y-2">
            {clinic.direccion && (
              <div className="flex gap-2 text-sm">
                <dt className="w-24 shrink-0 text-slate-500">Dirección</dt>
                <dd>{clinic.direccion}</dd>
              </div>
            )}
            {clinic.telefono && (
              <div className="flex gap-2 text-sm">
                <dt className="w-24 shrink-0 text-slate-500">Teléfono</dt>
                <dd>
                  <a href={`tel:${clinic.telefono}`} className="text-blue-400 hover:underline">
                    {clinic.telefono}
                  </a>
                </dd>
              </div>
            )}
            {clinic.email && (
              <div className="flex gap-2 text-sm">
                <dt className="w-24 shrink-0 text-slate-500">Correo</dt>
                <dd>
                  <a href={`mailto:${clinic.email}`} className="text-blue-400 hover:underline">
                    {clinic.email}
                  </a>
                </dd>
              </div>
            )}
            {clinic.rif && (
              <div className="flex gap-2 text-sm">
                <dt className="w-24 shrink-0 text-slate-500">RIF</dt>
                <dd>{clinic.rif}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Services */}
        {clinic.servicios.length > 0 && (
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Servicios
            </h2>
            <div className="flex flex-wrap gap-2">
              {clinic.servicios.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Doctors */}
        {clinic.affiliations.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Especialistas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {clinic.affiliations.map((aff) => (
                <div
                  key={aff.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4"
                >
                  {aff.doctor.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={aff.doctor.fotoUrl}
                      alt={`${aff.doctor.nombre} ${aff.doctor.apellido}`}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-lg font-semibold">
                      {aff.doctor.nombre[0]}
                      {aff.doctor.apellido[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Dr. {aff.doctor.nombre} {aff.doctor.apellido}
                    </p>
                    <p className="text-sm text-slate-400">{aff.doctor.especialidadPrincipal}</p>
                    {aff.doctor.subEspecialidades.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {aff.doctor.subEspecialidades.join(", ")}
                      </p>
                    )}
                    {aff.doctor.idiomas.length > 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        Idiomas: {aff.doctor.idiomas.join(", ")}
                      </p>
                    )}
                    {aff.doctor.bio && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{aff.doctor.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Noticias / Posts */}
        {(posts as any[]).length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Noticias y Anuncios
            </h2>
            <div className="space-y-4">
              {(posts as any[]).map((post: any) => (
                <article
                  key={post.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-5"
                >
                  {post.imagenUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imagenUrl}
                      alt={post.titulo}
                      className="mb-3 h-48 w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="text-base font-semibold text-white">{post.titulo}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(post.publicadoAt).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: 'America/Caracas',
                    })}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{post.contenido}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          Powered by MedSysVE · Sistema de Gestión Médica para Venezuela
        </footer>
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
