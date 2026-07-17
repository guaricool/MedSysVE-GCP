import re

with open('server/routers/patient.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix patient workspace lookup
old_source = '''      const source = await ctx.db.patient.findFirst({
        where: {
          id: input.patientId,
          workspace: { doctorId: ctx.session.doctorId },
        },
      })'''
new_source = '''      const source = await ctx.db.patient.findUnique({
        where: { id: input.patientId },
      })
      if (!source || !source.workspaceId) throw new TRPCError({ code: "NOT_FOUND" })

      const sourceWorkspace = await ctx.db.workspace.findFirst({
        where: { id: source.workspaceId, doctorId: ctx.session.doctorId }
      })
      if (!sourceWorkspace) throw new TRPCError({ code: "FORBIDDEN" })'''
content = content.replace(old_source, new_source)

# Fix audit event
old_audit = '"PATIENT_AUTO_IMPORTED"'
new_audit = '"PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE"'
content = content.replace(old_audit, new_audit)

with open('server/routers/patient.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed successfully!')
