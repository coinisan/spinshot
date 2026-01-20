import { NextResponse } from "next/server";

// Şimdilik veritabanı yerine bu sahte listeyi döndüreceğiz
// İleride buraya gerçek veritabanı (Vercel KV) bağlayabiliriz.
const MOCK_LEADERBOARD = [
  { name: "dwr.eth", score: 15 },
  { name: "vbuterin", score: 12 },
  { name: "coinisan", score: 10 },
  { name: "base.eth", score: 8 },
  { name: "jesse.xyz", score: 5 },
];

export async function GET() {
  // Rastgele biraz gecikme ekleyelim ki gerçekçi olsun
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return NextResponse.json({ 
    leaderboard: MOCK_LEADERBOARD 
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, score } = body;

  // Gerçekte burada veritabanına kaydederdik.
  // Şimdilik listeye eklenmiş gibi geri dönüyoruz.
  const newEntry = { name: name || "Anonymous", score: score };
  const newList = [newEntry, ...MOCK_LEADERBOARD].sort((a, b) => b.score - a.score).slice(0, 5);

  return NextResponse.json({ 
    success: true,
    leaderboard: newList
  });
}