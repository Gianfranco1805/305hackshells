import crypto from "node:crypto";
import path from "node:path";

import { createServerClient } from "@/lib/supabase";
import type {
  ExtractionMethod,
  ExtractionStatus,
} from "@/lib/document-extraction";

const PRIVATE_DOCS_BUCKET =
  process.env.SUPABASE_PRIVATE_DOCS_BUCKET || "privateLegalDocs";
const PRIVATE_DOC_DATA_BUCKET =
  process.env.SUPABASE_PRIVATE_DOC_DATA_BUCKET || "privateDocData";

export type CreatePrivateDocumentInput = {
  title: string;
  language: string;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
  fileBuffer: Buffer;
  extractedText: string;
  extractionMethod: ExtractionMethod;
  extractionStatus: ExtractionStatus;
  pageCount: number | null;
  isFillablePdf: boolean;
};

export type PrivateDocumentRecord = {
  id: number;
  user_id: string;
  title: string;
  language: string;
  storage_bucket: string;
  storage_path: string;
  metadata_bucket: string;
  metadata_path: string;
  file_name: string;
  file_ext: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  sha256_hash: string | null;
  extraction_status: ExtractionStatus;
  is_fillable_pdf: boolean;
  page_count: number | null;
  created_at: string;
  updated_at: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "document";
}

function sha256(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function buildMetadataPayload(
  document: PrivateDocumentRecord,
  extractedText: string,
  extractionMethod: ExtractionMethod,
) {
  return {
    document_id: document.id,
    user_id: document.user_id,
    title: document.title,
    language: document.language,
    storage_bucket: document.storage_bucket,
    storage_path: document.storage_path,
    metadata_bucket: document.metadata_bucket,
    metadata_path: document.metadata_path,
    file_name: document.file_name,
    file_type: document.file_ext || document.mime_type,
    file_size: document.file_size_bytes,
    mime_type: document.mime_type,
    hash: document.sha256_hash,
    page_count: document.page_count,
    extraction_status: document.extraction_status,
    extraction_method: extractionMethod,
    extracted_text: extractedText,
    is_fillable_pdf: document.is_fillable_pdf,
    uploaded_at: document.created_at,
  };
}

export async function createPrivateDocument(
  input: CreatePrivateDocumentInput,
) {
  const { client, userId } = await createServerClient();
  const fileHash = sha256(input.fileBuffer);
  const safeBaseName = slugify(path.parse(input.fileName).name || input.title);

  const { data: duplicate } = await client
    .from("private_documents")
    .select("id")
    .eq("user_id", userId)
    .eq("sha256_hash", fileHash)
    .limit(1)
    .maybeSingle();

  if (duplicate) {
    throw new Error("You already uploaded this document.");
  }

  const { data: insertedRows, error: insertError } = await client
    .from("private_documents")
    .insert({
      user_id: userId,
      title: input.title,
      language: input.language,
      storage_bucket: PRIVATE_DOCS_BUCKET,
      storage_path: "__pending__",
      metadata_bucket: PRIVATE_DOC_DATA_BUCKET,
      metadata_path: "__pending__",
      file_name: input.fileName,
      file_ext: input.fileExtension || null,
      mime_type: input.mimeType || null,
      file_size_bytes: input.fileSizeBytes,
      sha256_hash: fileHash,
      extraction_status: input.extractionStatus,
      is_fillable_pdf: input.isFillablePdf,
      page_count: input.pageCount,
    })
    .select("*")
    .single();

  if (insertError || !insertedRows) {
    throw new Error(insertError?.message || "Failed to create document record.");
  }

  const document = insertedRows as PrivateDocumentRecord;
  const storagePath = `${userId}/${document.id}/original/${safeBaseName}${input.fileExtension}`;
  const metadataPath = `${userId}/${document.id}/metadata.json`;

  const { error: uploadError } = await client.storage
    .from(PRIVATE_DOCS_BUCKET)
    .upload(storagePath, input.fileBuffer, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (uploadError) {
    await client.from("private_documents").delete().eq("id", document.id);
    throw new Error(uploadError.message);
  }

  const { error: textError } = await client.from("private_document_text").insert({
    document_id: document.id,
    extracted_text: input.extractedText,
    extraction_method: input.extractionMethod,
  });

  if (textError) {
    await client.storage.from(PRIVATE_DOCS_BUCKET).remove([storagePath]);
    await client.from("private_documents").delete().eq("id", document.id);
    throw new Error(textError.message);
  }

  const { data: updatedRows, error: updateError } = await client
    .from("private_documents")
    .update({
      storage_path: storagePath,
      metadata_path: metadataPath,
    })
    .eq("id", document.id)
    .select("*")
    .single();

  if (updateError || !updatedRows) {
    await client.from("private_document_text").delete().eq("document_id", document.id);
    await client.storage.from(PRIVATE_DOCS_BUCKET).remove([storagePath]);
    await client.from("private_documents").delete().eq("id", document.id);
    throw new Error(updateError?.message || "Failed to finalize document record.");
  }

  const finalizedDocument = updatedRows as PrivateDocumentRecord;
  const metadataPayload = buildMetadataPayload(
    finalizedDocument,
    input.extractedText,
    input.extractionMethod,
  );

  const { error: metadataError } = await client.storage
    .from(PRIVATE_DOC_DATA_BUCKET)
    .upload(metadataPath, JSON.stringify(metadataPayload, null, 2), {
      contentType: "application/json",
      upsert: true,
    });

  if (metadataError) {
    await client.from("private_document_text").delete().eq("document_id", document.id);
    await client.storage.from(PRIVATE_DOCS_BUCKET).remove([storagePath]);
    await client.from("private_documents").delete().eq("id", document.id);
    throw new Error(metadataError.message);
  }

  return {
    document: finalizedDocument,
    extractedText: input.extractedText,
    extractionMethod: input.extractionMethod,
  };
}
