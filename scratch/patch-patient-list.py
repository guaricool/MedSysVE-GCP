import re

with open('components/patients/patient-list-client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useSession import
if 'useSession' not in content:
    content = content.replace(
        'import { Search } from "lucide-react"',
        'import { Search } from "lucide-react"\nimport { useSession } from "next-auth/react"\nimport { useRouter } from "next/navigation"'
    )

# Get currentWorkspaceId and import patient mutation
if 'const { data: session }' not in content:
    content = content.replace(
        '  const [tag, setTag] = useState("")',
        '  const [tag, setTag] = useState("")\n\n  const { data: session } = useSession()\n  const currentWorkspaceId = session?.user?.workspaceId as string | undefined\n  const router = useRouter()\n  const importPatient = trpc.patient.importPatient.useMutation({\n    onSuccess: (newReg) => router.push(/doctor/patients/)\n  })'
    )

# Deduplicate regs to show only one registration per physical patient
if 'const uniqueRegs = Array.from' not in content:
    content = content.replace(
        '  const regs = (hasSearch\n    ? (searchQuery.data as any[]) ?? []\n    : hasFilter\n      ? (listQuery.data as any[]) ?? []\n      : []) as any[]',
        '  const regs = (hasSearch\n    ? (searchQuery.data as any[]) ?? []\n    : hasFilter\n      ? (listQuery.data as any[]) ?? []\n      : []) as any[]\n\n  // Deduplicate physical patients (if they exist in multiple workspaces)\n  // Prefer the one in current workspace\n  const uniqueRegs = Array.from(\n    regs.reduce((acc, r) => {\n      const key = r.patient.numeroIdentificacion || r.patient.nombre + r.patient.apellido\n      if (!acc.has(key) || r.workspaceId === currentWorkspaceId) {\n        acc.set(key, r)\n      }\n      return acc\n    }, new Map<string, any>())\n  ).map(([_, r]) => r)'
    )

    # replace regs with uniqueRegs in rendering
    content = content.replace('regs.length', 'uniqueRegs.length')
    content = content.replace('regs.map', 'uniqueRegs.map')

# Replace Link with button for cross-workspace
old_link = '''            <Link
              key={r.id}
              href={/doctor/patients/}
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between hover:border-slate-700 hover:bg-slate-800/70 transition-colors"
            >'''

new_link = '''            <button
              key={r.id}
              onClick={() => {
                if (r.workspaceId !== currentWorkspaceId) {
                  importPatient.mutate({ patientId: r.patientId })
                } else {
                  router.push(/doctor/patients/)
                }
              }}
              disabled={importPatient.isLoading && importPatient.variables?.patientId === r.patientId}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between hover:border-slate-700 hover:bg-slate-800/70 transition-colors disabled:opacity-50"
            >'''
content = content.replace(old_link, new_link)

# Replace closing Link with closing button
old_link_close = '''            </Link>'''
new_link_close = '''            </button>'''
content = content.replace(old_link_close, new_link_close)


with open('components/patients/patient-list-client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched successfully!")
