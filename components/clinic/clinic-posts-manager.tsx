"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Plus, Trash2, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  clinicId: string
}

export function ClinicPostsManager({ clinicId }: Props) {
  const utils = trpc.useUtils()
  const { data: posts, isLoading } = (trpc.clinicPublic as any).getPosts.useQuery({ clinicId })

  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")

  const createPost = (trpc.clinicPublic as any).createPost.useMutation({
    onSuccess: () => {
      (utils.clinicPublic as any).getPosts.invalidate({ clinicId })
      setTitulo("")
      setContenido("")
      setShowForm(false)
    },
  })

  const deletePost = (trpc.clinicPublic as any).deletePost.useMutation({
    onSuccess: () => (utils.clinicPublic as any).getPosts.invalidate({ clinicId }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <Newspaper size={16} className="text-slate-400" />
          Noticias de la Clínica
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} className="mr-1" />
          Nueva noticia
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Nuevos horarios de atención"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Contenido</Label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escriba el contenido del anuncio..."
              rows={4}
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!titulo.trim() || !contenido.trim() || createPost.isPending}
              onClick={() => createPost.mutate({ titulo: titulo.trim(), contenido: contenido.trim() })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPost.isPending ? "Publicando..." : "Publicar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">Cargando publicaciones...</p>}

      {!isLoading && (!posts || (posts as any[]).length === 0) && (
        <p className="text-sm text-slate-500">No hay noticias publicadas aún.</p>
      )}

      {(posts as any[] | undefined)?.map((post: any) => (
        <div
          key={post.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">{post.titulo}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {new Date(post.publicadoAt).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: 'America/Caracas' })}
            </p>
            <p className="mt-1 text-sm text-slate-400 line-clamp-2">{post.contenido}</p>
          </div>
          <button
            onClick={() => deletePost.mutate({ id: post.id })}
            disabled={deletePost.isPending}
            className="shrink-0 text-slate-600 hover:text-red-400 disabled:opacity-50"
            title="Archivar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
