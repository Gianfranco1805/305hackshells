import { DOCUMENTS_BUCKET, getDocumentForUser } from "@/lib/documents";
import { apiError, apiSuccess, createServerClient } from "@/lib/supabase";

type DocumentRouteContext = {
  params: Promise<{ id: string }>;
};

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
