import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "IQEApp — Ideal Quality Engineers",
  description: "Ideal Quality Engineers — AI-Powered Quality & Inspection System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Roboto+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans bg-slate-50 antialiased text-slate-800">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
