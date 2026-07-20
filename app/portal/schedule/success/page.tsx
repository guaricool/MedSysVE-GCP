import Link from "next/link"
import { CheckCircle, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ScheduleSuccessPage() {
  return (
    <div className="mx-auto mt-16 max-w-lg text-center space-y-8 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
      <div className="flex justify-center">
        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">¡Cita Agendada!</h1>
        <p className="text-slate-400 text-lg">
          Tu cita ha sido solicitada exitosamente. Recibirás una notificación cuando el doctor confirme el horario.
        </p>
      </div>

      <div className="pt-8 flex flex-col gap-4">
        <Button asChild className="h-12 text-md">
          <Link href="/portal/search">
            <Calendar className="mr-2 h-5 w-5" /> Agendar otra cita
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 text-md bg-slate-800 border-slate-700 hover:bg-slate-700">
          <Link href="/portal">
            Ir al inicio <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
