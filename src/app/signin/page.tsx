import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/matches");

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center px-5">
      <div className="mb-8 text-center">
        <div className="mb-3 text-6xl" aria-hidden>
          ⚽🏆
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Prode <span className="text-primary">Mundial 2026</span>
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Pronosticá los resultados. Sumá puntos. Ganá el derecho a cargar.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="p-5">
          <SignInForm />
        </CardContent>
      </Card>

      <p className="mt-6 max-w-sm text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
        Aviso: el ingreso es solo con nombre, así que se puede suplantar dentro
        del grupo. Está bien entre amigos — más adelante se puede agregar un PIN.
      </p>
    </main>
  );
}
