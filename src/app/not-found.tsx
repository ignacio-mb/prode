import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-6xl" aria-hidden>
        🥅
      </div>
      <h1 className="text-2xl font-extrabold">Tiro desviado</h1>
      <p className="text-sm text-muted-foreground">Esta página no existe.</p>
      <Link
        href="/matches"
        className="font-semibold text-primary hover:underline"
      >
        Volver a los partidos →
      </Link>
    </main>
  );
}
