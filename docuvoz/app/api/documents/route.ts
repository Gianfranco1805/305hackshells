import { listDocumentsForUser, mapDocumentRow } from "@/lib/documents";
import { apiError, apiSuccess, createServerClient } from "@/lib/supabase";
import type { DocumentStatus, DocumentsPageItem } from "@/types";

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
  const [legacyDocuments, privateDocumentsResult] = await Promise.all([
    listDocumentsForUser(client, userId),
    client
      .from("private_documents")
      .select(
        "id,title,file_name,mime_type,created_at,private_document_translations(translation_status,summary_es,translated_pdf_path,translated_text_path)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (privateDocumentsResult.error) {
    return apiError(
      `Unable to load private documents: ${privateDocumentsResult.error.message}`,
      500,
    );
  }

  const privateDocuments: DocumentsPageItem[] = (privateDocumentsResult.data ?? []).map(
    (row) => {
      const translation = Array.isArray(row.private_document_translations)
        ? row.private_document_translations[0]
        : row.private_document_translations;

      const translationStatus =
        translation?.translation_status ?? "unavailable";
      const hasTranslation = translationStatus === "completed";

      return {
        id: String(row.id),
        title: row.title ?? row.file_name ?? "Untitled document",
        fileName: row.file_name ?? row.title ?? "Untitled document",
        createdAt: row.created_at ?? new Date().toISOString(),
        mimeType: row.mime_type ?? null,
        source: "private",
        translationStatus,
        hasTranslation,
        summaryEs: translation?.summary_es ?? null,
      };
    },
  );

  const legacyItems: DocumentsPageItem[] = legacyDocuments.map((document) => ({
    id: document.id,
    title: document.file_name,
    fileName: document.file_name,
    createdAt: document.created_at,
    mimeType: document.mime_type,
    source: "legacy",
    translationStatus:
      document.status === "ready"
        ? "ready"
        : document.status === "error"
          ? "failed"
          : "processing",
    hasTranslation: Boolean(document.translated_text),
    summaryEs: null,
  }));

  return apiSuccess([...privateDocuments, ...legacyItems]);
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
