import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSacsBackfill } from "@/scripts/backfill-sacs-doctors";

const ADMIN_EMAIL = "cpierluissis@gmail.com";

export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
  }

  try {
    const summary = await runSacsBackfill();
    return NextResponse.json({
      success: true,
      message: "Backfill SACS MPPS ejecutado con éxito",
      summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al ejecutar el backfill SACS" },
      { status: 500 }
    );
  }
}
