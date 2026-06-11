import { redirect } from "next/navigation";
import { Header } from "@/components/nav/Header";
import { BottomNav } from "@/components/nav/BottomNav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="mx-auto flex min-h-dvh max-w-screen-sm flex-col">
      <Header userName={user.name} />
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
      <BottomNav isAdmin={user.isAdmin} />
    </div>
  );
}
