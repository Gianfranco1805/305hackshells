import { extractTextFromImage, translateDocumentText } from "@/lib/document-processing";
import {
  buildStoragePath,
  DOCUMENTS_BUCKET,
  mapDocumentRow,
  SUPPORTED_UPLOAD_TYPES,
} from "@/lib/documents";
import { apiError, apiSuccess, createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  let client: Awaited<ReturnType<typeof createServerClient>>["client"] | null = null;
  let userId = "";

  try {
    ({ client, userId } = await createServerClient());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return apiError(message, message.toLowerCase().includes("unauthenticated") ? 401 : 500);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const extractedTextFromClient = formData.get("extractedText");

  if (!(file instanceof File)) {
    return apiError("A file upload is required.", 400);
  }

  if (!SUPPORTED_UPLOAD_TYPES.has(file.type)) {
    return apiError("Unsupported file type. Upload a PDF, JPG, PNG, or WEBP.", 400);
  }

  const extractedTextHint =
    typeof extractedTextFromClient === "string" ? extractedTextFromClient.trim() : "";
  const fileBuffer = await file.arrayBuffer();
  const storagePath = buildStoragePath(userId, file.name);

  const { error: uploadError } = await client.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return apiError(`Upload failed: ${uploadError.message}`, 500);
  }

  const initialInsert = await client
    .from("documents")
    .insert({
      user_id: userId,
      file_name: file.name,
      file_url: storagePath,
      storage_path: storagePath,
      mime_type: file.type,
      status: "processing",
      extracted_text: null,
      translated_text: null,
      error_message: null,
    })
    .select(
      "id, user_id, file_name, file_url, storage_path, mime_type, extracted_text, translated_text, status, error_message, created_at",
    )
    .single();

  if (initialInsert.error) {
    await client.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    return apiError(
      `Unable to create document record: ${initialInsert.error.message}`,
      500,
    );
  }

  const documentId = initialInsert.data.id as string;

  try {
    const extractedText =
      file.type === "application/pdf"
        ? extractedTextHint
        : await extractTextFromImage(fileBuffer);

    if (!extractedText.trim()) {
      throw new Error("No readable text was found in the uploaded document.");
    }

    const translatedText = await translateDocumentText(extractedText);

    const { data, error } = await client
      .from("documents")
      .update({
        extracted_text: extractedText,
        translated_text: translatedText,
        status: "ready",
        error_message: null,
      })
      .eq("id", documentId)
      .eq("user_id", userId)
      .select(
        "id, user_id, file_name, file_url, storage_path, mime_type, extracted_text, translated_text, status, error_message, created_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return apiSuccess(mapDocumentRow(data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the uploaded document.";

    await client
      .from("documents")
      .update({
        status: "error",
        error_message: message,
      })
      .eq("id", documentId)
      .eq("user_id", userId);

    return apiError(message, 500);
  }
}
