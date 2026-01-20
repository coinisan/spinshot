import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// Liderlik tablosunun Redis'teki anahtarı
const LEADERBOARD_KEY = "spinshot_leaderboard";

export async function GET() {
  try {
    // Redis'ten en yüksek 10 skoru, isimleriyle birlikte çek (Ters sıralı: En yüksek en üstte)
    // 'WITHSCORES' seçeneği sayesinde hem ismi hem de puanı alıyoruz.
    const data = await kv.zrevrange(LEADERBOARD_KEY, 0, 9, { withScores: true });

    // Redis'ten gelen veri ["isim1", "skor1", "isim2", "skor2", ...] şeklinde düz bir listedir.
    // Bunu { name: "isim", score: number } şekline dönüştürmemiz lazım.
    const leaderboard = [];
    if (data) {
        for (let i = 0; i < data.length; i += 2) {
            leaderboard.push({
                name: data[i] as string,
                score: Number(data[i + 1]) // Skoru sayıya çevir
            });
        }
    }

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("KV Error:", error);
    // Hata durumunda boş liste dön ki oyun çökmesin
    return NextResponse.json({ leaderboard: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, score } = body;

    if (!name || typeof score !== 'number') {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Skoru veritabanına ekle veya güncelle.
    // ZADD komutu, eğer aynı isimde biri varsa ve yeni skor daha yüksekse günceller.
    await kv.zadd(LEADERBOARD_KEY, { score, member: name });

    // Güncel listeyi hemen geri döndürmek için tekrar çekelim
    const data = await kv.zrevrange(LEADERBOARD_KEY, 0, 9, { withScores: true });
    const leaderboard = [];
    if (data) {
        for (let i = 0; i < data.length; i += 2) {
            leaderboard.push({
                name: data[i] as string,
                score: Number(data[i + 1])
            });
        }
    }

    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    console.error("KV Error:", error);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}