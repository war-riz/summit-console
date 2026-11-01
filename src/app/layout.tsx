import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/providers";
import { APP_NAME, EVENT_NAME } from "@/lib/constants";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION = `${EVENT_NAME}: internal management console`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: DESCRIPTION,
    images: [{ url: "/dolf-logo.jpg", alt: "D-OLF Hydrometric" }],
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: DESCRIPTION,
    images: ["/dolf-logo.jpg"],
  },
};
export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f6fb" }, { media: "(prefers-color-scheme: dark)", color: "#080b22" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}