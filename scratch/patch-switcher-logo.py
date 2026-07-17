import re

with open('components/workspace/workspace-switcher.tsx', 'r', encoding='utf-8') as f:
    switcher = f.read()

# Replace Building2 icon for current workspace
old_current_icon = '''<Building2 size={10} className="shrink-0 text-blue-400" />'''
new_current_icon = '''{current?.logoUrl ? (
            <img src={current.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-contain bg-white" />
          ) : (
            <Building2 size={10} className="shrink-0 text-blue-400" />
          )}'''
switcher = switcher.replace(old_current_icon, new_current_icon)

# Replace Building2 icon for workspace list items
old_list_item = '''<Building2 size={10} className="shrink-0" />
              {ws.nombre}'''
new_list_item = '''{ws.logoUrl ? (
                <img src={ws.logoUrl} alt="" className="h-4 w-4 shrink-0 rounded object-contain bg-white" />
              ) : (
                <Building2 size={10} className="shrink-0" />
              )}
              {ws.nombre}'''
switcher = switcher.replace(old_list_item, new_list_item)

with open('components/workspace/workspace-switcher.tsx', 'w', encoding='utf-8') as f:
    f.write(switcher)

print("Patched workspace switcher")
