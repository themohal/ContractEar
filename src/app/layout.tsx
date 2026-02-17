import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "ContractEar - AI Audio Agreement Analyzer | Extract Commitments from Recordings",
  description:
    'Upload meeting recordings and get AI-powered analysis of verbal commitments, deadlines, red flags, and action items. Protect yourself from "I never said that" disputes.',
  keywords:
    "verbal agreement analyzer, meeting recording analysis, AI contract analyzer, audio agreement analysis, verbal commitment tracker, meeting transcription analysis",
  verification: {
    google: "eDw2fWEXVf7ksLhgsc25Dxh4O_h3lT81o7SH6rKQGpQ",
  },
  openGraph: {
    title: "ContractEar - AI Audio Agreement Analyzer",
    description:
      "Upload meeting recordings and get AI-powered analysis of verbal commitments, deadlines, and red flags.",
    type: "website",
    url: "https://contractear.com",
    siteName: "ContractEar",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContractEar - AI Audio Agreement Analyzer",
    description:
      "Upload meeting recordings and get AI-powered analysis of verbal commitments, deadlines, and red flags.",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://contractear.com"
  ),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ContractEar",
  description:
    "AI-powered audio agreement analyzer that extracts verbal commitments, deadlines, red flags, and action items from meeting recordings.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "3.99",
      priceCurrency: "USD",
      description: "Pay Per Use — single analysis",
    },
    {
      "@type": "Offer",
      price: "29.00",
      priceCurrency: "USD",
      description: "Basic — 20 analyses/month",
    },
    {
      "@type": "Offer",
      price: "79.00",
      priceCurrency: "USD",
      description: "Pro — 50 analyses/month",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <footer className="no-print border-t border-card-border bg-background">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted">
                &copy; {new Date().getFullYear()} ContractEar. All rights
                reserved.
              </p>
              <div className="flex gap-6 text-sm text-muted">
                <a href="/terms" className="hover:text-foreground transition">
                  Terms
                </a>
                <a href="/privacy" className="hover:text-foreground transition">
                  Privacy
                </a>
                <a href="/refund" className="hover:text-foreground transition">
                  Refund Policy
                </a>
                <a
                  href="mailto:support@contractear.com"
                  className="hover:text-foreground transition"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
