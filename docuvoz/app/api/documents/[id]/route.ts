import { DOCUMENTS_BUCKET, getDocumentForUser } from "@/lib/documents";
import { deletePrivateDocument } from "@/lib/document-translation";
import { apiError, apiSuccess, createServerClient } from "@/lib/supabase";

type DocumentRouteContext = {
  params: Promise<{ id: string }>;
};

function parsePrivateId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  _request: Request,
  context: DocumentRouteContext,
) {
  const { id } = await context.params;
  const { client, userId } = await createServerClient();
  const document = await getDocumentForUser(client, userId, id);

  if (!document) {
    return apiError("Document not found.", 404);
  }

  return apiSuccess(document);
}

export async function DELETE(
  _request: Request,
  context: DocumentRouteContext,
) {
  const { id } = await context.params;
  const privateId = parsePrivateId(id);

  if (privateId) {
    try {
      const result = await deletePrivateDocument(privateId);
      return apiSuccess({ id: String(result.documentId) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete document.";

      if (message.toLowerCase().includes("document not found")) {
        return apiError(message, 404);
      }

      if (message.toLowerCase().includes("unauthenticated")) {
        return apiError(message, 401);
      }

      return apiError(`Unable to delete document: ${message}`, 500);
    }
  }

  if (!isUuid(id)) {
    return apiError("Document not found.", 404);
  }

  const { client, userId } = await createServerClient();
  const document = await getDocumentForUser(client, userId, id);

  if (!document) {
    return apiError("Document not found.", 404);
  }

  if (document.storage_path) {
    const { error: storageError } = await client.storage
      .from(DOCUMENTS_BUCKET)
      .remove([document.storage_path]);

    if (storageError) {
      return apiError(`Unable to delete stored file: ${storageError.message}`, 500);
    }
  }

  const { error } = await client
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return apiError(`Unable to delete document: ${error.message}`, 500);
  }

  return apiSuccess({ id });
}
