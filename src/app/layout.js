import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vitadata.onrender.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VITADATA",
    template: "%s | VITADATA",
  },
  description:
    "VITADATA is a technology startup building modern healthcare software for hospitals, clinicians, and patients.",
  applicationName: "VITADATA",
  keywords: [
    "VITADATA",
    "healthcare technology",
    "hospital software",
    "medical startup",
    "digital health",
    "clinic management",
  ],
  authors: [{ name: "VITADATA" }],
  creator: "VITADATA",
  publisher: "VITADATA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "VITADATA",
    description:
      "VITADATA is a technology startup building modern healthcare software for hospitals, clinicians, and patients.",
    url: "/",
    siteName: "VITADATA",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "VITADATA logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VITADATA",
    description:
      "VITADATA is a technology startup building modern healthcare software for hospitals, clinicians, and patients.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
