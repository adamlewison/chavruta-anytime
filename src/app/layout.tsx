import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import "flag-icons/css/flag-icons.min.css";
import { Toaster } from "sonner";
import { Providers } from "@/lib/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chavrutaanytime.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ChavrutaAnytime — Find Your Learning Partner",
    template: "%s | ChavrutaAnytime",
  },
  description:
    "Connect with Torah learning partners anytime, anywhere. Find chavrutas and chaburas for Gemara, Chumash, Halacha, and more.",
  keywords: [
    "chavruta",
    "Torah learning",
    "Jewish learning",
    "chabura",
    "Gemara",
    "Talmud",
    "Halacha",
    "Chumash",
    "learning partner",
  ],
  openGraph: {
    type: "website",
    siteName: "ChavrutaAnytime",
    title: "ChavrutaAnytime — Find Your Learning Partner",
    description:
      "Connect with Torah learning partners anytime, anywhere. Find chavrutas and chaburas for Gemara, Chumash, Halacha, and more.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "ChavrutaAnytime — Find Your Learning Partner",
    description:
      "Connect with Torah learning partners anytime, anywhere. Find chavrutas and chaburas for Gemara, Chumash, Halacha, and more.",
  },
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              className: "!bg-card !text-card-foreground !border-border",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
