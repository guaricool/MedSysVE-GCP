"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"

interface UnsavedChangesContextType {
  setDirty: (formId: string, isDirty: boolean) => void
  isAnyDirty: boolean
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  setDirty: () => {},
  isAnyDirty: false,
})

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyForms, setDirtyForms] = useState<Set<string>>(new Set())

  const setDirty = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms((prev) => {
      const next = new Set(prev)
      if (isDirty) {
        next.add(formId)
      } else {
        next.delete(formId)
      }
      return next
    })
  }, [])

  const isAnyDirty = dirtyForms.size > 0

  // Register the global beforeunload and link click interceptors
  useUnsavedChanges(isAnyDirty)

  return (
    <UnsavedChangesContext.Provider value={{ setDirty, isAnyDirty }}>
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsaved() {
  return useContext(UnsavedChangesContext)
}
