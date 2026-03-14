import type { Metadata } from "next";
import "./globals.css";
import TabNav from "@/components/ui/TabNav";
import HeaderAuth from "@/components/ui/HeaderAuth";
import Link from "next/link";
import ZoomReset from "@/components/ui/ZoomReset";

export const metadata: Metadata = {
  title: "ArchiveCult",
  description: "This is going on the archive",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <ZoomReset />
      <body
        className="min-h-screen text-white"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
        }}
      >
        {/* Film grain overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
          }}
        />

        {/* Header - completely transparent, content flows through */}
        <header className="sticky top-0 z-40 w-full px-6 py-4">
          <div className="flex items-center gap-6 w-full">
            {/* Right side: logo + nav + profile */}
            <div className="ml-auto flex items-center gap-6">
              <Link href="/" className="text-xl font-bold tracking-tight">
                <span className="text-white">ARCHIVE</span>
                <span className="text-red-600">CULT</span>
              </Link>
              <TabNav />
              <HeaderAuth />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative z-10">{children}</main>

        {/* VHS scanlines */}
        <div
          className="fixed inset-0 pointer-events-none z-40"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)",
          }}
        />
      </body>
    </html>
  );
}
