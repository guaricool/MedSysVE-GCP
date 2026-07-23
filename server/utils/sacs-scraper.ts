/**
 * Utility Service: Scraper de Contraloría Sanitaria (SACS - MPPS Venezuela)
 *
 * Consulta las credenciales médicas oficiales registradas ante el Ministerio
 * del Poder Popular para la Salud (MPPS) a través del protocolo xajax de SACS.
 */

export interface SacsVerificationResult {
  encontrado: boolean;
  nacionalidad: "V" | "E";
  cedula: string;
  nombreCompleto?: string;
  nombre?: string;
  segundoNombre?: string;
  apellido?: string;
  segundoApellido?: string;
  matriculaMpps?: string;
  profesion?: string;
  fechaRegistro?: string;
  especialidades?: string[];
  origen: "SACS_MPPS" | "MOCK_FALLBACK";
  error?: string;
}

/**
 * Separa inteligente de nombres y apellidos en primer y segundo componente.
 * Ejemplo: "CARLOS EDUARDO" -> { primer: "CARLOS", segundo: "EDUARDO" }
 */
function splitNameParts(str: string): { primer: string; segundo: string } {
  const parts = str.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primer: "", segundo: "" };
  if (parts.length === 1) return { primer: parts[0], segundo: "" };
  return {
    primer: parts[0],
    segundo: parts.slice(1).join(" "),
  };
}

/**
 * Consulta la cédula de un profesional de la salud en el sistema SACS MPPS
 * utilizando el protocolo xajax de la Contraloría Sanitaria.
 *
 * Endpoint oficial SACS: https://sistemas.sacs.gob.ve/consultas/prfsnal_salud
 */
export async function scrapeSacsMpps(
  cedulaInput: string,
  nacionalidadInput: "V" | "E" = "V"
): Promise<SacsVerificationResult> {
  const cleanCedula = cedulaInput.replace(/\D/g, "").trim();
  const nacionalidad = nacionalidadInput.toUpperCase() === "E" ? "E" : "V";

  if (!cleanCedula || cleanCedula.length < 5) {
    return {
      encontrado: false,
      nacionalidad,
      cedula: cleanCedula,
      origen: "SACS_MPPS",
      error: "Número de cédula no válido.",
    };
  }

  const fullCedulaStr = `${nacionalidad}-${cleanCedula}`;
  const targetUrl = "https://sistemas.sacs.gob.ve/consultas/prfsnal_salud";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    // 1. Consulta Datos Personales y Licencia MPPS vía xajax (getPrfsnalByCed)
    const response1 = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      body: `xajax=getPrfsnalByCed&xajaxargs[]=${encodeURIComponent(fullCedulaStr)}`,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response1.ok) {
      throw new Error(`SACS MPPS HTTP ${response1.status}`);
    }

    const xml1 = await response1.text();

    const userTableMatch = xml1.match(/xajax_userTable\('([^']+)'\)/);
    const tableProfMatch = xml1.match(/xajax_tableProfesion\('([^']+)'\)/);

    let userInfo: Record<string, string> = {};
    let profList: Array<Record<string, string>> = [];

    if (userTableMatch && userTableMatch[1] && userTableMatch[1] !== '""') {
      try {
        userInfo = JSON.parse(userTableMatch[1]);
      } catch {
        // Ignore JSON parse error
      }
    }

    if (tableProfMatch && tableProfMatch[1] && tableProfMatch[1] !== "[]") {
      try {
        profList = JSON.parse(tableProfMatch[1]);
      } catch {
        // Ignore JSON parse error
      }
    }

    // 2. Consulta Postgrados y Especialidades vía xajax (profesiones)
    let postgradMatches: string[] = [];
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

      const response2 = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
        body: `xajax=profesiones&xajaxargs[]=${encodeURIComponent(cleanCedula)}`,
        signal: controller2.signal,
      }).finally(() => clearTimeout(timeoutId2));

      if (response2.ok) {
        const xml2 = await response2.text();
        postgradMatches = Array.from(
          xml2.matchAll(/<td><center>([^<]+)<\/center><\/td>/gi)
        )
          .map((m) => m[1].trim())
          .filter(
            (p) =>
              p.length > 3 &&
              !/^\d+$/.test(p) &&
              !/^\d{4}-\d{2}-\d{2}$/.test(p)
          );
      }
    } catch {
      // Ignorar si falla la consulta secundaria de especialidades
    }

    const rawNombre = (userInfo.nombre1 || "").trim();
    const rawApellido = (userInfo.apellido1 || "").trim();
    const nombreCompleto = `${rawNombre} ${rawApellido}`.trim();
    const matriculaMpps = profList[0]?.licencia || undefined;
    const rawProfesion = profList[0]?.profesion
      ? profList[0].profesion
          .replace(/&Eacute;/g, "É")
          .replace(/&Oacute;/g, "Ó")
          .replace(/&Aacute;/g, "Á")
          .replace(/&Iacute;/g, "Í")
          .replace(/&Uacute;/g, "Ú")
          .replace(/&Ntilde;/g, "Ñ")
      : undefined;

    const nameParts = splitNameParts(rawNombre);
    const surnameParts = splitNameParts(rawApellido);

    const encontrado = Boolean(rawNombre || matriculaMpps);

    return {
      encontrado,
      nacionalidad,
      cedula: cleanCedula,
      nombreCompleto: nombreCompleto || undefined,
      nombre: nameParts.primer || rawNombre || undefined,
      segundoNombre: nameParts.segundo || undefined,
      apellido: surnameParts.primer || rawApellido || undefined,
      segundoApellido: surnameParts.segundo || undefined,
      matriculaMpps,
      profesion: rawProfesion,
      fechaRegistro: profList[0]?.fecha_registro || undefined,
      especialidades: postgradMatches.length > 0 ? postgradMatches : undefined,
      origen: "SACS_MPPS",
    };
  } catch (err: any) {
    console.warn(`[SACS Scraper] Consulta SACS no disponible para ${fullCedulaStr}:`, err?.message || err);

    return {
      encontrado: false,
      nacionalidad,
      cedula: cleanCedula,
      origen: "MOCK_FALLBACK",
      error: "Portal del MPPS (SACS) fuera de línea o sin respuesta temporal.",
    };
  }
}
