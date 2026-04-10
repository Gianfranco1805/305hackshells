const TRANSLATION_PROMPT = `You are a helpful bilingual assistant. Translate the following English document
into clear, simple Spanish that is easy for non-native speakers and older adults
to understand. Do not use complex legal jargon. Return only the translated text.

Document:
`;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function extractTextFromImage(fileBuffer: ArrayBuffer) {
  const apiKey = requireEnv("GOOGLE_CLOUD_VISION_API_KEY");
  const content = Buffer.from(fileBuffer).toString("base64");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR request failed: ${errorText}`);
  }

  const payload = (await response.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      textAnnotations?: Array<{ description?: string }>;
      error?: { message?: string };
    }>;
  };

  const result = payload.responses?.[0];
  const message = result?.error?.message;

  if (message) {
    throw new Error(`OCR failed: ${message}`);
  }

  const text =
    result?.fullTextAnnotation?.text ??
    result?.textAnnotations?.[0]?.description ??
    "";

  if (!text.trim()) {
    throw new Error("OCR could not find readable text in the image.");
  }

  return text.trim();
}

async function generateWithGemini(model: string, prompt: string) {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty translation.");
  }

  return text;
}

export async function translateDocumentText(documentText: string) {
  const preferredModel = process.env.GEMINI_MODEL;
  const modelCandidates = [
    preferredModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter(Boolean) as string[];

  let lastError: Error | null = null;

  for (const model of modelCandidates) {
    try {
      return await generateWithGemini(model, `${TRANSLATION_PROMPT}${documentText}`);
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error("Translation failed.");
}
