import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export function Header({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
        <Link href="/matches" className="flex items-center gap-2 font-extrabold">
          <span className="text-xl" aria-hidden>
            ⚽
          </span>
          <span className="tracking-tight">
            Prode <span className="text-primary">WC26</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="max-w-[8rem] truncate text-sm font-medium text-muted-foreground">
            {userName}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
