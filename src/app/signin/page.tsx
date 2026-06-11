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
          Prode <span className="text-primary">World Cup 2026</span>
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Predict every scoreline. Earn points. Win the bragging rights.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="p-5">
          <SignInForm />
        </CardContent>
      </Card>

      <p className="mt-6 max-w-sm text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
        Heads up: sign-in is name-only, so it&apos;s spoofable within the group.
        Fine for friends — add a PIN later if you need it.
      </p>
    </main>
  );
}
