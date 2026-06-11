import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Prode · Mundial 2026",
  description:
    "Pronosticá todos los resultados del Mundial FIFA 2026 y subí en la tabla con tus amigos.",
  applicationName: "Prode WC26",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        {/* Intentionally in English, per request. */}
        <div className="bg-primary px-4 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
          made for Lo Ganter. Navita y Weke se la comen
        </div>
        {children}
      </body>
    </html>
  );
}
