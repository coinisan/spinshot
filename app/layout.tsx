import type { Metadata, Viewport } from "next"; // Viewport eklendi
import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Spinshot",
  description: "The addictive neon arcade game on Farcaster.",
  manifest: "/manifest.json", // İleride PWA olursa diye
};

// MOBİL İÇİN KRİTİK AYARLAR
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Kullanıcı zoom yapamasın
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