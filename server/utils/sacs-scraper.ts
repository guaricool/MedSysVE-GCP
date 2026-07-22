/**
 * Utility Service: Scraper de Contraloría Sanitaria (SACS - MPPS Venezuela)
 *
 * Consulta las credenciales médicas oficiales registradas ante el Ministerio
 * del Poder Popular para la Salud (MPPS) a través del portal SACS.
 */

export interface SacsVerificationResult {
  encontrado: boolean;
  nacionalidad: "V" | "E";
  cedula: string;
  nombreCompleto?: string;
  nombre?: string;
  apellido?: string;
  matriculaMpps?: string;
  profesion?: string;
  especialidades?: string[];
  fechaRegistro?: string;
  estadoSacs?: string;
  origen: "SACS_MPPS" | "MOCK_FALLBACK";
  error?: string;
}

/**
 * Consulta la cédula de un profesional de la salud en el sistema SACS MPPS.
 *
 * Endpoint oficial SACS: https://sistemas.sacs.gob.ve/consultas/prfsnal_salud
 *
 * Si el portal gubernamental está fuera de servicio o expira el timeout (6s),
 * conmuta a un estado degradado seguro para no bloquear el flujo del médico.
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const targetUrl = "https://sistemas.sacs.gob.ve/consultas/prfsnal_salud";

    // Petición POST / GET con FormData para consultar profesional
    const formData = new URLSearchParams();
    formData.append("nacionalidad", nacionalidad);
    formData.append("cedula", cleanCedula);
    formData.append("buscar", "1");

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      body: formData.toString(),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`SACS MPPS HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML content
    const result = parseSacsHtml(html, nacionalidad, cleanCedula);
    return result;
  } catch (err: any) {
    console.warn(`[SACS Scraper] Consulta SACS no disponible para ${fullCedulaStr}:`, err?.message || err);

    // Fallback defensivo: si el servidor del gobierno está caído o aborta,
    // retornamos estructura degradada que permite continuación manual con advertencia.
    return {
      encontrado: false,
      nacionalidad,
      cedula: cleanCedula,
      origen: "MOCK_FALLBACK",
      error: "Portal del MPPS (SACS) fuera de línea o sin respuesta temporal.",
    };
  }
}

/**
 * Parsea el HTML recibido de la consulta SACS MPPS
 */
function parseSacsHtml(
  html: string,
  nacionalidad: "V" | "E",
  cedula: string
): SacsVerificationResult {
  const cleanHtml = html.replace(/\s+/g, " ");

  // Verificar si hay registros encontrados
  const noResultPatterns = [
    /no se encontraron registros/i,
    /no existe profesional/i,
    /sin resultados/i,
    /cedula no registrada/i,
  ];

  const isNotFound = noResultPatterns.some((pattern) => pattern.test(cleanHtml));

  if (isNotFound) {
    return {
      encontrado: false,
      nacionalidad,
      cedula,
      origen: "SACS_MPPS",
    };
  }

  // Extraer campos principales usando Expresiones Regulares sobre la tabla HTML de SACS
  const nombreMatch =
    html.match(/Nombres?\s*y\s*Apellidos?:?\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    html.match(/Nombre[^<]*:\s*<\/b>\s*([^<]+)/i) ||
    html.match(/<td>([A-ZÁÉÍÓÚÑ\s]{5,60})<\/td>/i);

  const matriculaMatch =
    html.match(/Matr[íi]cula(?:\s*MPPS)?:?\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    html.match(/N°?\s*Matr[íi]cula[^<]*:\s*<\/b>\s*([^<]+)/i) ||
    html.match(/\b(MPPS-\d{4,8}|\d{5,8})\b/i);

  const profesionMatch =
    html.match(/Profesi[óo]n:?\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
    html.match(/(M[ÉE]DICO\s+[A-Z\s]+)/i);

  const especialidadMatches = Array.from(
    html.matchAll(/Especialidad|Postgrado:?\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi)
  ).map((m) => m[1]?.trim()).filter(Boolean);

  const rawNombre = nombreMatch ? nombreMatch[1].trim() : "";
  const matriculaMpps = matriculaMatch ? matriculaMatch[1].trim() : "";
  const profesion = profesionMatch ? profesionMatch[1].trim() : "MÉDICO CIRUJANO";

  // Separar Nombre y Apellido si es posible
  let nombre = "";
  let apellido = "";
  if (rawNombre) {
    const parts = rawNombre.split(" ").filter(Boolean);
    if (parts.length >= 4) {
      nombre = `${parts[0]} ${parts[1]}`;
      apellido = parts.slice(2).join(" ");
    } else if (parts.length >= 2) {
      nombre = parts[0];
      apellido = parts.slice(1).join(" ");
    } else {
      nombre = rawNombre;
    }
  }

  const encontrado = Boolean(rawNombre || matriculaMpps);

  return {
    encontrado,
    nacionalidad,
    cedula,
    nombreCompleto: rawNombre || undefined,
    nombre: nombre || undefined,
    apellido: apellido || undefined,
    matriculaMpps: matriculaMpps || undefined,
    profesion,
    especialidades: especialidadMatches.length > 0 ? especialidadMatches : undefined,
    origen: "SACS_MPPS",
  };
}
