import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "3Search — Temukan Produk Potensial Viral";
const description =
  "Saring ratusan produk jadi 3 kandidat terbaik berbasis sinyal penjualan, rating, dan ulasan. Lengkap dengan alasan, risiko, dan simulasi profit.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s · 3Search",
  },
  description,
  applicationName: "3Search",
  keywords: [
    "TikTok Shop",
    "riset produk",
    "produk viral",
    "analisis pasar",
    "dropship",
    "3Search",
  ],
  openGraph: {
    title,
    description,
    siteName: "3Search",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafafa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
