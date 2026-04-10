import type { SupabaseClient } from "@supabase/supabase-js";
import type { Document, DocumentStatus } from "@/types";

export const DOCUMENTS_BUCKET = "documents";

export const SUPPORTED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type DocumentRow = Partial<Document> & {
  id: string;
  user_id: string;
  file_name?: string | null;
  file_url?: string | null;
  storage_path?: string | null;
  mime_type?: string | null;
  extracted_text?: string | null;
  translated_text?: string | null;
  status?: DocumentStatus | null;
  error_message?: string | null;
  created_at?: string | null;
};

export function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

export function mapDocumentRow(row: DocumentRow): Document {
  return {
    id: row.id,
    user_id: row.user_id,
    file_name: row.file_name ?? "Untitled document",
    file_url: row.file_url ?? "",
    storage_path: row.storage_path ?? "",
    mime_type: row.mime_type ?? "application/octet-stream",
    extracted_text: row.extracted_text ?? null,
    translated_text: row.translated_text ?? null,
    status: row.status ?? "processing",
    error_message: row.error_message ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

export async function listDocumentsForUser(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("documents")
    .select(
      "id, user_id, file_name, file_url, storage_path, mime_type, extracted_text, translated_text, status, error_message, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapDocumentRow(row as DocumentRow));
}

export async function getDocumentForUser(
  client: SupabaseClient,
  userId: string,
  id: string,
) {
  const { data, error } = await client
    .from("documents")
    .select(
      "id, user_id, file_name, file_url, storage_path, mime_type, extracted_text, translated_text, status, error_message, created_at",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapDocumentRow(data as DocumentRow);
}
