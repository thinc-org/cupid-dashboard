import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakartaSans = localFont({
  src: "../assets/fonts/plus-jakarta-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CUpid Analytics & Insights",
  description:
    "Internal staff analytics dashboard for CUpid platform cohort health, demographics, and deck insights.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn("font-sans", plusJakartaSans.variable)
    } >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html >
  );
}
