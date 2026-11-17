import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "AAPDA Grid — Disaster Intelligence Platform",
  description:
    "AI-assisted disaster intelligence, mountain-road accessibility and relief coordination for Jammu & Kashmir. DEMO / SIMULATED environment.",
  keywords: ["disaster management", "AAPDA", "Jammu Kashmir", "relief coordination"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
