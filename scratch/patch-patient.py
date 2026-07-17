import re

with open('server/routers/patient.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace search's workspaceId
old_search_where = '''        where: {
          workspaceId: ctx.session.workspaceId,'''
new_search_where = '''        where: {
          workspace: { doctorId: ctx.session.doctorId },'''
content = content.replace(old_search_where, new_search_where)

# Replace list's workspaceId
old_list_where = '''        where: {
          workspaceId: ctx.session.workspaceId,'''
new_list_where = '''        where: {
          workspace: { doctorId: ctx.session.doctorId },'''
content = content.replace(old_list_where, new_list_where)

# Add importPatient procedure
import_patient_code = '''
  importPatient: doctorProcedure
    .input(z.object({ patientId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = ctx.session.workspaceId
      const source = await ctx.db.patient.findFirst({
        where: {
          id: input.patientId,
          workspace: { doctorId: ctx.session.doctorId },
        },
      })
      if (!source) throw new TRPCError({ code: "NOT_FOUND" })

      if (!source.sinCedula && source.numeroIdentificacion) {
        const existing = await ctx.db.patient.findFirst({
          where: {
            workspaceId,
            hmacCedula: source.hmacCedula,
            tipoIdentificacion: source.tipoIdentificacion,
          },
        })
        if (existing) {
          const reg = await ctx.db.patientRegistration.findFirst({
            where: { patientId: existing.id, workspaceId }
          })
          if (reg) return reg
        }
      }

      const MAX_RETRIES = 3
      let lastError: unknown
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const reg = await ctx.db.$transaction(async (tx) => {
            const idDisplay = await getNextIdDisplay(tx, workspaceId)
            const newPatient = await tx.patient.create({
              data: {
                workspaceId,
                tipoIdentificacion: source.tipoIdentificacion,
                numeroIdentificacion: source.numeroIdentificacion,
                hmacCedula: source.hmacCedula,
                sinCedula: source.sinCedula,
                nombre: source.nombre,
                nombreCifrado: source.nombreCifrado,
                hmacNombre: source.hmacNombre,
                apellido: source.apellido,
                apellidoCifrado: source.apellidoCifrado,
                hmacApellido: source.hmacApellido,
                fechaNacimiento: source.fechaNacimiento,
                sexo: source.sexo,
                grupoSanguineo: source.grupoSanguineo,
                direccion: source.direccion,
                direccionCifrada: source.direccionCifrada,
                telefono: source.telefono,
                telefonoCifrado: source.telefonoCifrado,
                hmacTelefono: source.hmacTelefono,
                email: source.email,
                emailCifrado: source.emailCifrado,
                hmacEmail: source.hmacEmail,
                repCedula: source.repCedula,
                repNombreCompleto: source.repNombreCompleto,
                repParentesco: source.repParentesco,
                repTelefono: source.repTelefono,
                repEmail: source.repEmail,
              }
            })
            return await tx.patientRegistration.create({
              data: {
                idDisplay,
                patientId: newPatient.id,
                workspaceId,
              }
            })
          })
          await audit("PATIENT_AUTO_IMPORTED", {
            workspaceId,
            userId: ctx.session.doctorId,
            userRole: ctx.session.role,
            resourceType: "Patient",
            outcome: "ALLOWED",
            channel: "API",
            metadata: { sourceWorkspaceId: source.workspaceId, sourcePatientId: source.id },
          })
          return reg
        } catch (e: any) {
          if (e.code === "P2002") {
            lastError = e
            continue
          }
          throw e
        }
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to import patient" })
    }),
'''

# Insert before search:
content = content.replace('  search: doctorProcedure', import_patient_code + '\n  search: doctorProcedure')

with open('server/routers/patient.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Patched successfully!')
