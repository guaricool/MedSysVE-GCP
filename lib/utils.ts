import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function sharePdfFile(url: string, filename: string, title: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("No se pudo descargar el archivo")
    
    const blob = await response.blob()
    const file = new File([blob], filename, { type: "application/pdf" })
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: title,
      })
      return true
    } else {
      // Fallback: just open/download
      window.open(url, "_blank")
      return false
    }
  } catch (error) {
    console.error("Error sharing file:", error)
    window.open(url, "_blank")
    return false
  }
}
