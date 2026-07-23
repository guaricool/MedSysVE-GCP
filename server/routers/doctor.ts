import { router, publicProcedure, protectedProcedure, doctorProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"
import { hashPassword, strongPasswordSchema } from "@/lib/password-policy"
import { rateLimit, getRequestIdentifier, LIMITERS } from "@/lib/rate-limit"
import { safeLog } from "@/lib/log-sanitizer"
import { headers } from "next/headers"
import { loadAllLegalDocs } from "@/lib/legal/load-legal"
import { encryptField, decryptField } from "@/lib/field-crypto"
import { verifyVerifiedToken } from "@/lib/otp"
import { ESPECIALIDADES_VE } from "@/lib/venezuela-specialties"
import { scrapeSacsMpps } from "@/server/utils/sacs-scraper"

// LOPDP Art. 25 — consentimiento expreso. All three required checkboxes
// must be true; we persist a ConsentAcceptance row for each so the doctor
// has a tamper-evident record of what they agreed to (and when).
const consentSchema = z.object({
  terminos: z.boolean().refine((v) => v === true, "Debes aceptar los Términos y Condiciones"),
  privacidad: z.boolean().refine((v) => v === true, "Debes aceptar la Política de Privacidad"),
  lopdp: z.boolean().refine((v) => v === true, "Debes aceptar el Consentimiento LOPDP"),
  cookies: z.boolean().default(false), // cookies is optional
})

export const doctorRouter = router({
  register: publicProcedure
    .input(z.object({
      cedula: z.string().min(6).max(10),
      nacionalidad: z.enum(["V", "E"]).default("V"),
      nombre: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
      segundoNombre: z.string().max(80).optional(),
      apellido: z.string().min(2).max(80).regex(/^[\p{L}\s\-']+$/u, "Solo letras y espacios"),
      segundoApellido: z.string().max(80).optional(),
      mppsMatricula: z.string().optional(),
      email: z.string().email().max(254),
      // Strong password policy enforced via reusable schema (min 12 chars,
      // mixed case, digit, symbol, not in common-passwords list).
      password: strongPasswordSchema,
      telefono: z.string().regex(/^[\d\s+\-()]{7,20}$/).optional(),
      especialidadPrincipal: z.enum(ESPECIALIDADES_VE as [string, ...string[]]),
      subEspecialidades: z.array(z.string()).max(20).default([]),
      workspaceNombre: z.string().min(2).max(120),
      workspaceEstado: z.string().min(2).max(60),
      workspaceCiudad: z.string().min(2).max(80),
      workspaceDireccion: z.string().max(250).optional(),
      workspaceTelefono: z.string().regex(/^[\d\s+\-()]{7,20}$/).optional(),
      /**
       * If provided, the new doctor joins the clinic identified by this
       * invitation code (the OWNER ClinicAdmin shares this code with new
       * doctors off-platform).
       */
      clinicInvitationCode: z.string().optional(),
      /**
       * Or if they select a public clinic, they can pass the clinicId.
       */
      clinicId: z.string().optional(),
      consent: consentSchema,
      /**
       * HMAC-signed token from `auth.verifyEmailOtp`. Required: ensures the
       * doctor actually owns the email address they claim. The token is
       * single-use (the underlying OTP row is marked consumed on issuance)
       * and expires 15 min after issue.
       */
      verifiedToken: z.string().min(20).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      // Per-IP rate limit: 3 registrations / hour per IP.
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const rl = await rateLimit({
        prefix: LIMITERS.register.prefix,
        identifier: ip,
        max: LIMITERS.register.max,
        windowSec: LIMITERS.register.windowSec,
      })
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Demasiados registros desde esta IP. Intente más tarde.",
        })
      }

      // Verify the OTP token — proves the user controls the email inbox.
      const claims = verifyVerifiedToken(input.verifiedToken)
      if (!claims.ok || claims.claims.purpose !== "EMAIL_VERIFY" || claims.claims.email !== input.email.toLowerCase().trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Debes verificar tu correo electrónico antes de registrarte. Solicita un nuevo código.",
        })
      }

      const emailLower = input.email.toLowerCase().trim()
      const existing = await ctx.db.doctor.findFirst({
        where: { OR: [{ cedula: input.cedula }, { email: emailLower }] },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existing.cedula === input.cedula
            ? "Ya existe un doctor registrado con esa cédula"
            : "Ya existe un doctor registrado con ese email",
        })
      }

      const passwordHash = await hashPassword(input.password)
      safeLog("info", "doctor.register_attempt", {
        email: emailLower.slice(0, 3) + "***",
        cedulaPrefix: input.cedula.slice(0, 3) + "***",
        ip: ip.slice(0, 8) + "***",
      })

      try {
        // Load all current legal doc versions + contentHashes so we can
        // record immutable ConsentAcceptance rows that point at the exact
        // text the doctor agreed to.
        const legalDocs = await loadAllLegalDocs()

        // Lookup-or-create the LegalVersion rows that match the markdown
        // files on disk. We do it inside the transaction so consent and
        // doctor creation are atomic.
        const legalVersionRecords = await Promise.all(
          legalDocs.map(async (d) => {
            const existing = await ctx.db.legalVersion.findUnique({
              where: { slug_version: { slug: d.slug, version: d.version } },
            })
            if (existing) return existing
            return ctx.db.legalVersion.create({
              data: {
                slug: d.slug,
                version: d.version,
                title: d.title,
                contentHash: d.contentHash,
                effectiveAt: d.effectiveAt,
              },
            })
          }),
        )

        const versionBySlug = new Map(legalVersionRecords.map((v) => [v.slug, v]))

        const [doctor, workspace] = await ctx.db.$transaction(async (tx) => {
          const doc = await tx.doctor.create({
            data: {
              cedula: input.cedula,
              nacionalidad: input.nacionalidad,
              nombre: input.nombre,
              segundoNombre: input.segundoNombre,
              nombreCifrado: encryptField(input.nombre),
              apellido: input.apellido,
              segundoApellido: input.segundoApellido,
              apellidoCifrado: encryptField(input.apellido),
              email: emailLower,
              passwordHash,
              telefono: input.telefono,
              telefonoCifrado: encryptField(input.telefono ?? null),
              especialidadPrincipal: input.especialidadPrincipal,
              subEspecialidades: input.subEspecialidades,
              mppsMatricula: input.mppsMatricula,
              isSacsVerified: true,
              isOnboardingComplete: true,
              currentLegalVersion: legalDocs
                .map((d) => `${d.slug}@${d.version}`)
                .join(";"),
            },
          })

          // ─── Clinic invitation resolution ────────────────────────────
          // If the doctor provided a clinicInvitationCode, look up the clinic
          // and bind this doctor's new workspace to it. The Doctor is NOT
          // the clinic admin — that's a separate `ClinicAdmin` row created
          // via `clinicAdmin.register`. The doctor here is just a member
          // physician.
          let clinicId: string | null = null
          if (input.clinicInvitationCode) {
            // Must verify against ClinicInvitationCode model
            const codeRecord = await tx.clinicInvitationCode.findUnique({
              where: { code: input.clinicInvitationCode },
              include: { clinic: true },
            })
            if (!codeRecord || codeRecord.used || !codeRecord.clinic.activa) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "El código de invitación no es válido, ya fue usado o la clínica está inactiva.",
              })
            }
            clinicId = codeRecord.clinicId
            
            // Mark as used
            await tx.clinicInvitationCode.update({
              where: { id: codeRecord.id },
              data: { used: true, usedById: doc.id }
            })
          } else if (input.clinicId) {
             const clinic = await tx.clinic.findUnique({
               where: { id: input.clinicId },
               select: { id: true, activa: true },
             })
             if (!clinic || !clinic.activa) {
               throw new TRPCError({
                 code: "BAD_REQUEST",
                 message: "La clínica seleccionada no es válida o está inactiva.",
               })
             }
             clinicId = clinic.id
          }

          const ws = await tx.workspace.create({
            data: {
              nombre: input.workspaceNombre,
              nombreCifrado: encryptField(input.workspaceNombre),
              estado: input.workspaceEstado,
              ciudad: input.workspaceCiudad,
              direccion: input.workspaceDireccion,
              direccionCifrada: encryptField(input.workspaceDireccion ?? null),
              telefono: input.workspaceTelefono,
              telefonoCifrado: encryptField(input.workspaceTelefono ?? null),
              doctorId: doc.id,
              clinicId,
            },
          })

          // If this doctor joined an existing clinic, create the affiliation row.
          // Role = OWNER if this is the very first doctor in the clinic (e.g. a
          // clinic was created and immediately a doctor joined before any other
          // physician — the OWNER ClinicAdmin role is separate from this). For
          // subsequent doctors joining, role = STAFF.
          if (clinicId) {
            const existingAffs = await tx.doctorClinicAffiliation.count({
              where: { clinicId, activo: true },
            })
            await tx.doctorClinicAffiliation.create({
              data: {
                doctorId: doc.id,
                clinicId,
                rol: existingAffs === 0 ? "OWNER" : "STAFF",
                activo: true,
              },
            })
            safeLog("info", "doctor.joined_clinic", {
              doctorId: doc.id,
              clinicId,
              role: existingAffs === 0 ? "OWNER" : "STAFF",
              seatNumber: existingAffs + 1,
            })
          }

          // Write one ConsentAcceptance row per legal doc the user agreed to.
          // Required (terms, privacy, lopdp) and optional (cookies).
          const acceptances = [
            { slug: "terminos", accepted: input.consent.terminos },
            { slug: "privacidad", accepted: input.consent.privacidad },
            { slug: "cookies", accepted: input.consent.cookies },
            { slug: "lopdp-consentimiento", accepted: input.consent.lopdp },
          ]

          for (const a of acceptances) {
            if (!a.accepted) continue
            const lv = versionBySlug.get(a.slug)
            if (!lv) continue
            await tx.consentAcceptance.create({
              data: {
                doctorId: doc.id,
                legalVersionId: lv.id,
                slug: a.slug,
                version: lv.version,
                ip: ip.slice(0, 8) + "***",
                userAgent: hdrs.get("user-agent")?.slice(0, 500) ?? null,
                explicit: true,
              },
            })
          }

          return [doc, ws] as const
        })

        safeLog("info", "doctor.registered_with_consent", {
          doctorId: doctor.id,
          consentsGiven: [
            input.consent.terminos && "terminos",
            input.consent.privacidad && "privacidad",
            input.consent.cookies && "cookies",
            input.consent.lopdp && "lopdp",
          ].filter(Boolean),
        })

        return { doctorId: doctor.id, workspaceId: workspace.id }
      } catch (e: unknown) {
        // P2002 = unique constraint violation (race condition)
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code: string }).code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un doctor registrado con esa cédula o email",
          })
        }
        throw e
      }
    }),

  especialidades: publicProcedure.query(() => ESPECIALIDADES_VE),

  verifySacs: publicProcedure
    .input(
      z.object({
        cedula: z.string().min(4).max(12),
        nacionalidad: z.enum(["V", "E"]).default("V"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await scrapeSacsMpps(input.cedula, input.nacionalidad)
      return result
    }),

  completeOnboarding: doctorProcedure
    .input(
      z.object({
        nacionalidad: z.enum(["V", "E"]).default("V"),
        segundoNombre: z.string().max(80).optional(),
        segundoApellido: z.string().max(80).optional(),
        rif: z.string().regex(/^[VJEGvjeg]-?\d{7,9}-?\d$|^[VJEGvjeg]\d{8,9}$/, "Formato de RIF no válido (ej: V-12345678-0)"),
        mppsMatricula: z.string().min(3, "Ingresa tu número de Matrícula MPPS"),
        especialidadPrincipal: z.string().min(2, "Selecciona tu especialidad principal"),
        subEspecialidades: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doctorId = ctx.session.doctorId
      const cleanRif = input.rif.trim().toUpperCase()

      const updated = await ctx.db.doctor.update({
        where: { id: doctorId },
        data: {
          nacionalidad: input.nacionalidad,
          segundoNombre: input.segundoNombre?.trim() || null,
          segundoApellido: input.segundoApellido?.trim() || null,
          rif: cleanRif,
          rifCifrado: encryptField(cleanRif),
          mppsMatricula: input.mppsMatricula.trim(),
          especialidadPrincipal: input.especialidadPrincipal,
          subEspecialidades: input.subEspecialidades,
          isSacsVerified: true,
          isOnboardingComplete: true,
        },
      })

      return {
        success: true,
        doctorId: updated.id,
        isOnboardingComplete: updated.isOnboardingComplete,
      }
    }),

  searchPublicClinics: publicProcedure
    .input(
      z.object({
        estado: z.string().min(2).max(60).optional(),
        ciudad: z.string().min(2).max(80).optional(),
        query: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { estado, ciudad, query } = input
      
      const q = query?.trim()

      return ctx.db.clinic.findMany({
        where: {
          activa: true,
          ...(estado ? { estado: estado.trim() } : {}),
          ...(ciudad ? { ciudad: ciudad.trim() } : {}),
          ...(q ? {
             nombre: { contains: q, mode: "insensitive" }
          } : {})
        },
        select: {
          id: true,
          nombre: true,
          estado: true,
          ciudad: true,
        },
        take: 50,
        orderBy: { nombre: "asc" }
      })
    }),

  searchForReferral: protectedProcedure
    .input(
      z.object({
        query: z.string().min(0).max(100).default(""),
        estado: z.string().min(2).max(60).optional(),
        ciudad: z.string().min(2).max(80).optional(),
        // Carlos pidió (2026-07-01): que la UI filtre también por especialidad.
        // El frontend lo usa para acotar la lista cuando el médico ya eligió
        // la especialidad del destinatario (cardiología, pediatría, etc).
        // Si NO viene, el backend devuelve doctores de cualquier especialidad
        // en la zona — útil para derivar la lista de especialidades disponibles.
        especialidad: z.string().min(2).max(80).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // ─── Location-aware filtering ───────────────────────────────────────
      // Carlos pidió: al referir un paciente, el doctor debe poder filtrar
      // por estado+ciudad para NO mezclar doctores de zonas distantes
      // (ej: Maracaibo/Zulia vs Ciudad Bolívar/Bolívar son extremos opuestos
      // del país). Si estado+ciudad vienen, los usamos para hacer JOIN con
      // Workspace y filtrar a doctores que efectivamente trabajan ahí.
      //
      // Si NO vienen, caemos al search global por nombre/especialidad (back
      // compat). Si la búsqueda falla por ubicación faltante del doctor
      // objetivo, igual lo mostramos — el referidor decide si es razonable.
      const estadoFilter = input.estado?.trim()
      const ciudadFilter = input.ciudad?.trim()
      const especialidadFilter = input.especialidad?.trim()
      const q = input.query.trim()

      // Find eligible doctor IDs by joining through Workspace.estado/ciudad.
      let workspaceDoctorIds: string[] | undefined
      if (estadoFilter || ciudadFilter) {
        const ws = await ctx.db.workspace.findMany({
          where: {
            estado: estadoFilter || undefined,
            ciudad: ciudadFilter || undefined,
            doctorId: { not: ctx.session.doctorId },
          },
          select: { doctorId: true },
          distinct: ["doctorId"],
        })
        workspaceDoctorIds = ws.map((w) => w.doctorId)
        if (workspaceDoctorIds.length === 0) {
          // No matches in that location — return empty rather than fall
          // through to global search (would defeat the purpose of filtering).
          return []
        }
      }

      return ctx.db.doctor.findMany({
        where: {
          id: {
            not: ctx.session.doctorId,
            ...(workspaceDoctorIds ? { in: workspaceDoctorIds } : {}),
          },
          ...(especialidadFilter
            ? {
                especialidadPrincipal: {
                  equals: especialidadFilter,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(q
            ? {
                OR: [
                  { nombre: { contains: q, mode: "insensitive" } },
                  { apellido: { contains: q, mode: "insensitive" } },
                  { especialidadPrincipal: { contains: q, mode: "insensitive" } },
                  { cedula: { contains: q } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          especialidadPrincipal: true,
          subEspecialidades: true,
          workspaces: {
            select: {
              estado: true,
              ciudad: true,
              clinic: { select: { id: true, nombre: true } },
            },
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
        take: 20,
      })
    }),

  myProfile: doctorProcedure.query(async ({ ctx }) => {
    const doc = await ctx.db.doctor.findUnique({
      where: { id: ctx.session.doctorId },
      select: {
        id: true,
        prefijo: true,
        nombre: true,
        segundoNombre: true,
        apellido: true,
        segundoApellido: true,
        cedula: true,
        cedulaCifrada: true,
        nacionalidad: true,
        mppsMatricula: true,
        isSacsVerified: true,
        isOnboardingComplete: true,
        especialidadPrincipal: true,
        subEspecialidades: true,
        bio: true,
        idiomas: true,
        fotoUrl: true,
        selloUrl: true,
        rif: true,
        rifCifrado: true,
        // Subscription state — read by SubscriptionCard to show Premium vs Free.
        // The Stripe webhook writes stripeSubscriptionId on
        // checkout.session.completed; checking that field (instead of a
        // hypothetical billingStatus) is the source of truth.
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        plan: true,
      },
    })
    if (!doc) return null
    return {
      ...doc,
      cedula: doc.cedula || (doc.cedulaCifrada ? decryptField(doc.cedulaCifrada) : null),
      rif: doc.rif || (doc.rifCifrado ? decryptField(doc.rifCifrado) : null),
    }
  }),

  updateProfile: doctorProcedure
    .input(z.object({
      prefijo: z.enum(["Dr.", "Dra."]).optional(),
      especialidadPrincipal: z.string().optional(),
      subEspecialidades: z.array(z.string()).optional(),
      bio: z.string().max(2000).optional(),
      idiomas: z.array(z.string()).optional(),
      fotoUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.doctor.update({
        where: { id: ctx.session.doctorId },
        data: {
          prefijo: input.prefijo,
          especialidadPrincipal: input.especialidadPrincipal,
          subEspecialidades: input.subEspecialidades,
          bio: input.bio,
          idiomas: input.idiomas,
          fotoUrl: input.fotoUrl,
        },
      })
    }),

  updateSello: doctorProcedure
    .input(z.object({
      selloUrl: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.doctor.update({
        where: { id: ctx.session.doctorId },
        data: {
          selloUrl: input.selloUrl,
        },
      })
    }),

  /**
   * Record the doctor's acceptance of one or more legal documents.
   * Creates ConsentAcceptance rows + updates Doctor.currentLegalVersion
   * to the combined signature of all CURRENT versions (matching the
   * format used by /app/(dashboard)/require-legal-acceptance.tsx).
   *
   * Called from the LegalAcceptanceGate component when the doctor
   * clicks "Aceptar y continuar". Idempotent: re-running with the
   * same slugs just inserts additional ConsentAcceptance rows
   * (audit trail preserved).
   */
  acceptLegal: doctorProcedure
    .input(
      z.object({
        acceptances: z
          .array(z.object({ slug: z.string() }))
          .min(1)
          .max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doctorId = ctx.session.doctorId
      const hdrs = await headers()
      const ip =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        hdrs.get("x-real-ip") ??
        "unknown"
      const ua = hdrs.get("user-agent")?.slice(0, 500) ?? null

      const legalDocs = await loadAllLegalDocs()
      const latestBySlug = new Map(legalDocs.map((d) => [d.slug, d]))

      const acceptedRows: Array<{
        slug: string
        version: string
        legalVersionId: string
      }> = []
      for (const { slug: rawSlug } of input.acceptances) {
        const slug = rawSlug as "terminos" | "privacidad" | "cookies" | "lopdp-consentimiento"
        const latest = latestBySlug.get(slug)
        if (!latest) continue
        // Lookup-or-create — matches the pattern in the register flow so a
        // freshly-edited legal doc (new version) gets a LegalVersion row the
        // moment a doctor accepts it, without a separate admin migration.
        const lv =
          (await ctx.db.legalVersion.findUnique({
            where: { slug_version: { slug, version: latest.version } },
          })) ??
          (await ctx.db.legalVersion.create({
            data: {
              slug,
              version: latest.version,
              title: latest.title,
              contentHash: latest.contentHash,
              effectiveAt: latest.effectiveAt,
            },
          }))
        acceptedRows.push({ slug, version: latest.version, legalVersionId: lv.id })
      }

      if (acceptedRows.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ningún slug correspondía a un documento legal vigente.",
        })
      }

      await ctx.db.$transaction(async (tx) => {
        for (const row of acceptedRows) {
          await tx.consentAcceptance.create({
            data: {
              doctorId,
              legalVersionId: row.legalVersionId,
              slug: row.slug,
              version: row.version,
              ip: ip.includes(":")
                ? ip.split(":").slice(0, 3).join(":") + ":0:0:0:0:0"
                : (() => {
                    const p = ip.split(".")
                    return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : ip
                  })(),
              userAgent: ua,
              explicit: true,
            },
          })
        }

        // Update the doctor's cursor to the combined signature of all
        // CURRENT versions. This matches loadAllLegalDocs() format.
        const currentSignature = legalDocs
          .map((d) => `${d.slug}@${d.version}`)
          .sort()
          .join(";")

        await tx.doctor.update({
          where: { id: doctorId },
          data: { currentLegalVersion: currentSignature },
        })

        // Audit each acceptance (LOPDP Art. 32).
        for (const row of acceptedRows) {
          await tx.auditEvent.create({
            data: {
              workspaceId: ctx.session.workspaceId,
              actorId: doctorId,
              actorRole: "DOCTOR",
              action: "LEGAL_CONSENT_ACCEPTED",
              resourceType: "LegalVersion",
              resourceId: row.legalVersionId,
              outcome: "ALLOWED",
              channel: "UI",
              metadata: {
                slug: row.slug,
                version: row.version,
                explicit: true,
              },
            },
          })
        }
      })

      safeLog("info", "doctor.accepted_legal_terms", {
        doctorId,
        slugs: acceptedRows.map((r) => r.slug),
      })

      return {
        accepted: acceptedRows.length,
        currentLegalVersion: legalDocs.map((d) => `${d.slug}@${d.version}`).sort().join(";"),
      }
    }),
})
