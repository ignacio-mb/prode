"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ListChecks,
  Settings,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/matches", label: "Partidos", icon: CalendarDays },
  { href: "/leaderboard", label: "Tabla", icon: Trophy },
  { href: "/my-predictions", label: "Pronósticos", icon: ListChecks },
] as const;

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [...ITEMS, { href: "/admin", label: "Admin", icon: Settings } as const]
    : ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex max-w-screen-sm items-stretch justify-around">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-5", active && "fill-primary/10")}
                strokeWidth={active ? 2.4 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
