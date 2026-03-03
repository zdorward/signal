import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal - Candidate Intelligence",
  description: "Create job applications, evaluate candidates, hire smarter.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    images: ["/og-image-v2.png"],
    title: "Signal — AI-Native Hiring Infrastructure",
    description: "The infrastructure that makes proof-of-work hiring scale.",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image-v2.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={jetbrainsMono.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
