"use client";

import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Camera, ImageIcon, Hash, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function MarketingDashboard() {
  const { data: posts, isLoading, refetch } = trpc.marketing.listPosts.useQuery();
  const republish = trpc.marketing.republishPost.useMutation({
    onSuccess: () => {
      toast.success("¡Post republicado con éxito!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(`Error al republicar: ${err.message}`);
    }
  });

  const handleRepublish = (postId: string) => {
    toast.promise(
      republish.mutateAsync({ postId }),
      {
        loading: 'Enviando a Instagram...',
        success: '¡Publicado!',
        error: 'Ocurrió un error.'
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-3">
          <Camera className="w-8 h-8 text-amber-500" />
          Dashboard de Marketing
        </h1>
        <p className="text-slate-400 mt-2">
          Historial de publicaciones generadas por IA. Administra y republica contenido.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-20 border border-slate-800 rounded-xl bg-slate-900/50">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300">No hay posts generados</h3>
          <p className="text-slate-500">Los posts creados por el bot aparecerán aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <Card key={post.id} className="bg-slate-900 border-slate-800 overflow-hidden flex flex-col group hover:border-amber-500/50 transition-colors">
              <div className="relative aspect-square w-full bg-slate-800">
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
                
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={post.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                    {post.status === "PUBLISHED" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {post.status}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-950/80 backdrop-blur border-slate-700 text-slate-300">
                    {post.style}
                  </Badge>
                </div>
              </div>

              <CardContent className="flex-1 p-5 space-y-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(post.publishedAt), "PPpp", { locale: es })}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {post.caption}
                  </p>
                  <p className="text-xs font-medium text-amber-500/80 flex items-start gap-1 line-clamp-2">
                    <Hash className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{post.hashtags}</span>
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0 mt-auto">
                <Button 
                  onClick={() => handleRepublish(post.id)}
                  disabled={republish.isPending}
                  className="w-full bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-all border border-slate-700 hover:border-amber-500"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${republish.isPending ? "animate-spin" : "group-hover:-rotate-180 transition-transform duration-500"}`} />
                  Republicar en Instagram
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
