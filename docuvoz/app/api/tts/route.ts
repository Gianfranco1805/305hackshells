import { apiError } from "@/lib/supabase";

const DEFAULT_VOICE_ID =
  process.env.ELEVENLABS_DEFAULT_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return apiError("Missing ELEVENLABS_API_KEY.", 500);
  }

  const body = (await request.json()) as {
    text?: string;
    voiceId?: string;
  };

  if (!body.text?.trim()) {
    return apiError("text is required.", 400);
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${body.voiceId ?? DEFAULT_VOICE_ID}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: body.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    return apiError(`ElevenLabs request failed: ${errorText}`, 500);
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
