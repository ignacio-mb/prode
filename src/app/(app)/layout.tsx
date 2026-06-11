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
    <>
      {/* Decorative party photos flanking the centered app on wide screens. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 hidden justify-between lg:flex"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/side-left.png"
          alt=""
          className="h-full w-[calc((100vw-40rem)/2)] object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/side-right.png"
          alt=""
          className="h-full w-[calc((100vw-40rem)/2)] object-cover"
        />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-screen-sm flex-col">
        <Header userName={user.name} />
        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
        <BottomNav isAdmin={user.isAdmin} />
      </div>
    </>
  );
}
