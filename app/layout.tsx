import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal - Candidate Intelligence",
  description: "Create job applications, evaluate candidates, hire smarter.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    images: ["/og-image.png"],
    title: "Signal — AI-Native Hiring Infrastructure",
    description: "The infrastructure that makes proof-of-work hiring scale.",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
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
      </body>
    </html>
  );
}
