import { listDocumentsForUser, mapDocumentRow } from "@/lib/documents";
import { apiError, apiSuccess, createServerClient } from "@/lib/supabase";
import type { DocumentStatus } from "@/types";

type CreateDocumentBody = {
  file_name?: string;
  file_url?: string;
  storage_path?: string;
  mime_type?: string;
  extracted_text?: string | null;
  translated_text?: string | null;
  status?: DocumentStatus;
  error_message?: string | null;
};

export async function GET() {
  const { client, userId } = await createServerClient();
  const documents = await listDocumentsForUser(client, userId);

  return apiSuccess(documents);
}

export async function POST(request: Request) {
  const { client, userId } = await createServerClient();
  const body = (await request.json()) as CreateDocumentBody;

  if (!body.file_name?.trim()) {
    return apiError("file_name is required.", 400);
  }

  const { data, error } = await client
    .from("documents")
    .insert({
      user_id: userId,
      file_name: body.file_name.trim(),
      file_url: body.file_url ?? body.storage_path ?? "",
      storage_path: body.storage_path ?? "",
      mime_type: body.mime_type ?? "application/octet-stream",
      extracted_text: body.extracted_text ?? null,
      translated_text: body.translated_text ?? null,
      status: body.status ?? "processing",
      error_message: body.error_message ?? null,
    })
    .select(
      "id, user_id, file_name, file_url, storage_path, mime_type, extracted_text, translated_text, status, error_message, created_at",
    )
    .single();

  if (error) {
    return apiError(`Unable to create document record: ${error.message}`, 500);
  }

  return apiSuccess(mapDocumentRow(data), { status: 201 });
}
