import sys
path = r"C:\Proyectos\MedSysVE\proxy.ts"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
old = 'const PUBLIC_PREFIXES = ["/clinica", "/portal/schedule", "/legal"]'
new = 'const PUBLIC_PREFIXES = ["/clinica", "/portal/schedule", "/legal", "/forgot-password", "/reset-password"]'
if old not in c:
    print("OLD NOT FOUND")
    sys.exit(1)
c = c.replace(old, new, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("OK")
