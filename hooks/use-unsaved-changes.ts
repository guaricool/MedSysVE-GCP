"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

/**
 * Muestra una advertencia si hay cambios sin guardar cuando el usuario
 * intenta cerrar la pestaña, recargar la página, o navegar a otra página
 * usando un enlace interno (<Link> de Next.js o <a> normal).
 * 
 * @param isDirty true si hay cambios sin guardar
 * @param message El mensaje a mostrar (el navegador puede ignorarlo y mostrar su propio mensaje)
 */
export function useUnsavedChanges(isDirty: boolean, message = "Tienes cambios sin guardar. ¿Seguro que deseas salir?") {
  const router = useRouter()

  useEffect(() => {
    // 1. Interceptar cierre de pestaña y recarga (Browser nativo)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    // 2. Interceptar navegación interna (Clics en enlaces)
    const handleClick = (e: MouseEvent) => {
      if (!isDirty) return

      // Buscar si el clic provino de un enlace (<a>)
      const target = e.target as HTMLElement
      const link = target.closest("a")

      if (link && link.href) {
        // Ignorar si es un enlace que abre en otra pestaña
        if (link.target === "_blank") return

        // Ignorar si es un anchor link en la misma página (#)
        const currentUrl = new URL(window.location.href)
        const linkUrl = new URL(link.href)
        if (currentUrl.pathname === linkUrl.pathname && linkUrl.hash) return

        // Si es un enlace a otra página de la aplicación
        if (link.href !== window.location.href) {
          if (!window.confirm(message)) {
            e.preventDefault() // Evitar la navegación
          }
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    // Usamos la fase de captura (true) para interceptar el clic antes que Next.js
    document.addEventListener("click", handleClick, true)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleClick, true)
    }
  }, [isDirty, message])
}
