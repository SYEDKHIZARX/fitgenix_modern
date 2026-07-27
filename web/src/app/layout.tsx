import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { AuthProvider } from "@/context/AuthProvider";
import { FitgenixProvider } from "@/context/FitgenixProvider";
import "./globals.css";

const body = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "FITGENIX — Adaptive Fitness Coach",
  description:
    "Injury-aware adaptive training powered by genetic algorithms and reinforcement learning.",
  applicationName: "FITGENIX",
  appleWebApp: {
    capable: true,
    title: "FITGENIX",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#080A0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${body.variable} ${display.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <FitgenixProvider>{children}</FitgenixProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
