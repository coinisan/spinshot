import { NextResponse } from "next/server";

export async function GET() {
  // 👇 FİNAL LİNKİMİZ BURADA
  const appUrl = "https://spinshot.vercel.app"; 

  const config = {
    "accountAssociation": {
      "header": "eyJmaWQiOjIyOTY5NywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGRhZDM5ZTg0YjNiMTlhNWIwNzEwYjgyMzI4MGEzNzQ3MjllYTA5YjQifQ",
      "payload": "eyJkb21haW4iOiJmYXJjYXN0ZXItZm9sbG93LWNoZWNrZXIudmVyY2VsLmFwcCJ9",
      "signature": "zhXnTw978/eSWQGCIQDMDam23PBqi9ceukNY79hTgIY8shhmY8Q4zAIRWIr1UWZmSxCowfMIDxa+YHf1+w5Dmhw="
    },
    "miniapp": {
      "version": "1",
      "name": "Spinshot",
      "slug": "spinshot",
      "iconUrl": `${appUrl}/icon.png`,
      "homeUrl": appUrl,
      "description": "Addictive neon arcade game on Base. Hit the target!",
      "primaryCategory": "games",
      "tags": ["game", "arcade", "skill"],
      "splashImageUrl": `${appUrl}/icon.png`,
      "splashBackgroundColor": "#000000"
    }
  };

  return NextResponse.json(config);
}