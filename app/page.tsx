"use client";

import dynamic from "next/dynamic";

// Oyunu dinamik olarak (tarayıcıda) yüklüyoruz
const SpinshotGame = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">
      Loading Spinshot...
    </div>
  ),
});

export default function Home() {
  return (
    <main>
      <SpinshotGame />
    </main>
  );
}