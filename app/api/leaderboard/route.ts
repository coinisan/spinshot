import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const LEADERBOARD_KEY = "spinshot_leaderboard";

export async function GET() {
  try {
    // DÜZELTME BURADA: 'zrevrange' yerine 'zrange' kullanıyoruz ve 'rev: true' ekliyoruz.
    const data = await kv.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

    const leaderboard = [];
    if (data) {
        // Gelen veri [isim1, skor1, isim2, skor2...] şeklindedir.
        for (let i = 0; i < data.length; i += 2) {
            leaderboard.push({
                name: data[i] as string,
                score: Number(data[i + 1])
            });
        }
    }

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("KV Error:", error);
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

    // Skoru kaydet
    await kv.zadd(LEADERBOARD_KEY, { score, member: name });

    // Güncel listeyi çek (Yine zrange ve rev: true ile)
    const data = await kv.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });
    
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