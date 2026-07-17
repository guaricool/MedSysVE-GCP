import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix isPending
    content = content.replace('importPatient.isLoading', 'importPatient.isPending')

    # Fix Array.from typing
    content = content.replace(').map(([_, r]) => r)', '.entries()).map(([_, r]) => r)')
    content = content.replace(').map(([_, p]) => p)', '.entries()).map(([_, p]) => p)')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('components/patients/patient-list-client.tsx')
fix_file('components/search/command-palette.tsx')
print("Fixed successfully!")
