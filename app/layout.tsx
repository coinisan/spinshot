import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Spinshot",
  description: "The addictive neon arcade game on Farcaster.",
  manifest: "/manifest.json",
  // 👇 İKONLARI GÜNCELLEDİK
  icons: {
    icon: '/logox.png',   // Yeni logonun adı
    apple: '/logox.png',  // iPhone ana ekran ikonu için de aynısı
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={orbitron.className}>{children}</body>
    </html>
  );
}