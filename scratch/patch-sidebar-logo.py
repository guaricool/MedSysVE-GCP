import re

# 1. Update Layout
with open('app/(dashboard)/layout.tsx', 'r', encoding='utf-8') as f:
    layout = f.read()

layout = layout.replace('select: { nombre: true }', 'select: { nombre: true, logoUrl: true }')
layout = layout.replace('workspaceNombre={workspace?.nombre ?? "Consultorio"}', 'workspaceNombre={workspace?.nombre ?? "Consultorio"}\n        workspaceLogoUrl={workspace?.logoUrl ?? null}')

with open('app/(dashboard)/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(layout)

# 2. Update Sidebar
with open('components/layout/sidebar.tsx', 'r', encoding='utf-8') as f:
    sidebar = f.read()

sidebar = sidebar.replace('workspaceNombre: string', 'workspaceNombre: string\n  workspaceLogoUrl?: string | null')
sidebar = sidebar.replace('export function Sidebar({ role, nombre, apellido, workspaceNombre, isAdmin }: SidebarProps)', 'export function Sidebar({ role, nombre, apellido, workspaceNombre, workspaceLogoUrl, isAdmin }: SidebarProps)')

header_logo_old = '''          <div className="flex items-center gap-2">
            <Stethoscope size={20} className="text-blue-400" />
            <span className="font-bold text-lg tracking-tight">
              <span className="text-[#FFD100]">Med</span>
              <span className="text-[#3B82F6]">Sys</span>
              <span className="text-[#EF4444]">VE</span>
            </span>
          </div>'''

header_logo_new = '''          <div className="flex items-center gap-2">
            {workspaceLogoUrl ? (
              <img src={workspaceLogoUrl} alt="Logo" className="h-8 w-auto object-contain rounded" />
            ) : (
              <>
                <Stethoscope size={20} className="text-blue-400" />
                <span className="font-bold text-lg tracking-tight">
                  <span className="text-[#FFD100]">Med</span>
                  <span className="text-[#3B82F6]">Sys</span>
                  <span className="text-[#EF4444]">VE</span>
                </span>
              </>
            )}
          </div>'''

sidebar = sidebar.replace(header_logo_old, header_logo_new)

# Update mobile header logo as well
mobile_logo_old = '''        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-blue-400" />
          <span className="font-bold text-base tracking-tight">
            <span className="text-[#FFD100]">Med</span>
            <span className="text-[#3B82F6]">Sys</span>
            <span className="text-[#EF4444]">VE</span>
          </span>
        </div>'''

mobile_logo_new = '''        <div className="flex items-center gap-2">
          {workspaceLogoUrl ? (
            <img src={workspaceLogoUrl} alt="Logo" className="h-6 w-auto object-contain rounded" />
          ) : (
            <>
              <Stethoscope size={18} className="text-blue-400" />
              <span className="font-bold text-base tracking-tight">
                <span className="text-[#FFD100]">Med</span>
                <span className="text-[#3B82F6]">Sys</span>
                <span className="text-[#EF4444]">VE</span>
              </span>
            </>
          )}
        </div>'''

sidebar = sidebar.replace(mobile_logo_old, mobile_logo_new)

with open('components/layout/sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(sidebar)

print("Patched layout and sidebar")
