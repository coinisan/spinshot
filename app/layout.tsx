import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Spinshot",
  description: "The addictive neon arcade game on Farcaster.",
  manifest: "/manifest.json",
  // 👇 LOGO AYARLARI BURADA
  icons: {
    icon: '/logo.png',
    apple: '/logo.png', // iPhone ana ekrana eklenirse bu görünür
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