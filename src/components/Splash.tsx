"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Full-screen intro splash shown for ~2s every time the app is opened/reloaded
 * in the browser. Closable early via the X. Lives in the root layout, so it
 * fires on full page loads (not on client-side navigations). Tuned for mobile
 * (portrait image, object-cover).
 */
export function Splash() {
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hide = setTimeout(() => setLeaving(true), 2000);
    return () => clearTimeout(hide);
  }, []);

  // Unmount shortly after the fade-out starts.
  useEffect(() => {
    if (!leaving) return;
    const done = setTimeout(() => setOpen(false), 350);
    return () => clearTimeout(done);
  }, [leaving]);

  if (!open) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 " +
        (leaving ? "opacity-0" : "opacity-100")
      }
      onClick={() => setLeaving(true)}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={(e) => {
          e.stopPropagation();
          setLeaving(true);
        }}
        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <X className="size-6" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/splash.png"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
