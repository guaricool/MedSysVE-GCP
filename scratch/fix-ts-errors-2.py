import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Array.from typing
    content = content.replace('.entries()).map(([_, r]) => r)', '.values())')
    content = content.replace('.entries()).map(([_, p]) => p)', '.values())')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('components/patients/patient-list-client.tsx')
fix_file('components/search/command-palette.tsx')

with open('components/patients/patient-list-client.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Fix useMutation in patient-list-client
content = content.replace(
'''  const importPatient = trpc.patient.importPatient.useMutation({
    onSuccess: (newReg) => router.push(/doctor/patients/)
  })''',
'  const importPatient = trpc.patient.importPatient.useMutation()'
)

# And update the onClick to include onSuccess
content = content.replace(
'''                  importPatient.mutate({ patientId: r.patientId })''',
'''                  importPatient.mutate({ patientId: r.patientId }, {
                    onSuccess: (newReg) => router.push(/doctor/patients/)
                  })'''
)

with open('components/patients/patient-list-client.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed successfully!")
