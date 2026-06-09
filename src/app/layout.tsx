import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto Claims AI — Prototype",
  description:
    "AI-assisted claims review prototype. Top-10 carrier orchestration layer over commodity damage vision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
