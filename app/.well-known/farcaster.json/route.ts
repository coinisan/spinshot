import { NextResponse } from "next/server";

export async function GET() {
  // 👇 FİNAL LİNKİMİZ BURADA
  const appUrl = "https://spinshot.vercel.app"; 

  const config = {
    "accountAssociation": {
      "header": "eyJmaWQiOjIyOTY5NywidHlwZSI6ImF1dGgiLCJrZXkiOiIweDM2Q0RiOERCOTQ0YTUyZUIxQUVCYTVmMTU1NjUyZTA5YzI1NTQ3MzMifQ",
      "payload": "eyJkb21haW4iOiJzcGluc2hvdC52ZXJjZWwuYXBwIn0",
      "signature": "PdS9SKIFb9ofrHNz24r0NAfjxbpn4I1tHnDXl3VFVLV4pIiqCFlYLgPOq4PGg8zf2yZyPk49Z95Joz/jp6L8xRs="
    },
    "miniapp": {
      "version": "1",
      "name": "Spinshot",
      "slug": "spinshot",
      "description": "Addictive neon arcade game on Base. Hit the target!",
      "primaryCategory": "games",
      "tags": ["game", "arcade", "skill"],
      
      // 👇 İKONLARI GÜNCELLEDİK
      "iconUrl": `${appUrl}/logo.png`,
      "splashImageUrl": `${appUrl}/logo.png`,
      "splashBackgroundColor": "#000000",
      
      "homeUrl": appUrl
    }
  };

  return NextResponse.json(config);
}