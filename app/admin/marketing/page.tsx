"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Camera,
  ImageIcon,
  Hash,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Share2,
  Trash2,
  Bot,
  Layers,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const POST_STYLES = [
  { id: "hyperrealistic", name: "Hiperrealista 3D", desc: "Fotografía/render ultra realista médico", badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  { id: "cartoon", name: "Cartoon / Ilustración", desc: "Ilustración 2D/3D amigable y colorida", badgeColor: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  { id: "screenshot", name: "Captura de Pantalla", desc: "Captura en vivo de la plataforma MedSysVE", badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { id: "marketing", name: "Promocional Marketing", desc: "Banner corporativo de características", badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
];

const PRESET_TOPICS = [
  {
    topic: "Historias Clínicas SOAP",
    caption: "🏥 Reconcilia tu práctica médica con MedSysVE. Registra tus consultas en formato SOAP, adjunta exámenes de laboratorio e imprime récipes oficiales al instante con tu firma y código QR.",
    hashtags: "#MedSysVE #HistoriaClinica #MedicinaVenezuela #SaludVenezuela #DoctorVenezolano #SOAP",
    imageUrl: "https://storage.googleapis.com/medsysve-bot-temp/soap-demo.png",
  },
  {
    topic: "Visor DICOM / PACS Inactivo",
    caption: "🔬 ¡Revisa tomografías y resonancias en HD directo en el expediente de tu paciente! MedSysVE cuenta con visor DICOM 100% web con herramientas de zoom, CINE multiframe y densidad HU.",
    hashtags: "#MedSysVE #DICOM #PACS #RadiologiaVenezuela #Traumatologia #Cardiologia #SaludDigital",
    imageUrl: "https://storage.googleapis.com/medsysve-bot-temp/dicom-demo.png",
  },
  {
    topic: "Facturación Dual USD / Bs (BCV)",
    caption: "💵 Evita dolores de cabeza contables. MedSysVE actualiza automáticamente la tasa oficial del Banco Central de Venezuela (BCV) diariamente para emitir recibos y facturas en USD y Bolívares.",
    hashtags: "#MedSysVE #FacturacionSENIAT #BCV #SaaSMedico #ConsultorioMedico #Venezuela",
    imageUrl: "https://storage.googleapis.com/medsysve-bot-temp/billing-demo.png",
  },
  {
    topic: "Red de Referidos entre Doctores",
    caption: "🤝 Interconecta tu consultorio con especialistas de todo el país. Remite pacientes en segundos manteniendo la trazabilidad completa del expediente clínico sin fugas de información.",
    hashtags: "#MedSysVE #RedDeReferidos #DoctoresVenezuela #SaludDigital #EspecialistasMedicos",
    imageUrl: "https://storage.googleapis.com/medsysve-bot-temp/referrals-demo.png",
  },
  {
    topic: "Verificación Oficial SACS MPPS",
    caption: "🛡️ En MedSysVE cuidamos la salud de Venezuela. Todos los médicos en nuestra plataforma son validados oficialmente ante el Registro de Profesionales del Ministerio de Salud (SACS MPPS). ¡Consultas seguras con profesionales 100% verificados! 🩺🇻🇪",
    hashtags: "#MedSysVE #SACS #MPPS #DoctorVerificado #SaludVenezuela #MedicinaVenezuela #ConsultasSeguras #Venezuela",
    imageUrl: "https://storage.googleapis.com/medsysve-bot-temp/sacs-verification-demo.png",
  },
];

export default function MarketingDashboard() {
  const { data: posts, isLoading, refetch } = trpc.marketing.listPosts.useQuery();

  const [activeTab, setActiveTab] = useState<"PENDING" | "PUBLISHED" | "ALL">("PENDING");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  const [style, setStyle] = useState<"hyperrealistic" | "cartoon" | "screenshot" | "marketing">("hyperrealistic");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#MedSysVE #SaludVenezuela #DoctoresVenezuela #SoftwareMedico");
  const [imageUrl, setImageUrl] = useState("");
  const [publishNow, setPublishNow] = useState(false);

  const republish = trpc.marketing.republishPost.useMutation({
    onSuccess: () => {
      toast.success("¡Publicado en Instagram y Facebook exitosamente!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Error al publicar: ${err.message}`);
    },
  });

  const createPost = trpc.marketing.createPost.useMutation({
    onSuccess: () => {
      toast.success("¡Publicación enviada a la bandeja de aprobación!");
      setShowCreateModal(false);
      setCaption("");
      setImageUrl("");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Error al crear publicación: ${err.message}`);
    },
  });

  const updatePost = trpc.marketing.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Publicación actualizada.");
      setEditingPost(null);
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar: ${err.message}`);
    },
  });

  const deletePost = trpc.marketing.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Publicación eliminada.");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const handleApproveAndPublish = (postId: string) => {
    toast.promise(republish.mutateAsync({ postId }), {
      loading: "Aprobando y enviando a Instagram & Facebook...",
      success: "¡Aprobado y publicado exitosamente!",
      error: "Error al publicar en redes sociales.",
    });
  };

  const handleSelectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setCaption(preset.caption);
    setHashtags(preset.hashtags);
    setImageUrl(preset.imageUrl);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !imageUrl.trim()) {
      toast.error("Por favor completa la imagen y la leyenda del post.");
      return;
    }
    createPost.mutate({
      imageUrl: imageUrl.trim(),
      caption: caption.trim(),
      hashtags: hashtags.trim(),
      style,
      status: publishNow ? "PUBLISHED" : "PENDING_APPROVAL",
      publishNow,
    });
  };

  const pendingCount = posts?.filter((p) => p.status === "PENDING_APPROVAL" || p.status === "DRAFT").length || 0;
  const publishedCount = posts?.filter((p) => p.status === "PUBLISHED").length || 0;

  const filteredPosts = posts?.filter((post) => {
    if (activeTab === "PENDING") return post.status === "PENDING_APPROVAL" || post.status === "DRAFT";
    if (activeTab === "PUBLISHED") return post.status === "PUBLISHED";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 flex items-center gap-3">
            <Camera className="w-8 h-8 text-amber-500" />
            Bandeja de Aprobación & Marketing Bot
          </h1>
          <p className="text-slate-400 mt-2">
            Revisa, edita, aprueba y gestiona publicaciones generadas por el Bot IA (<span className="text-amber-300 font-semibold">marketing@medsysve.com</span>) antes de enviarlas a Instagram y Facebook.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(!showCreateModal)}
          className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold flex items-center gap-2 self-start md:self-auto shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" />
          {showCreateModal ? "Cerrar Creador" : "Crear / Sugerir Publicación"}
        </Button>
      </div>

      {/* Tabs de Selección y Estado */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "PENDING"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm"
              : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Pendientes de Aprobación</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("PUBLISHED")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "PUBLISHED"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm"
              : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Publicados en Redes</span>
          <span className="rounded-full bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px]">
            {publishedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ALL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-slate-800 border border-slate-700 text-white shadow-sm"
              : "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
          }`}
        >
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Todos ({posts?.length || 0})</span>
        </button>
      </div>

      {/* Creador Interactivo de Posts */}
      {showCreateModal && (
        <div className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-2xl space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Sugerir / Crear Publicación Social para MedSysVE
            </h2>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">
              Requiere Aprobación Super Admin
            </Badge>
          </div>

          {/* Selector de Presets Inteligentes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-400" /> Plantillas y Sugerencias de Campañas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {PRESET_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 text-left rounded-lg border border-slate-800 bg-slate-950/60 hover:border-amber-500/50 transition-all space-y-1.5 group"
                >
                  <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 block">
                    {preset.topic}
                  </span>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {preset.caption}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Estilo Visual */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" /> Estilo del Arte / Publicación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POST_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStyle(st.id as any)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                        style === st.id
                          ? "border-amber-500 bg-amber-500/15 text-amber-300"
                          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="font-bold text-slate-200">{st.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL de Imagen */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" /> URL de la Imagen (GCS / CDN)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://storage.googleapis.com/medsysve-bot-temp/imagen.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Recomendado: Imágenes 1:1 (1080x1080px) con el logo oficial de MedSysVE incorporado.
                </p>
              </div>
            </div>

            {/* Texto y Leyenda del Post */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center justify-between">
                <span>Leyenda / Texto del Post (Instagram & Facebook)</span>
                <span className="text-[11px] text-amber-400 font-normal">Incluye emojicraft y llamado a la acción</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Escribe el texto de la publicación..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-amber-400" /> Hashtags Destacados
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Opciones de Publicación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500 h-4 w-4"
                />
                <span>Aprobar y Publicar inmediatamente en Instagram / Facebook ahora</span>
              </label>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-slate-800 text-slate-400 hover:bg-slate-900"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPost.isPending}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {createPost.isPending ? "Guardando..." : publishNow ? "Aprobar y Publicar en Redes" : "Enviar a Bandeja de Pendientes"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Edición Inline de Post */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Editar Publicación antes de Aprobar
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Leyenda / Texto</label>
                <textarea
                  rows={4}
                  value={editingPost.caption}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hashtags</label>
                <input
                  type="text"
                  value={editingPost.hashtags}
                  onChange={(e) => setEditingPost({ ...editingPost, hashtags: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">URL de Imagen</label>
                <input
                  type="url"
                  value={editingPost.imageUrl}
                  onChange={(e) => setEditingPost({ ...editingPost, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setEditingPost(null)}
                className="border-slate-800 text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updatePost.mutate({
                    postId: editingPost.id,
                    caption: editingPost.caption,
                    hashtags: editingPost.hashtags,
                    style: editingPost.style,
                    imageUrl: editingPost.imageUrl,
                  });
                }}
                disabled={updatePost.isPending}
                className="bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
              >
                {updatePost.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Publicaciones Filtradas */}
      {!filteredPosts || filteredPosts.length === 0 ? (
        <div className="text-center py-20 border border-slate-800 rounded-xl bg-slate-900/50">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300">No hay publicaciones en esta pestaña</h3>
          <p className="text-slate-500">
            {activeTab === "PENDING"
              ? "¡Excelente! No hay publicaciones pendientes por revisar en este momento."
              : "No hay publicaciones registradas en esta sección."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post: any) => {
            const styleConfig = POST_STYLES.find((s) => s.id === post.style);
            const isPending = post.status === "PENDING_APPROVAL" || post.status === "DRAFT";

            return (
              <Card key={post.id} className={`bg-slate-900 overflow-hidden flex flex-col group transition-all shadow-lg ${
                isPending ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-slate-800 hover:border-slate-700"
              }`}>
                <div className="relative aspect-square w-full bg-slate-950">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex gap-2 flex-wrap">
                    {isPending ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pendiente Aprobación
                      </Badge>
                    ) : post.status === "PUBLISHED" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Publicado
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                        {post.status}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`backdrop-blur ${styleConfig?.badgeColor || "bg-slate-950/80 text-slate-300"}`}>
                      {styleConfig?.name || post.style}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex-1 p-5 space-y-4">
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(post.publishedAt), "PPpp", { locale: es })}
                    </span>
                    {post.igMediaId && (
                      <span className="font-mono text-[10px] text-emerald-400/80">
                        ID: {post.igMediaId.slice(-6)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                      {post.caption}
                    </p>
                    <p className="text-xs font-medium text-amber-400/90 flex items-start gap-1 line-clamp-2 font-mono">
                      <Hash className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{post.hashtags}</span>
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto flex flex-col gap-2">
                  {isPending ? (
                    <div className="w-full flex items-center gap-2">
                      <Button
                        onClick={() => handleApproveAndPublish(post.id)}
                        disabled={republish.isPending}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Aprobar y Publicar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingPost(post)}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs px-2.5"
                        title="Editar post"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm("¿Rechazar y eliminar esta publicación pendiente?")) {
                            deletePost.mutate({ postId: post.id });
                          }
                        }}
                        className="border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-2.5"
                        title="Rechazar y eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <Button
                        onClick={() => handleApproveAndPublish(post.id)}
                        disabled={republish.isPending}
                        className="flex-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all border border-slate-700 hover:border-amber-500 text-xs font-bold"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${republish.isPending ? "animate-spin" : ""}`} />
                        Republicar en Redes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (confirm("¿Seguro que deseas eliminar esta publicación?")) {
                            deletePost.mutate({ postId: post.id });
                          }
                        }}
                        className="border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2.5"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
