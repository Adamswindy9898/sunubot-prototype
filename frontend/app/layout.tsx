import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SunuBot — Assistant Administratif du Senegal",
  description: "Chatbot multilingue francais/wolof pour les services administratifs senegalais. Etat civil, DGID, CNSS — avec MCP et NLP avance (mBERT + Mistral).",
  keywords: ["SunuBot", "chatbot", "Senegal", "administration", "etat civil", "DGID", "CNSS", "wolof", "MCP", "NLP"],
  authors: [{ name: "Adama GAYE", url: "https://github.com/Adamswindy9898" }],
  openGraph: {
    title: "SunuBot — Assistant Administratif du Senegal",
    description: "Simplifiez vos demarches administratives au Senegal. Chatbot multilingue francais/wolof avec intelligence artificielle.",
    type: "website",
    locale: "fr_SN",
    siteName: "SunuBot",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
