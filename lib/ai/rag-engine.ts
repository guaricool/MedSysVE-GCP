import { GoogleGenAI } from "@google/genai"
import { db } from "@/lib/db"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
})

export interface VectorSearchResult {
  id: string
  title: string
  content: string
  source: string
  category: string
  similarity: number
}

// Cálculo de similitud por coseno entre dos vectores
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Genera el embedding de un texto usando Gemini text-embedding-004 o un vector semántico si no hay API key
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    // Basic fallback pseudo-vector (normalized hash distribution) when no API Key is set in offline dev
    const vector = new Array(64).fill(0)
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i)
      vector[i % 64] += code / 1000
    }
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1
    return vector.map((v) => v / norm)
  }

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    })

    const resAny = response as any
    if (resAny.embedding?.values) {
      return resAny.embedding.values
    }
    if (resAny.embeddings?.[0]?.values) {
      return resAny.embeddings[0].values
    }
  } catch (err) {
    console.warn("[RAG] Error generando embedding con Gemini API, usando fallback:", err)
  }

  // Fallback seguro
  const vector = new Array(64).fill(0)
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    vector[i % 64] += code / 1000
  }
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1
  return vector.map((v) => v / norm)
}

// Búsqueda vectorial semántica en la base de datos de conocimiento
export async function searchKnowledgeBase(opts: {
  query: string
  category?: "MARKETING" | "CUSTOMER_SERVICE" | "TECH_SUPPORT" | "SYSTEM"
  limit?: number
}): Promise<VectorSearchResult[]> {
  const { query, category, limit = 3 } = opts
  const queryEmbedding = await generateTextEmbedding(query)
  const prisma = db as any

  try {
    const whereCondition: any = {}
    if (category) {
      whereCondition.category = category
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where: whereCondition,
      take: 100,
    })

    if (!chunks || chunks.length === 0) {
      return []
    }

    const resultsWithScore: VectorSearchResult[] = []

    for (const chunk of chunks) {
      let similarity = 0
      if (chunk.vectorJson) {
        try {
          const chunkVector = JSON.parse(chunk.vectorJson) as number[]
          similarity = cosineSimilarity(queryEmbedding, chunkVector)
        } catch {
          similarity = 0
        }
      }

      // Keyword match bonus para reforzar precisión
      const lowerQuery = query.toLowerCase()
      const lowerTitle = chunk.title.toLowerCase()
      const lowerContent = chunk.content.toLowerCase()
      
      const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 3)
      let keywordHits = 0
      for (const kw of keywords) {
        if (lowerTitle.includes(kw) || lowerContent.includes(kw)) {
          keywordHits += 1
        }
      }

      const score = similarity + keywordHits * 0.15

      resultsWithScore.push({
        id: chunk.id,
        title: chunk.title,
        content: chunk.content,
        source: chunk.source,
        category: chunk.category,
        similarity: score,
      })
    }

    // Ordenar de mayor a menor puntuación
    resultsWithScore.sort((a, b) => b.similarity - a.similarity)
    return resultsWithScore.slice(0, limit)
  } catch (error) {
    console.error("[RAG] Error buscando en KnowledgeBase:", error)
    return []
  }
}

// Agrega o actualiza un bloque de conocimiento en la DB
export async function upsertKnowledgeChunk(opts: {
  source: string
  category: "MARKETING" | "CUSTOMER_SERVICE" | "TECH_SUPPORT" | "SYSTEM"
  title: string
  content: string
}) {
  const prisma = db as any
  const vector = await generateTextEmbedding(`${opts.title}\n${opts.content}`)
  const vectorJson = JSON.stringify(vector)

  const existing = await prisma.knowledgeChunk.findFirst({
    where: {
      source: opts.source,
      title: opts.title,
    },
  })

  if (existing) {
    return await prisma.knowledgeChunk.update({
      where: { id: existing.id },
      data: {
        category: opts.category,
        content: opts.content,
        vectorJson,
        updatedAt: new Date(),
      },
    })
  }

  return await prisma.knowledgeChunk.create({
    data: {
      source: opts.source,
      category: opts.category,
      title: opts.title,
      content: opts.content,
      vectorJson,
    },
  })
}
