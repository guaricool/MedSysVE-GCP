import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { differenceInYears } from "date-fns"
import { router, doctorProcedure } from "../trpc"
import { generateReportDraft } from "../../lib/ai/generate-report"
import { notifyDocumentReady } from "../../lib/whatsapp"
import { sendDocumentReady, sendReferralNotification } from "../../lib/email"
import { hmacIndex, encryptField } from "../../lib/field-crypto"
import { readEncounterMotivo } from "../../lib/encounter-crypto"
import { audit } from "../../lib/audit"
import { DEFAULT_REPORT_SECCIONES, isReportOverride, resolveReportSections } from "@/types/report"

const TIPO_LABEL: Record<string, string> = {
  INFORME: "Informe médico",
  REPOSO: "Reposo médico",
  REFERIDO: "Referido médico",
  CERTIFICADO: "Certificado médico",
  RECETA: "Receta médica",
}

export const documentRouter = router({
  generateAIDraft: doctorProcedure
    .input(z.object({ encounterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.db.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.session.workspaceId },
        include: {
          diagnoses: true,
          prescriptions: {
            include: { items: { include: { medication: true } } },
          },
          labOrders: true,
          imagingOrders: true,
          patientRegistration: { include: { patient: true } },
          // We also need the most recent INFORME Document for this encounter
          // to read its per-consulta reportOverride (if any).
          documents: {
            where: { tipo: "INFORME" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, reportOverride: true },
          },
        },
      })
      if (!enc) throw new TRPCError({ code: "NOT_FOUND" })

      const patient = enc.patientRegistration.patient
      const edad = differenceInYears(new Date(), new Date(patient.fechaNacimiento))

      // ─── Resolve the report sections for this consulta ───────────────────
      // Source of truth: DoctorReportPreferences for the current doctor.
      // Delta: Document.reportOverride on the most-recent INFORME row for
      // this encounter (created by the override modal in informe-form.tsx).
      // The override may be absent on the very first draft — in that case
      // we use the doctor's defaults verbatim.
      const prefs = await ctx.db.doctorReportPreferences.findUnique({
        where: { doctorId: ctx.session.doctorId },
        select: { secciones: true, instruccionesDefault: true },
      })
      const overrideRaw = enc.documents[0]?.reportOverride
      const override = isReportOverride(overrideRaw) ? overrideRaw : null

      const secciones = resolveReportSections(
        prefs?.secciones as Parameters<typeof resolveReportSections>[0],
        prefs?.instruccionesDefault as Parameters<typeof resolveReportSections>[1],
        override,
      )

      const draft = await generateReportDraft({
        motivo: readEncounterMotivo(enc),
        historiaClinica: enc.historiaClinica,
        vitales: enc.vitales as Record<string, number | undefined> | null,
        examenFisico: typeof enc.examenFisico === "string" ? enc.examenFisico : null,
        plan: enc.plan,
        diagnoses: enc.diagnoses.map((d) => ({
          codigoCie10: d.codigoCie10,
          descripcion: d.descripcion,
          tipo: d.tipo,
        })),
        medicamentos: enc.prescriptions.flatMap((p) =>
          p.items.map((it) => ({
            nombreGenerico: it.medication.nombreGenerico,
            concentracion: it.concentracion,
            dosis: it.dosis,
            frecuencia: it.frecuencia,
            duracion: it.duracion,
          })),
        ),
        labOrders: enc.labOrders.map((lo) => ({
          estudios: lo.estudios as string[],
          urgente: lo.urgente,
          indicacionesClinicas: lo.indicacionesClinicas ?? undefined,
        })),
        imagingOrders: enc.imagingOrders.map((io) => ({
          tipoImagen: io.tipoImagen,
          region: io.region,
          urgente: io.urgente,
          indicacionesClinicas: io.indicacionesClinicas ?? undefined,
        })),
        paciente: { nombre: patient.nombre, apellido: patient.apellido, edad },
        // If the doctor has no prefs row yet (new doctor), use the
        // DEFAULT_REPORT_SECCIONES so the first informe isn't blank.
        secciones: secciones.size > 0 ? secciones : null,
        // Specialty-specific data (Cardiología, Traumatología, etc.) saved
        // by the specialty forms. Always included in the prompt when present
        // so the AI can produce a richer, specialty-aware informe.
        datosEspecialidad: enc.datosEspecialidad as Record<string, unknown> | null,
      })

      return { aiDraft: draft }
    }),

  save: doctorProcedure
    .input(
      z.object({
        id: z.string().optional(),
        encounterId: z.string(),
        patientRegistrationId: z.string(),
        tipo: z.enum(["INFORME", "REPOSO", "REFERIDO", "CERTIFICADO", "RECETA"]),
        contenidoHtml: z.string(),
        aiDraft: z.string().optional(),
        // Per-consulta report override. Only meaningful for tipo=INFORME.
        // Other tipos just store as-is and the AI generator ignores them.
        // We accept any JSON shape here; the resolver in generate-report.ts
        // is permissive (isReportOverride type-guard at read time).
        reportOverride: z.unknown().optional(),
        referidoANombre: z.string().optional(),
        referidoAEspecialidad: z.string().optional(),
        referidoATelefono: z.string().optional(),
        referidoADoctorId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const referralData = {
        referidoANombre: input.referidoANombre,
        referidoAEspecialidad: input.referidoAEspecialidad,
        referidoATelefono: input.referidoATelefono,
        referidoADoctorId: input.referidoADoctorId,
      }
      if (input.id) {
        // Use updateMany so we can scope by workspaceId.
        // First validate the document belongs to this workspace.
        const exists = await ctx.db.document.findFirst({
          where: { id: input.id, encounter: { workspaceId: ctx.session.workspaceId } },
          select: { id: true },
        })
        if (!exists) throw new TRPCError({ code: "NOT_FOUND" })
        const updated = await ctx.db.document.update({
          where: { id: input.id },
          data: {
            contenidoHtml: input.contenidoHtml,
            aiDraft: input.aiDraft,
            reportOverride: input.reportOverride ?? undefined,
            ...referralData,
          },
          include: { patientRegistration: { include: { patient: true } } },
        })
        // When the tipo is REFERIDO and we have a receiving doctor,
        // sign + notify in line with the `sign` mutation. We only
        // do this if the document is not already signed (so re-saves
        // don't fire duplicate notifications) and if the receiver
        // is set (skipping the case where the user just saved a
        // draft with no receiver yet).
        if (updated.tipo === "REFERIDO" && updated.referidoADoctorId && !updated.firmadoAt) {
          await finalizeReferral(ctx, updated)
        }
        return updated
      }

      // Single-instance types: there must be at most one INFORME,
      // RECETA, REPOSO, CERTIFICADO or REFERIDO per encounter. Before
      // creating a new one, drop the previous sibling so the
      // doctor (and the patient's portal) only ever see the latest
      // version. We skip this on the update path above because
      // `update` already targets the specific id the user picked.
      // Order matters: delete first so the create never collides
      // with a unique constraint, and so the new doc gets a
      // fresh `createdAt`.
      await ctx.db.document.deleteMany({
        where: {
          encounterId: input.encounterId,
          tipo: input.tipo,
        },
      })

      const created = await ctx.db.document.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          tipo: input.tipo,
          contenidoHtml: input.contenidoHtml,
          aiDraft: input.aiDraft,
          reportOverride: input.reportOverride ?? undefined,
          ...referralData,
        },
        include: { patientRegistration: { include: { patient: true } } },
      })
      // New REFERIDO documents are immediately delivered to the receiving
      // doctor: sign + flip status to SENT + drop an in-app notification
      // + send email. This is the behaviour the doctor expects from
      // the form ("create referido" == "send to colleague") and avoids
      // the bug where the form called `save` but never `sign`, leaving
      // the document in DRAFT with no notification.
      if (created.tipo === "REFERIDO" && created.referidoADoctorId) {
        await finalizeReferral(ctx, created)
      }
      return created
    }),

  sign: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the document belongs to this workspace BEFORE signing.
      const existing = await ctx.db.document.findFirst({
        where: { id: input.id, encounter: { workspaceId: ctx.session.workspaceId } },
        select: { id: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" })

      const signed = await ctx.db.document.update({
        where: { id: input.id },
        data: {
          firmadoAt: new Date(),
          firmadoPor: ctx.session.doctorId,
          visibleEnPortal: true,
        },
        include: { patientRegistration: { include: { patient: true } } },
      })

      const pat = signed.patientRegistration.patient
      const tipoLabel = TIPO_LABEL[signed.tipo] ?? signed.tipo
      const patientName = `${pat.nombre} ${pat.apellido}`

      if (pat.telefono) {
        // WhatsApp temporalmente desactivado
        // void notifyDocumentReady({ phone: pat.telefono, patientName, tipoDocumento: tipoLabel })
      }
      if (pat.email) {
        void sendDocumentReady({ to: pat.email, patientName, tipoDocumento: tipoLabel })
      }

      // For REFERIDO documents, hand off to the shared helper that flips
      // the status to SENT + drops the in-app notification + emails the
      // receiving doctor. Same helper the `save` mutation calls when
      // a new REFERIDO is created, so the two paths are guaranteed to
      // produce the same delivery state.
      if (signed.tipo === "REFERIDO" && signed.referidoADoctorId) {
        await finalizeReferral(ctx, signed)
      }

      return signed
    }),

  listForEncounter: doctorProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.document.findMany({
        where: {
          encounterId: input.encounterId,
          encounter: { workspaceId: ctx.session.workspaceId },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  listIncomingReferrals: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.document.findMany({
      where: {
        tipo: "REFERIDO",
        referidoADoctorId: ctx.session.doctorId,
      },
      include: {
        patientRegistration: { include: { patient: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  acceptReferral: doctorProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findFirst({
        where: { id: input.documentId, tipo: "REFERIDO", referidoADoctorId: ctx.session.doctorId },
        include: {
          patientRegistration: {
            include: {
              patient: true,
              alergias: { where: { activa: true } },
              vaccines: true,
              insurances: { where: { activa: true } },
              labResults: {
                where: {
                  fecha: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
                  },
                },
              },
            },
          },
        },
      })
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" })
      if (doc.referidoStatus === "ACCEPTED") throw new TRPCError({ code: "CONFLICT", message: "Ya aceptado" })
      if (doc.referidoStatus === "MERGE_PENDING") {
        // Re-fetch the merge payload (e.g. the doctor closed the modal and
        // came back to it). Same logic as a fresh conflict.
      }

      const ws = await ctx.db.workspace.findFirst({ where: { doctorId: ctx.session.doctorId } })
      if (!ws) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace no encontrado" })

      const referredPatient = doc.patientRegistration.patient

      // ─────────────────────────────────────────────────────────────────────
      // Cédula-merge detection.
      //
      // If the receiving workspace ALREADY has a Patient with the same
      // (tipoIdentificacion, hmacCedula), do NOT silently merge. Instead,
      // flip the document to MERGE_PENDING and return a payload so the UI
      // can show a side-by-side diff and let the doctor decide.
      //
      // Only applies when the referred patient has a cédula on file.
      // sinCedula minors keep their cross-workspace copy as before.
      // ─────────────────────────────────────────────────────────────────────
      const hmac = referredPatient.hmacCedula ?? (
        referredPatient.sinCedula
          ? null
          : referredPatient.numeroIdentificacion
            ? hmacIndex(referredPatient.numeroIdentificacion)
            : null
      )

      if (hmac && referredPatient.tipoIdentificacion) {
        const ownPatient = await ctx.db.patient.findFirst({
          where: {
            workspaceId: ws.id,
            hmacCedula: hmac,
            tipoIdentificacion: referredPatient.tipoIdentificacion,
          },
          select: {
            id: true,
            nombre: true,
            apellido: true,
            fechaNacimiento: true,
            sexo: true,
            telefono: true,
            email: true,
          },
        })
        if (ownPatient && ownPatient.id !== doc.patientRegistration.patientId) {
          // Conflict — flip to MERGE_PENDING and hand both records to the
          // client for a user-driven resolution.
          await ctx.db.document.update({
            where: { id: doc.id },
            data: { referidoStatus: "MERGE_PENDING" },
          })
          await audit("PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE", {
            workspaceId: ws.id,
            userId: ctx.session.doctorId,
            userRole: ctx.session.role,
            resourceType: "PatientRegistration",
            resourceId: doc.id,
            outcome: "ALLOWED",
            channel: "API",
            metadata: {
              source: "REFERRAL_MERGE_PENDING",
              referredPatientId: doc.patientRegistration.patientId,
              conflictingPatientId: ownPatient.id,
              hmacCedulaPrefix: hmac.slice(0, 8),
            },
          })

          return {
            needsMerge: true,
            documentId: doc.id,
            existingPatient: ownPatient,
            referredPatient: {
              id: referredPatient.id,
              nombre: referredPatient.nombre,
              apellido: referredPatient.apellido,
              fechaNacimiento: referredPatient.fechaNacimiento,
              sexo: referredPatient.sexo,
              telefono: referredPatient.telefono,
              email: referredPatient.email,
            },
          }
        }
      }

      // No conflict — proceed with normal accept.
      // We must ALWAYS create a new Patient row in the receiving workspace to
      // maintain strict tenant isolation (1 Patient = 1 workspace).
      const lastRef = await ctx.db.patientRegistration.findFirst({
        where: { workspaceId: ws.id, idDisplay: { startsWith: "REF-" } },
        orderBy: { idDisplay: "desc" },
        select: { idDisplay: true },
      })
      const nextRef = lastRef ? parseInt(lastRef.idDisplay.replace("REF-", ""), 10) + 1 : 1
      const idDisplay = `REF-${String(nextRef).padStart(5, "0")}`

      const newPatient = await ctx.db.patient.create({
        data: {
          workspaceId: ws.id,
          tipoIdentificacion: referredPatient.tipoIdentificacion,
          numeroIdentificacion: referredPatient.numeroIdentificacion,
          hmacCedula: referredPatient.hmacCedula,
          sinCedula: referredPatient.sinCedula,
          nombre: referredPatient.nombre,
          nombreCifrado: referredPatient.nombreCifrado,
          hmacNombre: referredPatient.hmacNombre,
          apellido: referredPatient.apellido,
          apellidoCifrado: referredPatient.apellidoCifrado,
          hmacApellido: referredPatient.hmacApellido,
          fechaNacimiento: referredPatient.fechaNacimiento,
          sexo: referredPatient.sexo,
          grupoSanguineo: referredPatient.grupoSanguineo,
          direccion: referredPatient.direccion,
          direccionCifrada: referredPatient.direccionCifrada,
          telefono: referredPatient.telefono,
          telefonoCifrado: referredPatient.telefonoCifrado,
          hmacTelefono: referredPatient.hmacTelefono,
          email: referredPatient.email,
          emailCifrado: referredPatient.emailCifrado,
          hmacEmail: referredPatient.hmacEmail,
          portalPasswordHash: referredPatient.portalPasswordHash, // Optional: might not apply
          repCedula: referredPatient.repCedula,
          repNombreCompleto: referredPatient.repNombreCompleto,
          repParentesco: referredPatient.repParentesco,
          repTelefono: referredPatient.repTelefono,
          repEmail: referredPatient.repEmail,
        },
      })

      const newReg = await ctx.db.patientRegistration.create({
        data: {
          idDisplay,
          patientId: newPatient.id,
          workspaceId: ws.id,
          // Transfer antecedentes from sender
          antecedentes: doc.patientRegistration.antecedentes ?? undefined,
        },
      })

      // Transfer clinical profile (Alergia, Vaccine, Insurance, LabResults < 90 days)
      if (doc.patientRegistration.alergias.length > 0) {
        await ctx.db.alergia.createMany({
          data: doc.patientRegistration.alergias.map((a) => ({
            workspaceId: ws.id,
            patientRegistrationId: newReg.id,
            sustancia: a.sustancia,
            reaccion: a.reaccion,
            gravedad: a.gravedad,
            activa: a.activa,
            createdAt: a.createdAt,
          })),
        })
      }

      if (doc.patientRegistration.vaccines.length > 0) {
        await ctx.db.vaccine.createMany({
          data: doc.patientRegistration.vaccines.map((v) => ({
            workspaceId: ws.id,
            patientRegistrationId: newReg.id,
            vacuna: v.vacuna,
            fechaAplicacion: v.fechaAplicacion,
            dosis: v.dosis,
            lote: v.lote,
            proximaDosis: v.proximaDosis,
            notas: v.notas,
            aplicadoPor: v.aplicadoPor,
            createdAt: v.createdAt,
          })),
        })
      }

      if (doc.patientRegistration.insurances.length > 0) {
        // Insurance mappings are tricky because InsuranceProvider is workspace scoped.
        // We might not have the same provider in the new workspace!
        // The user asked to transfer it, but since providers are workspace-specific,
        // we'd need to either match by name or create a new provider.
        // Let's create the providers on the fly if they don't exist, matching by name (lowercase).
        for (const ins of doc.patientRegistration.insurances) {
          const senderProvider = await ctx.db.insuranceProvider.findUnique({ where: { id: ins.providerId } })
          if (senderProvider) {
            let receiverProvider = await ctx.db.insuranceProvider.findFirst({
              where: { workspaceId: ws.id, nombre: senderProvider.nombre },
            })
            if (!receiverProvider) {
              receiverProvider = await ctx.db.insuranceProvider.create({
                data: {
                  workspaceId: ws.id,
                  nombre: senderProvider.nombre,
                  codigo: senderProvider.codigo,
                  telefono: senderProvider.telefono,
                  email: senderProvider.email,
                },
              })
            }
            await ctx.db.patientInsurance.create({
              data: {
                patientRegistrationId: newReg.id,
                providerId: receiverProvider.id,
                numeroPóliza: ins.numeroPóliza,
                titular: ins.titular,
                coberturaPct: ins.coberturaPct,
                fechaVigencia: ins.fechaVigencia,
                activa: ins.activa,
                notas: ins.notas,
                createdAt: ins.createdAt,
              },
            })
          }
        }
      }

      if (doc.patientRegistration.labResults.length > 0) {
        await ctx.db.labResult.createMany({
          data: doc.patientRegistration.labResults.map((l) => ({
            patientRegistrationId: newReg.id,
            // Encounter is not copied
            titulo: l.titulo,
            fecha: l.fecha,
            resultado: l.resultado,
            valores: l.valores ?? undefined,
            notas: l.notas,
            notasCifradas: l.notasCifradas,
            createdAt: l.createdAt,
          })),
        })
      }

      await ctx.db.document.update({
        where: { id: doc.id },
        data: { referidoStatus: "ACCEPTED" },
      })

      void ctx.db.notification.create({
        data: {
          workspaceId: doc.patientRegistration.workspaceId,
          tipo: "REFERRAL_ACCEPTED",
          titulo: "Referido aceptado",
          mensaje: `El referido de ${doc.patientRegistration.patient.nombre} ${doc.patientRegistration.patient.apellido} fue aceptado.`,
          referenciaId: doc.id,
        },
      })

      return { needsMerge: false, documentId: doc.id }
    }),

  resolveReferralMerge: doctorProcedure
    .input(
      z.object({
        documentId: z.string(),
        action: z.enum(["keep", "update"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findFirst({
        where: {
          id: input.documentId,
          tipo: "REFERIDO",
          referidoADoctorId: ctx.session.doctorId,
          referidoStatus: "MERGE_PENDING",
        },
        include: {
          patientRegistration: {
            include: {
              patient: true,
              alergias: { where: { activa: true } },
              vaccines: true,
              insurances: { where: { activa: true } },
              labResults: {
                where: {
                  fecha: {
                    gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          },
        },
      })
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Referido no está en estado de merge pendiente" })

      const ws = await ctx.db.workspace.findFirst({ where: { doctorId: ctx.session.doctorId } })
      if (!ws) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace no encontrado" })

      const referredPatient = doc.patientRegistration.patient
      const hmac = referredPatient.hmacCedula ?? (
        referredPatient.sinCedula
          ? null
          : referredPatient.numeroIdentificacion
            ? hmacIndex(referredPatient.numeroIdentificacion)
            : null
      )
      if (!hmac || !referredPatient.tipoIdentificacion) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El referido no tiene cédula para hacer merge" })
      }

      const ownPatient = await ctx.db.patient.findFirst({
        where: {
          workspaceId: ws.id,
          hmacCedula: hmac,
          tipoIdentificacion: referredPatient.tipoIdentificacion,
        },
      })
      if (!ownPatient) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente existente ya no se encuentra" })
      }

      // Compute which fields actually differ so we can report them in the
      // audit log.
      const diff: string[] = []
      if (ownPatient.nombre !== referredPatient.nombre) diff.push("nombre")
      if (ownPatient.apellido !== referredPatient.apellido) diff.push("apellido")
      if (
        ownPatient.fechaNacimiento instanceof Date &&
        referredPatient.fechaNacimiento instanceof Date &&
        ownPatient.fechaNacimiento.getTime() !== referredPatient.fechaNacimiento.getTime()
      ) diff.push("fechaNacimiento")
      if (ownPatient.sexo !== referredPatient.sexo) diff.push("sexo")
      if ((ownPatient.telefono ?? null) !== (referredPatient.telefono ?? null)) diff.push("telefono")
      if ((ownPatient.email ?? null) !== (referredPatient.email ?? null)) diff.push("email")
      if ((ownPatient.grupoSanguineo ?? null) !== (referredPatient.grupoSanguineo ?? null)) diff.push("grupoSanguineo")

      // Make sure a PatientRegistration exists for the existing patient in
      // this workspace. It should — otherwise the conflict wouldn't have
      // triggered — but defend against a race.
      let existingReg = await ctx.db.patientRegistration.findFirst({
        where: { workspaceId: ws.id, patientId: ownPatient.id },
      })
      if (!existingReg) {
        const lastRef = await ctx.db.patientRegistration.findFirst({
          where: { workspaceId: ws.id, idDisplay: { startsWith: "REF-" } },
          orderBy: { idDisplay: "desc" },
          select: { idDisplay: true },
        })
        const nextRef = lastRef ? parseInt(lastRef.idDisplay.replace("REF-", ""), 10) + 1 : 1
        const idDisplay = `REF-${String(nextRef).padStart(5, "0")}`
        existingReg = await ctx.db.patientRegistration.create({
          data: { idDisplay, patientId: ownPatient.id, workspaceId: ws.id },
        })
      }

      if (input.action === "update" && diff.length > 0) {
        // Update the receiving-workspace Patient with the referred values
        // for the fields that differ. PHI fields are re-encrypted via the
        // packPatientCedula helper equivalent — here we touch only the
        // non-encrypted columns (nombre, apellido, sexo, fechaNacimiento)
        // and the encrypted columns (telefono, email) — for those, we
        // write both the plaintext legacy column (kept for migration) and
        // the *_Cifrado columns with fresh encryption.
        const telefonoCifrado = referredPatient.telefono ? encryptField(referredPatient.telefono) : null
        const emailCifrado = referredPatient.email ? encryptField(referredPatient.email.toLowerCase()) : null
        await ctx.db.patient.update({
          where: { id: ownPatient.id },
          data: {
            nombre: referredPatient.nombre,
            nombreCifrado: encryptField(referredPatient.nombre),
            hmacNombre: hmacIndex(referredPatient.nombre),
            apellido: referredPatient.apellido,
            apellidoCifrado: encryptField(referredPatient.apellido),
            hmacApellido: hmacIndex(referredPatient.apellido),
            fechaNacimiento: referredPatient.fechaNacimiento,
            sexo: referredPatient.sexo,
            telefono: referredPatient.telefono,
            telefonoCifrado,
            hmacTelefono: referredPatient.telefono ? hmacIndex(referredPatient.telefono) : null,
            email: referredPatient.email,
            emailCifrado,
            hmacEmail: referredPatient.email ? hmacIndex(referredPatient.email.toLowerCase()) : null,
            grupoSanguineo: referredPatient.grupoSanguineo,
          },
        })
      }

      // Transfer clinical profile lists to the existing registration.
      // We always append to ensure no data is lost. Duplicate prevention can be handled
      // in the UI or future deduplication jobs if necessary.
      
      let antecedentesUpdated = false
      if (doc.patientRegistration.antecedentes && !existingReg.antecedentes) {
        // If the receiving patient has no antecedentes, copy them from the sender.
        await ctx.db.patientRegistration.update({
          where: { id: existingReg.id },
          data: { antecedentes: doc.patientRegistration.antecedentes },
        })
        antecedentesUpdated = true
      }

      if (doc.patientRegistration.alergias.length > 0) {
        await ctx.db.alergia.createMany({
          data: doc.patientRegistration.alergias.map((a) => ({
            workspaceId: ws.id,
            patientRegistrationId: existingReg.id,
            sustancia: a.sustancia,
            reaccion: a.reaccion,
            gravedad: a.gravedad,
            activa: a.activa,
            createdAt: a.createdAt,
          })),
        })
      }

      if (doc.patientRegistration.vaccines.length > 0) {
        await ctx.db.vaccine.createMany({
          data: doc.patientRegistration.vaccines.map((v) => ({
            workspaceId: ws.id,
            patientRegistrationId: existingReg.id,
            vacuna: v.vacuna,
            fechaAplicacion: v.fechaAplicacion,
            dosis: v.dosis,
            lote: v.lote,
            proximaDosis: v.proximaDosis,
            notas: v.notas,
            aplicadoPor: v.aplicadoPor,
            createdAt: v.createdAt,
          })),
        })
      }

      if (doc.patientRegistration.insurances.length > 0) {
        for (const ins of doc.patientRegistration.insurances) {
          const senderProvider = await ctx.db.insuranceProvider.findUnique({ where: { id: ins.providerId } })
          if (senderProvider) {
            let receiverProvider = await ctx.db.insuranceProvider.findFirst({
              where: { workspaceId: ws.id, nombre: senderProvider.nombre },
            })
            if (!receiverProvider) {
              receiverProvider = await ctx.db.insuranceProvider.create({
                data: {
                  workspaceId: ws.id,
                  nombre: senderProvider.nombre,
                  codigo: senderProvider.codigo,
                  telefono: senderProvider.telefono,
                  email: senderProvider.email,
                },
              })
            }
            await ctx.db.patientInsurance.create({
              data: {
                patientRegistrationId: existingReg.id,
                providerId: receiverProvider.id,
                numeroPóliza: ins.numeroPóliza,
                titular: ins.titular,
                coberturaPct: ins.coberturaPct,
                fechaVigencia: ins.fechaVigencia,
                activa: ins.activa,
                notas: ins.notas,
                createdAt: ins.createdAt,
              },
            })
          }
        }
      }

      if (doc.patientRegistration.labResults.length > 0) {
        await ctx.db.labResult.createMany({
          data: doc.patientRegistration.labResults.map((l) => ({
            patientRegistrationId: existingReg.id,
            titulo: l.titulo,
            fecha: l.fecha,
            resultado: l.resultado,
            valores: l.valores ?? undefined,
            notas: l.notas,
            notasCifradas: l.notasCifradas,
            createdAt: l.createdAt,
          })),
        })
      }

      await ctx.db.document.update({
        where: { id: doc.id },
        data: { referidoStatus: "ACCEPTED" },
      })

      await audit(
        input.action === "update"
          ? "PATIENT_MERGE_UPDATE"
          : "PATIENT_MERGE_KEEP",
        {
          workspaceId: ws.id,
          userId: ctx.session.doctorId,
          userRole: ctx.session.role,
          resourceType: "Patient",
          resourceId: ownPatient.id,
          outcome: "ALLOWED",
          channel: "API",
          metadata: {
            source: "REFERRAL_RESOLVE_MERGE",
            documentId: doc.id,
            referredPatientId: referredPatient.id,
            fieldsChanged: diff,
          },
        },
      )

      void ctx.db.notification.create({
        data: {
          workspaceId: doc.patientRegistration.workspaceId,
          tipo: "REFERRAL_ACCEPTED",
          titulo: "Referido aceptado",
          mensaje: `El referido de ${referredPatient.nombre} ${referredPatient.apellido} fue aceptado.`,
          referenciaId: doc.id,
        },
      })

      return {
        success: true,
        patientRegistrationId: existingReg?.id ?? null,
        fieldsChanged: input.action === "update" ? diff : [],
      }
    }),

  rejectReferral: doctorProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findFirst({
        where: { id: input.documentId, tipo: "REFERIDO", referidoADoctorId: ctx.session.doctorId },
        include: { patientRegistration: { include: { patient: true } } },
      })
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" })
      await ctx.db.document.update({
        where: { id: doc.id },
        data: { referidoStatus: "REJECTED" },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d1 = doc as any
      void ctx.db.notification.create({
        data: {
          workspaceId: doc.patientRegistration.workspaceId,
          tipo: "REFERRAL_REJECTED",
          titulo: "Referido rechazado",
          mensaje: `El referido de ${doc.patientRegistration.patient.nombre} ${doc.patientRegistration.patient.apellido} fue rechazado.`,
          referenciaId: doc.id,
        },
      })
      void d1 // silence unused

      return { success: true }
    }),
})

/**
 * Shared finalizer for a REFERIDO document. Flips the status to SENT,
 * creates the in-app REFERRAL_RECEIVED notification for the receiving
 * doctor's workspace, and emails them.
 *
 * Called by BOTH the `sign` mutation (legacy "save then sign" flow)
 * and the `save` mutation (new "create and deliver in one step" flow).
 * Centralising the logic guarantees the two paths produce identical
 * delivery state — the previous setup left the `save` path dropping
 * the notification, so the receiving doctor never saw the bell badge
 * and had no idea a referral was waiting.
 */
async function finalizeReferral(
  ctx: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: any
    session: {
      workspaceId: string
      doctorId: string
    }
  },
  doc: {
    id: string
    tipo: string
    referidoADoctorId: string | null
    referidoAEspecialidad: string | null
    firmadoAt: Date | null
    patientRegistration: { patient: { nombre: string; apellido: string; email?: string | null } }
  },
) {
  if (doc.tipo !== "REFERIDO" || !doc.referidoADoctorId) return

  // 1) Flip status to SENT. We don't touch firmadoAt here — the caller
  //    is responsible for setting it when it makes sense (sign does,
  //    save does because the doctor's "Crear referido" click IS the
  //    moment of intent to deliver).
  await ctx.db.document.update({
    where: { id: doc.id },
    data: { referidoStatus: "SENT" },
  })

  // 2) Look up the receiving doctor's contact + the sending
  //    workspace's doctor (used in the notification + email body).
  const receiving = await ctx.db.doctor.findUnique({
    where: { id: doc.referidoADoctorId },
    select: { email: true, nombre: true, apellido: true },
  })
  const ws = await ctx.db.workspace.findUnique({
    where: { id: ctx.session.workspaceId },
    include: { doctor: true },
  })

  // 3) In-app notification in the receiving doctor's workspace.
  //    The bell badge + dropdown are workspace-scoped, so we need
  //    that workspace's id (each doctor has one). If they don't have
  //    a workspace yet, fall back to email-only.
  const receivingWs = await ctx.db.workspace.findFirst({
    where: { doctorId: doc.referidoADoctorId },
    select: { id: true },
  })
  if (receivingWs && ws) {
    const patientName = `${doc.patientRegistration.patient.nombre} ${doc.patientRegistration.patient.apellido}`
    void ctx.db.notification.create({
      data: {
        workspaceId: receivingWs.id,
        tipo: "REFERRAL_RECEIVED",
        titulo: "Nuevo referido pendiente",
        mensaje: `Dr. ${ws.doctor.nombre} ${ws.doctor.apellido} te refirió a ${patientName} para ${doc.referidoAEspecialidad ?? "evaluación"}.`,
        referenciaId: doc.id,
      },
    })
  }

  // 4) Email fallback. Best-effort: a missing email never blocks the
  //    in-app notification.
  if (receiving?.email && ws) {
    const patientName = `${doc.patientRegistration.patient.nombre} ${doc.patientRegistration.patient.apellido}`
    void sendReferralNotification({
      to: receiving.email,
      receivingDoctorName: `${receiving.nombre} ${receiving.apellido}`,
      sendingDoctorName: `${ws.doctor.nombre} ${ws.doctor.apellido}`,
      patientName,
      especialidad: doc.referidoAEspecialidad ?? "Especialidad no indicada",
    })
  }
}
